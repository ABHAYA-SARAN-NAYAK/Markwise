# StudentSphere — Mark Leak Finder
### Product Requirements Document (PRD) v1.0 — Class 12, Tamil Nadu State Board, English medium
**Event:** College exhibition, 14 October 2026 · **Audience:** Class 12 school students (and their teachers) · **Device at stall:** one laptop, good internet

---

## 0. How to use this file (read first)

This PRD is written to be pasted into Antigravity. The project needs **three files**. Put them in the project like this:

| File | Where it goes | What it is |
|---|---|---|
| `StudentSphere_PRD.md` (this file) | project root | The plan. Antigravity reads it. |
| `keycards.json` | `public/data/keycards.json` | 26 ready Key Cards (the "answer keys") for 5 subjects. Already built. |
| `engine.js` | `public/js/engine.js` | The checking engine. Already written and tested. **Use it as it is. Do not rewrite it.** |

Rules for the builder (Antigravity):
1. **Do not change `engine.js` or the format of `keycards.json`.** Build the screens around them.
2. **The marks come only from the engine (fixed rules). AI is used ONLY to read handwriting.** Never let an AI model decide a mark.
3. Build in the phases of Section 12. **Phase 1 must work end to end before Phase 2 starts.**
4. If something is unclear, choose the simpler option. The exhibition is tomorrow.

---

## 1. Reality check on the data (honest, please read)

What you gave me, and what it really contains:

- **`Board_Exam_Syllabus_and_Papers.md`** is mostly **CBSE** (subject codes 042, 043, 044...). Its useful part is about **20 worked questions with step-wise marking**. I used these where the numbers checked out. I **did not use** two of them: the cell-potential question (it gives two different answers) and the cash-flow question (it adds back a "previous year proposed dividend", which I do not trust).
- **`previous_questions_all.md`** has **Tamil Nadu question papers**, but the questions are **re-written in short form and there are NO answers or keys**. It tells me which kinds of questions TN asks. It does not tell me the TN marking key.
- **So no real Tamil Nadu marking key exists in your files.** I wrote the Key Cards myself at textbook level. That is why **every Key Card is marked "Draft key"** in the app until a teacher marks it verified.
- The file has stray text like `[span_228]` and LaTeX. Ignore it.

What this means for tomorrow:
- We cannot cover all questions of 5 subjects. We have **26 Key Cards (81 marks)**: Physics 5, Chemistry 6, Biology 6, Accountancy 5, Maths 4. This is enough for a strong 2-minute demo.
- The app is **data driven**. Adding a question later = adding one JSON object. No code change.
- **The biggest risk is not code. It is a wrong key.** Get a Class 12 teacher to check at least the cards you will show most (suggestion: PHY-01, PHY-03, CHE-01, BIO-01, ACC-02, MAT-02). Then set `"verified": true` and `"verifiedBy": "Name, subject, school"` in the JSON.

### The 26 Key Cards included

