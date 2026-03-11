# Panchatantra — Project Context for Claude

## What is this project?

Panchatantra is a web application for Karnataka's gram panchayat (GP) offices to perform all mandatory administrative tasks — daily records, meeting minutes, office documentation, and more.

The platform has two sides:
- **Citizen-facing side** — public-facing portal
- **Department login side** — the primary focus here; GP staff log in and access a suite of administrative modules

After login, staff see a modules list page. We are currently building the **Meeting Management module**, which is used to enter Minutes of Meeting (MoM) into the system following Gram Sabhas and GP General Body meetings. This is currently a tedious manual process — we are integrating **Speech-to-Text (STT)** and an **AI feedback mechanism** to reduce effort and improve quality of entries.

---

## Tech Stack

- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **Language:** JavaScript (JSX)

---

## Design System Rules — CRITICAL

> **All UI must be built exclusively using components from `/src/components`.  
> Never write one-off inline styles. Never create ad-hoc UI elements.  
> If a UI need arises that no existing component covers, flag it — do not improvise.**

All components are sourced from the Figma file's **"All Components"** section and have been implemented as React components in `/src/components`. Every screen must compose from these components only.

---

## Component Library Structure

Located in `/src/components`, organised by group:

### Navigation
| Component | Variants / States |
|---|---|
| `Navbar` | Default (with welcome), No welcome |
| `Sidebar` | Full (expanded), Shortened (collapsed) |
| `SideNavOption` | Default, Hover, Clicked/Open |
| `DropdownInSidenav` | Default, Hover, Selected |
| `Breadcrumb` | Level 3, Level 4 |

### Icons
| Component | Notes |
|---|---|
| `Icon` | Accepts `name` prop — values: `arrow_drop_down`, `arrow_drop_down_up`, `file_copy`, `people_alt`, `menu` |

### Dropdowns
| Component | Variants / States |
|---|---|
| `DropdownBoxProfile` | Opened, Closed — across 6 hierarchy levels (L1–L5) |
| `DropdownBoxIcon` | Same structure as DropdownBoxProfile |

### Buttons & Tags
| Component | Variants / States |
|---|---|
| `Button` | variant: `default-outlined`, `filled` / state: `default`, `hover`, `pressed`, `focused`, `disabled` / iconPlacement: `none`, `left`, `right` |
| `CompletionTag` | state: `pending`, `completed` |
| `FeedbackCardTag` | type: `add-missing-details`, `rephrase` |

### Meeting / MoM Specific
| Component | Notes |
|---|---|
| `MeetingDetailsCard` | Displays GP meeting metadata |
| `MeetingDetailsTag` | Tag within the meeting details card |
| `SectionHeading` | Section-level headings within the MoM flow |
| `SmallDetailsText` | Supporting detail text |
| `AgendaCard` | state: `default`, `completed`, `inside-stages` |
| `MoMEntryPopUp` | state: `default`, `after-1-entry`, `audio-recording` |
| `AgendaNumberLabel` | Agenda item numbering label |
| `GoBackToPreviousPage` | Back navigation component |

### Other UI
| Component | Variants / States |
|---|---|
| `Stepper` | state: `active-step-2`, `active-step-3` |
| `TextAreaContainer` | state: `default`, `filled`, `recording` |
| `InfoBox` | variant: `default`, `outlined` |
| `QuestionFieldSmall` | type: `mandatory`, `not-mandatory` |

---

## Prop Conventions

- **`variant`** — visual style (e.g. `"filled"`, `"outlined"`)
- **`state`** — interactive state (e.g. `"default"`, `"hover"`, `"disabled"`, `"recording"`)
- **`type`** — semantic category (e.g. `"mandatory"`, `"add-missing-details"`)
- **`iconPlacement`** — `"none"` | `"left"` | `"right"` (on Button)
- **`level`** — hierarchy depth for dropdowns (e.g. `"L1"` through `"L5"`)

Always pass state as a prop, never manage visual states with local Tailwind conditionals outside the component itself.

---

## Module Being Built — Meeting Management

### Screen Flow (in order)

