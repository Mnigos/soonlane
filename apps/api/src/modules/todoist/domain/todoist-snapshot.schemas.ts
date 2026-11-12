import { Schema } from 'effect'

const nullable = <TSchema extends Schema.Top>(schema: TSchema) =>
	Schema.optionalKey(Schema.NullOr(schema))

/** `date` is `YYYY-MM-DD`, or a floating `YYYY-MM-DDTHH:MM:SS`, or the same in UTC with a trailing `Z` when the time is pinned to a zone. */
const dueSchema = Schema.Struct({
	date: Schema.String,
	is_recurring: Schema.Boolean,
	timezone: nullable(Schema.String),
})

const itemSchema = Schema.Struct({
	id: Schema.String,
	content: Schema.String,
	description: nullable(Schema.String),
	project_id: Schema.String,
	section_id: nullable(Schema.String),
	parent_id: nullable(Schema.String),
	labels: Schema.Array(Schema.String),
	priority: Schema.Number,
	due: nullable(dueSchema),
	deadline: nullable(Schema.Unknown),
	duration: nullable(Schema.Unknown),
	checked: Schema.optionalKey(Schema.Boolean),
	is_deleted: Schema.optionalKey(Schema.Boolean),
})

/** The parts of one Todoist full sync an import reads; Todoist sends more, which decoding drops. */
export const todoistSnapshotSchema = Schema.Struct({
	user: Schema.Struct({ inbox_project_id: Schema.String }),
	projects: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			parent_id: nullable(Schema.String),
			is_deleted: Schema.optionalKey(Schema.Boolean),
		})
	),
	items: Schema.Array(itemSchema),
	labels: Schema.Array(
		Schema.Struct({
			name: Schema.String,
			color: nullable(Schema.String),
			is_deleted: Schema.optionalKey(Schema.Boolean),
		})
	),
})
export type TodoistSnapshot = typeof todoistSnapshotSchema.Type
export type TodoistItem = (typeof itemSchema)['Type']
