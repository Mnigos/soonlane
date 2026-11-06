import { Layer } from 'effect'
import { AppMenuLive } from '../modules/menu/infrastructure/app-menu.layer'
import { NavigationLive } from '../modules/navigation/application/navigation.service'
import { ElectrobunSystemBrowserLive } from '../modules/navigation/infrastructure/electrobun-system-browser.layer'
import { NavigationEventsLive } from '../modules/navigation/infrastructure/navigation-events.layer'
import { FileFrameStoreLive } from '../modules/window/infrastructure/file-frame-store.layer'
import { MainWindowLive } from '../modules/window/infrastructure/main-window.layer'
import { DesktopConfigLive } from './config/desktop.config'

export const AppLive = Layer.mergeAll(AppMenuLive, NavigationEventsLive).pipe(
	Layer.provide(NavigationLive),
	Layer.provide(ElectrobunSystemBrowserLive),
	Layer.provideMerge(MainWindowLive),
	Layer.provide(FileFrameStoreLive),
	Layer.provideMerge(DesktopConfigLive)
)
