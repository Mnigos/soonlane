/**
 * What the browser shows after it handed the code to the app, before the app
 * has exchanged it, so it promises no signed-in state. The script drops the
 * code from the address bar and the tab's history entry.
 */
export const CALLBACK_PAGE = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Signing in · Soonlane</title>
		<style>
			:root { color-scheme: dark; }
			body { margin: 0; min-height: 100dvh; display: grid; place-items: center; background: #0f0f10; color: #ececed; font: 15px/1.5 system-ui, sans-serif; }
			main { max-width: 22rem; padding: 2rem; }
			h1 { margin: 0 0 0.25rem; font-size: 1.25rem; }
			p { margin: 0; color: #a1a1a6; }
		</style>
		<script>history.replaceState(null, '', '/')</script>
	</head>
	<body>
		<main>
			<h1>Sign-in continues in Soonlane</h1>
			<p>You can close this tab and go back to the app.</p>
		</main>
	</body>
</html>`
