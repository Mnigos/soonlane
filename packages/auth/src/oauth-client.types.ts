/** An app registered with an OAuth provider. */
export interface OAuthClientOptions {
	clientId: string
	clientSecret: string
}

/** Which of a grant's tokens a revocation names (RFC 7009 `token_type_hint`). */
export type OAuthTokenKind = 'access_token' | 'refresh_token'