| ID | Subject | Chapter | Topic | Marks | Type |
|---|---|---|---|---|---|
| PHY-01 | Physics | Electromagnetic Induction and Alternating Current | Lenz's law | 2 | define |
| PHY-02 | Physics | Optics | Optical path length | 2 | define |
| PHY-03 | Physics | Current Electricity | Internal resistance of a cell | 2 | numerical |
| PHY-04 | Physics | Dual Nature of Radiation and Matter | Photoelectric effect (energy check) | 3 | numerical |
| PHY-05 | Physics | Electrostatics | Gauss's law: infinitely long charged wire | 5 | derive |
| CHE-01 | Chemistry | Chemical Kinetics | Half-life of a first order reaction | 3 | numerical |
| CHE-02 | Chemistry | Ionic Equilibrium | Solubility product (Ksp) | 2 | define |
| CHE-03 | Chemistry | Metallurgy | Mond process (refining of nickel) | 3 | derive |
| CHE-04 | Chemistry | Ionic Equilibrium | pH of 0.1 M acetic acid | 5 | numerical |
| CHE-05 | Chemistry | Solid State | Tetrahedral and octahedral voids | 3 | differentiate |
| CHE-06 | Chemistry | Chemistry in Everyday Life / Polymers | Condensation polymerisation | 3 | define |
| BIO-01 | Biology | Reproduction in Plants (Bio-Botany) | Mellitophily | 2 | define |
| BIO-02 | Biology | Principles and Processes of Biotechnology | Insertional inactivation | 2 | explain |
| BIO-03 | Biology | Biotechnology Applications | DNA fingerprinting steps | 3 | derive |
| BIO-04 | Biology | Plant Breeding | Heterosis (hybrid vigour) | 3 | explain |
| BIO-05 | Biology | Immunology (Bio-Zoology) | Active vs passive immunity | 5 | differentiate |
| BIO-06 | Biology | Evolution (Hardy-Weinberg) | Allele frequency calculation | 4 | numerical |
| ACC-01 | Accountancy | Partnership Accounts | Rules when there is no partnership deed | 2 | list |
| ACC-02 | Accountancy | Dissolution of a Firm | Partner's remuneration for realisation | 3 | journal |
| ACC-03 | Accountancy | Admission of a Partner | New profit sharing ratio | 3 | numerical |
| ACC-04 | Accountancy | Retirement of a Partner | Gaining ratio and new ratio | 3 | numerical |
| ACC-05 | Accountancy | Company Accounts | Forfeiture and re-issue of shares | 4 | journal |
| MAT-01 | Maths | Vector Algebra | Orthogonal vectors | 2 | numerical |
| MAT-02 | Maths | Applications of Differentiation | Related rates (ladder) | 3 | numerical |
| MAT-03 | Maths | Applications of Differentiation | Maximum volume of an open box | 4 | numerical |
| MAT-04 | Maths | Vector Algebra (3D Geometry) | Shortest distance between skew lines | 5 | derive |

---

## 2. Product in one page

**Name:** StudentSphere · **Hero feature:** Mark Leak Finder
**One line:** *The student writes a board-style answer. The app shows exactly where marks would leak, using a keyword-and-steps key like the one a board valuator uses — and it also tells the student if their handwriting is hard to read.*

### The problem (why this is not "one more guide")
- Students already have too many notes, guides and MCQ banks. **More content does not help.**
- Board exams are **written**. Most practice apps check only MCQs.
- A valuator gives marks for **keywords, steps, formulas, units and labelled diagrams**. Students often know the idea but lose marks because a keyword, a step or a unit is missing.
- If the valuator cannot **read** the handwriting, marks are lost too.
- No teacher can check 40 written answers per student per day.

### What we build (hero loop, 60 seconds)
1. Student picks a subject and a question (2, 3, 4 or 5 marks).
2. Student writes the answer on paper and shows it to the laptop camera (or uploads a photo, or types it).
3. The app **reads the handwriting** and shows the text so the student can fix it.
4. The **Keyword Key Engine** checks the text against the Key Card.
5. The student sees the **Mark Leak Report**: marks kept, marks leaked, which keyword or step is missing, spelling slips, and a handwriting readability score with 3 tips.
6. The student tries again and sees the **improvement** (for example "+1.5 marks").

### Why it is different (the answer to a teacher's question)
| Guides / question banks / MCQ apps | Mark Leak Finder |
|---|---|
| Give the answer | Checks **your** answer |
| Test knowing (MCQ) | Tests **writing for the exam** |
| Say "wrong" | Says **which keyword / step / unit** lost the mark |
| Ignore handwriting | Flags **readability** and gives tips |
| Teacher learns the class is weak after the exam | Teacher sees **most missed keywords** today (Class Map) |

### What it is NOT (say this honestly)
- It does **not** replace a teacher or give "official board marks". It gives an **estimate** based on a key. Different valuators can differ.
- It does **not** judge deep reasoning. It checks that the expected points are present.
- The AI does **not** give marks. It only reads handwriting.

---

## 3. Scope

### P0 — must work tomorrow (demo breaks without these)
1. Home with 5 subjects, nickname box (no sign-up).
2. Question list per subject (from `keycards.json`).
3. Answer screen with **Type** mode.
4. **Mark Leak Report** using `engine.js`.
5. **Photo mode**: upload + laptop camera → handwriting reading → **review/edit text** → check.
6. Handwriting card: **photo check** (retake) and **readability score + 3 tips**.
7. "Draft key" badge on every unverified card.
8. "How marks are decided" screen (for teacher questions).
9. Dark glass design, big text, works on one laptop in full screen.

