import { Schema } from 'effect'

const coordinateSchema = Schema.Finite
const lengthSchema = Schema.Finite.check(Schema.isGreaterThan(0))

export const windowFrameSchema = Schema.Struct({
	x: coordinateSchema,
	y: coordinateSchema,
	width: lengthSchema,
	height: lengthSchema,
})
export type WindowFrame = typeof windowFrameSchema.Type

// `resize` events carry the whole frame, `move` events only `x` and `y`.
export const frameEventSchema = Schema.Struct({
	data: Schema.Struct({
		x: Schema.optionalKey(coordinateSchema),
		y: Schema.optionalKey(coordinateSchema),
		width: Schema.optionalKey(lengthSchema),
		height: Schema.optionalKey(lengthSchema),
	}),
})
