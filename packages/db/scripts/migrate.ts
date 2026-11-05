import { resolveMigrationUrl, runMigrations } from '../migrator.helper'

await runMigrations(resolveMigrationUrl(process.env))

console.log('Migrations applied.')
