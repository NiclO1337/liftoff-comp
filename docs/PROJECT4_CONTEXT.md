# PROJECT4_CONTEXT – LiftOff Comp (Next.js full-stack)

Agreed plan for Project 4. It replaces the brief (`project4-liftoff-comp.md`):
everything that matters is summarised here.

> **Status (13 Oct 2026, updated after review):** docs stage. Sections marked
> **TODO** are filled in the next two stages: wireframes (§12), then visual
> tokens + build plan (§12, §15).

**From the brief:** Choose and develop your own frontend project. Plan, design,
develop and deploy a complete project. *A small, well-designed and functional
project is better than a large project that is incomplete.*

**The idea:** **LiftOff Comp: "Know when you're up."** During an Olympic
weightlifting competition, answer the question *"How long until it is my turn
to lift?"* so warm-up, food and drink can be planned. Everything is saved in a
database, so the app can also answer *"How did I and my competitors do in
previous competitions?"*. Fun detail: a **T-minus** countdown and a rocket icon.

---

## 1. Requirements from the brief (must have)

- [ ] Planned first: what, who for, what problem, main features, plus a simple plan/wireframes
- [ ] Complete frontend: clear navigation/structure, several views, consistent UI,
      user interaction, meaningful functionality (more than a static page)
- [ ] HTML5 + CSS3, responsive layouts with Flexbox and/or Grid, modern UI/UX
- [ ] React concepts: components, props, state, events, conditional rendering,
      reusable components (plus routing, API/data, forms, filtering as the project needs)
- [ ] Works on desktop, tablet and mobile (tested at different sizes)
- [ ] Public GitHub repo: organised files, clear folder structure, README with
      description, technologies used and basic setup instructions
- [ ] Deployed and publicly accessible, live URL works
- [ ] Final checklist passed: all important features tested
- [ ] Deliverables: **GitHub repo URL**, **live website URL**, **short project description**
- Optional features only when they improve the project (auth UI, API, charts,
  dark/light mode, leaderboard, data export, ...). *Do not add features only to
  make the project bigger.*

---

## 2. Agreed decisions

| Topic | Decision |
|-------|----------|
| Repo | Standalone repo `NiclO1337/liftoff-comp` (public), `main` only |
| Stack | **Next.js 16.4** (App Router) + **TypeScript** + React 19 |
| Backend | Same repo: Server Components for reads, **Server Actions** for writes, validated with **Zod** |
| Database | **PostgreSQL on Neon** (via Vercel Marketplace) + **Prisma ORM 7** |
| Auth | **Better Auth**, email + password. No self sign-up: accounts are created by an admin/coach |
| Accounts, first slice | Schema has **clubs and roles** (`ADMIN`, `COACH`, `LIFTER`) from day one. UI is built for **admin and coach**. The **admin** (created by a seed script) has full access to every club: creates clubs and coaches, adds and edits competitions and lifters, and acts in one club at a time through a club switcher (the last active club is remembered). A **coach** has full access inside their own club and can add coaches to it. Lifter accounts are a later phase (§4) |
| Data sharing | Everything belongs to a club. Different clubs never see each other's data (except the admin). A club's coaches share data |
| Lifter identity | A lifter record belongs to **one club's directory**. There is no global lifter identity: pooling records across clubs would give inconsistent stats. The same person entered by two clubs is two records |
| Groups | Men and women can compete in the same group in this version. The group table gets an `allowedSex` column now (empty = mixed) so a restriction can be added later without a migration (§7) |
| Fresh data | The board **refreshes itself about every 15 s** (polling with `router.refresh()`, §11). No WebSockets |
| Styling | **CSS Modules written in Sass** (`.module.scss`) + a global token file (CSS custom properties). No UI library |
| Theme | Dark by default: **dark + orange**, with a special **blue accent**. Light mode too. Exact tokens: **TODO** (after wireframes) |
| Fun detail | T-minus display ("T–7") + rocket icon |
| Testing | **Vitest** + React Testing Library + jsdom. Unit tests for domain functions and components, integration tests at the end |
| Quality | ESLint + Prettier, TypeScript strict |
| Deployment | Vercel, Neon Postgres, environment variables in Vercel |
| UI language | English. Dates like "18 Oct 2026", 24 h clock, kg |
| Timeline | About **3 weeks** from 13 Oct 2026, so the *Must* slice (§4) has to be shippable. *Should* and *Could* are optional |
| Docs | Same README template as before, `TESTING.md`, `readme-assets/` |

**Considered and not chosen**
- **Material UI:** heavier, and harder to get a custom dark/orange T-minus identity. Sass is the new thing to learn instead.
- **Auth.js:** in maintenance mode since Sept 2025 (the Better Auth team now maintains it). Better Auth is the default for new projects.
- **Prisma 8:** on 13 Oct 2026 the npm `latest` tag pointed to `8.0.0-rc.22`, a release candidate, and Better Auth 1.7.7 lists Prisma 5–7 as supported. **Pin Prisma 7.x.**
- **Push-based real-time sync** (WebSockets, SSE, Pusher/Ably): serverless functions on Vercel cannot hold WebSocket connections, so push needs an extra service. Polling every 15 s is enough for this app (§11).

**Versions checked on 13 Oct 2026:** Next.js 16.4.0 (Node ≥ 20.9), Prisma needs
Node ≥ 22.18, Better Auth 1.7.7. Local Node is 22.23.2, which works.

---

## 3. Audience and goals

**Users**
1. **Lifters** at a competition: "How many lifts until I'm up, and roughly how
   many minutes?" to time warm-up lifts, food and drink.
2. **Coaches:** follow one or two athletes in the same group, enter judge flags
   and weights, and see *which judge* gives red flags so technique problems are
   clear and reliable.
3. **Teachers** grading the course project.

**Problem:** at the competition the official monitor shows who lifts next, but
not how long until *your* turn. Lifters count lifts in their head and guess.

**Goals**
- Open the app and see "my turn in ~7 lifts / ~10 minutes" within 3 seconds.
- Enter a result in about 2 taps (flags default to white, so only red flags need a tap).
- Never lose data. Results, weights and flags can always be corrected afterwards.
- Never show a stale screen: when one coach enters a result, every other open board (second coach, later lifters) updates by itself within about 15 s.
- Keep the history: competitions, lifters, per-judge flags, timestamps, Sinclair.

---

## 4. Scope tiers (3-week plan)

