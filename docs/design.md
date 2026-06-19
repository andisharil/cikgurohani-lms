# Design system — "Buku Latihan"

Visual identity for cikgurohani LMS. Grounded in the world of Malaysian SPM
tuition: the ruled exercise book (buku latihan), the red teacher's-margin line,
highlighter, red-pen marking, exam-paper, and the mark/record book. Deliberately
**not** the generic AI-admin look (indigo + slate + Geist) nor the cream-serif-
terracotta default.

## Tokens (defined in `src/app/globals.css` `@theme`)
| Token | Hex | Role |
|------|-----|------|
| `ink` | #16223A | fountain-pen navy — primary, text, "book-cover" sidebar/headers |
| `paper` | #F4F3EA | exam-paper background |
| `card` | #FCFBF6 | a fresh sheet (surfaces) |
| `marker` | #D2392B | teacher's red pen — sparing: alerts, errors, margin rule, active tab underline |
| `highlight` | #F4D64E | highlighter — active nav swipe, selected |
| `chalk` | #2E6E55 | chalkboard green — Aktif / healthy |
| `rule` | #D6DBE4 | faint ruled line / borders |

## Type (loaded in `src/app/layout.tsx`)
- **Display** Bricolage Grotesque — headings, big figures (`font-display`)
- **Body** Inter (`font-sans`)
- **Data/ledger** IBM Plex Mono — codes, RM, dates, stat labels (`font-mono`)
- **Hand** Caveat — wordmark + teacher's notes ONLY, used sparingly (`.wordmark` / `font-hand`)

## Signature
The ruled exercise-book surface with the **red teacher's margin** (`.ruled`,
`.book-margin`), the navy book-cover sidebar/header, and a **highlighter swipe**
on the active nav item (`.swipe-active`). Status badges remap to the palette
(Aktif=chalk, Akan Tamat=highlight, Tamat=marker, Disekat=ink-grey).

## Rules of restraint
- Boldness lives in the signature; tables/forms stay quiet and legible (no rules
  behind dense data).
- `prefers-reduced-motion` respected; keyboard focus uses an ink ring.
- Corners are a soft 5px (paper card), not pill-round and not broadsheet-square.
