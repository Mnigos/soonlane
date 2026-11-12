import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import {
	getTicketNumber,
	LINEAR_TEAM_KEY,
	planLabelChanges,
	type PriorityLabel,
	REPOSITORY,
} from './linear-priority.policy'

const GH_MAX_BUFFER = 64 * 1024 * 1024
const LINEAR_API_URL = 'https://api.linear.app/graphql'
const ISSUES_QUERY = `query TicketPriorities($team: String!, $numbers: [Float!]!) {
	issues(first: 250, filter: { team: { key: { eq: $team } }, number: { in: $numbers } }) {
		nodes { number priority }
	}
}`

interface OpenPull {
	number: number
	head: { ref: string }
	labels: { name: string }[]
}

interface TicketPrioritiesResponse {
	data?: { issues: { nodes: { number: number; priority: number }[] } }
	errors?: { message: string }[]
}

const execFileAsync = promisify(execFile)

async function gh(args: string[]) {
	const { stdout } = await execFileAsync('gh', ['api', ...args], {
		encoding: 'utf-8',
		maxBuffer: GH_MAX_BUFFER,
	})
	return stdout
}

/** Reads every page of a list endpoint through `gh api --paginate --slurp`. */
async function listAllPages<TItem>(path: string) {
	const pages: TItem[][] = JSON.parse(
		await gh([`${path}?per_page=100`, '--paginate', '--slurp'])
	)
	return pages.flat()
}

/** Returns the PR of a `pull_request_target` event, or every open PR for the hourly and manual runs. */
async function readPulls(repository: string) {
	const { GITHUB_EVENT_NAME, GITHUB_EVENT_PATH } = process.env
	if (GITHUB_EVENT_NAME === 'pull_request_target' && GITHUB_EVENT_PATH) {
		const payload: { pull_request: OpenPull } = JSON.parse(
			await readFile(GITHUB_EVENT_PATH, 'utf-8')
		)
		return [payload.pull_request]
	}

	return await listAllPages<OpenPull>(`repos/${repository}/pulls`)
}

/** Fetches the Linear priority of each SOON ticket number; tickets Linear does not know are left out. */
async function fetchPriorities(apiKey: string, numbers: number[]) {
	const response = await fetch(LINEAR_API_URL, {
		method: 'POST',
		headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: ISSUES_QUERY,
			variables: { team: LINEAR_TEAM_KEY, numbers },
		}),
	})
	const body: TicketPrioritiesResponse = JSON.parse(await response.text())
	if (!response.ok || body.errors || !body.data)
		throw new Error(
			`Linear API ${response.status}: ${body.errors?.map(e => e.message).join('; ') ?? 'no data'}`
		)

	return new Map(body.data.issues.nodes.map(i => [i.number, i.priority]))
}

/** Creates the missing priority labels in the repository, so a PR can carry them. */
async function ensureLabels(repository: string, labels: PriorityLabel[]) {
	const repositoryLabels = await listAllPages<{ name: string }>(
		`repos/${repository}/labels`
	)
	const existing = new Set(repositoryLabels.map(label => label.name))
	for (const label of labels.filter(l => !existing.has(l.name)))
		await gh([
			`repos/${repository}/labels`,
			'--method',
			'POST',
			'--raw-field',
			`name=${label.name}`,
			'--raw-field',
			`color=${label.color}`,
			'--raw-field',
			`description=${label.description}`,
		])
}

async function syncPriorityLabels(repository: string, apiKey: string) {
	const pulls = await readPulls(repository)
	const tickets = pulls.flatMap(pull => {
		const ticket = getTicketNumber(pull.head.ref)
		return ticket === undefined ? [] : [{ pull, ticket }]
	})
	if (tickets.length === 0) return console.info('No PR on a SOON branch.')

	const priorities = await fetchPriorities(
		apiKey,
		tickets.map(t => t.ticket)
	)
	const plans = tickets.flatMap(({ pull, ticket }) => {
		const priority = priorities.get(ticket)
		if (priority === undefined) {
			console.info(`#${pull.number}: SOON-${ticket} not found in Linear.`)
			return []
		}
		const labels = pull.labels.map(label => label.name)
		return [{ pull, ticket, ...planLabelChanges(labels, priority) }]
	})

	await ensureLabels(
		repository,
		plans.flatMap(plan => (plan.add ? [plan.add] : []))
	)

	for (const { pull, ticket, add, remove } of plans) {
		const issuePath = `repos/${repository}/issues/${pull.number}/labels`
		for (const name of remove)
			await gh([
				`${issuePath}/${encodeURIComponent(name)}`,
				'--method',
				'DELETE',
			])
		if (add)
			await gh([
				issuePath,
				'--method',
				'POST',
				'--raw-field',
				`labels[]=${add.name}`,
			])
		if (add || remove.length > 0)
			console.info(
				`#${pull.number} SOON-${ticket}: +${add?.name ?? 'none'} -${remove.join(', ') || 'none'}`
			)
	}
}

if (import.meta.main) {
	const { GITHUB_REPOSITORY, LINEAR_API_KEY } = process.env
	if (GITHUB_REPOSITORY?.toLowerCase() !== REPOSITORY)
		throw new Error(`Unsupported repository ${GITHUB_REPOSITORY}`)
	if (!LINEAR_API_KEY)
		throw new Error('The LINEAR_API_KEY repository secret is not set')

	await syncPriorityLabels(GITHUB_REPOSITORY, LINEAR_API_KEY)
}
