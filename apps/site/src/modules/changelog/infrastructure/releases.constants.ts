import { changelog } from 'virtual:changelog'
import { parseChangelog } from './changelog.parser'

export const RELEASES = parseChangelog(changelog)