1. **Agenda List Screen**
2. **MoM Entry Sub Page — Default**
3. **MoM Entry Sub Page — While Recording**
4. **MoM Entry Sub Page — Post Recording**
5. **MoM Entry Sub Page — Post One Round of Feedback**

> A screen prior to the Agenda List screen will be built later, once this flow is complete.

---

## Screen-by-Screen Behaviour

### Agenda List Screen
- Shows `Navbar`, `Sidebar`, `Breadcrumb`, `Stepper` (indicating form stage)
- `MeetingDetailsCard` displays meeting metadata at the top
- Below it: list of agenda items using `AgendaCard` components
- Each agenda has a `CompletionTag` (pending/completed) and an **"Add Proceedings"** CTA
- Once proceedings are saved for an agenda, its tag changes to `completed` and the CTA is replaced by two buttons: **"View Proceedings"** and **"Edit Proceedings"**
- User selects the next agenda to work on from this list

### MoM Entry Sub Page — Default
- Opens when user clicks "Add Proceedings" on an agenda item
- Contains `TextAreaContainer` (default state) for entry
- Two input modes available: **typing** and **dictation** — user can use either or both
- If user types first and then records, typed text must remain intact; new dictated text is appended after it
- Same additive behaviour applies after feedback has been done — text already in field is never overwritten

### MoM Entry Sub Page — While Recording
- `TextAreaContainer` switches to `recording` state
- Visual recording indicator active
- STT API is called with audio stream

### MoM Entry Sub Page — Post Recording
- `TextAreaContainer` switches to `filled` state
- Transcript appended to any existing text in the field
- User can manually edit the text at this point
- **"Get Feedback"** CTA becomes active
- **TextAreaContainer auto-resizes** vertically to fit its content at all times — no internal scrollbar ever. Min height when empty, expands as text grows.
- **"Get Feedback" button** enables as soon as any text exists in the TextAreaContainer. Disabled when the field is empty.
- **"Save" button** remains disabled until at least one round of feedback has been completed. It does not enable on text entry alone.

### MoM Entry Sub Page — Post One Round of Feedback

**Route:** `/mom-entry/feedback`
**Route state received:** `{ agenda, discussionText, feedbackResult: { category, category_reason, feedback: string[] } }`

#### Screen layout
- Same shared shell: `MeetingShellLayout` with `stepperActiveState={2}` (Navbar, Language tab, Sidebar, Breadcrumb, Stepper, MeetingDetailsCard all fixed)
- Main content: outer white card containing `GoBackToPreviousPage` + a **left-right split**:
  - **Left card** — bordered (`border-[rgba(106,62,49,0.24)]`), flex-1: full MoM entry form (AgendaCard, Action field, Discussion field + floating MicButton)
  - **Right card** — muted background (`bg-[rgba(134,134,134,0.08)]`), fixed width `w-[360px]`, `self-stretch`: Feedback heading + suggestion count badge + list of `FeedbackCard` components

#### Feedback items
- `feedbackResult.feedback` is a `string[]` where each element is a plain actionable suggestion — **no span/position data is returned by the API**
- Each string is classified into a type using a **keyword heuristic** in `inferType()`:
  - Keywords like "add", "include", "specify", "document", "mention", "provide", "timeline", "name", "cost", "estimate", "detail", "missing" → `add-missing-details`
  - All others → `rephrase`
- Each item becomes a `CardState` object with: `id`, `text`, `type`, `dismissed`, `accepted`, `inputText`, `recordingState`, `sttError`
- Cards are stored in local state; dismissed cards are filtered out of `visibleCards` for rendering

#### Bidirectional linking (left ↔ right)
- `activeCardId: string | null` tracks the currently active card
- **Hovering** a `FeedbackCard` → sets `activeCardId` to that card's id via `onHoverEnter`; clears it on `onHoverLeave` (unless another card was clicked)
- **Clicking** a `FeedbackCard` → toggles `activeCardId` (click same card again to deactivate)
- The **left card's border and box-shadow** respond to `activeCardId`:
  - `add-missing-details` active → border/glow `#ff7468` (coral)
  - `rephrase` active → border/glow `#613af5` (purple)
  - No active card → default border `rgba(106,62,49,0.24)`
- This is the visual "highlight" linking: the `TextAreaContainer` itself is not span-highlighted (the API returns no position data), but the entire left card's border signals which type of feedback is active

