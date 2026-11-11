import {
	Config,
	Context,
	Effect,
	Layer,
	Schema,
	SchemaTransformation,
} from 'effect'

const originsSchema = Schema.String.pipe(
	Schema.decodeTo(
		Schema.Array(Schema.URLFromString),
		SchemaTransformation.transform<readonly string[], string>({
			decode: value => value.split(','),
			encode: origins => origins.join(','),
		})
	)
)

export class AppConfig extends Context.Service<
	AppConfig,
	{
		readonly port: number
		readonly environment: string
		readonly commit: string
		readonly baseUrl: string
		readonly trustedOrigins: readonly string[]
	}
>()('soonlane/AppConfig') {}

/** Every setting is required: a missing or malformed variable stops the start with its name. */
const appConfig = Config.all({
	port: Config.port('PORT'),
	environment: Config.nonEmptyString('APP_ENV'),
	// GitHub deploys get the commit from Railway; `railway up` uploads no git metadata, so the staging workflow sets `APP_COMMIT`.
	commit: Config.nonEmptyString('RAILWAY_GIT_COMMIT_SHA').pipe(
		Config.orElse(() => Config.nonEmptyString('APP_COMMIT'))
	),
	baseUrl: Config.url('API_URL').pipe(Config.map(url => url.origin)),
	trustedOrigins: Config.schema(originsSchema, 'TRUSTED_ORIGINS').pipe(
		Config.map(urls => urls.map(url => url.origin))
	),
})

export const AppConfigLive = Layer.effect(
	AppConfig,
	Effect.gen(function* () {
		return yield* appConfig
	})
)
