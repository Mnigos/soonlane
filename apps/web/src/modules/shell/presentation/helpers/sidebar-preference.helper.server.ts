import { getCookie } from '@tanstack/react-start/server'
import {
	SIDEBAR_COOKIE,
	toSidebarPreference,
} from './sidebar-preference.helper'

export function getServerSidebarPreference() {
	return toSidebarPreference(getCookie(SIDEBAR_COOKIE))
}
