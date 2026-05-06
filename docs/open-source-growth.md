# Help Maamria-AWB grow

Code is one of many ways to help. If you've ever set up `CLAUDE.md` by hand, fought to make Copilot stop reading `node_modules/`, or written the same Cursor rules five times, you already have things to share.

## Easy ways to contribute (no code required)

- **Use it on a real project and tell us what broke.** Open a [bug report](../.github/ISSUE_TEMPLATE/bug_report.md). Even small UX papercuts help us sharpen the wizard.
- **Improve a doc page.** Typos, broken links, missing examples, confusing sentences — every fix counts. Use the [docs issue template](../.github/ISSUE_TEMPLATE/documentation.md) or open a PR directly.
- **Test on different operating systems.** macOS Apple Silicon, macOS Intel, Ubuntu, Fedora, Arch, Windows + WSL, Windows + PowerShell, Termux on Android. Report what works and what doesn't.
- **Test with different Node managers.** `nvm`, `volta`, `fnm`, system Node, Bun-managed Node. The CI runs Node 18 / 20 / 22 on macOS / Linux / Windows; community reports for everything else are gold.
- **Share use cases.** Open an issue with the prompt _"How I use AWB on a [SaaS / mobile / data] project"_. We'll surface the best ones in docs.

## Code contributions that move the needle

### Templates

The biggest unlock for new users is **good defaults for their stack**. If you maintain a project on a popular framework, consider PR'ing a template:

- Next.js / Nuxt / Remix / SvelteKit
- FastAPI / Django / Flask / Rails / Laravel / NestJS / Express
- Mobile (React Native, Flutter, Swift, Kotlin)
- Data (Airflow, dbt, Spark)
- DevOps (Terraform, Ansible, Pulumi)

Each template is a short YAML / JSON describing the rules, agents, skills, and commands a project of that shape benefits from.

### Assistant integrations

[`ROADMAP.md`](../ROADMAP.md) Phase 2 lists the assistants whose full output isn't shipped yet:

- GitHub Copilot — `.github/copilot-instructions.md` and per-language hints.
- Cursor — `.cursorrules` and `.cursor/rules/*.md`.
- Windsurf — `.windsurfrules` and profile templates.
- ChatGPT Project — Markdown bundle that fits inside the Project's "Instructions" field.

If you use one of these heavily, you're better placed than us to write the right output. Drop a note on the relevant tracking issue (or open one).

### Framework presets

Once we ship `--preset`, presets become the easiest way for the community to encode know-how. A preset is a saved combination of:

- assistant + project type
- common rules
- recommended agents / skills / commands
- description tailored to the framework

Presets ship in their own repo so they can grow without churning the CLI release cadence.

### Improve the docs

The docs that benefit most from outside eyes:

- [`docs/dev-setup.md`](./dev-setup.md) — anything that confused you on day one is worth fixing.
- [`docs/troubleshooting.md`](./troubleshooting.md) — a real error you hit + the fix is more valuable than ten written from memory.
- [`docs/global-install.md`](./global-install.md) — Windows + PowerShell paths in particular still need community input.

## Reporting bugs effectively

Quality bug reports get fixed faster. The [bug template](../.github/ISSUE_TEMPLATE/bug_report.md) asks for:

1. CLI version (`maamria-awb --version`).
2. Node version (`node -v`).
3. OS + shell.
4. Exact command (with secrets redacted).
5. Expected vs. actual.
6. Logs.
7. Reproduction steps.

If you can do steps 1–7 in 5 minutes, please do — it's the difference between "fixed in a day" and "still open in 6 weeks".

## Sharing use cases

We'd love to know:

- What kind of projects you generate workspaces for.
- Which assistant you ended up sticking with, and why.
- Tweaks you make manually after `init` finishes (those are great inputs to the next preset).
- Workflows you've built around AWB — Git hooks, CI integration, monorepo strategies.

Open a discussion / issue tagged `use-case`. With your permission we'll write the best ones up as docs.

## Spreading the word

If AWB has saved you time:

- ⭐ Star the repository — that's the single biggest signal to discoverers.
- Tweet / post about it. Tag [@maamria](https://maamria.com).
- Talk about it at a meetup or write a blog post.
- Recommend it to a teammate who's still cobbling `CLAUDE.md` together by hand.

## Maintainer commitments back to you

- We'll **respond to issues and PRs within a few business days** (faster for security).
- We'll be **honest about what's planned vs. someday-maybe** — see the status legend in [`ROADMAP.md`](../ROADMAP.md).
- We **won't merge PRs that break existing CLI behaviour without a release note and a major-version bump**.
- We'll **credit you in `CHANGELOG.md`** for non-trivial contributions, unless you ask us not to.

Welcome to the project. Glad you're here.
