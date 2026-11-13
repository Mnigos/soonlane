// Hermes on iOS ships no Intl.Locale or Intl.PluralRules; @soonlane/domain builds a PluralRules at module load.
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
import '@formatjs/intl-pluralrules/polyfill-force.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import { registerRootComponent } from 'expo'
import { App } from './src/app'

registerRootComponent(App)
