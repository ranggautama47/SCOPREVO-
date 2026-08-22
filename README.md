# SCOPREVO

**AI-powered Scope & Revision Intelligence.**

> Turn messy client feedback into clear revisions — and know what is inside or outside the project scope.

**Note on naming/brand:** product was previously named ScopeGuard; SCOPREVO (Scope + Revision) is the current name going forward. Visual identity (logo, color system, brand symbol) is intentionally **not locked in this document** — that ownership sits with the UI/UX Lead per the multi-AI role split (this doc, as Product/System Architect output, covers scope, data model, AI contract, and roadmap only).

SCOPREVO mengubah feedback klien yang berantakan (chat WhatsApp, email) menjadi checklist revisi yang terstruktur, sekaligus secara otomatis mendeteksi permintaan mana yang masih termasuk scope proyek dan mana yang berpotensi menjadi pekerjaan tambahan (out of scope).

---

## Problem

Freelancer dan agency kecil di Indonesia kehilangan waktu dan uang karena:
1. Feedback klien tersebar dan tidak terstruktur (WhatsApp, email, campur aduk dengan basa-basi).
2. Tidak ada batas jelas antara "revisi yang disepakati" dan "request baru yang harusnya kena biaya tambahan" → scope creep.
3. Klien enggan pakai tools project management berat (Jira/Trello/Asana) yang butuh onboarding.

## Solution

Satu alur inti, bukan aplikasi serba bisa:

```
Client sends messy feedback (text)
        ↓
   AI extracts & classifies
        ↓
Structured revision checklist
   (IN_SCOPE / OUT_OF_SCOPE / NEEDS_REVIEW)
        ↓
   Revision quota tracked (2/3 used)
        ↓
   Magic link sent to client
        ↓
   Client confirms — no login needed
```

## Why this, not a generic PM tool

Moxie, Plutio, dan Odoo adalah platform all-in-one (invoicing, CRM, scheduling, contracts, dll). Keberadaan mereka justru memvalidasi bahwa freelancer butuh business tooling — tapi tak satupun fokus mendalam pada satu masalah spesifik: **mengekstrak dan mengklasifikasi revisi dari feedback berantakan, lalu melindungi scope proyek secara real-time.** SCOPREVO sengaja sempit: satu workflow, dikerjakan tuntas.

## Core value in one line

> "AI mengubah feedback klien yang tidak terstruktur menjadi checklist revisi yang bisa ditindaklanjuti, dan melindungi freelancer dari scope creep."

## MVP Scope (in)

- Input: paste teks mentah (WhatsApp/email copy-paste)
- AI extraction → structured JSON (item, kategori, klasifikasi scope, alasan)
- Revision quota tracking per project
- Magic link client portal (no login)
- Client sign-off / confirm

## Explicitly deferred (not in MVP)

- WhatsApp Business API integration
- Voice note transcription
- OCR / PDF / DOCX / XLSX ingestion
- Payment/billing
- Team roles / RBAC
- Analytics dashboard

These are legitimate Phase 2/3 features — deferred so the MVP ships and demos cleanly.

## Measuring impact (required for case study)

Every claim must come from an actual measured run, not a marketing estimate:

| Metric | Manual | SCOPREVO |
|---|---|---|
| Time to interpret feedback | ~12–30 min | ~10–30 sec (AI) |
| Ambiguous requests caught | Often missed | Flagged as NEEDS_REVIEW |
| Out-of-scope requests caught | Often missed until too late | Flagged immediately with reason |

**Status: no real beta tester identified yet.** This is an open risk — the before/after case study needs a real feedback sample from an actual freelancer/agency contact, not a fabricated one. Do not write the case study numbers until this is resolved.

## Platform & Tech Stack

SCOPREVO is being built for **DevHandal 2026 Batch 2 (Codepolitan x Tencent EdgeOne)** — Misi 2 requires a technical review/tutorial based on a project actually published on EdgeOne Makers, so the app needs to be real and live on that platform (not just described).

Locked stack:

| Layer | Choice |
|---|---|
| Frontend | Vue 3 + Vite + TypeScript |
| Backend | Express.js + TypeScript |
| Deployment / Hosting | Tencent EdgeOne Makers |
| Serverless Runtime | EdgeOne Cloud Functions (Express mounted as a function handler) |
| Database | PostgreSQL |
| Database Provider | Supabase |
| AI | EdgeOne Models / external LLM API |
| Optional | EdgeOne KV (cache/session only, not primary storage), EdgeOne Blob, EdgeOne Observability |

**Why not KV/Blob as primary storage:** SCOPREVO's data model is inherently relational (Account → Project → RevisionBatch → RevisionItem, with foreign keys, enums, and quota calculations that depend on filtered counts). EdgeOne's native KV/Blob layer is suited to cache, session tokens, and simple config — not this shape of data. PostgreSQL via Supabase is used instead.

**Deployment structure note (unverified — confirm in EdgeOne console before building):** current best understanding is a single EdgeOne project with one root directory, where the Express backend lives inside a `cloud-functions/` folder alongside the Vue frontend source (per EdgeOne's own `express-template`), rather than two independently-rooted `apps/web` + `apps/api` folders in one project. If two fully separate deployments are wanted instead, that requires two separate EdgeOne projects pointing at two subdirectories — confirm this in the console before committing to a folder layout.

## Docs in this set

- `README.md` — this file
- `PHASES.md` — build roadmap, day by day
- `DATABASE.md` — relational data model (ERD + schema)
- `UML.md` — use case, sequence, and state diagrams