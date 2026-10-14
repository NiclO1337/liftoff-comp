# CLAUDE.md – LiftOff Comp

Guidance for Claude Code in this repo. Read this first, then
`docs/PROJECT4_CONTEXT.md`. That file is the source of truth for decisions,
domain rules, the data model and the build plan. If this file and the context
doc disagree, the context doc wins (and tell me, so we can fix one of them).

## What this is

**LiftOff Comp: "Know when you're up."** A Next.js app for Olympic
weightlifting competitions. A coach enters the lifters of a group, logs every
attempt with three judge flags, and the app shows how many lifts (and later how
many minutes) until a tracked lifter's turn. Everything is stored in a database
so previous competitions and lifters can be looked up.

This is a school project (Lexicon, Project 4). A small, working, well-tested app
beats a big unfinished one. Stick to the Must tier in the context doc (§4) first.

## Stack

- Next.js 16 (App Router) + TypeScript (strict) + React 19
- PostgreSQL (Neon) + Prisma 7 (**pin 7.x**, not 8)
- Better Auth (email + password), Zod for validation
- CSS Modules written in Sass (`.module.scss`) + global tokens. No UI library. Fonts: Inter and Space Grotesk through `next/font/google`
- Vitest + React Testing Library + jsdom
- Deployed on Vercel

Next 16 differs from older versions you may remember (for example `middleware.ts`
is now `proxy.ts`, and request APIs are async). Check the current docs before
writing Next-specific code. Same for Prisma 7 and Better Auth.

## Commands

TODO: fill in when the project is scaffolded (dev, build, lint, format, test, test:run, db:migrate, db:seed).

## How we work together

- **Do not start the dev server** unless it is really needed. Tell me what to look at and I will check manually.
- **Small chunks.** Each change should fit in one commit. Stop after each chunk, say what changed and what to check.
- **Always suggest committing** after a change. Commit messages are **very short**, imperative and lowercase, for example `add attempt model`.
- Say which step of the build plan (context doc §15) you are on.
- **Clean code.** If a solution or fix feels complicated, take a step back, re-evaluate, and check whether something should change fundamentally instead of stacking fixes on fixes.
- **Ask before adding a dependency**, and before anything destructive (resetting the database, deleting files, force pushes).
- Do not leave `console.log`, commented-out code or unused files behind.

## Code conventions

- **Semantic HTML first.** `<table>` for the lifter list, `<button>` for actions, real headings in order, landmarks, labels on every input. Follow accessibility best practices (context doc §17).
- **Where logic lives**
  - `src/domain/`: pure TypeScript for rules, ordering, time estimate, plates, Sinclair. No React, no Prisma, no `Date.now()` (pass the time in). Heavily unit-tested.
  - `src/server/`: Prisma access, auth, queries and Server Actions.
  - `src/components/`: UI. Receives plain props. Does not import `server/` internals. Only the board's top client component (`GroupBoard`) and the form containers import Server Actions from `server/actions` and pass them down as callback props, so presentational components test without mocks.
  - `src/app/`: routes. Keep pages thin: fetch, then pass plain serializable props to client components.
- **Server Actions** always: check the session and role, validate input with Zod, scope to the user's club, write, revalidate, return `{ ok: true } | { ok: false, error }`. Never trust ids from the client.
- **Club scoping** is mandatory. Every data function takes a `clubId` and filters by it. A coach's `clubId` is their own club. An admin acts in one **active club** at a time (club switcher, cookie checked against the database). Never write cross-club queries.
- **Board data comes from server props.** Do not copy props into `useState`. Derive board state from props plus optimistic changes (`useOptimistic`), otherwise the auto-refresh (`router.refresh()` about every 15 s, context doc §11) changes nothing.
- **Derived values are never stored** (good/no-lift result, phase, predicted order, time estimate). Only store what the context doc §7 lists.
- **Layout follows the wireframes** in `readme-assets/wireframes/` (context doc §12). Phone first, then tablet (768 px and up) and desktop (1200 px and up), through the `from(tablet)` / `from(desktop)` mixins (written in `em`). The wireframes show layout and states only: colours and fonts come from the tokens. If a wireframe and the context doc disagree, ask.
- Styling: tokens in `src/styles/` (colours, fonts, type scale, spacing and radii are all in context doc §12, dark is the default theme). No hard-coded colours, font sizes, spacing or radii in components: use the tokens. No inline styles except genuinely dynamic values.
- Numbers that line up or count (weights, lot numbers, times, T-minus) use the `tabular` mixin. Ticks and crosses are SVG icons, not text characters. Anything tappable is at least `--tap-min` (44 px) high. Nothing is smaller than 12 px.
- Names: `PascalCase` components, one component per folder (`Name/Name.tsx`, `Name.module.scss`, `Name.test.tsx`), `camelCase` functions, `kebab-case` for non-component files.
- Do not use `any`. Prefer small functions with a single job.

