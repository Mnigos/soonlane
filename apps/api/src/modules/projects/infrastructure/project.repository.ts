import type {
	CreateProjectInput,
	ListedProject,
	Project,
	UpdateProjectInput,
} from '@soonlane/contracts'
import { project, task } from '@soonlane/db'
import type { ProjectId, UserId } from '@soonlane/domain'
import { and, asc, count, eq, isNull, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import {
	ownedBy,
	SHOWN_IN_LISTS,
} from '@/modules/tasks/infrastructure/owned-tasks.query'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'
import { toProject } from './project.mapper'

export interface OwnedProject {
	ownerId: UserId
	id: ProjectId
}

export interface NewProject extends CreateProjectInput {
	ownerId: UserId
}

export type ProjectChanges = Omit<UpdateProjectInput, 'id'>

export interface ProjectChange extends OwnedProject, ProjectChanges {}

export class ProjectRepository extends Context.Service<
	ProjectRepository,
	{
		readonly list: (ownerId: UserId) => Effect.Effect<ListedProject[], DbError>
		readonly create: (project: NewProject) => Effect.Effect<Project, DbError>
		readonly update: (
			change: ProjectChange
		) => Effect.Effect<Project | undefined, DbError>
		readonly delete: (
			project: OwnedProject
		) => Effect.Effect<Project | undefined, DbError>
	}
>()('soonlane/ProjectRepository') {}

export const ProjectRepositoryLive = Layer.effect(
	ProjectRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return ProjectRepository.of({
			list: ownerId =>
				db.run('ProjectRepository.list', async database => {
					const rows = await database
						.select({ project, openTaskCount: count(task.id) })
						.from(project)
						.leftJoin(
							task,
							and(
								eq(task.projectId, project.id),
								ownedBy(ownerId),
								isNull(task.completedAt),
								SHOWN_IN_LISTS
							)
						)
						.where(eq(project.ownerId, ownerId))
						.groupBy(project.id)
						.orderBy(asc(sql`lower(${project.name})`), asc(project.createdAt))

					return rows.map(row => ({
						...toProject(row.project),
						openTaskCount: row.openTaskCount,
					}))
				}),
			create: ({ ownerId, name }) =>
				db.run('ProjectRepository.create', async database => {
					const [row] = await database
						.insert(project)
						.values({ ownerId, name })
						.returning()

					if (!row) throw new Error('Project insert returned no row')

					return toProject(row)
				}),
			update: ({ ownerId, id, name }) =>
				db.run('ProjectRepository.update', async database => {
					const [row] = await database
						.update(project)
						.set({ name })
						.where(and(eq(project.ownerId, ownerId), eq(project.id, id)))
						.returning()

					return row && toProject(row)
				}),
			delete: ({ ownerId, id }) =>
				db.run(
					'ProjectRepository.delete',
					async database =>
						await database.transaction(async transaction => {
							// Unsetting the project on its tasks locks them; taking them first in the tree lock order avoids deadlocks.
							await transaction
								.select({ id: task.id })
								.from(task)
								.where(and(ownedBy(ownerId), eq(task.projectId, id)))
								.orderBy(asc(task.depth), asc(task.id))
								.for('update')

							const [row] = await transaction
								.delete(project)
								.where(and(eq(project.ownerId, ownerId), eq(project.id, id)))
								.returning()

							return row && toProject(row)
						})
				),
		})
	})
)
