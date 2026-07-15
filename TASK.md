# TASK: Bilimdon — Improvement Backlog (15 tasks)

> Written 2026-07-16 after a full-project review. The previous contents of this file (the FSRS
> learn-module rebuild spec) are **done and deployed** — deliberately removed. This document is
> self-contained: an agent picking up any task below should not need the old spec.

**Product:** Bilimdon — English vocabulary platform for 5th–6th grade students in Karakalpakstan.
UI language: Karakalpak (kaa), Latin script with diacritics (á ó ú ń ǵ ı). All user-facing strings
live in `web/src/i18n/kaa.ts` — never hardcode UI text in components.

**Stack:** `web/` = React 19 + Vite + Tailwind v4 (CSS-first config in `web/src/index.css`) +
Zustand 5 + react-i18next. `server/` = Express + Prisma + PostgreSQL (Docker, localhost:5432).
No test infrastructure exists — verify changes via `npx tsc --noEmit` (both packages), `npm run
build`, curl against `npm run dev` (port 4000), and browser click-through (Vite on 5173).

**Current state (2026-07-16):**
- Learn path = 18 units × 2 lessons × 5 words (179 words total, sourced from Cambridge "Guess
  What!" Grade 5/6 vocabulary lists). Each lesson is a row of 6 sequentially-unlocked blocks:
  `intro → listen → translate → letters → speak → write` (see `BLOCK_ORDER`/`BLOCK_EXERCISE` in
  `server/src/lib/learnQueue.ts`), tracked per-user in the `LearnBlockProgress` table.
- FSRS spaced repetition per word (`server/src/lib/srs.ts`, `UserWordProgress` table, 0–5 mastery
  ladder). Review sessions ("🔁 Qaytalaw") pick exercises adaptively via `exerciseForLevel`.
- Word DB row shape: `en`, `ipa`, `uz` (⚠️ contains **Karakalpak**, not Uzbek), `example`
  (English sentence), `emoji`, `order`.
- Production: https://bilimdan.uz — VPS 111.88.132.156 (root SSH). Backend `/opt/bilimdon/server`
  (systemd `bilimdon.service`, rsync src + rebuild remotely, NOT a git checkout), frontend
  `/var/www/bilimdan.uz/`, postgres in Docker (`bilimdon-postgres-1`). **Always `pg_dump` before
  any migration/seed on prod.** ⚠️ The VPS is shared with other projects (Camelot etc.) whose
  deploys have twice overwritten `/etc/nginx/sites-available/bilimdan.uz` — check that file first
  if the domain serves the wrong app (restore from `bilimdan.uz.bak-20260707090520`).
- `books/` (gitignored, 176MB) holds the source textbook PDFs.

**Suggested order:** F1 → F4 → F2 → F5 → C1 → C2 → C3 → F3 → C4 → C5 → N2 → N3 → N4 → N1 → N5.
(F = fix, C = change, N = new feature. F1/F4 are security/data-safety critical. C1 should land
before C2. N-tasks are independent of each other.)

---

## Part 1 — FIXES (bugs)

### F1. Rate-limit unauthenticated auth endpoints (security)

**Problem.** `rateLimit()` (`server/src/middleware/rateLimit.ts`) keys on `req.userId` and calls
`next()` unconditionally when it is `null` (line ~21). `POST /api/auth/login` and
`POST /api/auth/signup` (`server/src/routes/auth.ts`) have no limiter attached at all. Result:
unlimited-speed password brute-forcing and unlimited account creation.

**Fix.** Add an IP-keyed variant of the same sliding-window limiter (factor the window logic so
both share it; key by `req.ip` — set `app.set('trust proxy', 1)` in `server/src/index.ts` since
nginx proxies with `X-Forwarded-For`, otherwise every request appears to come from 127.0.0.1).
Apply to login (e.g. 10/min per IP) and signup (e.g. 5/min per IP). Return the existing 429
`RATE_LIMITED` AppError so the client's `errorMessage.ts` handles it.

**Accept when:** 11 rapid failed logins from one IP → 429 with Karakalpak message; normal login
still works; `tsc` clean.

### F2. "Letters" block runs the wrong exercise type

**Problem.** The block the UI labels "Háriplerdi tabıw" (find the letters, icon 🔤) should be the
assemble-the-word-from-letter-tiles exercise, but `BLOCK_EXERCISE.letters = 'fill_blank'`
(`server/src/lib/learnQueue.ts` ~line 16) — which is actually "pick the word for the blank in a
sentence" (`web/src/screens/learn/FillBlankExercise.tsx`). Mismatch between label and content.

**Fix.** Change `BLOCK_EXERCISE.letters` to `'letter_tiles'`. Notes: (a) `letter_tiles` needs no
`options` — `enrichItems` in `server/src/routes/learn.ts` already handles it via the `default`
branch; (b) XP per item changes 2→3 (`XP_TABLE`), that's fine; (c) `fill_blank` remains reachable
through review sessions (`exerciseForLevel` level-5 pool), so don't delete anything.

**Accept when:** starting the letters block serves 5 `letter_tiles` items (curl the session-start
response); the LetterTilesExercise renders in browser; already-completed letters blocks stay
completed (block key unchanged — verify a user with existing `LearnBlockProgress` rows).

### F3. XP lost to read-modify-write race in `awardProgress`

**Problem.** `server/src/lib/progress.ts` (~line 49) does `xp: user.xp + xpGain` after a separate
read. Two near-simultaneous completions (double-tap, slow network retry, two tabs) can overwrite
each other and silently drop XP. Same pattern risk for `goalDoneToday`.

**Fix.** Wrap the read + rollover computation + update in `prisma.$transaction(async (tx) => …)`
and make the XP write atomic (`xp: { increment: xpGain }`). The streak/goalDoneToday rollover
needs the read anyway, so an interactive transaction is the right shape; keep
`checkAndAwardBadges` outside the transaction (it re-reads).

**Accept when:** firing two concurrent `/api/learn/session-complete` calls for two different
completed sessions of the same user (script it) yields the sum of both XP awards; `tsc` clean.

### F4. Guard the destructive seed (data safety)

**Problem.** `server/src/seed.ts` now hard-wipes `UserWordProgress`, `LearnSession`,
`LearnBlockProgress`, `Word`, `Unit` and resets `wordsKnownCount` on **every run** (the
"Clearing old units/words…" block, ~line 708). This was correct for the one-time vocab
replacement on 2026-07-16, but as a standing behavior one absent-minded `npm run seed` against
prod deletes all learner progress.

**Fix.** Split behavior by an explicit opt-in, e.g. env `SEED_REPLACE_CONTENT=1` (or CLI arg
`--replace-content`). Without it: skip the wipe AND the units/words section entirely (leave
content untouched), still idempotently seed regions/schools, badges, demo user, and refresh the
quiz/listen/battle banks (those are safe deleteMany+createMany on tables nothing references).
With the flag: current full-replace behavior, but print a loud multi-line warning and the target
`DATABASE_URL` host first, and `process.exit(1)` if the flag is set while `NODE_ENV=production`
unless a second env `SEED_REPLACE_CONTENT_CONFIRM_PROD=1` is also set.

**Accept when:** plain `npm run seed` on a populated dev DB changes no Unit/Word/progress rows
(verify counts before/after); with the flag it performs the full replace; warning prints.

### F5. Quiz/Listen/Battle question banks test words that no longer exist

**Problem.** `QUIZ_QUESTIONS` (~60), `LISTEN_QUESTIONS` (30), `BATTLE_QUESTIONS` (~60) in
`server/src/seed.ts` were written for the pre-2026-07-16 vocabulary ("Head", "Monday", "Gilam"…)
that was deleted from the Word table. Students are now quizzed/battled on words the Learn module
never teaches.

**Fix.** Regenerate all three banks from the current 18-unit `UNITS` array in the same file.
Formats to keep (they match the UI and grading exactly):
- Quiz/Battle: `'"<en>" sóziniń awdarması qaysı?'` with 4 Karakalpak options (distractors = other
  words' `uz` from the same unit first, then anywhere), plus some reversed
  `'"<uz>" inglizshede qalay aytıladı?'` with English options. `correctIndex` 0-based; vary its
  position.
- Listen: an English sentence containing the target word (reuse/adapt the word's `example`), 4
  similar-sounding/same-unit English options.
Target sizes: ~60 quiz, ~60 battle, ~30 listen, covering words across all 18 units (bias toward
units 1–9 = Grade 5, since those unlock first). Generation can be scripted or hand-written by an
agent, but every question's correct answer MUST be verifiable against the UNITS data — write a
small assertion script that checks each quiz/battle question's correct option equals the actual
`uz`/`en` of some current word, and run it.

**Accept when:** assertion script passes; `npm run seed` (with content flag per F4 if merged
after it) loads the new banks; a quiz round in the browser shows only current-vocab words.

---

## Part 2 — CHANGES (improvements to existing behavior)

### C1. Server-side answer grading for the Learn module (anti-cheat)

**Problem.** `POST /api/learn/answer` (`server/src/routes/learn.ts`) trusts a client-sent
`correct: boolean`, and MCQ payloads even ship `correctIndex` to the client before answering.
Anyone with devtools can farm XP/leaderboard rank. Leaderboards make this matter.

**Change.** Grade on the server:
- At session start, `enrichItems` already computes `options`/`correctIndex` per item — persist
  them into the `LearnSession.items` JSON (extend the stored item shape; the client response can
  keep sending options but MUST stop including `correctIndex` for un-answered items).
- `/answer` accepts `{ sessionId, wordId, exercise, answerIndex?, answerText?, responseMs }`.
  Server grades: MCQ-family (`mcq_en2kaa`, `mcq_kaa2en`, `listen_pick`, `fill_blank`) by
  `answerIndex === storedCorrectIndex`; typing family (`type_en`, `dictation`, `letter_tiles`) by
  case-insensitive compare of `answerText` against `word.en` (letter_tiles submits the assembled
  word); `intro` is always correct; `speak` cannot be verified server-side — accept the client's
  boolean for speak only (mic scoring is client-side by nature, `web/src/lib/useMicScoring.ts`).
- Response gains `correct: boolean` (+ `correctIndex`/`correctAnswer` for reveal). Client
  (`web/src/store/useAppStore.ts` `answerCurrent`, exercise components in
  `web/src/screens/learn/`) must show feedback from the server response for graded types. The
  exercise components currently self-grade for instant UI feedback — restructure so they submit
  first, then render feedback from the response (latency is fine, answers are a single row trip).
- Keep the idempotency behavior (replayed answer returns current progress, no FSRS re-run).

Out of scope (note in code, don't do): Oyinlar/quiz/battle XP flows have the same trust issue.

**Accept when:** posting `answerIndex` of a wrong option returns `correct:false` regardless of
any client-claimed field; session-start response contains no `correctIndex`; full lesson + review
click-through works in browser; resume (`/session-active`) still works mid-session.

### C2. Typo tolerance for typed answers

**Problem.** `type_en`/`dictation` (`TypingExerciseBody` in `web/src/screens/learn/shared.tsx`,
~line 143) require an exact case-insensitive match. One-letter slips fully fail 10–12-year-olds.

**Change.** Levenshtein distance ≤1 for target length ≥5, ≤2 for length ≥10 counts as correct but
shows a distinct "almost — check the spelling" amber feedback line displaying the exact spelling
(new i18n key in `kaa.ts`, e.g. `learn.almostCorrect`). Exact match keeps the green feedback.
Reuse `levenshteinDistance` from `web/src/lib/pronunciation.ts` (export it). **If C1 has landed,
this tolerance must be implemented in the server's grading of `answerText` instead** (share a
small util in `server/src/lib/`), with the client only rendering the distinction.

**Accept when:** typing "recieve"-style single-transposition/substitution for a ≥5-letter word is
accepted with amber feedback; 2 errors on a short word still fails; FSRS still records correct.

### C3. XP balance: intro block shouldn't earn the full lesson bonus

**Problem.** `session-complete` (`server/src/routes/learn.ts`, ~line 403) adds `xpGain += 20` for
any non-practice lesson session with items. Intro items award 0 XP each, so tapping "Túsindim" 5
times = +20 XP and ~3 goal-minutes for zero retrieval effort — the cheapest XP in the app.

**Change.** Award the +20 completion bonus only when `session.block === 'write'` (the final block
of a lesson row — finishing it means the whole lesson is done). Other blocks earn only their
per-item XP (intro block: 0 XP, that's fine — it's a reading step). Reduce intro-block goal
minutes to 1 (`minutes` calc, same handler). Review-session +10 stays unchanged.

**Accept when:** completing intro block → xpGained 0; completing write block → per-item XP + 20;
practice replays still halve; curl-verify each.

### C4. Move battle WebSocket auth out of the URL

**Problem.** `server/src/ws/battle.ts` (~line 386) authenticates via `?token=<JWT>` query param —
tokens land in nginx access logs and anywhere URLs are logged.

**Change.** First-message auth: client connects bare, must send `{ type: 'auth', token }` within
5s or the socket closes; server verifies with the existing `verifyToken`, then proceeds exactly as
today (the verified `userId` flows into the current `connection` handling). Update
`web/src/lib/battleSocket.ts` to send the auth frame on open and treat the old `queue:waiting`
etc. flow as starting only after an `auth:ok` server frame. Keep backward compatibility for one
deploy (accept query token if present) is NOT needed — client and server ship together.

**Accept when:** battle matchmaking + a full bot match work in browser; connecting without/with a
bad token closes the socket; no token appears in the request line of nginx/server logs.

### C5. Extract seed content into JSON data files

**Problem.** `server/src/seed.ts` is ~780 lines, mostly content arrays (`UNITS`, three question
banks, regions/schools). Content edits are code diffs; non-code contributors can't touch them;
the admin API (`server/src/routes/admin.ts`) can only add one word at a time.

**Change.** Move `UNITS`, `QUIZ_QUESTIONS`, `LISTEN_QUESTIONS`, `BATTLE_QUESTIONS` to
`server/content/units.json`, `quiz.json`, `listen.json`, `battle.json` (regions can stay in code —
they're stable). `seed.ts` imports them (TS `resolveJsonModule` or `fs.readFileSync` +
`JSON.parse`; ensure `npm run build`/`tsx` and the rsync-based prod deploy include the new
`content/` dir — update the deploy notes in this file's header if paths change). Add
`POST /api/admin/units/:id/words/bulk` accepting a JSON array of word objects (same shape),
validating required fields, appending with sequential `order`.

**Accept when:** `npm run seed` produces byte-identical DB content to before the refactor
(compare unit/word/question counts and a few spot rows); bulk endpoint inserts 10 words in one
call; `npm run build` still passes and dist runtime can locate the JSON.

---

## Part 3 — NEW FEATURES

### N1. Teacher dashboard (class monitoring) — biggest, do after the others

**Goal.** Teachers see their students' progress. Schools are already first-class data
(`Region`/`District`/`School` on every user).

**MVP scope.**
- Schema: `role` enum (`student`|`teacher`, default student) on `User`; `Class` model
  (id, name, teacherId, schoolId, joinCode 6-char unique, createdAt); `ClassMember`
  (classId, userId, unique pair). Teachers are promoted manually via a new admin endpoint
  (`PATCH /api/admin/users/:id/role`) — no self-serve teacher signup in MVP.
- Student side: an "enter class code" field in Settings (`web/src/screens/SettingsScreen.tsx`)
  → `POST /api/classes/join { code }`.
- Teacher side: new route `/app/teacher` (guard: role=teacher; hide nav item otherwise —
  `web/src/lib/navItems.ts`). Views: my classes (create with name → code shown), class roster
  table (fullName, wordsKnownCount, xp, streak, lastActiveDate, blocks completed this week), and
  a "hard words" aggregate (top 10 words by summed `lapses` across the class from
  `UserWordProgress`). Read-only; no messaging.
- Endpoints under `server/src/routes/teacher.ts`: list classes, create class, roster,
  hard-words. All queries scoped to `teacherId = req.userId`.

**Accept when:** promoted teacher creates a class, two students join by code, roster shows their
live stats, a student cannot access `/api/teacher/*` (403), `tsc` + build clean.

### N2. Daily quests

**Goal.** Three concrete daily goals with XP rewards to sharpen the daily loop (streak exists but
has no "what should I do today" shape).

**Scope.**
- Fixed quest set per day (no randomization needed for MVP): ① complete 3 learn blocks,
  ② learn 2 new words (`newlyKnown` in answers), ③ answer 20 exercises correctly. Rewards
  +10/+10/+15 XP.
- Schema: `DailyQuestProgress` (userId, dateKey `YYYY-MM-DD` in UZ time — reuse the `uzDay` shift
  from `server/src/lib/progress.ts`, counters for the three metrics, claimedFlags or auto-award).
  Auto-award on threshold cross inside the existing chokepoints (`/answer` and
  `/session-complete` already touch the DB per event; increment counters there).
- API: `GET /api/quests/today` → three quests with current/target/done/xp. Awarded XP goes
  through `awardProgress` (mind F3's transaction).
- UI: quest card on Dashboard (`web/src/screens/DashboardScreen.tsx`) with three progress rows;
  i18n keys in `kaa.ts`; a small confetti/pop (existing `Confetti` component) when one completes.

**Accept when:** counters advance during a real session; XP lands exactly once per quest per day;
counters reset at UZ midnight (test by faking dateKey); UI reflects live progress after each
session (Dashboard already refetches user).

### N3. "Hard words" practice mode

**Goal.** Target the words a student keeps failing. FSRS already records `lapses` per word in
`UserWordProgress` — currently unused.

**Scope.**
- Server: extend `POST /api/learn/session-start` with `type: 'hard'` — select up to 10 words for
  the user with `lapses >= 2`, ordered by `lapses` desc then `due` asc; build the queue with
  `exerciseForLevel` (same as review); XP/summary rules identical to review (+10 bonus,
  practice-halving not applicable). 404-equivalent `NO_HARD_WORDS` error (mirror
  `NO_REVIEWS_DUE`) when fewer than 3 candidates.
- Also return `hardCount` in `GET /api/learn/path` (cheap count query).
- Client: entry card on the Learn screen below the review card (`web/src/screens/LearnScreen.tsx`),
  visible when `hardCount >= 3`, styled like the review card but red/danger accent; store/api
  plumbing mirrors `startReviewSession` (`web/src/lib/learnApi.ts`, `useAppStore.startLearnSession`
  arg union, `LearnSessionScreen` needs no change — summary type can reuse 'review' handling or
  add a 'hard' label key in `kaa.ts`).

**Accept when:** a user with ≥3 lapsed words sees the card and completes a hard session
end-to-end; user without lapses sees no card; answering correctly eventually removes words from
the pool (lapses only grow — pool shrinks via the `lapses >= 2` threshold never un-crossing, so
instead select `lapses >= 2 AND level <= 4` so mastered words drop out; verify that).

### N4. Private battle rooms (play a friend)

**Goal.** Kids want to battle classmates, not random opponents/bots. WS infra exists
(`server/src/ws/battle.ts`, `web/src/lib/battleSocket.ts`, `web/src/screens/BattleScreen.tsx`).

**Scope.**
- Protocol: new client frames `room:create` → server replies `room:created { code }` (4-char
  A-Z2-9, unique among open rooms, in-memory Map, 10-min TTL); `room:join { code }` → if open,
  start a normal match between the two (reuse existing `match:found` flow; no bot fallback, no
  matchmaking queue involvement). Errors: `room:not_found`, `room:full`.
- Award half XP for private matches (friend-farming guard) — pass an `isPrivate` flag through the
  existing match-end XP path.
- UI: BattleScreen gets two buttons alongside the current "find opponent": "Dos penen oynaw" →
  create (shows big code to read aloud) / join (4-char input). i18n keys in `kaa.ts`.

**Accept when:** two browser sessions (normal + incognito, two accounts) complete a private match
via code; codes expire; random matchmaking unaffected; private XP is halved (check `xpAwarded`).

### N5. PWA + offline resilience — phased, largest infra task

**Goal.** Rural Karakalpakstan connectivity is unreliable; the app currently dies without network.

**Phase 1 (this task):**
- `vite-plugin-pwa` in `web/`: manifest (name Bilimdon, icons from existing favicon/logo assets,
  theme color `#22C55E`), precache the built app shell, `registerType: 'autoUpdate'`.
- Runtime caching: stale-while-revalidate for `GET /api/learn/path`, `/api/me`-style reads so the
  app opens and shows the last-known path offline.
- Offline answer queue: in `web/src/store/useAppStore.ts` `answerCurrent`, on network failure push
  the answer `{sessionId, wordId, exercise, …}` into an IndexedDB/localStorage queue and continue
  the session optimistically from the already-downloaded queue (a learn session's items are all
  delivered at session-start, so play-through needs no further reads); flush the queue on
  `online` event / next app start. The server's `/answer` idempotency (already implemented) makes
  replays safe. If C1 (server grading) has landed, offline grading falls back to client-side for
  queued items and reconciles on flush — acceptable, note it.
- An offline banner component (i18n key) when `navigator.onLine` is false.

Out of scope for phase 1: offline TTS/audio guarantees (speechSynthesis voice availability varies
by device), offline battle/games, background sync API.

**Accept when:** Lighthouse recognizes an installable PWA; with devtools offline: app opens,
learn path renders from cache, an in-progress session continues and answers queue; going online
flushes the queue (verify rows in `LearnSession.answered` server-side); `npm run build` clean.

---

## Working agreements (apply to every task)

1. Verify with `npx tsc --noEmit` in BOTH `server/` and `web/`, plus `npm run build`, before
   declaring done. There are no automated tests.
2. Any schema change: `npx prisma migrate dev --name <slug>` locally; prod migration is a
   separate, explicitly-confirmed step (backup first — see header).
3. All user-facing strings in Karakalpak via `web/src/i18n/kaa.ts` keys.
4. Don't deploy to bilimdan.uz without the owner explicitly asking; when deploying, follow the
   header notes (rsync src → remote `npm ci && npm run build && npx prisma migrate deploy`,
   `systemctl restart bilimdon`, rsync `web/dist/` → `/var/www/bilimdan.uz/`, then smoke-test
   and check the nginx vhost hasn't been clobbered).
5. Commit per task with a focused message; don't bundle unrelated tasks in one commit.
