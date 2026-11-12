# Blog

Posts are MDX files in the repo. A pull request shows them on its preview, and merging to `main` publishes them on soonlane.com with their sitemap and RSS entries.

## Write a post

Create `apps/web/src/modules/blog/content/<slug>.mdx`. The file name is the URL: `why-soonlane.mdx` becomes `/blog/why-soonlane`.

```mdx
---
title: Why Soonlane
description: One or two sentences for the list, search results and share previews (max 160 characters).
date: '2026-11-06'
draft: true
---

The post, in Markdown. GitHub-flavoured tables and task lists work too.
```

| Field         | Required | What it does                                                                 |
| ------------- | -------- | ---------------------------------------------------------------------------- |
| `title`       | yes      | The heading, the page title and the RSS item title.                          |
| `description` | yes      | Shown under the title in the list; meta description and RSS description.     |
| `date`        | yes      | Publish day, `YYYY-MM-DD`. Posts are listed newest first.                    |
| `updated`     | no       | Day of the last real change; shown as "Updated …" and used as `lastmod`.     |
| `draft`       | no       | `true` keeps the post off production. Defaults to `false`.                   |
| `image`       | no       | Custom share image under `/blog/`; without it the build draws one per post.  |

Put images in `apps/web/public/blog/<slug>/` and reference them as `/blog/<slug>/<file>`. Give inline images a width and height (`<img src="/blog/<slug>/shot.png" alt="…" width={1200} height={750} />`) so the page does not jump while they load.

## Publish

1. Open a pull request with the post as `draft: true`. Deploy the branch to staging (**Deploy staging**, [deploy-railway.md](deploy-railway.md#staging)) to read it there: staging lists it at `/blog` with a Draft label, and its page carries `noindex`. Drafts never go in the sitemap.
2. When the text is final, set `draft: false` and `date` to the publish day.
3. Merge with a `docs(blog): …` commit, so the post stays out of `CHANGELOG.md` (the release notes keep only `feat`, `fix` and `perf`).

Merging deploys production, and the post goes live at `/blog/<slug>`, in `/sitemap.xml` and in `/blog/rss.xml`.

## How visibility works

A post is published when `draft` is `false` and `date` is not after the build day (UTC). Production builds (`APP_ENV=production`) leave unpublished posts out of the generated content entirely, so their text is not in any page, script, sitemap or feed. Every other build (staging, local) renders them with the Draft label.

There is no scheduled publishing: a post with a future `date` stays hidden until the first production deploy on or after that day.
