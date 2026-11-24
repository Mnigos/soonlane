/** Every Linear string both host apps show; `{workspace}` is the connected workspace's name. */
export const LINEAR_COPY = {
	menuItem: 'Linear',
	menuStatusConnected: 'Connected',
	menuConnect: 'Connect Linear',
	submenuCaption: 'Connected to {workspace}',
	submenuOpen: 'Open Linear',
	submenuDisconnect: 'Disconnect',
	lapsedStatus: 'Reconnect',
	toastConnected: 'Linear connected',
	toastDisconnected: 'Linear disconnected',
	errorConnect: 'Could not connect Linear. Try again.',
	errorTaken:
		'This Linear account is already connected to another Soonlane account.',
	errorDisconnect: 'Could not disconnect Linear. Try again.',
	errorCancelled: 'Linear was not connected.',
} as const
