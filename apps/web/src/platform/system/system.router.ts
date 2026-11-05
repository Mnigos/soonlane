import { AppConfig } from '../config/app.config'
import { os } from '../rpc/rpc.base'

const LOCAL_VERSION = 'dev'

export const systemRouter = {
	health: os.system.health.effect(function* () {
		const { version } = yield* AppConfig

		return { ok: true, version: version ?? LOCAL_VERSION }
	}),
}
