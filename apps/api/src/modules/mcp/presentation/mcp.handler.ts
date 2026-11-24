import { createMcpHandler } from '@modelcontextprotocol/server'
import { Cause, Context, Effect, Exit } from 'effect'
import {
	type McpAccessToken,
	Auth,
} from '@/modules/identity/application/auth.port'
import type { AppServices } from '@/platform/app.runtime'
import { AppConfig } from '@/platform/config/app.config'
import { DbError, findDriverErrorCode } from '@/platform/db/db.errors'
import { McpService } from '../application/mcp.service'
import {
	McpClientNotConnected,
	McpRequestLimitReached,
} from '../domain/mcp-connection.errors'
import type { McpToolName, McpToolRunner } from './mcp-tool.helper'
import { createMcpServer, listMcpTools } from './mcp-tools.handler'

/** What the request's one log line says: the tool it called, how it ended and the error's name or code. Never a token, header, body, query or task text. */
interface McpRequestRecord {
	tool?: McpToolName
	outcome?: McpRequestOutcome
	error?: string
	/** The tools this request's grant registered, once it was admitted. */
	tools?: readonly McpToolName[]
	/** A copy of the POST body, read only to name a `tools/call` the SDK refused before a tool ran, and released otherwise. */
	copy?: BodyCopy
}
/** The cloned request's body stream: one branch of a tee, which keeps every chunk the SDK reads from the other until it is read or cancelled. */
type BodyCopy = ReadableStream<Uint8Array>
/** What the log reads from the copy's reader; `Request.clone()` gives Node's stream types, not Bun's. */
interface BodyCopyReader {
	read: () => Promise<{ done: boolean; value?: Uint8Array }>
	cancel: () => Promise<void>
}
type McpRequestOutcome = 'ok' | 'refused' | 'failed'

const JSON_RPC_SERVER_ERROR = -32_000
const HTTP_CLIENT_ERROR = 400
const HTTP_SERVER_ERROR = 500
const RETRY_AFTER_SECONDS = 60
/** The most of a copy the log reads; past it the copy is cancelled. A refused `tools/call` naming a tool is far smaller. */
const LOGGED_BODY_MAX_BYTES = 64 * 1024
const BROWSER_REFUSED =
	"Web pages can't call Soonlane directly, so connect through an AI app instead."
const UNAVAILABLE =
	"Soonlane couldn't read your tasks right now, so try again in a moment."

function jsonRpcError(
	status: number,
	message: string,
	headers?: Record<string, string>
) {
	return Response.json(
		{
			jsonrpc: '2.0',
			error: { code: JSON_RPC_SERVER_ERROR, message },
			id: null,
		},
		{ status, headers }
	)
}

/** An expected failure's code (`NOT_FOUND`, `BAD_REQUEST`), the driver code of a database error, or the name of anything else. */
function describeFailure(error: unknown) {
	if (error instanceof DbError)
		return `DbError ${findDriverErrorCode(error.cause) ?? ''}`.trim()
	if (
		typeof error === 'object' &&
		error !== null &&
		'_tag' in error &&
		'code' in error &&
		typeof error.code === 'string'
	)
		return error.code

	return error instanceof Error ? error.name : typeof error
}

function isExpected(error: unknown): error is { message: string } {
	return (
		!(error instanceof DbError) &&
		typeof error === 'object' &&
		error !== null &&
		'_tag' in error &&
		'code' in error &&
		'message' in error
	)
}

/** How a request without a tool call ended: answered, refused (no or a dead token, a browser, over the limit) or failed. */
function toOutcome(status: number): McpRequestOutcome {
	if (status < HTTP_CLIENT_ERROR) return 'ok'

	return status < HTTP_SERVER_ERROR ? 'refused' : 'failed'
}

function textResult(value: unknown, isError = false) {
	return {
		content: [{ type: 'text' as const, text: JSON.stringify(value) }],
		...(isError && { isError }),
	}
}

/**
 * Lets go of a copy that will not be read, so its branch buffers nothing more. Not awaited: a tee branch's cancel settles only once the other branch
 * is cancelled too, and the SDK only releases its reader.
 */
function releaseCopy(copy: BodyCopy | undefined) {
	if (!copy) return

	void (async () => {
		try {
			await copy.cancel()
		} catch {
			// Already closed or errored: nothing is buffered for it.
		}
	})()
}

/** Reads the copy's chunks until it ends, or answers `undefined` and cancels it once more than `LOGGED_BODY_MAX_BYTES` arrived. */
async function readUpToLimit(
	reader: BodyCopyReader,
	chunks: Uint8Array[] = [],
	size = 0
): Promise<Uint8Array[] | undefined> {
	const { done, value } = await reader.read()

	if (done || !value) return chunks

	const total = size + value.byteLength

	if (total > LOGGED_BODY_MAX_BYTES) {
		void (async () => {
			try {
				await reader.cancel()
			} catch {
				// Already closed or errored: nothing is buffered for it.
			}
		})()

		return undefined
	}

	chunks.push(value)

	return await readUpToLimit(reader, chunks, total)
}

