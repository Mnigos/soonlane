---
name: api-manual-testing
description: Manual QA of the Soonlist oRPC API with curl. Use when creating or running a test plan for procedures under /api/rpc, checking a deployment's API by hand, translating requirements into request flows, or reporting pass/fail API results.
---

Use this skill for curl-based checks of `/api/rpc` on the local dev server, a preview or production.

## First Read

- This skill.
- The contract in `packages/contracts/src/*.contract.ts` for the procedure path, input and output.
- The router (`apps/web/src/**/presentation/*.router.ts` or `platform/system/system.router.ts`) and whether it uses `requireOwner`.
- `apps/web/src/platform/rpc/rpc.handler.ts` for the origin check.

Confirm path, input and output from live files before writing commands.

## Protocol

- oRPC's RPC protocol: `POST /api/rpc/<router>/<procedure>`, body `{"json": <input>}` (`null` for no input), header `content-type: application/json`. The response body is `{"json": <output>}`; errors are `{"json": {"code", "message", "data"}}` with the mapped HTTP status.
- `GET` never reaches a procedure (404), by design.
- A foreign `Origin` header gets 403 before any procedure runs; send no `Origin` or the deployment's own origin.
- `Date` values travel as oRPC-serialized metadata; compare them through the contract output, not raw strings.

```bash
curl -s -o /tmp/response.json -w "%{http_code}\n" \
	-X POST -H 'content-type: application/json' -d '{"json":null}' \
	http://localhost:3000/api/rpc/system/health
```

## Auth

- Owner-only procedures need the owner's session cookie. There is no test login or auth bypass. For local runs, ask the owner to sign in at `http://localhost:3000` and paste the cookie into a shell variable; never print or store it in files.
- Without a cookie, check the unauthenticated path: owner procedures must return `UNAUTHORIZED` (401).

## Flow Design

- Group checks by user journey: read, create, update, complete, delete.
- Cover success, unauthorized, forbidden, not found, bad request and validation cases when relevant.
- "Today" comes from the client: pass dates as `YYYY-MM-DD` input exactly as the browser would.
- Clean up records the flow creates.

## Output

A results table: flow, procedure, expected status, actual status, body summary for failures, pass/fail.

## Rules

- Confirm the target server is running (`system.health`) before the plan.
- Never run mutating checks against production without the owner's go-ahead.
- Keep commands reproducible and free of secrets.
