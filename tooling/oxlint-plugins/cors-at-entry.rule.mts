import { defineRule } from '@oxlint/plugins'

/** Response headers only; a request's `Access-Control-Request-*` may be read anywhere. */
const CORS_HEADER_PATTERN = /^access-control-(?:allow-|expose-|max-age)/iu

/**
 * Forbids naming a CORS response header (`Access-Control-Allow-*`, `-Expose-Headers`,
 * `-Max-Age`) in a string or a template literal without expressions anywhere but
 * the API entry's `withCors`, which answers only the exact origins in
 * `TRUSTED_ORIGINS`. A header set elsewhere could open credentialed calls to
 * another origin or `*` without passing that list.
 */
export const corsAtEntryRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				'CORS headers are set only by withCors at the API entry (apps/api/src/platform/http/cors.helper.ts).',
		},
		messages: {
			corsHeader:
				'Set CORS headers only in withCors (apps/api/src/platform/http/cors.helper.ts), which checks TRUSTED_ORIGINS.',
		},
	},
	create(context) {
		return {
			Literal(node) {
				if (
					typeof node.value === 'string' &&
					CORS_HEADER_PATTERN.test(node.value)
				)
					context.report({ node, messageId: 'corsHeader' })
			},
			TemplateLiteral(node) {
				const [quasi] = node.quasis

				if (
					node.expressions.length === 0 &&
					CORS_HEADER_PATTERN.test(quasi?.value.cooked ?? '')
				)
					context.report({ node, messageId: 'corsHeader' })
			},
		}
	},
})