### P1 — if time remains (in this order)
1. Retry with improvement ("+1.5 marks").
2. Keyword Bank (searchable list of must-know keywords per chapter).
3. Class Map (teacher view, live from today's visitors).
4. Peer Marking (mark an anonymous sample with the checklist).
5. Leaderboard: "Biggest Comeback".
6. Printable answer sheet page.
7. Demo mode with saved reads (works with no internet).
8. Kiosk mode (auto reset after 90 seconds idle).

### P2 — after the exhibition (do not build now)
Student login, real database, phone upload by QR, Tamil medium, teacher dashboard with classes, more subjects, verified keys from the board, photo blur detection, mobile app.

### Cut order if you run out of time
Peer Marking → Leaderboard → Class Map → Keyword Bank. **Never cut:** Type mode, Photo mode, Mark Leak Report, Draft badge, How marks are decided.

---

## 4. Screens and flow (detailed)

Single page app. Hash routes. Base font size **18px** (visitors stand 60 cm from a laptop).

### 4.1 Home `#/`
- Top bar: logo "StudentSphere" · small links: Keyword Bank · Peer Marking · Class Map · How marks are decided.
- Hero: headline **"Find where your marks leak."** Sub line: *"Write an answer. We check it with a board-style keyword key and tell you what to fix."*
- Nickname input (placeholder "Your nickname, no real name needed"). Saved in `ss.nick`.
- 5 subject cards (Physics, Chemistry, Biology, Accountancy, Maths), each showing: number of questions, total marks.
- Footer line: *"Practice tool. Keys are drafts until a teacher verifies them."*
- Privacy line: *"Do not write your name or school on the paper."*

### 4.2 Subject `#/subject/:name`
- Chips to filter by marks: All · 2 · 3 · 4 · 5.
- List of question cards: topic, marks chip, part chip (for example "Part III"), **Draft key** badge (yellow outline) or **Verified by …** badge (green).
- Click opens the answer screen.

### 4.3 Answer `#/q/:id`
- Left: question text, marks, chapter, tip "Write like an exam: formula → steps → unit → final answer."
- Right: tabs **Type | Photo | Camera**.
  - **Type:** big textarea, live word count. Button "Check my answer".
  - **Photo:** drag-and-drop or file picker (jpg/png/heic not required; accept image/*). Shows a preview.
  - **Camera:** `getUserMedia` live view, "Take photo" button, retake button. (Works on `localhost`.)
- Before sending a photo, do a **local brightness check** (Section 7.2). If too dark or too bright, show the retake message and do not call the server.
- Tip card: "Write with a dark pen on white paper. Keep the page flat and fill the camera frame."

### 4.4 Reading screen (Photo/Camera only) — `#/read`
- Shows a shimmer "Reading your handwriting…" (max 20 seconds, then a friendly error with "Type it instead").
- When done, show **two columns**: the photo on the left, the **transcript** on the right in an editable box.
- Words the reader could not read appear as a yellow `[?]` chip. The student can type the correct word.
- Message: *"Check the text. Fix any wrong word. Then press Check."* (This protects trust: if the reader made a mistake, the student fixes it.)
- Button: **Check my answer**.

### 4.5 Mark Leak Report `#/result`
Layout (desktop):

```
┌──────────────────────────────────────────────────────────────┐
│  Question + marks                              [Try again]   │
├───────────────┬──────────────────────────────────────────────┤
│  SCORE RING   │  WHERE MARKS LEAKED  (sorted, biggest first) │
│   3 / 5       │  −1  Unit missing           Tip: write ...   │
│  Kept 3       │  −1  Step 2 missing         Look for: ...    │
│  Leaked 2     │                                              │
├───────────────┴──────────────────────────────────────────────┤
│  KEY CHECKLIST (every item the valuator looks for)           │
│  ✔ green found   ✔ orange spelling   ◐ partial   ✖ missing   │
├──────────────────────────────────────────────────────────────┤
│  YOUR ANSWER (matched keywords highlighted yellow)           │
├──────────────────────────────────────────────────────────────┤
│  HANDWRITING (Photo only): photo check · readability · tips  │
├──────────────────────────────────────────────────────────────┤
│  Warnings (short answer, spelling, steps out of order, trap) │
│  [Reveal model answer]  (hidden until clicked)               │
│  Badge: Draft key / Verified by …                            │
└──────────────────────────────────────────────────────────────┘
```
Rules:
- Score ring animates from 0 to the score (600 ms).
- The **checklist** shows each Key Card item: label, marks got / marks max, status icon, the keywords as chips (`keys`).
- A missing item shows **"Look for:"** with the first expected word (`missingHints`) and the `tip`.
- **Model answer is hidden** until the student presses "Reveal model answer" (so they try first).
- **Traps** (wrong ideas such as "opposes the magnetic field") show in a red-orange box.
- If the student edited the transcript, show a small note: "Text edited by you".
- Save the attempt (Section 11). If this is the 2nd+ attempt on the same card in this session, show **"+X marks vs your first try"**.
- Always show: *"Estimate based on a draft key. Real valuators may differ."* (or "Verified by …").

### 4.6 Handwriting card (Photo/Camera only)
Two separate parts. **Do not mix them.**
1. **Photo check:** if `photo_ok` is false, show only the retake advice (map problems to messages, Section 7.3) and **do not show a readability score**. Do not count the attempt.
2. **Readability:** if the photo is fine, show a meter:
   - `readability = round(100 × readable words ÷ (readable + [?] words))`.
   - Bands: **90–100 Clear · 75–89 Mostly clear · 55–74 Hard to read in places · below 55 An examiner may struggle.**
   - Sentence: *"Readability is the share of words the reader could confidently read. It is an estimate, not a mark."*
   - Show up to **3 tips** from the fixed tip table (Section 7.4).
   - If `[?]` count > 0 and marks leaked > 0: *"Some lost marks may be because words were hard to read. Fix the text and check again."*

### 4.7 Keyword Bank `#/bank` (P1)
- Search box + chapter filter. Lists every item's **keys** (chips) with the item label ("why it matters") and card topic.
- Button "Suggest another word" on each item → saves to `ss.suggestions` as pending. In **Teacher mode** (PIN `1234`) show Approve / Reject. Approved words are stored in `ss.overrides` and added to that item's matching list at runtime (add as an extra variant in the first group). Show a small "teacher approved" tag.

### 4.8 Peer Marking `#/peer` (P1)
- Shows a card's `peerSamples` (anonymous "Sample A/B"). Student ticks which checklist items they think the sample earned. Then reveal the engine's result. Show "You agreed with the key on 3 of 4 points". No points system needed tomorrow; show a simple "Examiner eye" count.

### 4.9 Class Map `#/teacher` (P1)
- PIN `1234`. Heading **"Class Map — live from today's visitors at this stall"**.
- Cards: attempts today, average score %, average readability, subjects tried.
- **Most missed keywords** (top 8): count of attempts where an item was missing or partial, with item label and the Key Card topic.
- **Re-teach list:** the top 5 missed items as a printable list.
- **Spelling slips** (top 5).
- Honest label: *"Demo data from this laptop only."*

### 4.10 Leaderboard (P1) — "Biggest Comeback"
- Ranks nicknames by the **largest improvement between first and second try** on the same question (rewards learning, not luck). Second tab: "Most marks kept today".
- Do **not** add fake names. Do 6 real practice attempts with friends tonight so the board is not empty.

### 4.11 How marks are decided `#/how` (P0)
Short, plain page (one screen):
1. **Key Cards:** each question has a key like a valuator's: must-have keywords, accepted alternatives, steps, formula, unit.
2. **Fixed rules:** the app looks for those words and steps in your answer. No AI gives marks.
3. **AI only reads handwriting.** You can fix the text before checking.
4. **Spelling:** a key term with a small spelling slip still earns the mark but is flagged orange, because a valuator may not accept it.
5. **Draft vs Verified:** keys are drafts until a teacher checks them.
6. **Limits:** it is an estimate and it does not judge reasoning.

### 4.12 Print sheet `/print.html` (P1)
A4 page, white background, black text, simple frame: "Question no.: ____" · large empty ruled area · small note "Dark pen. Do not write your name." Print 40 copies. A clean sheet makes handwriting reading much more accurate.

---

## 5. Key Card format (the data)

Stored in `public/data/keycards.json`. **Already built.** Shape:

```json
{
  "id": "PHY-01", "subject": "Physics", "board": "Tamil Nadu State Board", "class": 12,
  "chapter": "...", "topic": "Lenz's law", "marks": 2, "part": "Part II (2 marks)",
  "type": "define", "question": "State Lenz's law.",
  "items": [
    { "id": "a", "label": "Says the induced current / emf OPPOSES", "marks": 1,
      "all": [["oppos","opposite","against"], ["induced"]],
      "tip": "...", "keys": ["opposes","induced current / emf"] },
    { "id": "p", "kind": "pool", "label": "Any three differences", "each": 1, "max": 3, "marks": 3,
      "points": [ { "label": "...", "any": ["word1","word2"] } ] }
  ],
  "model": "Model answer text",
  "mistakes": ["common mistake"],
  "traps": [ { "any": ["wrong phrase"], "msg": "Why it is wrong" } ],
  "minWords": 8, "ordered": false,
  "verified": false, "verifiedBy": null, "source": "...",
  "peerSamples": [ { "label": "Sample A", "text": "..." } ]
}
```

---

## 6. The Keyword Key Engine (rules)

File: `public/js/engine.js` (full code in Appendix A). API:

```js
Engine.evaluate(card, text)       // -> { total, max, items[], leaks[], warnings[], traps[], spellingFlags[], matchedVariants[], wordCount }
Engine.prepareTranscript(raw)     // -> { clean, illegible, readableWords, totalWords, readability }
Engine.highlight(text, variants)  // -> safe HTML string with <mark class="kw"> around matched words
```

---

## 7. Handwriting reading and readability

### 7.1 Flow
`Browser → POST /api/read (image as base64) → server calls a vision model → JSON → browser`

- The **API key stays on the server** (`.env`). Never put it in the browser code.
- Model: **Gemini Flash** (free tier in Google AI Studio). Keep the model name in `.env` as `GEMINI_MODEL`.
- Temperature 0. The model must **copy**, not correct.

### 7.2 Photo check before sending (saves cost, stops bad reads)
In the browser, draw the image to a small canvas (max 1600 px wide) and compute average brightness (0–255).
- Below 70 → "Too dark. Use more light."
- Above 235 → "Too bright / glare. Tilt the page."
- Image narrower than 600 px → "Too small. Move closer."
Do not call the server in these cases.

### 7.3 Photo problems → messages
| Model says | Message to student |
|---|---|
| too_dark | Too dark. Move under a light. |
| too_bright / glare | Too much glare. Tilt the page a little. |
| blurry | Blurry. Hold steady and let the camera focus. |
| tilted | Page is tilted. Keep the page straight. |
| shadow | A shadow covers the page. Move your hand or the lamp. |
| cropped | Part of the page is cut off. Fit the whole answer in the frame. |
| too_far | Too far. Move closer so the writing fills the frame. |
| not_a_page | I cannot see an answer sheet. |

If `photo_ok` is false: show these messages, **no readability score**, and let the student retake.

### 7.4 Readability and tips
- `readability` comes from `Engine.prepareTranscript` (count of `[?]`). **It is not a mark.**
- Tips are chosen by **fixed rules** from the model's `writing` fields:
| Field value | Tip shown |
|---|---|
| word_spacing = tight / very_tight | Leave a clear gap between words. Crowded words get skipped by examiners. |
| line_direction = uphill / downhill / wavy | Your lines drift. Put a ruled sheet under your paper. |
| letter_size = small | Write a little bigger. Small letters are easy to misread. |
| overwriting = some / a_lot | Cut a wrong word with one neat line and rewrite it. Do not write over letters. |
| confusable_characters not empty | Look-alike characters spotted: {list}. Write them clearly different (cross your 7, close your 0). |
| units_or_symbols_unclear = true | Write units and symbols clearly, right after the number. |
| none of the above | Your writing is easy to read. Keep it up. |

Show at most 3 tips (priority: confusable → units → spacing → lines → size → overwriting). Add the line: *"These are observations by the reading service. A teacher's eye is the final judge."*

### 7.5 Cost and safety limits
- Cache by image hash (SHA-256 via `crypto.subtle`) in memory: same photo = no second call.
- Cooldown: 5 seconds between reads. Maximum 60 reads per hour on this laptop (client counter `ss.reads`). When reached, show "Reading limit reached. Please use Type mode." and keep the app usable.
- Timeout 20 seconds. On any error: show "Could not read the photo. Try again or type your answer." Never show a raw error.

### 7.6 Privacy
- Nickname only. No phone, no email, no real name.
- The app **does not save photos or answer text**. It saves only numbers (score, missing item ids, readability) in the browser.
- The photo is sent to an **online AI reading service** to read the words. Show this on the Photo screen in one line: *"Your photo is sent to an online AI service only to read the words. This app does not save it. Do not write your name or school."*

---

## 8. Community features (lite, honest)

| Feature | Tomorrow | Full version |
|---|---|---|
| Keyword Bank with "Suggest another word" | Yes (P1) | Students suggest, teachers approve, key improves for everyone |
| Peer Marking | Yes (P1) | Mark real anonymous classmates' answers; points for matching the teacher |
| Biggest Comeback board | Yes (P1) | School/district boards |
| Class Map for teachers | Yes (P1, this laptop only) | Real classes with codes; district weak-concept view for education officers |

---

## 9. Design system

Uniform Blue `#122837` + Palesun Yellow `#FBFC09`.

### 9.1 Colors (CSS variables)
```css
:root{
  --bg-0:#0A1822;          /* page background */
  --bg-1:#122837;          /* Uniform Blue: main surface */
  --bg-2:#183347;          /* raised surface */
  --glass:rgba(255,255,255,.06);
  --glass-strong:rgba(255,255,255,.10);
  --stroke:rgba(255,255,255,.14);
  --text:#EAF1F5;
  --muted:#9FB3C0;
  --accent:#FBFC09;        /* Palesun Yellow: buttons, highlights, key numbers */
  --accent-ink:#122837;    /* text on yellow */
  --blue:#3B82F6;          /* glow / links */
  --ok:#7CFC4F;            /* found */
  --warn:#FFB020;          /* spelling / partial */
  --bad:#FF5C6C;           /* missing / traps */
  --radius:20px;
  --shadow:0 20px 60px rgba(0,0,0,.45);
}
```

### 9.2 Type
- **Inter** (Google Fonts, weights 400, 500, 600, 700, 800) for everything.
- Scale: hero 56/60 (800) · h2 32 (700) · h3 22 (600) · body 18 (400) · small 14 (500, muted).
- Base font size: 18px.
- Numbers: tabular numbers.

### 9.3 Components
- Glass cards with 16px blur, 20px radius, 1px stroke.
- Primary buttons in Palesun Yellow with `#122837` text.
- Status icons: found ✔ green · spelling ✔ orange · partial ◐ orange · missing ✖ red. Always icon + word.
- Score ring SVG with glowing yellow stroke.
- Keyword highlight with `<mark class="kw">`.
- Textarea with 2px yellow focus ring.

---

## 10. Tech stack and folders

Plain HTML + CSS + JavaScript in `/public` + one small Node/Express `server.js`.
```
studentsphere/
  server.js
  package.json
  .env
  .env.example
  public/
    index.html
    print.html
    css/styles.css
    js/engine.js
    js/store.js
    js/vision.js
    js/views.js
    js/app.js
    data/keycards.json
    demo/
```

---

## 11. Data stored in the browser (`localStorage`)

Wrap every call in try/catch. Only numbers and IDs are saved, never photos or answer text.

---

## 12. Build plan
Phase 0: Scaffold
Phase 1: Core (Type mode)
Phase 2: Handwriting (Photo/Camera)
Phase 3: Community lite
Phase 4: Polish + kiosk + demo + tests