#### FeedbackCard — visual active state
- `isActive` prop drives an elevated appearance: matching `borderColor` + `boxShadow` glow on the card itself

#### FeedbackCard — rephrase type
- Body: shows `originalText` (the feedback suggestion) in a bordered div
- **Accept (✓):** dismisses card, sets `accepted: true`
- **Reject (✕):** dismisses card, `accepted` remains false

#### FeedbackCard — add-missing-details type
- Body: shows `originalText` then:
  - **Idle state:** auto-resizing `<textarea>` input + floating mic button (36 px, `#ff7468`)
  - **Recording state:** waveform canvas (live analyser animation) + cancel (red) and confirm (green) buttons — identical pattern to `TextAreaContainer`
  - **Processing state:** "Transcribing…" text in place of the canvas
- **Accept (✓) in header:** enabled only when `inputText` is non-empty; acts as push (same as "Add to Discussion" button)
- **"Add to Discussion" button:** appears below the input when `inputText` is non-empty and not recording; calls `handlePushText` — appends `inputText` (trimmed, with a space separator) to main `discussionText`, then dismisses the card
- **Reject (✕):** dismisses card without pushing any text
- STT flow inside card: identical to main textarea STT — `MediaRecorder` → base64 → `POST /speech-to-text` → transcription **appended** to `inputText` (never replaces); error shown inline above input via `micError` prop

#### Per-card recording state management
- Each card has its own `recordingState: 'idle' | 'recording' | 'processing'` in `CardState`
- Media refs are stored in `Map`s keyed by card id: `cardMediaRecordersRef`, `cardAudioChunksRef`, `cardAudioCtxRef`
- `cardAnalysers: Map<string, AnalyserNode | null>` state drives the waveform canvas in each card

#### Main TextAreaContainer on this screen
- Fully editable — user can continue typing or recording after feedback is shown
- Main mic recording works identically to the Post Recording screen (STT appends to `discussionText`)
- STT errors shown via `InfoBox type="default"` (replaces the outlined info box)
- **"Get Feedback" button:** `state="disabled"` — feedback has already been obtained; a second round is not triggered from this screen
- **"Save" button:** `state="default"`, always enabled on this screen (feedback round is complete)

#### Save behaviour
- Calls `markCompleted(agenda.id)` from `useAgenda()` context
- Navigates to `/` (Agenda List Screen)
- The agenda card on the list changes to `completed` state

#### FeedbackCard component props (extended)
The `FeedbackCard` component in `/src/components/FeedbackCard.tsx` was extended to support full interactivity. Key props added beyond the original:
- `isActive`, `onHoverEnter`, `onHoverLeave`, `onClick` — bidirectional linking
- `addedText`, `onAddedTextChange` — controlled input for add-details
- `onPushText`, `pushLabel` — "Add to Discussion" action + i18n label
- `isMicRecording`, `isMicProcessing`, `onMicClick`, `onCancelRecording`, `onConfirmRecording`, `micAnalyserNode` — recording lifecycle
- `micError` — inline STT error display
- `addPlaceholder` — i18n placeholder for the add-details textarea

#### i18n keys added for this screen
Both `en` and `kn` keys added to `translations.js`:
- `feedback_card_placeholder` — placeholder text for the add-details input textarea
- `feedback_card_push` — label for the "Add to Discussion" push button

---

## Navigation & Layout Behaviour

### Navbar
- Left: Home button (navigates to modules list page)
- Right: Settings icon (dropdown with logout, settings, other functions) + `DropdownBoxProfile`
- `DropdownBoxProfile` shows all GP staff roles that have a login
- **Both dropdowns must be functional**

### Sidebar
- Three options specific to Meeting Management module
- Expands/collapses when the `menu` icon (`Icon name="menu"`) is clicked — uses `Sidebar` Full vs Shortened states
- This expand/collapse behaviour is **consistent across all modules and the post-login home page**

### Language Tab
- A tab bar sits **directly below the Navbar**, spanning the full width
- Built using the `Button` component — two tabs: **English** and **ಕನ್ನಡ (Kannada)**
- Only one tab is active at a time (active = `variant: "filled"`, inactive = `variant: "default-outlined"`)
- Selecting a tab switches **all UI text across the entire interface** to that language
- This is a **global state** — language choice must persist as the user navigates between screens within the session
- Default language on load: **English**

