# TASK: Rebuild the "Sóz úyreniw" (Word Learning) Module from Scratch

> **Status (2026-07-15): Stages 0-6 implemented and committed to the working tree (uncommitted — no
> git commit made yet, by design; see below).** Stage 7's *automated* checks (server regression via
> curl/psql: FSRS scheduling, level ladder, XP economics incl. practice-mode halving, sequential
> unit/lesson locking, idempotency, backfill) all pass — see the session transcript for the exact
> commands. Stage 7's *interactive browser* checks (signup→lesson→session UI, mic permission flows,
> mid-session refresh, mobile viewport, visual click-through) were **not run** — no Chrome extension
> was available in that session — and **deployment to bilimdan.uz was deliberately not performed**.
> Before shipping: (1) do a manual click-through of the QA script in Part 3/Stage 7 in a real browser,
> (2) `git add`/commit the changes, (3) then follow the Stage 7 deploy steps (`pg_dump` first).
>
> Original brief below is unchanged and still the authoritative spec for what was built.

**Product:** Bilimdon — English vocabulary platform for 5th–6th grade students in Karakalpakstan (UI language: Karakalpak/kaa, Latin script).
**Stack:** React 19 + Vite + Tailwind + Zustand + react-i18next (in `web/`), Express + Prisma + PostgreSQL (in `server/`).
**Content:** ~26 units, ~258 words. `Word` fields: `en`, `ipa`, `uz` (⚠️ despite the name, contains **Karakalpak** translations), `example` (English sentence), `emoji`, `order`.

---

## Part 1 — Research Summary & Design Decisions

### 1.1 What the best apps do (comparative analysis)

