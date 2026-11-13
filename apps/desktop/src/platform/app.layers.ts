import { Layer } from 'effect'
import { AppKitDockBadgeLive } from '../modules/dock-badge/infrastructure/app-kit-dock-badge.layer'
import { DockBadgeEventsLive } from '../modules/dock-badge/infrastructure/dock-badge-events.layer'
import { AppMenuLive } from '../modules/menu/infrastructure/app-menu.layer'
import { NavigationLive } from '../modules/navigation/application/navigation.service'
import { ElectrobunSystemBrowserLive } from '../modules/navigation/infrastructure/electrobun-system-browser.layer'
import { NavigationEventsLive } from '../modules/navigation/infrastructure/navigation-events.layer'
import { QuickAddLive } from '../modules/quick-add/infrastructure/quick-add.layer'
import { DesktopSessionLive } from '../modules/sign-in/application/desktop-session.service'
import { KeychainTokenStoreLive } from '../modules/sign-in/infrastructure/keychain-token-store.layer'
import { FileFrameStoreLive } from '../modules/window/infrastructure/file-frame-store.layer'
import { MainWindowLive } from '../modules/window/infrastructure/main-window.layer'
import { DesktopConfigLive } from './config/desktop.config'

export const AppLive = Layer.mergeAll(
	AppMenuLive,
	NavigationEventsLive,
	QuickAddLive,
	DockBadgeEventsLive
).pipe(
	Layer.provide(NavigationLive),
	Layer.provideMerge(MainWindowLive),
	Layer.provide(FileFrameStoreLive),
	Layer.provideMerge(AppKitDockBadgeLive),
	Layer.provideMerge(DesktopSessionLive),
	Layer.provide(KeychainTokenStoreLive),
	Layer.provideMerge(ElectrobunSystemBrowserLive),
	Layer.provideMerge(DesktopConfigLive)
)
