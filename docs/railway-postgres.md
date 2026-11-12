# Production Postgres on Railway

The production database for the move off Neon (Linear project [Soonlane on Railway](https://linear.app/rigtch/project/soonlane-on-railway-66b76785820a), SOON-122). Nothing points at it yet. SOON-123 moves the data and SOON-119 points the API at it.

Railway's own volume backups protect it. There is no copy outside Railway and no dump job (Igor, 2026-11-11). The backups live in the same Railway project as the database. Deleting the project, wiping the volume or losing the Railway account loses the backups too.

## Setup

| What | Value |
| --- | --- |
| Railway project | `Soonlane` (`1e6066c5-929e-4baf-9eba-f4f90b8fcf6e`), workspace "Igor Makowski's Projects", Pro plan |
| Environment | `production` (`7fa805b3-a0c2-477d-a6a6-2b3d1df8c522`) |
| Service | `Postgres` (`da57ca13-0824-4367-9637-ba24a17b9a24`), Railway's PostgreSQL template |
| Image | `ghcr.io/railwayapp-templates/postgres-ssl:18`, server PostgreSQL 18.6 on 2026-11-11 |
| Region | Amsterdam, `europe-west4-drams3a` (service and volume) |
| Volume | `postgres-data` (`cae64ef6-4471-4da0-9af9-58c3679e2945`), 50 GB, mounted at `/var/lib/postgresql/data` |
| Database | `railway`, owner `postgres`, UTF8, `en_US.utf8`; production's data since the move from Neon on 2026-11-12 ([neon-to-railway-move.md](neon-to-railway-move.md)) |
| Private address | `postgres.railway.internal:5432`, reachable only from services in `production` |
| Public TCP proxy | off |

The image tag pins the major version (18), not the minor one, so a redeploy can pick up a newer 18.x. A move to 19 is a [major upgrade](https://docs.railway.com/databases/postgresql-major-upgrade) that someone starts on purpose.

## Variables

Railway generated the credentials when it created the service. Nobody typed or copied a secret. The `Postgres` service in `production` has:

- `DATABASE_URL` (private address, the one the API will use)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `PGDATA`, `SSL_CERT_DAYS`, `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`
- Railway's own `RAILWAY_*` variables, among them `RAILWAY_PRIVATE_DOMAIN` and `RAILWAY_VOLUME_*`

The API service will reference `${{Postgres.DATABASE_URL}}` instead of a copy. `DATABASE_PUBLIC_URL` does not exist, because public access is off. With the TCP proxy on, the service also gets `RAILWAY_TCP_PROXY_DOMAIN` and `RAILWAY_TCP_PROXY_PORT`.

## Backups

The volume has all three schedules on. Railway picks the minute of each run in UTC, and picks new ones whenever the schedule is saved, so read the current times in the Backups tab or with the query below. On 2026-11-11 at 22:46 UTC they were:

| Schedule | When (UTC) | Kept for |
| --- | --- | --- |
| Daily | every day at 08:36 | 6 days |
| Weekly | Saturdays at 05:45 | 27 days |
| Monthly | the 1st at 05:44 | 89 days |

That keeps about 6 daily, 4 weekly and 3 monthly backups at a time. A manual backup has no expiry and stays until someone deletes it. Backups are incremental copy-on-write snapshots of the whole volume, billed at the volume rate for the data that only they hold. A snapshot of a running Postgres is crash consistent, and Postgres replays its WAL on start. A manual backup may be at most half the volume's size.

To see the backups, open the project in the Railway dashboard, select the `production` environment, click the `Postgres` service, then the **Backups** tab. Each backup is listed by its date stamp, and the schedules are ticked above the list.

To check from a terminal, with the CLI logged in, send this query to `https://backboard.railway.com/graphql/v2` with the CLI's token as the bearer token. The volume instance id is `259e4847-9297-4510-9d4f-b7645b41d5e1`, and a restore changes it (below).

```graphql
query {
  volumeInstanceBackupScheduleList(volumeInstanceId: "259e4847-9297-4510-9d4f-b7645b41d5e1") { kind cron retentionSeconds }
  volumeInstanceBackupList(volumeInstanceId: "259e4847-9297-4510-9d4f-b7645b41d5e1") { name createdAt expiresAt }
}
```

The mutation `volumeInstanceBackupScheduleUpdate(volumeInstanceId: "…", kinds: [DAILY, WEEKLY, MONTHLY])` sets all three schedules, the same as ticking them in the Backups tab.

### When a backup fails

Nobody is told. Railway has no notification for a failed or missing backup: its webhooks and alerts cover deploy state changes, volume usage and CPU/RAM monitors. The workspace has no notification rules either. The project's activity feed shows `Backup created` when a backup runs, and nothing when one does not. Turning a schedule off leaves no entry in the feed either.

The only way to notice is to look. The Backups tab should show all three schedules ticked, a backup dated today once the daily run has passed, and six daily backups once the schedule has run for a week. A gap in the dates means a backup failed.

## Public access for maintenance

Postgres has no public address. A task that runs from a laptop, such as `pg_dump`, `pg_restore` or `psql`, opens the TCP proxy for the length of the task and closes it afterwards. Traffic through the proxy counts as egress.

The commands use the Railway CLI, logged in as a member of the workspace, and psql 18 or newer (`brew install libpq`, then add `/opt/homebrew/opt/libpq/bin` to `PATH`). A Homebrew `railway` 4.x knows neither `tcp-proxy` nor `-p`, so the function below runs the current CLI through Bun. In zsh or bash:

```sh
railway() { bun x @railway/cli "$@"; }
P=1e6066c5-929e-4baf-9eba-f4f90b8fcf6e
# psql against production through the proxy; railway run passes the credentials to psql without printing them
rpg() { railway run -p "$P" -e production -s Postgres -- sh -c 'PGHOST="$RAILWAY_TCP_PROXY_DOMAIN" PGPORT="$RAILWAY_TCP_PROXY_PORT" PGSSLMODE=require exec psql -v ON_ERROR_STOP=1 "$@"' psql "$@"; }
```

1. Open the proxy and check that psql connects:

   ```sh
   railway tcp-proxy create -p "$P" -e production -s Postgres --port 5432
   rpg -c 'select version()'
   ```

2. Do the work with `rpg`. It takes any psql argument, for example `rpg -f file.sql`, or SQL on standard input. Node's `pg` needs `?sslmode=no-verify` in a URL built from the same variables, because the server's certificate is self-signed.

3. Close the proxy and check that none is left:

   ```sh
   railway tcp-proxy list -p "$P" -e production -s Postgres
   railway tcp-proxy delete <proxy-id> --yes -p "$P" -e production -s Postgres
   railway tcp-proxy list -p "$P" -e production -s Postgres
   ```

In the dashboard, the same switch is **Postgres → Settings → Networking**: adding **Public Access** creates the proxy and `DATABASE_PUBLIC_URL`, and removing it deletes both.

## Restore

A restore puts back the whole database as it was when the backup ran. Everything written after that backup is gone from the live database. Before you restore a database that real users write to, stop the API (or accept losing the newest writes), and write down why you are restoring.

1. In the Railway dashboard, open project `Soonlane`, environment `production`, service `Postgres`, tab **Backups**.
2. Find the backup by its date stamp and click **Restore**. Railway prepares a new volume from it, which takes seconds.
3. A banner at the top of the canvas shows the staged changes: a new volume named after the backup's date stamp, mounted at `/var/lib/postgresql/data`, and the old volume unmounted. Click **Deploy**.
4. Railway redeploys `Postgres` on the new volume. The database is down from the deploy until Postgres has started, under a minute in the drill.
5. Check the data with the counts query below.
6. Open the **Backups** tab again and check that all three schedules are ticked on the new volume. Tick any that are missing. A few minutes after the 2026-11-11 drill only the monthly schedule was left, and the cause is unknown.
7. The old volume stays in the project, unmounted, with every backup made after the one you restored. Keep it until you are sure of the restore: mounting it on `Postgres` again undoes the restore. Delete it only when you no longer need it: Railway deletes a volume 48 hours after the request, and its backups go with it.
8. The new volume has a new volume instance id. Update the id in the GraphQL query above.

Backups restore only into the same project and environment. To copy a backup somewhere else, restore it here and `pg_dump` through the proxy.

The counts query prints a row count and an md5 of the ids for each table, so an added or deleted row, or a renamed task, shows up even when the counts match. Other column changes do not. It needs the app's tables, which exist once the migrations have run:

```sql
select 'user', count(*), md5(coalesce(string_agg(id::text, ',' order by id), '')) from "user"
union all select 'label', count(*), md5(coalesce(string_agg(id::text, ',' order by id), '')) from label
union all select 'task', count(*), md5(coalesce(string_agg(id::text || title, ',' order by id), '')) from task
union all select 'task_label', count(*), md5(coalesce(string_agg(task_id::text || label_id::text, ',' order by task_id, label_id), '')) from task_label
union all select 'migrations', count(*), md5(coalesce(string_agg(hash, ',' order by id), '')) from drizzle.__drizzle_migrations;
```

Save it as `counts.sql`.

## Restore drill

The drill restores a backup taken a minute earlier, so production loses no data. On a database people use, stop the API before step 2 and start it again after step 5, so nothing is written in between.

### Setup on an empty database

Skip this when the database already holds the app's tables and data. From the repository root, with the proxy open and Bun 1.4:

```sh
railway run -p "$P" -e production -s Postgres -- sh -c 'DATABASE_URL_UNPOOLED="postgresql://$PGUSER:$PGPASSWORD@$RAILWAY_TCP_PROXY_DOMAIN:$RAILWAY_TCP_PROXY_PORT/$PGDATABASE?sslmode=no-verify" exec bun packages/db/scripts/migrate.ts'
rpg <<'SQL'
insert into "user" (name, email) select 'Drill user ' || g, 'drill-' || g || '@drill.invalid' from generate_series(1, 3) g;
insert into label (owner_id, name) select u.id, 'drill-label-' || g from "user" u cross join generate_series(1, 2) g;
insert into task (owner_id, title, due_date) select u.id, 'Drill task ' || g, date '2026-11-12' + g % 10 from "user" u cross join generate_series(1, 40) g;
insert into task_label (task_id, label_id) select t.id, l.id from task t join label l on l.owner_id = t.owner_id where l.name = 'drill-label-1' and t.title ~ '[02468]$';
SQL
```

The first command prints `Migrations applied.` The test rows are 3 users, 6 labels, 120 tasks and 60 task-label links.

### Steps

1. Open the proxy. Run `rpg -At -f counts.sql > before.txt`.
2. Back up with the manual backup button on the **Backups** tab. Wait until the backup is in the list.
3. Only on the empty database with test rows, change the data so the restore has something to undo, and check that the counts moved:

   ```sh
   rpg -c "insert into \"user\" (name, email) values ('After backup', 'after-backup@drill.invalid')" -c "delete from task where title = 'Drill task 1'"
   rpg -At -f counts.sql | diff before.txt -
   ```

   The diff shows different `user` and `task` lines.

4. Restore the backup from step 2 and deploy (restore steps 2 to 4 above). Note the time you clicked **Restore**.
5. Run `rpg -At -f counts.sql | diff before.txt -` until psql connects. It must print nothing. Note the time: the difference from step 4 is the restore time.
6. Do restore steps 6 and 7: check the schedules, then delete the old volume once you are sure.
7. Delete the drill backup in the Backups tab. On the empty database, drop the test data by creating the database again:

   ```sh
   rpg -d postgres -c 'drop database railway with (force)' -c 'create database railway owner postgres'
   ```

8. Close the proxy and check that none is left.

### Run on 2026-11-11

The first drill ran on the empty production database, with the setup above.

- 22:37:55 UTC: manual backup `soon-122-drill`. It was in the list 4 seconds later (861 MB referenced, the whole volume).
- After the backup: one more user and one deleted task, so the counts read 4 users and 117 tasks.
- 22:38:17: restore started. Staged after 7 seconds. Deployed at 22:38:40.
- 22:39:06: counts and md5 sums matched the backup: 3 users, 6 labels, 120 tasks, 60 links, 7 migrations. The row added after the backup was gone and the deleted task was back.

From Restore to checked data took 49 seconds. The redeploy started at 22:38:32 and the first query after it answered at 22:39:06, so Postgres was unreachable for at most 34 seconds.

Right after the restore the new volume listed all three schedules. At 22:45 only the monthly one was left, after someone had opened the database from the dashboard at 22:40. The daily and weekly schedules were set again at 22:46 through the API, which also gave them the new times in the table above.

Cleanup: the `railway` database was dropped and created again, empty, with owner `postgres`. The drill backup was deleted from both volumes. The old volume `postgres-volume` was deleted after its schedule was cleared, and Railway removes it on 2026-11-13. The restored volume was renamed `postgres-data`, and the TCP proxy was deleted. No temporary service was used.

### Still to check

- On 2026-11-13 after 08:36 UTC the Backups tab should list daily backups from 2026-11-12 and 2026-11-13, and all three schedules should still be ticked.
- Someone other than the author runs the drill from this page alone.
