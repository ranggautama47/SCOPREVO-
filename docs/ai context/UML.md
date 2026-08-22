# UML.md — SCOPREVO System Design

Format teks/ASCII agar mudah disalin ke tool lain (draw.io, Mermaid, atau langsung dijelaskan ke Emergent AI builder).

---

## 1. Use Case Diagram

Dua aktor: **Freelancer/Agency** (pengguna terdaftar) dan **Client** (tanpa akun, akses via magic link).

```
                    ┌─────────────────────────────┐
                    │         SCOPREVO          │
                    │                              │
   Freelancer  ────▶│  Create Project              │
                    │  Submit Feedback (paste teks) │
                    │  View AI-Generated Checklist   │
                    │  View Revision Quota           │
                    │  Generate Magic Link           │
                    │  View Revision History         │
                    │                              │
   Client      ────▶│  View Checklist (via link)    │
                    │  View Scope Classification     │
                    │  Confirm Revision Scope         │
                    └─────────────────────────────┘
```

**Catatan:** Client tidak punya use case "login" atau "register" — ini disengaja, sesuai prinsip zero-friction onboarding.

---

## 2. Sequence Diagram — Core Flow (Submit Feedback → AI Classify → Client Confirm)

```
Freelancer      Frontend         Backend/API        AI Engine        Database        Client
    │               │                 │                  │               │             │
    │ paste feedback│                 │                  │               │             │
    │──────────────▶│                 │                  │               │             │
    │               │ POST /batches   │                  │               │             │
    │               │────────────────▶│                  │               │             │
    │               │                 │  send prompt +    │               │             │
    │               │                 │  raw feedback     │               │             │
    │               │                 │──────────────────▶│               │             │
    │               │                 │                  │ extract +     │             │
    │               │                 │                  │ classify      │             │
    │               │                 │  structured JSON  │               │             │
    │               │                 │◀──────────────────│               │             │
    │               │                 │ validate schema   │               │             │
    │               │                 │───────────────────────────────────▶│             │
    │               │                 │  save RevisionBatch + Items       │             │
    │               │                 │  update quota (used/allowed)      │             │
    │               │                 │  generate magicToken              │             │
    │               │ checklist +     │                  │               │             │
    │               │ quota + link    │                  │               │             │
    │               │◀────────────────│                  │               │             │
    │  see result   │                 │                  │               │             │
    │◀──────────────│                 │                  │               │             │
    │               │                 │                  │               │             │
    │ share link to client                                                             │
    │─────────────────────────────────────────────────────────────────────────────────▶│
    │               │                 │                  │               │  open link  │
    │               │                 │◀───────────────────────────────────────────────│
    │               │                 │ GET /portal/:token                             │
    │               │                 │───────────────────────────────────▶│             │
    │               │                 │  fetch batch + items + quota      │             │
    │               │                 │◀───────────────────────────────────│             │
    │               │                 │  render checklist ──────────────────────────────▶│
    │               │                 │                  │               │  click       │
    │               │                 │                  │               │  "Confirm"   │
    │               │                 │◀───────────────────────────────────────────────│
    │               │                 │  update status = APPROVED         │             │
    │               │                 │───────────────────────────────────▶│             │
```

---

## 3. State Diagram — RevisionBatch Lifecycle

```
        ┌───────┐
        │ START │
        └───┬───┘
            │ freelancer submits feedback text
            ▼
        ┌───────┐
        │ DRAFT │  (AI processing in progress)
        └───┬───┘
            │ AI extraction succeeds, items saved
            ▼
┌─────────────────────────┐
│ PENDING_CONFIRMATION     │  (magic link generated,
│                          │   waiting for client)
└───────────┬──────────────┘
            │ client clicks "Confirm Revision Scope"
            ▼
        ┌──────────┐
        │ APPROVED │  (counts toward used revision quota)
        └──────────┘
```

**Catatan penting:** hanya batch berstatus `APPROVED` yang menambah hitungan `usedRevisions`. Batch yang masih `DRAFT` atau `PENDING_CONFIRMATION` belum "memakan" kuota — ini mencegah freelancer dirugikan kalau klien belum sempat konfirmasi.

---

## 4. State Diagram — RevisionItem Scope Classification

```
                    ┌──────────────┐
   AI extracts ────▶│ NEEDS_REVIEW │ (default state jika AI tidak yakin)
   item                └──────┬───────┘
                              │
                ┌─────────────┼─────────────┐
                │                            │
                ▼                            ▼
        ┌───────────┐                ┌────────────────┐
        │ IN_SCOPE   │                │ OUT_OF_SCOPE    │
        │            │                │ (reason wajib)  │
        └───────────┘                └────────────────┘
```

AI tidak boleh langsung memutuskan IN/OUT dengan percaya diri penuh untuk kasus ambigu — `NEEDS_REVIEW` adalah jaring pengaman supaya sistem tidak terlihat "ngawur" saat demo (misalnya kasus "ubah alur checkout" yang bisa berarti modifikasi kecil atau fitur baru besar).

---

## 5. Component Overview (high-level, stack-agnostic)

```
┌─────────────────────────────────────────────────┐
│                   Client-facing                  │
│  ┌───────────────┐        ┌───────────────────┐  │
│  │ Freelancer     │        │ Client Portal      │  │
│  │ Dashboard      │        │ (magic link,       │  │
│  │ (auth required)│        │  no login)          │  │
│  └───────┬───────┘        └─────────┬─────────┘  │
└──────────┼──────────────────────────┼─────────────┘
           │                          │
┌──────────▼──────────────────────────▼─────────────┐
│                    API Layer                       │
│   Project CRUD │ Batch Ingestion │ Portal Read/Confirm │
└──────────┬──────────────────────────┬─────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼─────────────┐
│    AI Engine         │   │        Database          │
│ (LLM prompt →         │   │ Account / Project /      │
│  structured JSON      │   │ RevisionBatch /          │
│  validation)           │   │ RevisionItem              │
└───────────────────────┘   └──────────────────────────┘
```

Ini deliberately dipisah jadi 3 lapisan (client-facing, API, AI+data) supaya penjelasan ke Emergent AI builder tetap jelas per bagian, walau implementasi akhirnya satu platform terintegrasi.
