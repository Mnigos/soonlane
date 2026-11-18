/** Where the iPhone app opens a sign-in in its sheet; it signs the OAuth state into whichever browser opens it. */
export const EXPO_PROXY_PATH = '/expo-authorization-proxy'
/** The Android app's package; the web's callback page opens only this app. */
export const ANDROID_PACKAGE = 'com.mnigos.soonlane'
/** The browser page that hands a sign-in to the Android app, through the desktop hand-off's code. */
export const ANDROID_SIGN_IN_PATH = '/android/sign-in'
/** Where that page sends the code: an App Link Android opens only in the app `assetlinks.json` verifies. */
export const ANDROID_CALLBACK_PATH = '/android/callback'
/** Where the Android app trades that code and its verifier for a session cookie; the desktop app trades its codes only for a token. */
export const ANDROID_EXCHANGE_PATH = '/android-sign-in/exchange'

/** The mobile app sends it with `MOBILE_APP` on its API calls. */
export const MOBILE_APP_HEADER = 'x-soonlane-app'
export const MOBILE_APP = 'mobile'
