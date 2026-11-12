import type {
	CreateProjectInput,
	ListedProject,
	Project,
} from '@soonlane/contracts'
import { PROJECT_OWNER_NAME_INDEX } from '@soonlane/db'
import type { ProjectId, UserId } from '@soonlane/domain'
import { Context, Effect, Layer } from 'effect'
import { type DbError, isUniqueViolation } from '@/platform/db/db.errors'
import { ProjectNameTaken, ProjectNotFound } from '../domain/project.errors'
import {
	type ProjectChanges,
	ProjectRepository,
} from '../infrastructure/project.repository'

export class ProjectsService extends Context.Service<
	ProjectsService,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<ListedProject[], DbError>
		readonly create: (
			ownerId: UserId,
			input: CreateProjectInput
		) => Effect.Effect<Project, ProjectNameTaken | DbError>
		readonly update: (
			ownerId: UserId,
			id: ProjectId,
			changes: ProjectChanges
		) => Effect.Effect<Project, ProjectNotFound | ProjectNameTaken | DbError>
		readonly delete: (
			ownerId: UserId,
			id: ProjectId
		) => Effect.Effect<void, ProjectNotFound | DbError>
	}
>()('soonlane/ProjectsService') {}

function requireProject(project: Project | undefined) {
	return project ? Effect.succeed(project) : Effect.fail(new ProjectNotFound())
}

function failNameTaken(error: DbError) {
	return Effect.fail(
		isUniqueViolation(error, PROJECT_OWNER_NAME_INDEX)
			? new ProjectNameTaken()
			: error
	)
}

export const ProjectsServiceLive = Layer.effect(
	ProjectsService,
	Effect.gen(function* () {
		const repository = yield* ProjectRepository

		const list = Effect.fn('ProjectsService.list')(function* (ownerId: UserId) {
			return yield* repository.list(ownerId)
		})

		const create = Effect.fn('ProjectsService.create')(function* (
			ownerId: UserId,
			input: CreateProjectInput
		) {
			return yield* repository
				.create({ ...input, ownerId })
				.pipe(Effect.catchTag('DbError', failNameTaken))
		})

		const update = Effect.fn('ProjectsService.update')(function* (
			ownerId: UserId,
			id: ProjectId,
			changes: ProjectChanges
		) {
			return yield* requireProject(
				yield* repository
					.update({ ...changes, ownerId, id })
					.pipe(Effect.catchTag('DbError', failNameTaken))
			)
		})

		const remove = Effect.fn('ProjectsService.delete')(function* (
			ownerId: UserId,
			id: ProjectId
		) {
			yield* requireProject(yield* repository.delete({ ownerId, id }))
		})

		return ProjectsService.of({ list, create, update, delete: remove })
	})
)