## Domain quick reference

- 3 attempts per lift. Snatch first, then Clean & Jerk. **Both openings are required** when a lifter is entered, so all six attempts always have a weight. Attempts 2 and 3 are estimated at +4 % / +8 % of attempt 1 (whole kg, at least +1 kg over the previous attempt) until edited. **The percentages are used once**, when the lifter is added. Later edits never apply a percentage again (lowering attempt 2 leaves attempt 3 as it is). Entering a result clears the estimate marker.
- **A missed lift is repeated (R16):** after a no-lift the lifter's next attempt in that lift takes the failed weight, but only if it is still an estimate (`isEstimated`). A typed-in weight is never overwritten, a good lift changes nothing, and the attempt stays marked as an estimate.
- **Weight rules:** whole kg. Inside a lift the next weight must be at least +1 kg after a good lift (and between two attempts without a result). The same weight may be repeated after a no-lift. A refused edit keeps the old value and shows "Weight can not be lower than 93 kg" (the real minimum). Raising an attempt to or above the next one moves the later attempts up (90 / 92 / 94 with attempt 2 → 94 gives 90 / 94 / 95) and marks them as estimates. Attempts with a result are never moved. Raising is always allowed, because lifters raise to stall the clock.
- The **next-lifter panel is derived** from the sorted order and never stored. When weights change it updates by itself, and flags toggled for the old attempt reset. *Enter result* sends the attempt id and shown weight, and the server refuses a stale weight or a second result. The row menu can also enter a result for any lifter's next pending attempt (same action, same checks), because the hall does not always follow the app's order.
- Three judge flags in fixed order **left, centre, right**. At least 2 white = good lift. The result is derived from the flags.
- `resultAt` is set once, when a result is first entered, and is never changed by later edits.
- Order of lifting: lowest next weight first, then lower attempt number, then lower lot number. Finished or stopped lifters go to the bottom. A lifter following themselves gets a 2-minute clock (instead of 1).
- Stopping early and withdrawing set `cancelled` on pending attempts. Nothing is deleted, and **Restore** undoes it.
- Time estimate: default 75–90 s between different lifters and 100–120 s when a lifter follows themselves. "Started" is **per lift**: until the first result of the lift in play (Snatch, and again Clean & Jerk) show "Next up" and "T–N lifts" with a **fixed clock time**, never minutes. Each group has a date and a Snatch and a Clean & Jerk start time (wall-clock `HH:mm`, no timezone stored): clock = start + N lifts × the middle of the pace, rounded to the minute (13:50 and T–7 = "around 14:00"), counting from now if the start has passed. After the first result of the lift show live minutes only. Render the clock time on the client after mount (the server's timezone is not the hall's). Validation is light: the date inside the competition's dates and Clean & Jerk after Snatch.
- **Lifters belong to one club** (no global identity). **Sex and birth year are required** on every lifter. Sex decides the bar (20 kg men, 15 kg women) in the plate diagram. Competitions also use 2.5 kg collars on each side, so plates per side = (weight − bar − 5) / 2.
- Groups can mix men and women. `Group.allowedSex` is empty for now and `canEnterGroup()` in `domain/` always returns true. Keep that check in one place.
- Roles: `ADMIN` has full access to every club (via the active club), `COACH` has full access to their own club, `LIFTER` accounts come later. The admin's last active club is remembered in a long-lived cookie (invalid → `/admin/clubs`).
- Plates: port from `weightlifting-calculator/plates.js` with **no 1.25 kg plate** and the **metal** plates, not the plastic ones. Ask me for access to that folder when you get to the plates step.

## Testing

- Unit tests are written **in the same commit** as the code. Domain functions get table-driven tests. Every component gets `Name.test.tsx` next to it.
- Query by role and accessible name (`getByRole`) before test ids.
- Integration tests come at the end (`src/test/integration/`), with Server Actions mocked.
- Async Server Components are not unit tested, which is why pages stay thin.

## README rules

The README follows the template used in the earlier projects. When a section
needs an image, **write the image markdown anyway** with a suggested alt text and
the path with a suggested file name, and add a TODO comment. For example:

```md
![Group board on a phone with the next lifter, plates and lifter table](readme-assets/screenshots/group-board-mobile.png)
<!-- TODO: take screenshot -->
```

## Docs map

| File | What it is |
|------|------------|
| `docs/PROJECT4_CONTEXT.md` | Decisions, domain rules, estimator, data model, routes, testing, build plan |
| `README.md` | Public project description (sections with TODOs are filled in at the end) |
| `TESTING.md` | Test notes (created in the last phase) |
| `readme-assets/wireframes/` | The eight wireframe sheets (SVG). Screenshots go in `readme-assets/screenshots/` |