| App | Core method | What we take | What we reject |
|---|---|---|---|
| **Duolingo** | Short mixed-exercise sessions, path/map navigation, hearts/XP/streak, Birdbrain difficulty targeting, spaced review woven into lessons | Session structure (10–15 items, immediate feedback, missed items re-queued until correct), path UI, gamification layer (already partly built: XP, streak, badges, leagues) | Ads/monetization pressure mechanics; hard heart-block that stops learning (bad for a school tool) |
| **Anki / FSRS** | Pure spaced repetition; FSRS algorithm needs 20–30% fewer reviews than SM-2 for equal retention ([benchmark on 500M+ reviews](https://deckstudy.com/blog/fsrs-vs-sm2-modern-spaced-repetition)) | FSRS as the scheduling engine, via the maintained [`ts-fsrs`](https://www.npmjs.com/package/ts-fsrs) npm package (default parameters — no per-user optimization needed) | Raw flashcard UI (too dry for 10–12-year-olds); 4-button self-grading (kids can't self-assess — we derive ratings from answer correctness) |
| **Memrise** | Multimedia encoding (image+audio+text), "planting/growing" word-mastery metaphor | Emoji+audio+example presentation of new words; visible per-word mastery levels (0–5) | Native-speaker videos (no content pipeline for that) |
| **Drops** | 5-minute sessions, purely visual vocab | Short session length; heavy use of visuals (emoji) | No typing/production (research says production matters — see below) |
| **Quizlet** | Flashcards + test modes | Exercise variety per word | Unstructured self-directed use (kids need a guided path) |
| **Babbel** | Words in sentence context, speech recognition practice | Fill-blank in example sentences; mic-based speaking (already have `useMicScoring`) | Grammar-first lessons (out of scope — this is a vocab product) |

### 1.2 Learning-science principles the design is built on

1. **Retrieval practice (testing effect).** Actively recalling a word beats re-reading it. Confirmed specifically for primary-school children: [Goossens et al. 2014](https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.2956), [Frontiers in Psychology 2016](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.00350/full). → Every exercise after the intro card is a retrieval act.
2. **Spacing effect.** Reviews spread over days beat cramming — the core of [Duolingo's approach](https://blog.duolingo.com/how-we-learn-how-you-learn/) and FSRS. → FSRS schedules each word individually; a daily review queue surfaces due words.
3. **Receptive → productive progression.** [Productive retrieval (typing/saying the word) produces stronger learning than receptive (multiple choice)](https://www.researchgate.net/publication/303939278_The_Effects_of_Receptive_and_Productive_Word_Retrieval_Practice_on_Second_Language_Vocabulary_Learning), but is harder — so each word climbs a ladder: recognize → assemble → type → speak.
4. **Multiple in-session retrievals.** A new word is retrieved 2–3 times within its first session (expanding gaps), not shown once.
5. **Interleaving.** New words and due reviews are mixed in one queue rather than blocked.
6. **Gamification with care.** Streaks/XP/badges boost engagement ([~30% higher course completion with badges](https://studypulse.education/blog/gamification-in-education-what-research-says/)) but hard punishments (heart-block) increase anxiety and dropout in kids — so hearts are *visual pressure only*, never a lockout.

### 1.3 Locked-in product decisions (already confirmed with the owner)

- ✅ **Full FSRS-based SRS** with a daily review queue.
- ✅ **Single path/map screen** (Duolingo-style). The separate "Temalar" (Lessons) page is **removed**.
- ✅ **Mic speaking exercises are mandatory — no skip button.** (Owner's explicit requirement: "aytıp úyreniwi shart".) Engineering fallback only: if `SpeechRecognition` API is unavailable in the browser, the speak exercise is silently replaced by a dictation exercise; after 3 consecutive mic *hardware/permission errors* (not low scores), show a "Dawam etiw" button so a broken mic can't brick the path. A low score is never a reason to unlock skipping — the student retries.

---

## Part 2 — System Design

### 2.1 Word mastery ladder (drives exercise selection)

Each word has a per-user `level` 0–5. Level goes up by 1 on a **first-attempt correct** answer in a session, down by 1 (min 1) on a wrong answer (once the word has been introduced).

| Level | Meaning | Exercise used when this word appears |
|---|---|---|
| 0 | never seen | `intro` — presentation card (no grading) |
| 1 | introduced | `mcq_en2kaa` — see English word, pick Karakalpak translation (4 options) |
| 2 | recognizes | `mcq_kaa2en` or `listen_pick` (50/50 random) |
| 3 | recalls receptively → **counts as "known"** (`wordsKnownCount`, old `known` flag) | `letter_tiles` — assemble the English word from letter tiles |
| 4 | assembles | `type_en` or `dictation` (50/50 random) |
| 5 | produces (mastered) | `speak` first time it reaches 5, then random from {`fill_blank`, `type_en`, `speak`, `mcq_kaa2en`} on later reviews |

### 2.2 FSRS integration

- Use the **`ts-fsrs`** npm package (server-side only), default FSRS parameters, `request_retention: 0.9`, `maximum_interval: 180` (days — a school year is the horizon), `enable_fuzz: true`.
- Rating mapping (kids can't self-grade): first attempt in a session → **wrong = `Again`**, **correct = `Good`**. Re-queued (repeat) attempts within the same session do NOT generate FSRS reviews.
- The `intro` exercise generates the initial FSRS card state (equivalent to first `Good` review) and sets `level = 1`.
- All scheduling happens **on the server** in `POST /api/learn/answer` — the client never computes SRS state (anti-cheat, consistency).

### 2.3 Database schema changes (Prisma)

Extend `UserWordProgress` (keep the `known`/`knownAt` fields — they feed `wordsKnownCount` and badges):

```prisma
model UserWordProgress {
  id      Int       @id @default(autoincrement())
  userId  Int
  wordId  Int
  known   Boolean   @default(false)
  knownAt DateTime?

  // --- NEW: SRS state (FSRS) + mastery ladder ---
  level      Int       @default(0)          // 0–5 ladder from §2.1
  state      Int       @default(0)          // ts-fsrs State enum: 0=New 1=Learning 2=Review 3=Relearning
  due        DateTime  @default(now())
  stability  Float     @default(0)
  difficulty Float     @default(0)
  reps       Int       @default(0)
  lapses     Int       @default(0)
  lastReview DateTime?

  user User @relation(fields: [userId], references: [id])
  word Word @relation(fields: [wordId], references: [id])

  @@unique([userId, wordId])
  @@index([userId, due])                     // review-queue query
}

model LearnSession {
  id          Int       @id @default(autoincrement())
  userId      Int
  type        String                         // 'lesson' | 'review'
  unitId      Int?                           // set for lessons, null for reviews
  lessonIndex Int?                           // 0-based lesson number within the unit
  items       Json                           // ordered queue: [{ wordId, exercise }]
  answered    Json      @default("[]")       // [{ wordId, exercise, correct, responseMs }]
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  xpAwarded   Int       @default(0)

  user User @relation(fields: [userId], references: [id])

  @@index([userId, completedAt])
}
```

Add `learnSessions LearnSession[]` to `User`.

**Backfill migration** (raw SQL inside the same migration, after the ALTERs): existing rows with `known = true` become `level = 3, state = 2 (Review), stability = 14, difficulty = 5, reps = 1, due = now(), lastReview = now()` — so previously-learned words flow straight into the review queue instead of being re-taught.

### 2.4 Lesson structure (deterministic, no extra tables)

- A unit's words, ordered by `Word.order`, are chunked into lessons of **5 words** (`ceil(wordsCount / 5)` lessons; last chunk may be 1–5).
- Lesson *i* covers words `[5i, 5i+5)`. A lesson is **complete** when all its words have `level >= 1`.
- A unit is complete when all its lessons are complete. Units unlock sequentially: unit N is locked until unit N−1 is complete (first unit always unlocked). Completed units stay replayable (their lessons become practice: same flow, half XP).

### 2.5 Session queue composition (built server-side)

**Lesson session** (`type: 'lesson'`, given `unitId` + `lessonIndex`):
- The lesson's ≤5 words. For each **new** word (level 0): `intro` + two retrievals (`mcq_en2kaa`, then `letter_tiles`) spaced apart in the queue. For each already-started word: one exercise per its level.
- Plus up to **5 due review words** (due <= now, from ANY unit), interleaved.
- Interleave pattern (example for 5 new words A–E): `intro A, intro B, mcq A, intro C, mcq B, tiles A, rev₁, mcq C, intro D, tiles B, rev₂, mcq D, intro E, tiles C, rev₃, mcq E, tiles D, rev₄, tiles E, rev₅` — never the same word twice in a row; a word's retrievals come ≥2 positions after its intro.
- Typical queue: 15–20 items ≈ 5–8 minutes.

**Review session** (`type: 'review'`): up to **15 due words** (ordered by `due` asc), exercise chosen by each word's level (§2.1). Available whenever ≥1 word is due.

**Client-side re-queue rule:** a wrongly-answered item is re-inserted 2–3 positions later and repeats until answered correctly (only the first attempt is POSTed as the graded answer; repeats are ungraded practice → `POST /api/learn/answer` is called once per queue item).

### 2.6 XP & progress economics

| Event | XP |
|---|---|
| Correct first-attempt answer — receptive (`mcq_*`, `listen_pick`, `fill_blank`) | +2 |
| Correct first-attempt answer — productive (`letter_tiles`, `type_en`, `dictation`, `speak`) | +3 |
| Lesson completed (all items done) | +20 bonus |
| Review session completed | +10 bonus |
| Replaying a completed lesson (practice mode) | half XP, no bonus |

- XP is computed **server-side** in `session-complete` from the `answered` log (clamp: max = items × 3 + bonus — tampering can't farm XP).
- `awardProgress()` (existing `server/src/lib/progress.ts`) is the only writer: `minutes = ceil(itemsTotal / 2)` capped at 20; it handles streak rollover + badges.
- `known`/`wordsKnownCount`: when a word first crosses `level >= 3`, set `known = true, knownAt = now()` and increment `wordsKnownCount` by the number of newly-known words (pass via `extra` to `awardProgress`, same as the old code did).
- Hearts: session starts with 3; wrong answer −1; at 0 hearts **nothing is blocked** — hearts refill to 1 and a gentle "Itibarlıraq bolıń! 💪" toast shows. Combo: consecutive correct answers; at 5+ show flame and play `sound.ts` combo sound. Both purely client-side/visual (reuse `web/src/components/HeartsBar.tsx` — props: `hearts, maxHearts, combo`).

### 2.7 API contract (all under `/api/learn`, all `requireAuth`)

Register in `server/src/index.ts` as `app.use('/api/learn', learnRouter)` (import was removed — re-add).

```
GET  /api/learn/path
→ {
    dueCount: number,                     // words due for review right now
    units: [{
      id, title, emoji, order,
      wordsCount,
      lessons: [{ index, wordsCount, complete }],
      complete: boolean,
      locked: boolean
    }]
  }

POST /api/learn/session-start            rateLimit(15/min)
body: { type: 'lesson', unitId, lessonIndex } | { type: 'review' }
→ {
    sessionId,
    type,
    unit: { id, title, emoji } | null,
    items: [{
      wordId, exercise,                   // exercise: 'intro'|'mcq_en2kaa'|'mcq_kaa2en'|'listen_pick'|'letter_tiles'|'type_en'|'dictation'|'speak'|'fill_blank'
      word: { id, en, ipa, kaa, example, emoji },   // kaa = Word.uz column
      options?: string[] , correctIndex?: number    // present for mcq_*/listen_pick/fill_blank, built server-side with distractors from the same unit (fallback: global random words)
    }]
  }
Errors: 400 if lesson locked / bad index; review with 0 due words → 400 NO_REVIEWS_DUE.
If an uncompleted session already exists for the user, session-start abandons it (completedAt = now, xpAwarded = 0) and starts fresh — simple and predictable for kids.

POST /api/learn/answer                   rateLimit(60/min)
body: { sessionId, wordId, exercise, correct: boolean, responseMs: number }
→ { level, due }                          // updated word state
Server: validates the item belongs to the session and wasn't already answered; appends to session.answered; runs FSRS (intro counts as Good); updates level per §2.1; flips known at level 3.

POST /api/learn/session-complete         rateLimit(15/min)
body: { sessionId }
→ { user: ApiUser, xpGained, correctCount, itemsTotal, newWordsLearned }
Server: computes XP per §2.6 from session.answered, calls awardProgress, sets completedAt.
Idempotent: calling twice returns the stored result without double-award.

GET  /api/learn/session-active
→ { session: null } | { sessionId, type, unit, items, answeredWordIds: number[] }
Used on mount to resume after a page refresh (replaces the old sessionStorage persistence — server is the source of truth now).
```

### 2.8 Frontend architecture

```
web/src/screens/LearnScreen.tsx              ← REPLACE the stub: the path/map screen
web/src/screens/LearnSessionScreen.tsx       ← NEW: runs a session (route /app/learn/session)
web/src/screens/learn/                       ← NEW folder: one component per exercise
  IntroCard.tsx        McqExercise.tsx        ListenPickExercise.tsx
  LetterTilesExercise.tsx  TypeExercise.tsx   DictationExercise.tsx
  SpeakExercise.tsx    FillBlankExercise.tsx  SessionSummary.tsx
web/src/lib/learnApi.ts                      ← NEW: typed fetch wrappers for §2.7
web/src/store/useAppStore.ts                 ← extend with the learn-session slice (below)
```

**Store slice** (add to `useAppStore` — follow the existing zustand style, see the battle/quiz slices):

```ts
// state
learnPath: LearnPathResponse | null;
learnSession: ActiveSession | null;    // { sessionId, type, unit, queue: QueueItem[], cursor, hearts, combo, correctCount, firstAttemptWrongIds: Set<number>, xp summary fields }
// actions
loadLearnPath(): Promise<void>;
startLearnSession(args): Promise<void>;        // POST session-start, seed local queue
resumeLearnSession(): Promise<boolean>;        // GET session-active on mount
answerCurrent(correct: boolean, responseMs: number): Promise<void>;  // POST answer (first attempt only), advance/requeue
completeLearnSession(): Promise<SummaryData>;  // POST session-complete, refresh user fields
abandonLearnSession(): void;                   // local clear (server auto-abandons on next start)
```

**Exercise component contract** (uniform, mirrors the pattern in `web/src/screens/games/*` — see `MemoryFlipPhase.tsx` props):

```ts
interface ExerciseProps {
  item: QueueItem;                  // word + options
  onAnswer: (correct: boolean, responseMs: number) => void;  // called exactly once
  isRepeat: boolean;                // true when re-queued after a miss (show "Qaytalaw" chip)
}
```

The session screen owns: progress bar, HeartsBar, feedback banner (green "Durıs! ✓" / red "Durıs juwabı: …" with the correct answer, 1.2 s or tap-to-continue), sounds (`web/src/lib/sound.ts`), Confetti on summary, and the re-queue logic.

### 2.9 Exercise specifications

All exercises show the word's `emoji` prominently. TTS via `speak(text)` from `web/src/lib/speech.ts` (respects the `head` setting). Every exercise auto-plays the English word's audio where indicated 🔊.

1. **`intro`** — big emoji, `en` 🔊 (auto-play), IPA, `kaa` translation, example sentence with the word highlighted + 🔊 button for the sentence. One button: "Túsindim →". Not graded (`onAnswer(true, ms)` on continue).
2. **`mcq_en2kaa`** — prompt: `en` 🔊 + emoji; 4 Karakalpak options (server-provided). Tap → instant color feedback.
3. **`mcq_kaa2en`** — prompt: `kaa` + emoji; 4 English options; correct option is read aloud on reveal.
4. **`listen_pick`** — 🔊 auto-play (replay button, NO text shown); 4 English word options.
5. **`letter_tiles`** — prompt: `kaa` + emoji; the letters of `en` (plus 2–3 distractor letters for words ≤4 chars) as shuffled tiles; tap to build, backspace to undo. Correct when assembled string matches (case-insensitive).
6. **`type_en`** — prompt: `kaa` + emoji; free-text input; correct = case-insensitive exact match of `en` (trim). No typo tolerance (owner decision from git history: `f4eac4f`).
7. **`dictation`** — 🔊 auto-play (replay button, no text); type what you hear; same matching as `type_en`.
8. **`speak`** — shows `en` + IPA + emoji, "Úlgini tıńlaw" button; mic button → `useMicScoring` (`web/src/lib/useMicScoring.ts`, already exists and works — reuse as-is, error messages are already in Karakalpak). Pass = score ≥ 60 (`scorePronunciation` in `web/src/lib/pronunciation.ts`). **No skip.** Retry unlimited on low score. Fallbacks per §1.3 only.
9. **`fill_blank`** — the word's `example` sentence with the target word blanked (`_ _ _`); 4 English options (server-provided). Sentence read aloud on reveal.

### 2.10 Path screen (LearnScreen) spec

- Vertical, gently zig-zagging column of nodes (CSS offsets alternating left/right, single column on mobile), grouped by unit: a unit header chip (emoji + title), then its lesson nodes (circles, ~64px), then the next unit.
- Node states: **done** (green, ✓), **active** (colored, pulsing ring — the first incomplete lesson of the first unlocked-incomplete unit), **locked** (gray, 🔒). Tapping active/done → starts that lesson (`navigate('/app/learn/session')` after `startLearnSession`). Tapping locked → shake animation + toast "Aldıńǵı sabaqtı tamamlań".
- **Review node**: sticky card at the top when `dueCount > 0`: "🔁 Qaytalaw — {{count}} sóz kútip tur" with a start button (starts a `review` session). This is the SRS surface — make it prominent (amber).
- Auto-scroll to the active node on mount.
- Data: `loadLearnPath()` on mount; `ContentLoader` while null.

### 2.11 i18n

All new UI strings go into `web/src/i18n/kaa.ts`. **Delete** the now-orphaned groups: `learn`, `familiarize`, `write`, `speak`, `test`, `summary` (the games in `web/src/screens/games/` do NOT use them — verified). **Keep** `lessons.*` keys until Stage 6 removes LessonsScreen, then delete that group too. New namespace (write exactly these, extend as needed):

```ts
learn: {
  title: 'Sóz úyreniw',
  reviewTitle: '🔁 Qaytalaw',
  reviewDue: '{{count}} sóz qaytalawdı kútip tur',
  reviewStart: 'Baslaw',
  reviewEmpty: 'Búgin qaytalaw joq — bárin úlgerdińiz! 🎉',
  lessonLabel: '{{n}}-sabaq',
  lockedToast: 'Aldın aldıńǵı sabaqtı tamamlań',
  unitComplete: 'Tamamlandı',
  continue: 'Dawam etiw →',
  gotIt: 'Túsindim →',
  check: 'Tekseriw',
  correct: 'Durıs! ✓',
  incorrectAnswer: 'Durıs juwabı: {{answer}}',
  repeatChip: '↻ Qaytalaw',
  heartsEmpty: 'Itibarlıraq bolıń! 💪',
  exitConfirm: 'Shıǵasızba? Bul sessiyadaǵı jetiskenlik saqlanbaydı.',
  // exercise prompts
  promptMcqEn2Kaa: 'Bul sózdiń awdarması qaysı?',
  promptMcqKaa2En: 'Inglizshesi qaysı?',
  promptListenPick: 'Esitkenińizdi tańlań',
  promptTiles: 'Sózdi háriplerden jıynań',
  promptType: 'Inglizshe jazıń',
  promptDictation: 'Esitip, jazıń',
  promptSpeak: 'Sózdi dawıslap aytıń',
  promptFillBlank: 'Bos orınǵa qaysı sóz keledi?',
  typePlaceholder: 'Inglizshe sózdi jazıń…',
  listenSample: 'Úlgini tıńlaw',
  micStart: 'Mikrofondı qosıw',
  micStop: 'Toqtatıw',
  micListening: 'Tıńlap atırman…',
  speakGreat: 'Ájayıp! 🎉',
  speakTryAgain: 'Qaytadan urınıp kóriń 💪',
  youSaid: 'Siz ayttıńız: "{{transcript}}"',
  // summary
  summaryTitle: 'Sabaq tamamlandı! 🎉',
  summaryReviewTitle: 'Qaytalaw tamamlandı! 🎉',
  summaryCorrect: 'Durıs juwaplar',
  summaryNewWords: 'Jańa sózler',
  summaryXp: 'Jıynalǵan XP',
  summaryContinue: 'Dawam etiw →',
  summaryBackToPath: 'Jolǵa qaytıw',
},
```

---

## Part 3 — Implementation Stages

### Stage 0 — Foundations (server deps + schema)

1. `cd server && npm install ts-fsrs`
2. Edit `server/prisma/schema.prisma` per §2.3 (extend `UserWordProgress`, add `LearnSession`, add relation on `User`).
3. `npx prisma migrate dev --name learn_srs` — then append the backfill SQL (§2.3) to the generated migration file and re-run, or write it as a second migration `learn_srs_backfill`.
4. Verify: `npx prisma studio` or psql — known words show `level=3, state=2`.

**Accept when:** `npx tsc --noEmit` passes in `server/`; migration applies cleanly on a fresh DB (`npx prisma migrate reset` + seed) AND on a DB with existing progress.

### Stage 1 — Server: SRS engine + learn routes

1. **`server/src/lib/srs.ts`** (new): wraps `ts-fsrs`. Exports:
   - `reviewWord(progress, correct: boolean, now: Date)` → new `{state, due, stability, difficulty, reps, lapses, lastReview}` using `Rating.Again`/`Rating.Good`; params: `request_retention: 0.9, maximum_interval: 180, enable_fuzz: true`.
   - `nextLevel(current: number, correct: boolean)` → §2.1 rule.
   - `exerciseForLevel(level: number, rng)` → §2.1 table (the level-5 "first time → speak" rule needs a `speakDone` heuristic: use `lapses === 0 && reps` — simpler: pick `speak` when `level === 5 && state !== 2`, otherwise random pool).
2. **`server/src/lib/learnQueue.ts`** (new): pure functions `buildLessonQueue(words, progressMap, dueReviews)` and `buildReviewQueue(dueWords, progressMap)` implementing §2.5, plus `buildOptions(word, unitWords, allWords)` for MCQ distractors (3 distractors, prefer same unit, pad from global pool; shuffle; return `{options, correctIndex}`). Options for `fill_blank`/`mcq_kaa2en`/`listen_pick` are English (`en`), for `mcq_en2kaa` Karakalpak (`uz` column).
3. **`server/src/routes/learn.ts`** (new): the four endpoints + `session-active` per §2.7. Follow the existing route style (`server/src/routes/quiz.ts` is a good template): `requireAuth`, `rateLimit`, `next(err)`, errors via `badRequest`/`notFound` from `server/src/lib/errors.ts`.
4. Register in `server/src/index.ts`: `import { learnRouter } from './routes/learn';` + `app.use('/api/learn', learnRouter);`
5. Lesson/unit completion + locking logic per §2.4 lives in the `path` handler; write it as a pure helper in `learnQueue.ts` so it's testable.

**Accept when:** `npx tsc --noEmit` passes; manual curl script works end-to-end against a seeded DB:
```bash
TOKEN=$(curl -s localhost:PORT/api/auth/login -d '{"username":"demo","password":"..."}' -H 'content-type: application/json' | jq -r .token)
curl -s -H "Authorization: Bearer $TOKEN" localhost:PORT/api/learn/path | jq '.units[0]'
SID=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"type":"lesson","unitId":1,"lessonIndex":0}' localhost:PORT/api/learn/session-start | jq .sessionId)
# answer every item, then:
curl -s -X POST ... /api/learn/session-complete | jq  # → xpGained > 0, user.xp increased
curl -s ... /api/learn/path | jq '.units[0].lessons[0].complete'  # → true
```
Also verify: answering wrong → word's `due` is near-now and `level` dropped; `session-complete` called twice → same response, XP awarded once; locked lesson start → 400.

### Stage 2 — Client: API layer + store slice

1. **`web/src/types/api.ts`**: add `LearnPathResponse`, `LearnQueueItem`, `LearnSessionStartResponse`, `LearnSummaryResponse`, `ExerciseType` union — mirror §2.7 exactly.
2. **`web/src/lib/learnApi.ts`**: thin typed wrappers over the existing `api` helper (`web/src/lib/api.ts`).
3. **`web/src/store/useAppStore.ts`**: add the slice from §2.8. Key logic in `answerCurrent`:
   - first attempt for this queue item → `POST /answer`, track correctness, XP preview, hearts/combo;
   - wrong → clone item, insert at `min(cursor + 3, queue.length)`, mark `isRepeat`;
   - advance cursor; when cursor passes the end → status `'summary'`, call `completeLearnSession()`.
   - `logout()` must clear the new fields (see how battle/quiz fields are cleared there today).

**Accept when:** `npx tsc -b` passes in `web/`; store logic manually sanity-checked via a temporary debug page or the session screen from Stage 3.

### Stage 3 — Path screen (replace the stub `LearnScreen.tsx`)

Implement §2.10. Visual language: follow the existing design system — `font-display font-extrabold` headings, `rounded-[20px]` cards, `border-border`, palette used in `GamesHubScreen.tsx`/`DashboardScreen.tsx`, `animate-pop` entrance. Mobile-first (test at 360px).

**Accept when:** path renders all 26 units with correct done/active/locked states from real API data; review card appears when words are due (make a word due via psql `UPDATE "UserWordProgress" SET due = now() - interval '1 day'` to test); locked node toast works; active node auto-scrolls into view.

### Stage 4 — Exercise components

Build the 9 components per §2.9 in `web/src/screens/learn/`. Uniform `ExerciseProps` contract (§2.8). Reference implementations for interaction patterns exist in `web/src/screens/games/` (e.g. `DictationPhase.tsx` for dictation, `MissingLetterPhase.tsx` for tile-ish input) — **copy patterns, do not import those files** (they stay owned by Oyinlar and follow a different props contract).

Shared bits worth extracting into `web/src/screens/learn/shared.tsx`: option-button with correct/wrong/reveal states, prompt header (emoji + prompt text), audio-play button.

**Accept when:** each exercise can be exercised via a lesson session in the browser; keyboard works for typing exercises (Enter = check); TTS plays; `speak` uses the real mic flow (`useMicScoring`) and never shows a skip; wrong answers show the correct answer before advancing.

### Stage 5 — Session screen (`LearnSessionScreen.tsx`)

1. Route: add `<Route path="learn/session" element={<LearnSessionScreen />} />` in `web/src/App.tsx` (lazy, same pattern as others).
2. On mount: if no active session in store → try `resumeLearnSession()` → else `navigate('/app/learn')`.
3. Layout: top bar with ✕ (exit → confirm dialog `learn.exitConfirm` → abandon + navigate to path), progress bar (`answered/total`), `HeartsBar` (hearts + combo).
4. Render current item's exercise component; feedback banner between items; sounds on correct/wrong (`playCorrect`/`playWrong` — check exact exports in `web/src/lib/sound.ts`); hearts-empty toast per §2.6.
5. Summary phase (`SessionSummary.tsx`): Confetti, stats (correct/total, new words, XP gained with count-up), buttons per i18n. "Dawam etiw" → back to path with refreshed `loadLearnPath()`.
6. Refresh-resume: reload mid-session → lands back on the same session with answered items skipped (from `session-active.answeredWordIds`).

**Accept when:** full lesson start→finish flows in the browser update XP/streak in the topbar; refresh mid-session resumes; exit confirm works; review session flow works.

### Stage 6 — Integration & removal of the old navigation

1. **Delete** `web/src/screens/LessonsScreen.tsx`; remove its lazy import and `<Route path="lessons">` from `App.tsx`; add `<Route path="lessons" element={<Navigate to="/app/learn" replace />} />` (bookmarks survive).
2. `web/src/lib/navItems.ts`: remove the `/app/lessons` entry.
3. `web/src/components/Topbar.tsx` (`goToUnit`, ~line 50): searching a unit should now `navigate('/app/learn')` — drop the `loadUnitWords` call there; (optional nicety: pass `state: { scrollToUnit: id }` and honor it in LearnScreen).
4. `web/src/screens/DashboardScreen.tsx`: both "continue" buttons already point at `/app/learn` — keep; replace the `pickTargetUnit`-based subtitle with data from `loadLearnPath()` (active lesson's unit title + `dueCount` if > 0: "🔁 {{n}} sóz qaytalaw"). `pickTargetUnit` in the store becomes unused → delete it. **Keep** `units/loadUnits/loadUnitWords/ensureCurrentUnit/currentUnitWords` — Oyinlar (`GameSessionScreen`) and Topbar search depend on them.
5. `web/src/i18n/kaa.ts`: apply §2.11 (add `learn` group, delete orphaned groups incl. `lessons`).
6. Grep-verify nothing references removed things: `grep -rn "lessons\.\|pickTargetUnit\|familiarize\.\|write\.\|summary\." web/src --include="*.tsx" --include="*.ts"`

**Accept when:** `npx tsc -b` + `npm run build` pass in `web/`; no dead nav links; app-wide click-through (dashboard → learn → session → summary → leaders/profile) shows no regressions; Oyinlar still work.

### Stage 7 — QA pass + deploy

**Manual QA script (run all of it):**
1. Fresh signup → path shows unit 1 lesson 1 active, everything else locked.
2. Complete lesson 1 → node turns green, lesson 2 activates, XP/streak/topbar update, `wordsKnownCount` unchanged (words are level 1–2, not 3).
3. Play the same words up to level 3 across lessons → `wordsKnownCount` rises; profile stat matches.
4. Answer a word wrong twice → it re-queues in-session and its next-day due date shortens (check via psql).
5. Next day (or psql-forced due) → review card appears with count; review session works and empties the count.
6. Mic: deny permission → Karakalpak error, no skip appears; 3 hardware errors → "Dawam etiw" appears; low score → only retry.
7. Mid-session refresh resumes; logout mid-session → clean login state.
8. Old user with pre-migration progress → their known words appear as due reviews, not as new lessons.
9. Mobile 360px: path, every exercise, summary all usable.
10. `npm run build` (web) + `npx tsc --noEmit` (server) clean.

**Deploy (bilimdan.uz VPS — root@111.88.132.156, systemd + nginx + Docker postgres):**
```bash
# on the VPS, in the repo:
git pull
cd server && npm ci && npx prisma migrate deploy && npm run build && systemctl restart bilimdon-server
cd ../web && npm ci && npm run build   # nginx serves web/dist
```
⚠️ `prisma migrate deploy` runs the backfill against real student data — take a `pg_dump` first.

---

## Part 4 — Explicit non-goals (do NOT build these now)

- Per-user FSRS parameter optimization (defaults are fine at this scale).
- Offline/PWA support.
- New content authoring (admin CRUD at `server/src/routes/admin.ts` already covers units/words).
- Touching Oyinlar (`/app/battle/*`), Quiz, Listen, Leaders — they are stable and share only `units`/`currentUnitWords` from the store.
- Typo tolerance in typing exercises (explicitly removed before — commit `f4eac4f`).
- Renaming the `Word.uz` column (it holds Karakalpak text; renaming is churn with zero user value — just alias it as `kaa` in API responses).

## Part 5 — Key references

- FSRS vs SM-2 benchmark: [deckstudy.com](https://deckstudy.com/blog/fsrs-vs-sm2-modern-spaced-repetition), [fsrs-optimizer comparison](https://deepwiki.com/open-spaced-repetition/fsrs-optimizer/7.3-comparison-with-sm-2)
- `ts-fsrs` package: [github.com/open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
- Duolingo learning design: [How we learn how you learn](https://blog.duolingo.com/how-we-learn-how-you-learn/), [Birdbrain](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/), [Settles & Meeder 2016 (half-life regression)](https://research.duolingo.com/papers/settles.acl16.pdf)
- Retrieval practice in children: [Goossens et al. 2014](https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.2956), [Frontiers 2016](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.00350/full)
- Receptive vs productive retrieval: [ResearchGate 2016](https://www.researchgate.net/publication/303939278_The_Effects_of_Receptive_and_Productive_Word_Retrieval_Practice_on_Second_Language_Vocabulary_Learning)
- Gamification effects & caveats: [StudyPulse research review](https://studypulse.education/blog/gamification-in-education-what-research-says/)
