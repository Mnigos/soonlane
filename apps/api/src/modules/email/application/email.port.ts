import type { SignInCodeMail } from '@soonlane/auth/server'
import { Context, type Effect } from 'effect'

/** Mail the API sends; no method fails, so a lost mail never fails the request that sent it. */
export class Email extends Context.Service<
	Email,
	{
		readonly sendSignInCode: (mail: SignInCodeMail) => Effect.Effect<void>
	}
>()('soonlane/Email') {}