### Must: first slice (admin and coach flow)
| # | Feature |
|---|---------|
| M1 | Login. A seed script creates the first **admin**. All pages are behind login |
| M2 | **Clubs and accounts:** the admin has full access to every club (create clubs, add coaches, add and edit competitions and lifters) and acts in one club at a time through a **club switcher**. A coach can add coaches to their own club. The admin's last active club is remembered, so after login they land in that club. Lifter accounts come later (C1) |
| M3 | Competitions: create (name, date or date range, location optional) and list. Add groups to a competition (name, editable pace defaults). A group can mix men and women |
| M4 | Add lifters to a group: name with **suggestions from the club's lifter directory**, **sex and birth year (both required)**, bodyweight (weigh-in), lot number, and **both** the Snatch and the Clean & Jerk opening (both required). All six attempts get a weight at once: attempts 2 and 3 are estimated at +4 % / +8 % |
| M5 | **Group board:** next-lifter panel (name, attempt, weight, **plate diagram**) above a lifter table sorted by next weight. The panel always follows the table order, so it changes by itself when a weight is edited (R13). Finished/stopped lifters at the bottom. Clean & Jerk list under Snatch and moves to the top when Snatch is done |
| M6 | Inline weight editing: click the weight, blank input, click away. Blank restores the old value. The weight rules are enforced (R10): at least +1 kg after a good lift, a repeat is allowed after a no-lift, raising an attempt moves the later ones up. A refused weight shows a message |
| M7 | Three judge flags (left / centre / right), white ⇄ red toggles + "Enter result". ≥ 2 white = good lift. Row weight turns green or red. Weights and flags editable afterwards |
| M8 | Row actions: **stop this lift**, **withdraw**, **restore**, **track** |
| M9 | **Tracked lifter ("ME")** with "T–N lifts" before the start and "~9–11 min" after, using the default pace |
| M10 | **Auto-refresh:** the board refreshes itself about every 15 s, so other coaches never look at a stale screen (§11) |
| M11 | Light/dark theme, responsive (phone/tablet/desktop), accessibility basics |
| M12 | Unit tests, a few integration tests, README + TESTING.md, deployed on Vercel |

**Scope check:** M2 (admin and club switcher) is new compared with the first draft and
costs a few extra commits. If time gets tight, the cut order in §15 still applies,
and M2 can shrink to "admin creates clubs and coaches" with the club switcher as a plain select.

### Should: if time allows
| # | Feature |
|---|---------|
| S1 | **Measured pace** from attempt timestamps replaces the default after a few lifts |
| S2 | Lifter list and **lifter detail page**: competitions, each lift with its three flags |
| S3 | Previous competitions list and detail (duration, number of lifts, average pace) |
| S4 | **Sinclair** total on lifter detail and results |
| S5 | A finished competition's average pace becomes the suggested default for the next one |

### Could: later phases
C1 lifter accounts created by coaches or the admin + 1RM PR page (coach read-only) ·
C2 **Warmup page** (port from `weightlifting-calculator`) ·
C3 read-only live view for lifters on their own phone (reuses the auto-refresh) ·
C4 offline queue / PWA ·
C5 adaptive estimate (a no-lift usually repeats the weight) ·
C6 CSV export · C7 charts ·
C8 **weight classes and age classes** (for example W40), with the winner of each class on the results screen of a previous competition. Nothing extra is stored for this: class comes from sex, bodyweight and birth year, which are already saved (§7). The class tables change over time, so they are kept per cycle like Sinclair.

### Not doing
Payments, **push-based real-time sync** (updates in under a second with WebSockets; the 15 s auto-refresh in §11 covers the need), official-results integration, records.

---

## 5. Domain rules

### Vocabulary
| Term | Meaning |
|------|---------|
| Club | A group of coaches and lifters who share data |
| Competition | One event with a date (or date span) |
| Group | One session of a competition, e.g. "Group F". Lifters are entered per group. Men and women can be in the same group (R14) |
| Lifter | A person who lifts, from any club. Stored in **one** club's lifter directory, with no global identity across clubs |
| Entry | A lifter in one group: bodyweight, lot number, 6 attempts |
| Lift | **Snatch** (first) or **Clean & Jerk** (after a break) |
| Attempt | One of 3 tries per lift, with a weight and (when done) three judge flags |
| Flag | One judge's decision: white (good) or red (no). Order is fixed: **left, centre, right** |
| Lot number | Draw number, used as a tie-break in the lifting order |
| Tracked lifter | The lifter the user follows, shown as "ME" (see R11). The menu action is called **Track** |
| Pace | Seconds between attempts, used for the time estimate |

