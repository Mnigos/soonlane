---
title: CI, deploy and secrets
kind: bug
when:
  paths:
    - .github/**
    - .railway/**
    - self-host/**
    - '**/.env.example'
    - '**/Dockerfile'
    - apps/landing/Caddyfile
    - apps/api/src/platform/config/**
    - apps/desktop/src/platform/config/**
    - apps/mobile/app.config.ts
    - apps/mobile/eas.json
    - apps/*/vite.config.ts
    - apps/desktop/electrobun.config.ts
    - scripts/**
    - turbo.json
    - package.json
  triage: 'changes a GitHub workflow, what deploys or is released, a Dockerfile or Railway config, environment variables, or how a secret is read, passed or logged'
needs: ['Check, typecheck, build']
---

Find changes that leak a secret, let untrusted code run with secrets or write access, or ship a broken build to users.

For workflows under `.github/workflows`:

- A `pull_request_target`, `issue_comment` or `workflow_run` job that checks out, installs, builds or runs code from the pull request, or interpolates a title, body, branch name or comment (`${{ github.event.* }}`) straight into a `run:` script instead of passing it through `env`.
- A job with more `permissions` than its steps use, or secrets passed to a step that does not need them.
- An action referenced by tag where the file's other privileged jobs pin a commit SHA.
- A release or deploy job whose trigger, `if` or `needs` lets an unreviewed commit or a fork reach production, TestFlight, the desktop update feed or the published images.

For configuration and environment:

- A variable that holds a secret (`SECRET`, `PASSWORD`, `TOKEN`, `KEY`, `DATABASE_URL`) read without `Config.Redacted`, unwrapped with `Redacted.value` away from the client that needs it, logged, or inlined into a browser bundle through a `VITE_` or `EXPO_PUBLIC_` name.
- A variable added to `AppConfig` but missing from `.railway/railway.ts`, `apps/*/.env.example` or `self-host/.env.example`, so a deploy or a self-hosted start fails, or added there with a real value.
- A Dockerfile or Caddyfile change that copies `.env` files into an image, drops a security header or cache rule, or changes the port or health path Railway checks.

Proof names the file and line, who controls the input or reads the output (a fork, a pull request author, a browser, the public logs), and what they gain or what breaks on deploy.