/** The tool name of a `tools/call` message, or `undefined` for anything else or a body over the limit; the caller logs it only when it is a registered tool. */
async function readCalledTool(copy: BodyCopy) {
	const chunks = await readUpToLimit(copy.getReader())

	if (!chunks) return undefined

	try {
		const message: unknown = JSON.parse(await new Blob(chunks).text())

		if (
			typeof message === 'object' &&
			message !== null &&
			'method' in message &&
			message.method === 'tools/call' &&
			'params' in message &&
			typeof message.params === 'object' &&
			message.params !== null &&
			'name' in message.params &&
			typeof message.params.name === 'string'
		)
			return message.params.name
	} catch {
		// Not JSON: the SDK already answered it as a parse error.
	}

	return undefined
}

/**
 * A `tools/call` the SDK answered without running a tool: an unknown or unregistered name, or arguments failing the JSON Schema. Names only a
 * registered tool, with fixed codes, never the arguments or the SDK's message.
 */
async function recordRefusedCall(record: McpRequestRecord) {
	const { copy, tools } = record

	if (!copy) return
	if (record.tool || !tools) {
		releaseCopy(copy)

		return
	}

	const name = await readCalledTool(copy)

	if (name === undefined) return

	record.tool = tools.find(tool => tool === name)
	record.outcome = 'refused'
	record.error = record.tool ? 'INVALID_ARGUMENTS' : 'UNKNOWN_TOOL'
}

/** Calls `done` once the response's body has been sent or the client went away, so a streamed tool result is logged after it ends. */
function whenSent(response: Response, done: () => Promise<void>) {
	const { body } = response

	if (!body) {
		void done()

		return response
	}

	const { readable, writable } = new TransformStream<Uint8Array>()

	void (async () => {
		try {
			await body.pipeTo(writable)
		} catch {
			// The client went away; the line still says how the request ended.
		} finally {
			await done()
		}
	})()

	return new Response(readable, response)
}

/**
 * Serves `/mcp`, the MCP server over streamable HTTP, stateless: the 2026-07-28 protocol, and 2025 clients through the SDK's `legacy: 'stateless'`
 * serving, which answers their GET and DELETE with 405. A request with an `Origin` header comes from a browser and gets 403. Every other request
 * needs an MCP access token whose connection still exists and predates it (401 with the challenge otherwise), and the user's agents share
 * `MCP_REQUESTS_PER_MINUTE` (429). Each request gets a new MCP server with the tools its scopes allow, and logs one line.
 */
export function createMcpRequestHandler(
	services: Context.Context<AppServices>
) {
	const auth = Context.get(services, Auth)
	const mcpService = Context.get(services, McpService)
	const { commit } = Context.get(services, AppConfig)
	const runPromiseExit = Effect.runPromiseExitWith(services)

	async function serveMcpRequest(
		request: Request,
		token: McpAccessToken,
		record: McpRequestRecord
	) {
		const admitted = await runPromiseExit(mcpService.admit(token))

		if (Exit.isFailure(admitted)) {
			const error = Cause.squash(admitted.cause)

			record.error = describeFailure(error)

			if (error instanceof McpClientNotConnected) return undefined
			if (error instanceof McpRequestLimitReached)
				return jsonRpcError(429, error.message, {
					'Retry-After': String(RETRY_AFTER_SECONDS),
				})

			throw error
		}

		record.tools = listMcpTools(admitted.value)

		const run: McpToolRunner = async (tool, effect) => {
			record.tool = tool
			// The SDK has read the whole body by now; the copy would keep it until the response is sent.
			releaseCopy(record.copy)

			const exit = await runPromiseExit(effect)

			if (Exit.isSuccess(exit)) {
				record.outcome = 'ok'

				return textResult(exit.value)
			}

			const error = Cause.squash(exit.cause)

			record.error = describeFailure(error)

			if (isExpected(error)) {
				record.outcome = 'refused'

				return textResult({ error: error.message }, true)
			}

			record.outcome = 'failed'

			return textResult({ error: UNAVAILABLE }, true)
		}

		return await createMcpHandler(
			() => createMcpServer({ grant: admitted.value, version: commit, run }),
			// No change events to listen for: the tools are fixed per request.
			{ legacy: 'stateless', maxSubscriptions: 0 }
		).fetch(request)
	}

	/** One line, as the API's other log lines: scalar fields after the message. */
	function log(record: McpRequestRecord, status: number, startedAt: number) {
		Effect.runSyncWith(services)(
			Effect.logInfo(
				'MCP request',
				`status=${status}`,
				`tool=${record.tool ?? '-'}`,
				`outcome=${record.outcome ?? toOutcome(status)}`,
				`error=${record.error ?? '-'}`,
				`durationMs=${Math.round(performance.now() - startedAt)}`
			)
		)
	}

	return async (request: Request) => {
		const startedAt = performance.now()
		const record: McpRequestRecord = {}

		if (request.headers.has('origin')) {
			log(record, 403, startedAt)

			return jsonRpcError(403, BROWSER_REFUSED)
		}

		// The SDK reads the original; the copy is read only after a tools/call it refused, up to the limit, and released otherwise.
		record.copy =
			request.method === 'POST'
				? (request.clone().body ?? undefined)
				: undefined

		try {
			const response = await auth.serveMcpRequest(
				request,
				async token => await serveMcpRequest(request, token, record)
			)

			return whenSent(response, async () => {
				await recordRefusedCall(record)
				log(record, response.status, startedAt)
			})
		} catch (error) {
			releaseCopy(record.copy)
			record.outcome = 'failed'
			record.error ??= describeFailure(error)
			log(record, 503, startedAt)

			return jsonRpcError(503, UNAVAILABLE)
		}
	}
}