### Rules
| # | Rule |
|---|------|
| R1 | Each lifter has up to 3 attempts per lift: Snatch first, then Clean & Jerk |
| R2 | **All six weights exist from the start.** When a lifter is entered, **both openings are required**. Attempts 2 and 3 are estimated: `estimate(n) = max(round(attempt 1 × (1 + 0.04 × (n − 1))), previous weight + 1)`, which is +4 % for attempt 2 and +8 % for attempt 3, in whole kg and at least 1 kg above the previous attempt. Estimated weights are marked `isEstimated` until someone confirms them by editing. When a weight changes, the later attempts of the same lift that are still `isEstimated` are re-estimated, and attempts set by hand are moved up only when the weight rules need it (R10). Weights are editable at any time |
| R3 | **Result = flags.** Three flags, ≥ 2 white = good lift, otherwise a no-lift that does not count. The result is **derived from the flags and never stored** |
| R4 | **Entering a result:** flags default to white, the coach toggles any red ones, then presses **Enter result**. That sets `resultAt` (timestamp), turns the weight green or red and moves the board on. Flags and weights can be edited afterwards. Editing **never changes `resultAt`**, because the first entry time is the one used for pace |
| R5 | **The group has started** when the first result is entered (`resultAt` exists). There is no start button. Before that, only "N lifts" is shown, never minutes |
| R6 | **Lifting order (confirmed):** ascending by the weight of each lifter's next pending attempt. Ties: lower attempt number first, then lower lot number. A lifter can follow themselves; the clock is then **2 minutes instead of the standard 1 minute**, which is why that interval is longer (§6.3). Repeating a weight after a no-lift has no special rule |
| R7 | A lifter with no pending attempts in the current lift goes to the **bottom** of that lift's list |
| R8 | **Stopping early / withdrawing** sets `cancelled` on the pending attempts. Nothing is deleted. *Stop this lift* cancels the rest of one lift. *Withdraw* cancels everything remaining. **Restore** clears `cancelled` again, so a mis-click is always reversible |
| R9 | **Phase** is derived: `SNATCH` while any active lifter has a pending snatch attempt, then `CLEAN_JERK`, then `FINISHED`. The Clean & Jerk list sits under the Snatch list and moves to the top when Snatch is complete |
| R10 | **Weight rules.** Weights are **whole kg** ≥ 1 (official competitions use whole kg only). Inside one lift (Snatch and Clean & Jerk are independent, and attempt 1 has no lower limit): **after a good lift the next weight must be at least +1 kg**. **After a no-lift the same weight may be repeated.** While the previous attempt has no result yet the next one must also be at least +1 kg, because the app assumes it will be good. **Raising is always allowed.** Lifters raise a weight (for example 92 → 93) to buy time and stall the clock, which changes the order and the estimate (R13). **A weight below the minimum is refused:** the value is not saved, the field keeps its old value and shows the message *"Weight can not be lower than 93 kg"* with the real minimum. **Raising an attempt moves the later ones up:** if an attempt is raised to or above the next one, the next one becomes the raised weight + 1 kg, and so on down the lift. Example: 90 / 92 / 94 and attempt 2 raised to 94 gives 90 / 94 / 95. Raising attempt 1 over attempt 2 does the same. The same happens when a result changes, for example a no-lift corrected to a good lift makes a repeated weight go up by 1 kg. Attempts that the app moved are marked as estimates, because the lifter has not confirmed them. Only attempts **without a result** are moved (cancelled ones too, so *Restore* never gives an invalid sequence). If the next attempt already has a result it is not changed: an edit that would break the order with it is refused with *"Weight can not be higher than 91 kg (attempt 2 is already done)"* |
| R11 | **Tracking ("ME"):** a user can track one or more lifters per group. The first is "ME". More are shown by name, so a coach can follow two athletes from the same club. Changing who is tracked takes one tap in the lifter's row menu |
| R12 | **Clock times:** no scheduled start time is stored. Only the date is. When the estimate exists the UI may show `now + estimate` as "around 14:32" |
| R13 | **The next lifter is always derived.** The next-lifter panel shows the first attempt in the predicted order (§6.1). It is never stored or set by hand. When a weight is edited, for example the current lifter raises from 92 to 95 while another lifter is at 93, the table re-sorts and the panel switches to the new next lifter at once. Flags that are toggled but not yet sent belong to **one attempt**: if the next attempt changes, they reset to white. **Enter result** sends the attempt id and the weight that was shown. The server refuses it if the weight has changed since (*"This attempt is now 93 kg. Check and try again."*) or if a result already exists (*"Result already entered: white, white, red. Refresh."*). That second case covers two coaches pressing the button at nearly the same time. Flags are changed afterwards with a separate edit action, which keeps `resultAt` |
| R14 | **Mixed groups.** A group can have men and women in this version. The lifter's own sex decides the bar in the plate diagram (20 kg men, 15 kg women) and the Sinclair constants, not the group's. `Group.allowedSex` exists but is empty (= mixed). To restrict a group later, add the field to the group form and let `canEnterGroup(group, lifter)` in `domain/` refuse the wrong sex. That function exists from the start and always returns `true` |

### Judge flags: why order matters
Left / centre / right are stored as three separate columns. The lifter detail
page shows them per attempt, and later per lifter ("left judge: 9 red of 24"),
so a coach sees a consistent pattern.

---

## 6. Time estimate ("T-minus")

All of this is **pure TypeScript in `src/domain/`**, with no React, Prisma or
`Date.now()` inside. The current time is passed in, so every case is easy to test.

### 6.1 Predict the order
Simulate the rest of the lift from the current data:

1. Each active entry has a queue of its pending attempts, in order 1 → 2 → 3.
   Every attempt has a weight (R2), so none are skipped.
2. Take the head of every queue and pick the lowest by `(weight, attemptNumber, lotNumber)`.
3. Append it to the predicted order and move that lifter to their next attempt.
4. Repeat until all queues are empty.

The simulation assumes every attempt happens with the weight currently entered.
It is recalculated from scratch after every edit, result, stop or restore.
Nothing about the estimate is stored.

### 6.2 Lifts ahead
`liftsAhead` = the number of attempts **before** the tracked lifter's next
attempt in the predicted order. `0` means "you are next" (T–0). The lifter
shown in the next-lifter panel is index 0 of the order, so the panel changes
whenever the order changes (R13).

### 6.3 Time
Each step in the predicted order has an interval from the previous attempt:
**different lifter** or **same lifter** (a lifter following themselves).

```
waitSeconds = sum(interval of each of the liftsAhead steps)  −  secondsSinceLastResult
```
- `secondsSinceLastResult` is only subtracted once a result exists. The result is clamped at 0.
- The first step is measured from the last result, so the time already spent waiting counts.
  Whether it is a "same lifter" step depends on who lifted last, so `estimateWait` also
  needs the **last attempted entry** (the attempt with the newest `resultAt`).
- A range is shown: `min` uses the low value of each interval and `max` the high value.
  Minutes are rounded to the nearest whole minute for display.

| Setting | Default low | Default high | Used when |
|---------|-------------|--------------|-----------|
| Different lifter | 75 s | 90 s | consecutive attempts by different lifters |
| Same lifter | 100 s | 120 s | a lifter follows themselves (2-minute clock instead of 1 minute) |

**Worked example:** 7 lifts ahead, none by the same lifter →
7 × 75 s = 8.75 min to 7 × 90 s = 10.5 min, shown as **"9–11 min"**.
Both defaults are editable per group.

### 6.4 Measured pace (Should: S1)
- Each group's results give intervals between consecutive `resultAt` stamps, split
  into different-lifter and same-lifter intervals.
- Ignore intervals shorter than 20 s or longer than 240 s (batch entry, breaks,
  jury decisions, the Snatch → Clean & Jerk break).
- Use the last 10 valid intervals per kind and blend them with the defaults:
  `weight = n / (n + 5)`, `pace = weight × measured + (1 − weight) × default`.
  After about 5 lifts the measured pace has half the influence.
- Range when measured: `pace × 0.9` to `pace × 1.1`.
- When the group finishes, its average pace is stored with the stats and
  suggested as the default for the next competition (S5).

### 6.5 What the UI shows
| Situation | Text |
|-----------|------|
| Group not started | "T–7" / "7 lifts to go" (no minutes) |
| Started | "T–7 · ~9–11 min · around 14:32" |
| Tracked lifter is next | "You're up next" (T–0) |
| Tracked lifter's next attempt is in the other lift | "Snatch done, Clean & Jerk is next" or "N lifts until the break" |
| Tracked lifter finished or withdrawn | no estimate |

