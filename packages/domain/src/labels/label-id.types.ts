import type { Brand } from '../shared/brand.types'

export type LabelId = Brand<string, 'label_id'>

export function toLabelId(value: string): LabelId {
	return value as LabelId
}
