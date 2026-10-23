# mr-meeseeks-jobs — a Claude Code skill

<img src="assets/meeseeks.svg" alt="Ooh, I'm Mr. Meeseeks! Look at me!" width="640">

An unattended job-application agent for [Claude Code](https://claude.com/claude-code) + [Claude in Chrome](https://www.anthropic.com/news/claude-in-chrome).

You summon it, it fills out your job applications, and then it's at peace. You kick off a batch and walk away. It discovers roles on job boards, screens each
one against your verified profile with a 100-point rubric, tailors a resume and
cover letter, fills out the employer's application in its own browser tab, and
tracks everything in a markdown table. **It never clicks Submit** — you review the
filled tabs and submit yourself.

It notifies you (ntfy + desktop) when it hits a CAPTCHA, a login wall, 2FA, or a
question it can't answer from your profile.

Adapted from [joliverson/direct-job-application-agent](https://github.com/joliverson/direct-job-application-agent) (Codex) for Claude Code.

## Install

```bash
git clone https://github.com/fregas/mr-meeseeks-jobs.git ~/.claude/skills/job-search
cd ~/.claude/skills/job-search
mkdir -p private/resumes private/out
cp references/profile.template.md     private/profile.md
cp references/preferences.template.md private/preferences.md
cp references/tracker.template.md     private/tracker.md
```

Then fill in `private/profile.md` and `private/preferences.md`, and drop your base
resume(s) into `private/resumes/`.

Everything under `private/` is git-ignored — your resume, contact info, and
application history stay local.

You also need the Claude in Chrome extension installed and the relevant job sites
permitted in it.

## Use

In Claude Code:

- `/job-search` — run a batch (discover → screen → fill 5–10 applications)
- "screen this job: `<url>`" — score a single posting
- "job search status" — summarize the tracker

## What's in here

| Path | What it is |
| --- | --- |
| `SKILL.md` | The agent instructions Claude loads |
| `references/greenhouse-fill.js` | JS helpers that reliably fill Greenhouse forms in a hidden tab |
| `references/*.template.md` | Starting points for your profile, preferences, and tracker |

### The Greenhouse helpers

Greenhouse uses react-select, which ignores synthetic keyboard events and tracks a
"touched" state that programmatic `.value` sets don't update — so naive form filling
produces a form that *looks* filled and then fails validation on submit.
`greenhouse-fill.js` reaches the component's React fiber and calls its real
`selectOption`, then settles the blur/touched handlers. It works in a background
tab, so the agent can fill several applications in parallel without stealing focus.

Always `await` `__pick` / `__pickAsync`, and run `__audit()` before considering a
form done.

## Honesty guardrails

The skill is written so the agent:

- uses only facts recorded in `profile.md`, and never claims anything marked `(unverified)`
- never alters titles, dates, employers, degrees, or metrics when tailoring a resume
- leaves questions it can't answer blank and asks you, rather than guessing
- won't guess demographic/EEO answers, won't type passwords or verification codes
- won't submit anything

## Rate limits and ToS

LinkedIn and Indeed restrict automation and can flag accounts. The skill caps itself
at ~30 listings per board per run and paces page loads. Don't raise that, and don't
point it at bulk scraping.

## License

MIT