### 6.6 Functions (sketch)
```ts
// src/domain/order.ts
predictOrder(entries: EntryState[], lift: LiftType): QueuedAttempt[]
getPhase(entries: EntryState[]): "SNATCH" | "CLEAN_JERK" | "FINISHED"
sortForDisplay(entries: EntryState[], lift: LiftType): EntryState[]
// src/domain/estimate.ts
liftsAhead(order: QueuedAttempt[], entryId: string): number | null
estimateWait(order, entryId, pace: Pace, last: { entryId: string; at: Date } | null, now: Date): WaitRange | null
// src/domain/pace.ts
measureIntervals(results: ResultStamp[]): { different: number[]; same: number[] }
blendPace(defaults: Pace, measured: Intervals): Pace
// src/domain/attempts.ts
estimateWeight(attemptNumber: 2 | 3, opening: number, previousWeight: number): number   // at least previousWeight + 1
minWeight(previous: { weightKg: number; result: "GOOD" | "NO_LIFT" | null } | null): number   // prev + 1, or prev after a no-lift
applyWeightChange(lift: AttemptState[], attemptNumber: 1 | 2 | 3, newWeight: number): WeightChange
// WeightChange = { ok: true; lift: AttemptState[] }   // includes the later attempts that were moved up (R10)
//              | { ok: false; reason: "NOT_WHOLE" | "TOO_LOW" | "TOO_HIGH"; limit?: number }
applyResultChange(lift: AttemptState[]): AttemptState[]   // after a result or flag change: move later attempts up if needed
resolveResult(flags: [Flag, Flag, Flag]): "GOOD" | "NO_LIFT"
// src/domain/groups.ts
canEnterGroup(group: { allowedSex: Sex | null }, lifter: { sex: Sex }): boolean   // always true for now
```

### 6.7 Known inaccuracy
A no-lift usually means the lifter repeats the same weight, and lifters often
change weights at the last second. The estimate cannot know this in advance.
That is accepted for the first slice and C5 improves it later.
Late attempts (3rd) built on estimated weights are also less certain.

---

## 7. Data model

Sketch for `prisma/schema.prisma` (names and fields are refined when the
schema step is built; check the Prisma 7 and Better Auth docs for the exact setup).

```prisma
enum Role     { ADMIN COACH LIFTER }
enum Sex      { MALE FEMALE }
enum LiftType { SNATCH CLEAN_JERK }
enum Flag     { WHITE RED }

model Club {
  id           String        @id @default(cuid())
  name         String
  users        User[]
  lifters      Lifter[]
  competitions Competition[]
}

// Better Auth generates user/session/account/verification (its CLI writes the Prisma models).
// We add these fields to the user through Better Auth's additional fields:
model User {
  role     Role    @default(COACH)
  clubId   String?                // empty only for ADMIN, who acts in a chosen club
  club     Club?   @relation(fields: [clubId], references: [id])
  lifterId String? @unique        // only LIFTER accounts (later phase)
  lifter   Lifter? @relation(fields: [lifterId], references: [id])
  tracking Tracking[]
}

model Lifter {                    // belongs to ONE club's directory (no global identity); also holds competitors from other clubs
  id          String  @id @default(cuid())
  clubId      String
  name        String
  sex         Sex                 // required: needed for plates (bar 20/15 kg) and Sinclair
  birthYear   Int                 // required; used for age classes such as W40 (C8)
  affiliation String?             // the lifter's own club, when it is not ours
  entries     Entry[]
  @@index([clubId, name])
}

model Competition {
  id        String    @id @default(cuid())
  clubId    String
  name      String
  startDate DateTime  @db.Date
  endDate   DateTime? @db.Date     // multi-day competitions
  location  String?
  groups    Group[]
}

model Group {
  id               String  @id @default(cuid())
  competitionId    String
  name             String           // "Group F"
  allowedSex       Sex?             // empty = mixed group. Not enforced in this version (R14)
  paceMinSeconds   Int     @default(75)
  paceMaxSeconds   Int     @default(90)
  selfMinSeconds   Int     @default(100)
  selfMaxSeconds   Int     @default(120)
  entries          Entry[]
}

model Entry {                       // a lifter in one group
  id           String  @id @default(cuid())
  groupId      String
  lifterId     String
  lotNumber    Int
  bodyweightKg Float?               // weigh-in result
  attempts     Attempt[]
  tracking     Tracking[]
  @@unique([groupId, lifterId])
  @@unique([groupId, lotNumber])
}

model Attempt {
  id          String    @id @default(cuid())
  entryId     String
  lift        LiftType
  number      Int                   // 1..3
  weightKg    Int                   // always set, whole kg (R2, R10)
  isEstimated Boolean   @default(false)   // not confirmed by a person; also set when the app moves an attempt up (R10)
  cancelled   Boolean   @default(false)
  leftFlag    Flag?                 // all three are null until a result is entered
  centerFlag  Flag?
  rightFlag   Flag?
  resultAt    DateTime?             // set once, when the result is first entered
  updatedAt   DateTime  @updatedAt
  @@unique([entryId, lift, number])
}

model Tracking {                    // "ME": which entries a user follows
  userId  String
  entryId String
  @@id([userId, entryId])
}
```

**Invariants** (checked in Zod and domain code, tested with unit tests):
flags are either all `null` (no result yet) or all set together with `resultAt`.
`number` is 1–3. An attempt with `resultAt` cannot be `cancelled`. `weightKg` is a whole
number and respects the minimum from the previous attempt of the same lift (R10: +1 kg after a good or pending attempt, equal allowed after a no-lift). `ADMIN` users have no
`clubId`, `COACH` and `LIFTER` users always have one.

**Derived, never stored:** result (good / no-lift), attempt state
(`PENDING` / `DONE` / `CANCELLED`), phase, "started", predicted order, pace,
lifts ahead, best lifts, totals, Sinclair.

### Sinclair (Should: S4)
`src/domain/sinclair.ts` holds a table of coefficients **per Olympic cycle**,
chosen by the competition date.
Formula: `S = 10^(A × log10(bw / b)²)` when `bw ≤ b`, otherwise `1`.
`Sinclair total = total × S`. Total = best good Snatch + best good Clean & Jerk.
With no good lift in one of the lifts there is no total.

| Cycle | Men A | Men b | Women A | Women b | Source |
|-------|-------|-------|---------|---------|--------|
| 2021–2024 | 0.722762521 | 193.609 | 0.787004341 | 153.757 | IWF "Sinclair Coefficients for the Olympiad" |
| 2025–2028 | **TODO** | **TODO** | **TODO** | **TODO** | Not found on 13 Oct 2026. One calculator site says they are still being recalibrated. Check the IWF site again before building S4. Until then the 2021–2024 values are used and the UI says so |

### Weight classes and age classes (Could: C8)
Nothing extra is stored for these. Sex, bodyweight (per entry), birth year and the
competition date are already saved, so a class can be worked out later and the
winner of each class shown on the results screen of a previous competition
(for example "W40"). The class tables change over time, so they are kept per cycle
in `src/domain/` like the Sinclair constants. That is why `birthYear` is a required field on the lifter.

