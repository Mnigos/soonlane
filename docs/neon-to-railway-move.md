# Moving production data from Neon to Railway Postgres

The runbook for SOON-123. The move ran on 2026-11-12 between 22:04 and 22:14 UTC; since then production's `api` reads and writes Railway, and Neon was not kept as a way back, so the ways back below no longer apply. Before the move, `api` read and wrote Neon (`DATABASE_URL`, Neon `main`, direct). The move copies the data into the `railway` database of the `Postgres` service in `production` ([railway-postgres.md](railway-postgres.md)) during one short outage, then points `api` at it. Read it before the rehearsal and keep it open during the move. No value of a secret goes into a terminal echo, the repository, the ticket or a chat.

## How the outage works

`MAINTENANCE_MODE=on` on the `api` service turns on the maintenance switch at the next deploy:

- Reads keep working: task lists, labels, the session lookup, the calendar feed, health.
- Every oRPC procedure that writes answers 503 with `{ "code": "MAINTENANCE" }`. Only procedures the contract builds from `query` (`packages/contracts/src/read-only.base.ts`) may run; anything else is refused.
- Every `/api/auth` request answers 503 with the same code before Better Auth runs: no sign-in, sign-out, desktop sign-in or account deletion, and no rate-limit counter.
- The session lookup neither refreshes nor deletes a session.
- The web app and the Mac app show "Changes and sign-in are paused for a few minutes during an update. Try again shortly." instead of an error. A change made on screen is rolled back.

Nothing in the app writes to the database while the switch is on. The Neon freeze below adds a second barrier at the database itself.

## Rules for the window

The window runs from "Maintenance on" until "Maintenance off" is checked.

- Merge nothing to `main`. A push to `main` that touches the `api` paths deploys `api`, and its pre-deploy command runs the migrator against whatever `DATABASE_URL` points at at that moment: Neon, or a Railway database in the middle of a restore. It also replaces the code the rehearsal ran.
- Do not run `railway config apply`. `.railway/railway.ts` does not declare `MAINTENANCE_MODE`, so an apply deletes it and the switch goes off.
- Each variable change below redeploys `api`, and each redeploy runs the migrator. With nothing pending it writes no row. Against the frozen Neon it fails at `CREATE SCHEMA IF NOT EXISTS "drizzle"` and the previous deployment keeps serving, so lift the freeze before any deploy that points `api` at Neon.

## Before the rehearsal

Run all of this from the repository root, in zsh or bash.

