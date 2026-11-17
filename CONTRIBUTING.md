# Contributing to Soonlane

Bug reports, fixes and small improvements are welcome. Before you start on a larger change or a new feature, open an issue or a discussion so we can agree on the scope first. [PRODUCT.md](PRODUCT.md) lists what Soonlane does and what it leaves out on purpose.

## Run it locally

You need Bun **1.4.2** (pinned by `packageManager` in `package.json`) and Docker for the local Postgres. Node is not needed: `bunfig.toml` runs every script and tool under Bun.

```sh
bun install
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
bun run db:up        # Postgres 18 from compose.yaml on localhost:5433
bun run db:migrate
bun run dev
```

In `apps/api/.env.local`, set `AUTH_SECRET` to any random string (`openssl rand -hex 32`), and set `API_PROXY_SECRET` to another one, the same value in both `.env.local` files. Google sign-in needs your own OAuth client in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with the redirect URI `http://localhost:4000/api/auth/callback/google`. Without one, put any placeholder there and sign in with the sample user below. The example fills in the rest, and the variables it leaves empty are optional. [docs/deploy-railway.md](docs/deploy-railway.md) explains each one.

`bun run dev` starts the app on http://localhost:3000, the landing on http://localhost:3001 and the API on http://localhost:4000.

To sign in without Google, run `bun run --cwd apps/api dev:session`. It creates "Sample User" with a session in your local database and prints a session cookie; set that cookie for `localhost` in your browser and open the app. `dev:session --delete` removes the user with its tasks. The script only runs against a database on localhost.

The macOS app in `apps/desktop` has its own steps in the [README](README.md#desktop).

## Before you open a pull request

These three commands are the gates. CI runs them on every pull request, and all three must pass. Run `bun run --cwd apps/desktop sdk` once before the first `check`, because type-aware lint reads the desktop app's Electrobun types from the SDK it downloads.

```sh
bun run check       # oxlint and oxfmt through Ultracite; bun run check:fix fixes most findings
bun run typecheck
bun run build
```

The repository has no unit tests and no test framework, so please don't add one. Check your change in the running app instead, and for a change to the UI, add a screenshot or a short recording to the pull request.

## Code

[AGENTS.md](AGENTS.md) holds the rules for file names, layering between packages and modules, imports and comments, and most of them fail `bun run check` when broken. [ARCHITECTURE.md](ARCHITECTURE.md) maps the apps and packages and how a request flows through them. UI follows [DESIGN.md](DESIGN.md) and the tokens in `tooling/tailwind-config/tokens.css`.

A few rules lint can't check:

- Never edit a generated migration. Change the schema in `packages/db/schema` and run `bun run db:generate`.
- "Today" is the user's local day, read on their device. Never derive it from the server clock.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org). `bun install` sets up husky: the `commit-msg` hook runs commitlint and `pre-commit` formats staged files. CI runs commitlint on every commit of a pull request. `bun run commit` opens a prompt that writes the message for you.

Scopes decide what reaches the changelog. `feat`, `fix` and `perf` with a product scope (`tasks`, `labels`, `projects`, `shell`, `desktop`, `mobile`, `identity`, `site`, `blog`, `changelog`, `consent`) mark a change users notice, so write the subject as a plain sentence a user can read:

```
feat(tasks): break a task into subtasks and see them under it and on their days
```

Internal work uses `refactor`, `chore`, `build` or `ci`, or an infrastructure scope such as `api`, `db`, `auth`, `ui` or `web`. Don't edit `CHANGELOG.md` or `version.json`; only the release pull request writes them ([docs/release.md](docs/release.md)).

## Architecture decisions

A decision that is hard to reverse (a new package, a new outside service, a change to how data is stored) gets an ADR in [docs/decisions](docs/decisions). Number it after the last one (`0019-short-title.md`) and use the sections of the existing ones: Status, Date, Context, Decision, Consequences and Related. Propose it in the pull request that makes the change, or open a discussion first if you are unsure.

## Pull requests

Branch from `main`, keep one change per pull request, and describe what changes for the user and how you checked it. The maintainer reviews and merges with rebase, so each commit lands on `main` as you wrote it and has to pass commitlint on its own.

## License

Soonlane is licensed under the [GNU Affero General Public License v3.0 only](LICENSE).
