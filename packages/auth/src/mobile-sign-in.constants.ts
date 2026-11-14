/** The Android app's package; the web's callback page opens only this app. */
export const ANDROID_PACKAGE = 'com.mnigos.soonlane'
/** The browser page that hands a sign-in to the Android app, through the desktop hand-off's code. */
export const ANDROID_SIGN_IN_PATH = '/android/sign-in'
/** Where that page sends the code: an App Link Android opens only in the app `assetlinks.json` verifies. */
export const ANDROID_CALLBACK_PATH = '/android/callback'

/** The mobile app sends it with `MOBILE_APP` on its API calls and its code exchange. */
export const MOBILE_APP_HEADER = 'x-soonlane-app'
export const MOBILE_APP = 'mobile'