1. **Client tools.** `brew install libpq`, then put `/opt/homebrew/opt/libpq/bin` first on `PATH`. Check: `pg_dump --version` and `pg_restore --version` print 18 or newer. The client's major version must be at least the newer of the two servers.
2. **Neon's address.** In the Neon console open the project, **Connect**, branch `main`, and turn **Connection pooling** off: `pg_dump` needs the direct endpoint. Copy the URL, then run `read -rs NEON_URL && export NEON_URL` and paste it. Nothing is echoed and the value stays out of the shell history.
3. **Helpers.** Define `railway`, `P` and `rpg` from [railway-postgres.md](railway-postgres.md#public-access-for-maintenance), then:

   ```sh
   # pg_restore through the TCP proxy; railway run passes the credentials without printing them
   rrestore() { railway run -p "$P" -e production -s Postgres -- sh -c 'PGHOST="$RAILWAY_TCP_PROXY_DOMAIN" PGPORT="$RAILWAY_TCP_PROXY_PORT" PGSSLMODE=require exec pg_restore "$@"' pg_restore "$@"; }
   health() { curl -s -X POST https://api.soonlane.com/api/rpc/system/health -H 'content-type: application/json' -d '{}' | jq -c .json; }
   # 503 MAINTENANCE while the switch is on, 401 UNAUTHORIZED while it is off
   refused() { curl -s -X POST https://api.soonlane.com/api/rpc/tasks/create -H 'content-type: application/json' -d '{"json":{"title":"x","dueDate":"2026-01-01"}}' -w ' %{http_code}\n'; }
   ```

4. **How the dump reaches Railway.** The `Postgres` service has no public address. The dump goes from Neon to a file on the laptop, and `pg_restore` sends it to Railway through the TCP proxy. That is the route the SOON-122 drill used and documented, and it needs no extra service. The proxy is open only for the restore and its checks. Turn it off with `railway tcp-proxy delete <proxy-id> --yes -p "$P" -e production -s Postgres` and check that `railway tcp-proxy list -p "$P" -e production -s Postgres` lists none. The dump file holds every user's data. Keep it in a directory only you can read and delete it at the end.
5. **Versions.** `psql "$NEON_URL" -Atc 'show server_version'` must be 18 or lower; Railway runs 18 (`rpg -Atc 'show server_version'` with the proxy open). Write Neon's major in the ticket. The way back after the line restores a dump of Railway's 18 into Neon; the 2026-11-12 rehearsal restored one into Neon 17 without an error and with equal tables, so the way back uses the same Neon project.
6. **The freeze is allowed.** `psql "$NEON_URL" -Atc "select pg_get_userbyid(datdba) = current_user from pg_database where datname = current_database()"` prints `t`. Only the database's owner can freeze it.
7. **One database variable.** `railway variables -p "$P" -s api -e production --json | jq 'has("DATABASE_URL_UNPOOLED")'` prints `false`. The migrator prefers `DATABASE_URL_UNPOOLED` (`packages/db/migrator.helper.ts`), so if it exists, step 8 of the move would leave the pre-deploy migrator on Neon. Remove it before the window.
8. **Check files.** Save these three next to the dump.

   `every-table.sql` lists every table in every schema with its row count and an md5 of all its rows, so a missing, extra or changed row shows up:

   ```sql
   set timezone = 'UTC';
   set datestyle = 'ISO, MDY';
   select format(
   	'select %L, count(*), md5(coalesce(string_agg(t::text, E''\n'' order by t::text collate "C"), '''')) from %I.%I t',
   	n.nspname || '.' || c.relname, n.nspname, c.relname
   )
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('r', 'p')
   	and n.nspname not in ('pg_catalog', 'information_schema')
   	and n.nspname not like 'pg\_%'
   order by n.nspname, c.relname
   \gexec
   ```

   `sequences.sql`:

   ```sql
   select schemaname || '.' || sequencename, last_value from pg_sequences order by 1;
   ```

   `latest-migration.sql`, the newest migration Drizzle applied (`name` is the folder under `packages/db/migrations`):

   ```sql
   select id, name, hash from drizzle.__drizzle_migrations order by id desc limit 1;
   ```

## Rehearsal

A dump of Neon production restored into a scratch database on Railway, never into `railway`. Nobody notices it: no switch and no freeze on production.

1. Record the starting point in the ticket: `git rev-parse origin/main`, and `psql "$NEON_URL" -qAt -f latest-migration.sql`.
2. Dump and time it: `time pg_dump "$NEON_URL" --format=custom --no-privileges --file=rehearsal.dump`.
3. Open the proxy (railway-postgres.md, step 1). Create the scratch database: `rpg -d postgres -c 'create database rehearsal'`.
4. Restore and time it: `time rrestore --no-owner --no-privileges --exit-on-error --single-transaction -d rehearsal rehearsal.dump`. An error stops it and leaves `rehearsal` empty. Note the error, fix the command here, and repeat.
5. Compare:

   ```sh
   psql "$NEON_URL" -qAt -f every-table.sql > neon-tables.txt
   rpg -d rehearsal -qAt -f every-table.sql > rehearsal-tables.txt
   diff neon-tables.txt rehearsal-tables.txt
   psql "$NEON_URL" -qAt -f sequences.sql | diff - <(rpg -d rehearsal -qAt -f sequences.sql)
   psql "$NEON_URL" -qAt -f latest-migration.sql | diff - <(rpg -d rehearsal -qAt -f latest-migration.sql)
   ```

   Neon keeps taking writes during the rehearsal, so `public.session`, `public.rate_limit` or `public.verification` may differ, and a task table if someone used the app since the dump. During the move the freeze makes the first diff empty. The migration diff must be empty.
6. Try the switches on staging, with staging's own data (staging runs the same code once this PR is on `main`). On `api` in `staging`: set `MAINTENANCE_MODE=on`, time the redeploy until health shows `"maintenance":true`, check `refused` against the staging host, then set `DATABASE_URL` to a scratch database on staging's `Postgres` (`postgresql://${{Postgres.PGUSER}}:${{Postgres.PGPASSWORD}}@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/scratch`; open staging's proxy to create it first and close it afterwards) and back to `${{Postgres.DATABASE_URL}}`, checking health after each, then set `MAINTENANCE_MODE=off`. That is the way back from step 8 of the move, and it gives the redeploy times.
7. Try the freeze on the Neon `preview` branch, not `main`, with that branch's direct URL in place of `$NEON_URL`: the two statements and the role check from "Freeze Neon" below, a write that fails with `cannot execute ... in a read-only transaction`, then the statement from "Way back" that lifts it.
8. Try the way back after the line: dump `rehearsal` from Railway as in "Way back" step 2 (with `-d rehearsal`), restore it into a scratch database on a Neon branch other than `main`, compare `every-table.sql` on both sides, time it, drop the scratch database and `rm back.dump`. Write in the ticket which Neon project and branch the way back uses.
9. Clean up: `rpg -d postgres -c 'drop database rehearsal with (force)'`, close the proxy and check none is left, `rm rehearsal.dump neon-tables.txt rehearsal-tables.txt`.
10. Fill in the Rehearsal column of the timings table and post it in the ticket.

## The move

Pick a quiet hour. Keep a log with the UTC time of each step.

1. **Nothing changed since the rehearsal.** `git fetch` and `git log --oneline <rehearsal sha>..origin/main -- packages/db/migrations` prints nothing, and `psql "$NEON_URL" -qAt -f latest-migration.sql` prints the line recorded in the rehearsal. If either differs, a migration landed since; redo the rehearsal first. SOON-101 is one such migration (it makes the task due date nullable).
2. **Latency before.** `for i in $(seq 20); do curl -s -o /dev/null -w '%{time_total}\n' -X POST https://api.soonlane.com/api/rpc/system/health -H 'content-type: application/json' -d '{}'; done | sort -n | sed -n 10p` prints the median in seconds. Each call runs one `select 1` on the database.
3. **Maintenance on.** `railway variables -p "$P" -s api -e production --set MAINTENANCE_MODE=on`. Railway redeploys `api`. Wait until `railway deployment list -p "$P" --service api --environment production` shows the new deployment as successful, then 30 seconds more for the old one to drain. Check: `health` prints `"maintenance":true` and `"db":"ok"`, `refused` prints `MAINTENANCE` and 503, and `curl -s -o /dev/null -w '%{http_code}\n' -X POST https://api.soonlane.com/api/auth/sign-out` prints 503. The app shows your tasks, and adding one shows the notice.
4. **Freeze Neon.** This stops every writer, the old Vercel build included, which shares this database:

   ```sh
   printf '%s\n' "select format('alter database %I set default_transaction_read_only = on', current_database())" '\gexec' | psql "$NEON_URL" -v ON_ERROR_STOP=1
   psql "$NEON_URL" -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = current_database() and pid <> pg_backend_pid() and usename = current_user"
   ```

   The setting applies to new sessions, so the second statement ends the open ones; `api` reconnects at once and keeps reading. A read that was running at that moment fails once with a `DbError` log line and a PostHog exception; that is expected. Neon lets a role end only its own sessions. Check that no other role is connected: `psql "$NEON_URL" -Atc "select count(*) from pg_stat_activity where datname = current_database() and usename <> current_user"` prints 0; otherwise end those sessions from the Neon console. Then check: `psql "$NEON_URL" -Atc 'show default_transaction_read_only'` prints `on`, `health` still prints `"db":"ok"`, and `psql "$NEON_URL" -Atc 'select coalesce(sum(n_tup_ins + n_tup_upd + n_tup_del), 0) from pg_stat_user_tables'` prints the same number twice, a minute apart.
5. **Dump.** `psql "$NEON_URL" -qAt -f latest-migration.sql > neon-migration.txt`, compare it with the rehearsal's line, then `time pg_dump "$NEON_URL" --format=custom --no-privileges --file=move.dump`. Also save `psql "$NEON_URL" -qAt -f every-table.sql > neon-tables.txt` and `psql "$NEON_URL" -qAt -f sequences.sql > neon-sequences.txt`.
6. **Restore.** Open the proxy. Check that `railway` is empty: `rpg -Atc "select count(*) from pg_tables where schemaname not in ('pg_catalog', 'information_schema')"` prints 0. Then `time rrestore --no-owner --no-privileges --exit-on-error --single-transaction -d railway move.dump`.
7. **Check the copy.** Each command prints nothing:

   ```sh
   rpg -qAt -f every-table.sql | diff neon-tables.txt -
   rpg -qAt -f sequences.sql | diff neon-sequences.txt -
   rpg -qAt -f latest-migration.sql | diff neon-migration.txt -
   ```

   Equal lines mean the same row count and the same md5 of every row in every table, `drizzle.__drizzle_migrations` included.
8. **Point `api` at Railway.** `railway variables -p "$P" -s api -e production --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'`, in single quotes so the shell leaves the reference alone. The redeploy runs the migrator on Railway, which finds nothing pending. Check: the deployment succeeds; `railway variables -p "$P" -s api -e production --json | jq -r '.DATABASE_URL | capture("@(?<host>[^:/]+)").host'` prints `postgres.railway.internal` and nothing else; `health` prints `"db":"ok"` and `"maintenance":true`; `rpg -Atc "select count(*) from pg_stat_activity where datname = 'railway' and backend_type = 'client backend' and application_name <> 'psql'"` prints more than 0, so `api` holds connections to Railway. Neon may still show connections from the old Vercel build or its pooler; they cannot write while it is frozen.
9. **Smoke test, still in maintenance.** Signed in on soonlane.com and in the Mac app, Upcoming, Today and a label view show the same tasks as before. A calendar subscription link returns the feed.
10. **Maintenance off.** `railway variables -p "$P" -s api -e production --set MAINTENANCE_MODE=off`. Check: `health` prints `"maintenance":false`, `refused` prints `UNAUTHORIZED` and 401. Sign out and in again, add a task, complete it, delete it. From here on writes land on Railway; this is the line in "Way back".
11. **Clean up.** Close the proxy and check none is left. `rm move.dump neon-*.txt`. Neon keeps the data.
12. **Latency after.** The command from step 2. Write both numbers in the ticket.

| Step | Rehearsal | Move |
| --- | --- | --- |
| Maintenance on, variable set to health showing it | | |
| `pg_dump` | | |
| `pg_restore` | | |
| Checks (step 7) | | |
| `DATABASE_URL` switch, variable set to health | | |
| Outage, maintenance on to off | | |

## Way back

**Before the line** (maintenance still on, no write has reached Railway): lift the freeze, then set the one variable back.

```sh
printf '%s\n' 'set default_transaction_read_only = off;' "select format('alter database %I reset default_transaction_read_only', current_database())" '\gexec' | psql "$NEON_URL" -v ON_ERROR_STOP=1
psql "$NEON_URL" -Atc 'show default_transaction_read_only'
```

The first `set` matters, and so does its semicolon: without it psql joins it to the next line, fails with a syntax error, and the database stays frozen. A new session on the frozen database is read-only too, and Postgres refuses `ALTER DATABASE` in a read-only transaction. The last command opens a fresh session and must print `off`.

Then set `DATABASE_URL` on `api` back to Neon's direct URL, the value in `$NEON_URL`, in the dashboard (**api → Variables**), and wait for the redeploy. Check `health` (`"db":"ok"`), then turn maintenance off as in step 10. Railway's `railway` database can stay as it is; drop it before the next attempt with `rpg -d postgres -c 'drop database railway with (force)' -c 'create database railway owner postgres'`.

**After the line**, Railway holds writes Neon does not have, so the way back is a dump in the other direction:

1. Maintenance on (step 3).
2. Open the proxy and dump Railway: `railway run -p "$P" -e production -s Postgres -- sh -c 'PGHOST="$RAILWAY_TCP_PROXY_DOMAIN" PGPORT="$RAILWAY_TCP_PROXY_PORT" PGSSLMODE=require exec pg_dump --format=custom --no-privileges --file=back.dump'`.
3. In the Neon console create an empty database `soonlane_back` on the project and branch the rehearsal used for this route and load its direct URL with `read -rs NEON_BACK_URL && export NEON_BACK_URL`. The freeze belongs to the old database only.
4. `pg_restore --no-owner --no-privileges --exit-on-error --single-transaction -d "$NEON_BACK_URL" back.dump`, then compare `every-table.sql` on both sides as in step 7.
5. Close the proxy and check none is left.
6. Point `DATABASE_URL` at `soonlane_back`, check `health`, maintenance off. `rm back.dump`.

**The DNS way back to the old Vercel build** ([deploy-railway.md](deploy-railway.md), Cutover, "Going back") is a separate route. That build reads Neon directly, so it needs the freeze lifted, and it only shows Neon's data as of the move. It ends once a migration that the old build cannot read lands on Neon. SOON-101's nullable due date is one: if it is applied to Neon before the move, this route is already closed.

## After the move

- Neon stays untouched and frozen for 14 days. Write the earliest deletion date, the move date plus 14 days, in the ticket. The deletion belongs to the last ticket of stage 4.
- Write the latency before and after in the ticket (steps 2 and 12).
- The first scheduled Railway backup after the move holds the data. SOON-122 has no dump job, so the check is the volume backup. Its daily time is in the Backups tab ([railway-postgres.md](railway-postgres.md#backups)). Check that one exists with a `createdAt` after maintenance went off (the GraphQL query in railway-postgres.md) and write its name in the ticket. Never restore a scheduled backup onto production to look inside it: a restore replaces the volume and drops every write made since. The restore drill in railway-postgres.md takes its own fresh manual backup, so it shows that restoring works, not what a scheduled backup holds.
- A later PR makes the deploy page and `ARCHITECTURE.md` name Railway as the production database.