### i18n Implementation Rules
- All UI label strings are stored in `/src/i18n/translations.js` — **this file already exists and is complete. Never hardcode display text directly in components or screens.**
- The file contains both `en` and `kn` keys. English strings are final (extracted from Figma). Kannada strings are human-translated and ready to use.
- Use a `LanguageContext` (React Context) at `/src/i18n/LanguageContext.jsx` to provide the active language and a `t("key")` helper throughout the app
- Every string rendered in the UI — buttons, labels, headings, placeholders, error messages, info text — must go through `t("key")`. No exceptions.
- **Never add new hardcoded strings.** If a new string is needed, add it to both `en` and `kn` in `translations.js` first, then reference it via `t("key")`
- **Never auto-translate** using any external service. All translations come from `translations.js` only.
- Do not auto-translate using any external service whatsoever.

---

## Key Reference Files in Project Root

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file — full project context, rules, and behaviour specs |
| `api.md` | STT and Feedback API documentation — endpoints, request/response format, auth headers |
| `/src/i18n/translations.js` | All UI strings in English and Kannada — always use `t("key")` to access |
| `/src/i18n/LanguageContext.jsx` | Language context provider and `t()` helper — wrap entire app in this |

> Before implementing any API call, read `api.md` in full. Before rendering any string, check `translations.js` for the correct key.

---



> **See `api.md` in the project root for full endpoint details, request/response format, and auth headers.**

Behaviour requirements:
- User clicks mic button → recording starts → `TextAreaContainer` enters `recording` state
- Audio is captured and sent to the STT API
- On response, transcript text is **appended** to whatever is already in the text field (never replaces)
- Field returns to `filled` state
- If STT call fails, show an error using `InfoBox` (variant: `outlined`) — do not silently fail

---

## Feedback Integration

> **See `api.md` in the project root for full endpoint details, request/response format, and auth headers.**

Behaviour requirements:
- Triggered by user clicking "Get Feedback" CTA
- Current text content from `TextAreaContainer` is sent to the feedback API
- Response returns suggestions mapped to spans of text (positions or keywords)
- These spans are highlighted in the text area
- Feedback cards rendered in the right column using appropriate `FeedbackCardTag` types
- Highlight ↔ card linking is bidirectional (hover/click on either side)
- `add-missing-details` cards allow inline recording or typing, with a push-to-text-area action

---

## General Rules for Claude

1. **Never write one-off styles.** Use only components from `/src/components`.
2. **Never overwrite text in `TextAreaContainer`.** All text additions are append-only.
3. **All API failures must surface to the user** via `InfoBox` — no silent failures.
4. **Sidebar and Navbar behaviour is global** — implement once, reuse across all screens.
5. **Language tab is global** — implement `LanguageContext` once and wrap the entire app. Every screen and component must consume it via the `t("key")` helper.
6. **Never hardcode display strings** — all text must go through `t("key")` from `/src/i18n/translations.js`. This applies to buttons, labels, headings, placeholders, error messages — everything.
7. **Do not create new components** without flagging it first. If a design need isn't covered by existing components, ask before building something new.
8. **Routing:** Each screen in the meeting proceedings flow has its own route. Navigating between them should feel seamless and match the Figma prototype flow.
9. **State management:** Keep form state (text content, feedback state, agenda completion, active language) at the appropriate level so navigating back to the Agenda List preserves completion status and language choice.
10. **API reference:** Always refer to `api.md` in the project root for STT and feedback endpoint details before implementing any API call.
11. **TextAreaContainer always auto-resizes** vertically to fit its content — no internal scrollbar ever. Min height when empty, expands as text grows. Never constrain its height with a fixed value.
12. **"Get Feedback" button** enables as soon as any text exists in the TextAreaContainer. Disabled when the field is empty. This applies to every screen that contains the button.
13. **"Save" button** remains disabled until at least one round of feedback has been completed. It does not enable on text entry alone. The `feedbackCompleted` flag (carried in router state) is the sole gate for enabling Save.