### Who can do what (access)
| Role | First slice | Later |
|------|-------------|-------|
| `ADMIN` | Created by the seed script. **Full access to every club:** creates clubs, adds coaches (and lifters later), adds and edits competitions, groups, lifters and results. Acts in **one club at a time** through a club switcher in the app shell | Optional overview across clubs |
| `COACH` | Full read/write inside their own club: competitions, groups, entries, attempts and the lifter directory. Can add other coaches to the club | Creates lifter accounts, read-only access to lifters' PRs |
| `LIFTER` | (not built) | Own warm-up and PRs, read-only competition view |

**Club scoping is enforced on the server, every time.** Every query and Server
Action starts with `requireClubAccess()` (coach or admin), which returns
`{ userId, clubId, role }`. For a coach, `clubId` is their own club. For an admin it is
the **active club** chosen in the club switcher. It is kept in a long-lived cookie (HttpOnly, SameSite=Lax, one year, not cleared on logout), so after login the admin lands in the last club used. The cookie is checked against
the database on every request. With no valid active club the admin is sent to `/admin/clubs`.
Data functions take `clubId` as a required argument and filter through the
chain (`attempt → entry → group → competition → clubId`). A coach can never read or
change another club's data, even with a forged id. The admin reaches another club only
by switching the active club. Unit-test this with two clubs, as coach and as admin.

---

## 8. Routes (App Router)

```
/login                                          Login
/                                               Dashboard: upcoming + recent competitions, "New competition"
/competitions                                   All competitions (previous and upcoming)
/competitions/new                               Create competition
/competitions/[competitionId]                   Competition overview: its groups, "Add group"
/competitions/[competitionId]/groups/[groupId]  GROUP BOARD: setup and live in one page
/members                                        Members of the active club: coaches, "Add coach" (coach and admin)
/admin/clubs                                    Admin only: all clubs, create club, choose the active club
/lifters                                        Lifter directory (S2)
/lifters/[lifterId]                             Lifter detail: competitions, flags per lift, Sinclair (S2, S4)
/warmup                                         Warm-up calculator (C2, later)
```

- `(auth)` route group: `/login`. `(app)` route group: everything else, with a layout that
  requires a session and renders the app shell.
- The group board is the same page before and during the competition. Adding lifters
  opens an add form on the same page. Nothing changes layout when the first result is entered.
