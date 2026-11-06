import { Layer } from 'effect'
import { AppMenuLive } from '../modules/menu/infrastructure/app-menu.layer'
import { NavigationLive } from '../modules/navigation/application/navigation.service'
import { ElectrobunSystemBrowserLive } from '../modules/navigation/infrastructure/electrobun-system-browser.layer'
import { NavigationEventsLive } from '../modules/navigation/infrastructure/navigation-events.layer'
import { DesktopSignInLive } from '../modules/sign-in/application/desktop-sign-in.service'
import { SignInEventsLive } from '../modules/sign-in/infrastructure/sign-in-events.layer'
import { FileFrameStoreLive } from '../modules/window/infrastructure/file-frame-store.layer'
import { MainWindowLive } from '../modules/window/infrastructure/main-window.layer'
import { DesktopConfigLive } from './config/desktop.config'

export const AppLive = Layer.mergeAll(
	AppMenuLive,
	NavigationEventsLive,
	SignInEventsLive
).pipe(
	Layer.provide(Layer.mergeAll(NavigationLive, DesktopSignInLive)),
	Layer.provide(ElectrobunSystemBrowserLive),
	Layer.provideMerge(MainWindowLive),
	Layer.provide(FileFrameStoreLive),
	Layer.provideMerge(DesktopConfigLive)
)