- The app shell shows a **club switcher** (admin only) with the active club's name. A coach sees just their club's name.
- `proxy.ts` (Next 16's name for middleware) only does an **optimistic redirect** to `/login`.
  Real checks happen in layouts, queries and Server Actions.
- `not-found.tsx` and `error.tsx` for unknown ids and unexpected errors. Unknown or
  foreign ids give a 404, not "forbidden".

---

## 9. Folder structure

```
liftoff-comp/
├── CLAUDE.md   README.md   TESTING.md
├── docs/                    PROJECT4_CONTEXT.md
├── readme-assets/           wireframes/  screenshots/
├── prisma/                  schema.prisma  migrations/  seed.ts
├── prisma.config.ts
├── proxy.ts
└── src/
    ├── app/                 routes, thin pages
    │   ├── layout.tsx
    │   ├── (auth)/login/
    │   ├── (app)/           layout.tsx (session + shell), page.tsx, competitions/, lifters/
    │   └── api/auth/[...all]/route.ts
    ├── domain/              PURE TypeScript, no React, no Prisma, no Date.now()
    │   ├── attempts.ts  order.ts  estimate.ts  pace.ts  plates.ts  sinclair.ts
    │   └── *.test.ts        next to the code
    ├── server/              db.ts  auth.ts  session.ts
    │   ├── queries/         read functions, club-scoped
    │   └── actions/         Server Actions: session + Zod + club scope + write + revalidate
    ├── components/          Name/Name.tsx  Name.module.scss  Name.test.tsx
    ├── styles/              tokens, mixins, global
    ├── hooks/  (useAutoRefresh, useNow)   lib/
    └── test/                setup.ts  factories.ts  integration/
```

**Dependency direction (keep it one-way):**
`app (pages)` → `server` → `domain`, and `components` → `domain` (types and pure
helpers). `domain` imports nothing from the other folders. Components never import `server/`
(they get data as props and call actions passed in or imported from `server/actions`).

**Thin pages, smart client components.** Async Server Components are hard to
unit test with Vitest, so pages only fetch and pass **plain serializable props** to
client components. All behaviour worth testing lives in `domain/` and in client components.

---

## 10. Components (draft, finalised after the wireframes)

```
AppShell · NavMenu · ClubSwitcher (admin) · ThemeToggle · RocketIcon · Button
LoginForm
MembersTable · AddCoachForm · ClubsTable · CreateClubForm
CompetitionForm · GroupForm · CompetitionCard · GroupCard
GroupBoard                  client: board state = server props + optimistic changes, plus actions
 ├─ AutoRefresh · LastUpdated   runs useAutoRefresh; shows "Updated 12 s ago" + refresh button (§11)
 ├─ NextLifterPanel         name, attempt, weight. Derived from the table order (R13)
 │   └─ PlateDiagram        SVG plates (ported from weightlifting-calculator)
 ├─ FlagToggleGroup         3 × FlagToggle (left / centre / right) + EnterResultButton
 ├─ LiftSection (Snatch, Clean & Jerk)
 │   └─ LifterTable → LifterRow
 │        ├─ AttemptCell    weight + state colour (pending / good / no-lift / cancelled)
 │        │    └─ EditableWeight   button ⇄ input, blank restores, inline error message (R10)
 │        ├─ TMinus         "T–7 · ~9–11 min" badge (tracked rows only)
 │        └─ RowMenu        stop lift · withdraw · restore · track
 └─ AddLifterForm
      └─ LifterCombobox     suggestions from the club directory
```

**Where the brief's React concepts show up**
- Props: `AttemptCell`, `LifterRow`, `FlagToggle`, `Button`, `PlateDiagram`
- State: `EditableWeight` (editing/value), `FlagToggleGroup`, `GroupBoard` (board state), forms
- Events: weight edit, flag toggle, enter result, row menu, theme toggle
- Conditional rendering: pre-start vs live estimate, pending/good/no-lift/cancelled cell, tracked rows, empty states
- Reusable components: `Button`, `AttemptCell`, `FlagToggle`, `LiftSection` (used for both lifts)
- Custom hooks (draft): `useBoardState`, `useNow` (ticks once a second for the estimate), `useAutoRefresh` (§11)
- Next.js on top: layouts and route groups, Server Components, Server Actions, loading and error states

**Interaction notes (design inputs for the wireframes)**
- The board is used on a **phone or tablet in a loud hall**: big tap targets (≥ 44 px), one-hand use, flags and "Enter result" reachable without scrolling.
- Flags must not rely on colour alone: white = outlined flag, red = filled flag with a mark, plus an accessible name such as "Left judge: red (no)".
- Result states on a weight are green/red **plus** an icon or text for good / no-lift.
- Optimistic updates (`useOptimistic`): the row changes instantly, a small "saving…" / "failed, retry" marker shows per attempt. A failed save never silently loses a result.
- Editing a weight: the weight is a `<button>`. On click it becomes an `<input>` that is blank. Enter or click-away commits, **Esc or a blank value restores the old value**.
  A weight that breaks R10 is not saved: the old value comes back and a short message under the field (linked with `aria-describedby`) says *"Weight can not be lower than 93 kg"* (the real minimum).
  When raising an attempt makes the app move later attempts up, those cells show the estimate marker so the coach notices the change.
- The next-lifter panel never has its own state: it reads the first attempt of the sorted table. If the current lifter raises to a weight above the next one, the panel switches by itself and any toggled flags reset (R13).
- Admins see the active club's name in the top bar with a switcher. Make it obvious which club they are acting in, because they can edit any club.

---

## 11. Keeping every screen fresh (auto-refresh)

**What "real-time sync" means:** when one device changes data, other devices show the
change **without anyone refreshing their phone**. Coach A enters a result and coach B's
open board (later also a lifter's phone) updates by itself.

**Decision: polling, not push.** The board calls Next.js `router.refresh()` every
`AUTO_REFRESH_MS = 15_000` (a constant that is easy to change). `router.refresh()` asks the
server for fresh Server Component data for the current page and merges it in **without a
full reload and without losing client state** such as an open row menu or scroll position.
Push (WebSockets) is not used, because serverless functions on Vercel cannot hold those
connections (§2).

**Behaviour (`useAutoRefresh`)**
1. **Pause when hidden.** No refresh while the tab is in the background. Refresh once, straight
   away, when the tab becomes visible again, the window gets focus or the device comes back online.
2. **Never interrupt an edit.** Skip a tick while a weight input is open, flags are toggled but not
   sent, or a save is in flight. Try again at the next tick.
3. **Server data is the source of truth.** Board state is the server props plus optimistic changes
   (`useOptimistic`). Do **not** copy props into `useState`, or a refresh would change nothing.
4. **Show it.** "Updated 12 s ago" with a refresh button. If a refresh fails (no connection) show
   "Offline: showing data from 13:52" instead of an error page. This text is not a live region,
   so screen readers are not interrupted every 15 s.
5. **Pages stay dynamic.** Pages read the session, so they render per request. Do not cache the
   board queries.
6. **Separate clock.** `useNow` ticks every second on the device, so "9–11 min" counts down between
   refreshes. It fetches nothing.

**Cost:** each refresh renders the page and runs the board queries once. Ten open boards is about
40 refreshes a minute, which is small for this app. Check Vercel and Neon usage after the first
deploy. If needed later: a cheap `GET /api/groups/[id]/version` that returns the newest `updatedAt`,
and call `router.refresh()` only when it changed.

**Limits**
- Not instant: another device can be up to about 15 s behind.
- Two people editing at the same time: **last write wins**. The most important action is protected
  (R13): *Enter result* checks the attempt id and the weight that was shown, and refuses a second result.
- No offline queue in the first slice (C4).
- The read-only lifter view (C3) uses the same hook.

**Tests:** `useAutoRefresh` with fake timers: calls `refresh` every 15 s, pauses when hidden and
refreshes when visible again, skips while editing, stops on unmount (§13).

---

## 12. Design: wireframes and visual tokens (TODO)

**Stage 2: wireframes** (`readme-assets/wireframes/*.svg`). Draw in this order,
phone first, then tablet and desktop for the first two:

| # | Screen | Must show |
|---|--------|-----------|
| 1 | **Group board** | Next-lifter panel + plates, flag toggles + "Enter result", lifter table with 3 weights per row, tracked row with "T–7" before start and "T–7 · ~9–11 min" after start, Snatch list with Clean & Jerk list underneath, finished lifters at the bottom, the "Updated 12 s ago" refresh indicator, an inline weight error ("Weight can not be lower than 92 kg") |
| 2 | Group board states | Row menu open (stop lift, withdraw, restore, track), weight being edited, withdrawn lifter, group finished |
| 3 | Add lifter | Name field with suggestions, **sex and birth year (required)**, bodyweight, lot number, **both openings (required)**, the auto-filled 4 % / 8 % preview for both lifts |
| 4 | Dashboard + competitions | Upcoming/recent competitions, create competition, add group |
| 5 | Lifter detail | Competitions list, each lift with its three flags in order, Sinclair |
| 6 | Login | Simple, rocket icon, tagline |
| 7 | Members + admin | Members list with "Add coach"; admin clubs list with "Create club"; club switcher in the top bar (club name always visible) |

**Stage 3: visual tokens** (after the wireframes are agreed, same method as Project 3:
tokens for both themes, every text pair checked for WCAG AA 4.5:1 and UI borders 3:1).

Direction so far: dark by default with **orange** as the main colour and a
**special blue accent**, plus a light mode. A T-minus readout with large tabular
numerals, and a rocket icon. Fonts, spacing and radii: **TODO**.

---

## 13. Testing plan

Setup: `vitest` + `@vitejs/plugin-react` + `jsdom` + `vite-tsconfig-paths` +
`@testing-library/react` + `user-event` + `jest-dom`.
`src/test/setup.ts` loads jest-dom and clears mocks. `src/test/factories.ts`
builds entries and attempts for tests (`makeEntry({ snatch: [100, 104, 108] })`).

**Unit tests (written with each piece, same commit)**

| Target | What we test |
|--------|--------------|
| `attempts.ts` | `estimateWeight` (100 → 104, 108; rounding; at least +1 kg over the previous attempt), `minWeight` (+1 after a good or pending attempt, equal after a no-lift), `applyWeightChange` (not whole kg, too low with the minimum in the result, equal accepted after a no-lift, raising moves later attempts up: 90 / 92 / 94 with attempt 2 → 94 gives 90 / 94 / 95, attempt 1 raised over attempt 2 moves both, estimated attempts are re-estimated, cancelled attempts are moved too, a later attempt with a result is not moved and the edit is refused with the highest allowed weight, no limit for attempt 1 or between Snatch and Clean & Jerk), `applyResultChange` (a no-lift corrected to good moves a repeated weight up), `resolveResult` for all 8 flag combinations (position of the red flag does not change the result) |
| `order.ts` | Sort by weight, tie by attempt number then lot number, cancelled and finished at the bottom, lifter following themselves, a lifter raising above the next lifter changes the first attempt in the order, phase switches Snatch → Clean & Jerk → finished |
| `groups.ts` | `canEnterGroup` is true for a mixed group (and already correct for `MALE` / `FEMALE` groups, so the later restriction is only UI) |
| `estimate.ts` | `liftsAhead` (next = 0, unknown = null), 7 different lifters = 9–11 min, same-lifter steps use 100–120 s, elapsed time subtracted and clamped at 0, last-attempt lifter makes the first step "same", not started = no minutes |
| `pace.ts` | Outlier filtering (< 20 s, > 240 s), blend weights `n/(n+5)`, ±10 % range |
| `plates.ts` | Plates for 60, 61, 100 kg etc. for men's 20 kg and women's 15 kg bar. **Whole kg only. Metal plates only and no 1.25 kg plate** (port the logic and tests from `plates.js` in `weightlifting-calculator`, which marks which plates are metal and which are plastic) |
| `sinclair.ts` | Known values, `bw ≥ b` gives 1.0, cycle chosen by date |
| Zod schemas | Whole-kg weights, flags all-or-none, lot numbers, dates, sex, birth year (plausible, not in the future) and both openings required |
| `EditableWeight` | Click → blank input, Enter commits, click-away commits, blank restores, Esc restores, a weight below the minimum is rejected (+1 kg after a good lift, equal allowed after a no-lift): the field keeps the old value and shows "Weight can not be lower than 93 kg" with the real minimum, and attempts the app moved up show the estimate marker |
| `FlagToggle` / `FlagToggleGroup` | Default white, toggles to red and back, accessible names, "Enter result" calls back with the three flags in order |
| `AttemptCell` | Pending / good / no-lift / cancelled styles **and** text/icon, estimated weight marker |
| `LifterRow` / `LifterTable` | Order from props, finished at bottom, tracked row shows `TMinus`, `<th scope>` |
| `TMinus` | Before start shows lifts only, after start shows range, "You're up next", other-lift and finished texts |
| `RowMenu` | Opens/closes, actions call back, restore only shown when cancelled |
| `NextLifterPanel`, `PlateDiagram` | Name, attempt, weight, plates for a weight and for the lifter's bar. The panel shows the first attempt of the order and **changes when its props change** (R13). Toggled flags reset when the attempt changes |
| `LifterCombobox`, `AddLifterForm` | Suggestions filter, picking a suggestion fills sex and birth year, sex, birth year and both openings required, validation messages, auto 4 % / 8 % for both lifts |
| `useAutoRefresh` | Fake timers: calls `refresh` every 15 s, pauses when the tab is hidden and refreshes when visible again, skips while editing or saving, stops on unmount |
| `ClubSwitcher`, `MembersTable`, `AddCoachForm` | Switcher only for admin and shows the active club, the last active club is remembered (an invalid cookie falls back to `/admin/clubs`), add coach validation, a coach never sees other clubs |
| `CompetitionForm`, `GroupForm`, `LoginForm`, `ThemeToggle`, `Button` | Validation, submit, `aria-pressed`, link/button rendering |

**Integration tests (end of project, `src/test/integration/`, Server Actions mocked)**
1. Add lifters → attempts 2 and 3 are +4 % / +8 % → list is sorted by lowest weight.
2. Enter results → good/no-lift colours → next lifter changes → finished lifter moves down.
3. Track a lifter → "T–N" before start → minutes appear after the first result → editing a weight changes N.
4. Stop a lift / withdraw → moves to the bottom → restore brings the lifter back.
5. Correct a result afterwards (flag changed, good → no-lift) → colour changes, `resultAt` is not touched.
6. Theme toggle persists.
7. **The current lifter raises their weight above the next lifter** → the next-lifter panel switches to the other lifter, the table re-sorts, toggled flags reset to white.
8. Auto-refresh: new data from "another device" shows up after 15 s, but not while a weight is being edited.
9. Admin switches club → sees only that club's competitions and lifters. A coach has no switcher.
10. **Raise an attempt over the next one** → later attempts move up (90 / 92 / 94, attempt 2 → 94, attempt 3 becomes 95), the moved cells show the estimate marker, the order and the estimate update.
11. **Weight rules after results** → after a good lift the next weight must be at least +1 kg, after a no-lift the same weight is accepted, a refused weight shows the minimum and keeps the old value.

*Optional if time allows:* tenancy tests with two clubs, as coach and as admin, against a throwaway Neon branch.
No coverage target. Async Server Components are covered by keeping pages thin, not by tests.

---

## 14. Packages and scaffolding

Indicative commands. Check `--help` and the current docs when scaffolding.

```
npx create-next-app@latest        # TypeScript, ESLint, App Router, src/ dir, alias @/*, npm; no Tailwind
npm i prisma@7 @prisma/client@7 zod better-auth
npm i -D sass vitest @vitejs/plugin-react jsdom vite-tsconfig-paths \
         @testing-library/react @testing-library/user-event @testing-library/jest-dom \
         prettier eslint-config-prettier tsx
```
- Prisma 7 needs a driver adapter for Postgres and a `prisma.config.ts`, and the
  connection URL no longer lives in `schema.prisma`. Follow the current Prisma + Neon guide.
- Better Auth: use its CLI to generate the Prisma models, then add `role`, `clubId`
  and `lifterId` with additional fields.
- If `create-next-app` refuses because the folder is not empty (`README.md`,
  `CLAUDE.md`, `docs/`), scaffold in a temporary folder and move the files in, then
  restore our README and CLAUDE.md with `git checkout`.
- Scripts to add: `test`, `test:run`, `format`, `db:migrate`, `db:seed`.
- Env vars (`.env`, with `.env.example` committed): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

---

## 15. Build plan (TODO: written in stage 3, after wireframes)

Rules: **one step = one commit**, tests in the same commit, short commit messages,
deploy early. Draft phase outline (the commit-level steps come later):

| Phase | Content | Target |
|-------|---------|--------|
| 0 | Scaffold, Sass, Prettier, Vitest, first deploy to Vercel | week 1 |
| 1 | **Domain first, test-first:** attempts, order, estimate (+ pace, plates). No UI, no DB | week 1 |
| 2 | Prisma 7 + Neon, schema + migration, Better Auth, seed (first admin), protected app shell, club switcher, clubs + members pages, theme tokens | week 1–2 |
| 3 | Competitions and groups: create/list, group overview | week 2 |
| 4 | **Group board:** table, add lifters, inline edit with weight rules, flags + result, next-lifter panel + plates, row menu, tracking + T-minus, auto-refresh | week 2–3 |
| 5 | Should items as time allows: measured pace, lifter detail with flags, history, Sinclair | week 3 |
| 6 | Integration tests, responsive pass (375 / 768 / 1024 / 1440 px), accessibility check, README + TESTING.md + screenshots | week 3 |

Cut order if time runs short: S5 → S4 → S3 → S1, then shrink M2 (admin creates clubs and coaches only, plain select as club switcher). Never cut M1 or M3–M12.

---

## 16. Deployment (Vercel + Neon)

1. Create a Neon Postgres database through the Vercel Marketplace (`vercel install neon`
   or the dashboard). Vercel injects `DATABASE_URL`.
2. Add `BETTER_AUTH_SECRET` (a long random string) and `BETTER_AUTH_URL` (the production URL).
3. `prisma generate` must run before `next build` (build script or `postinstall`).
   Apply migrations with `prisma migrate deploy` against production **manually** at first.
4. Run the seed script once against production to create the first admin. The club and its coaches are then created in the app.
5. Use a separate development database (for example a Neon branch), so tests never touch production data.
6. Set the Node.js version in Vercel to 22.18 or later (24.x like in Project 3).
7. The repo is public: never commit `.env`. Commit `.env.example` only.

---

## 17. Accessibility checklist

- Skip link → `<main id="main">`. Landmarks: `header` / `nav` / `main` / `footer`. One `<h1>` per page, unique `<title>`.
- The lifter list is a real `<table>` with `<caption>`, `<th scope="col|row">`. Not a pile of `div`s.
- Flags: `<button aria-pressed>` with names like "Left judge flag: white (good)". Shape/icon differs, not only colour.
- Weight states are green/red **and** have an icon or text. Check contrast in both themes (AA).
- Weight editing is keyboard-complete (Enter, Esc, Tab). A refused weight keeps the old value, sets `aria-invalid` and shows the message ("Weight can not be lower than 92 kg") linked with `aria-describedby`.
- The next-lifter panel and result changes are announced in an `aria-live="polite"` region.
- The "Updated 12 s ago" text of the auto-refresh is **not** a live region, so screen readers are not interrupted every 15 s.
- The T-minus badge has a full-sentence accessible name: "7 lifts before your turn, about 9 to 11 minutes".
- Tap targets ≥ 44 px. Visible `:focus-visible` ring. Reduced motion respected for any animation.
- Forms: labels, `aria-invalid`, `aria-describedby` errors, `role="status"` messages.
- Row menu, dialogs and the combobox follow standard keyboard patterns (Escape closes, focus returns).

---

## 18. Risks

| Risk | Mitigation |
|------|------------|
| **Scope** is large for 3 weeks | Must/Should/Could tiers (§4), cut order in §15 |
| **Poor connection in the hall** | Optimistic updates with a visible saving/failed state. Offline queue is C4, not in the first slice |
| **Estimate accuracy** (weight changes, repeated attempts) | Pure function recalculated on every change, range instead of one number, measured pace (S1), adaptive repeats later (C5) |
| **Entering data under pressure** | Flags default white, big targets, everything reversible (restore, edit after result) |
| **Two coaches editing one group** | Last write wins. The board refreshes itself about every 15 s (§11) and *Enter result* is guarded against stale weights and double results (R13). Push-based sync is out of scope |
| **Stale screens** (a lifter or second coach sees old data) | Auto-refresh every 15 s, "Updated … ago" indicator, offline notice (§11) |
| **Admin can edit any club by mistake** | Active club always visible in the top bar, switch is explicit, the cookie is checked against the database on every request, scoping tests as admin and as coach |
| **Prisma 7 + Better Auth + Next 16 setup friction** | Do auth + DB in one early phase (§15), follow the current docs, pin Prisma 7 |
| **Sinclair constants for 2025–2028 not found** | Cycle table in code, 2021–2024 used and labelled until the new values are published |
| **Plate SVGs and logic live in another repo** | Ask for access to `weightlifting-calculator` at the plates step and port the code and tests, not a dependency |

---

## 19. Review decisions and open questions

### Decided in review (13 Oct 2026)
| # | Decision |
|---|----------|
| 1 | **Lifting order confirmed** (R6). The only special case: a lifter following themselves gets a 2-minute clock instead of 1 minute |
| 2 | **Both openings** (Snatch and Clean & Jerk) are required when a lifter is entered |
| 3 | The word is **Track** (menu item "Track timing"), shown as **ME** on the first tracked lifter |
| 4 | **Sex is a required field** on every lifter |
| 5 | **Lifters are scoped to one club.** Pooling records across clubs would give inconsistent stats. Competitors from other clubs are stored in our directory with an "affiliation" text |
| 6 | **Whole kg only.** For the plates, port from `weightlifting-calculator/plates.js` but **leave out the 1.25 kg plate** and use the **metal plates, not the plastic ones** (the file says which is which) |
| 7 | **Weight rules** (R10): at least +1 kg after a good lift, a repeat is allowed after a no-lift, raising an attempt moves the later ones up by +1, a refused weight keeps its old value and shows the minimum |
| 8 | **The next-lifter panel is derived** and updates when weights change (R13) |
| 9 | **Mixed groups** now, with `allowedSex` ready for later (R14) |
| 10 | **Admin has full access to every club** and acts in one at a time (M2) |
| 11 | **Weight classes and age classes** are a Could (C8), with the class winners on the results screen |
| 12 | **Auto-refresh about every 15 s** replaces real-time sync (§11) |
| 13 | **Pace outlier limit is 240 s** (changed directly in the repo copy of this file) |
| 14 | **Birth year is required** on every lifter (needed for age classes) |
| 15 | **The admin's last active club is remembered** in a long-lived cookie, with `/admin/clubs` as the fallback |

### Still open
Nothing blocks the wireframes. One interpretation to confirm:
- **R10 minimum:** +1 kg is enforced after a good lift and between two attempts that have no result yet (the app assumes success). After a no-lift the same weight is allowed, because repeating a missed weight is normal. Say so if you want +1 kg everywhere.

---

## 20. Definition of done

- [ ] All Must features (M1–M12) work on the deployed site, including login and a page refresh on any route
- [ ] A full group can be run: add lifters, enter 6 attempts each, stop/withdraw/restore, correct a result afterwards
- [ ] Tracked lifter shows lifts before the start and a minute range after the first result
- [ ] If a lifter raises their weight above the next lifter, the next-lifter panel switches by itself
- [ ] A result entered on one device shows up on a second device within about 15 s without refreshing
- [ ] The weight rules hold: +1 kg after a good lift, a repeat is accepted after a no-lift, a refused weight keeps its old value and shows the minimum, and raising an attempt moves the later ones up
- [ ] Club scoping verified: a coach cannot see or change another club's data, and the admin only reaches other clubs by switching the active club
- [ ] Dark and light theme, responsive at 375 / 768 / 1024 / 1440 px
- [ ] Unit + integration tests pass (`npm run test:run`), lint clean
- [ ] Accessibility checked (keyboard, contrast, Lighthouse / WAVE)
- [ ] README + TESTING.md complete, repo public, live URL works
- [ ] Submitted: repo URL, live URL, short project description
