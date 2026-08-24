# UML.md — SCOPREVO System Design

Dokumen ini berfungsi sebagai referensi arsitektur tunggal bagi tim pengembang (Frontend, Backend, QA) dan materi teknis untuk submission DevHandal. Format teks/ASCII digunakan agar mudah dirender oleh tool diagram (draw.io, Mermaid) tanpa kehilangan konteks bisnis.

---

## 1. Use Case Diagram

Dua aktor: **Freelancer/Agency** (pengguna terdaftar) dan **Client** (tanpa akun, akses via magic link).

```text
                    ┌─────────────────────────────┐
                    │         SCOPREVO            │
                    │                             │
   Freelancer  ────▶│  Create Project             │
                    │  Submit Feedback (paste teks)│
                    │  View AI-Generated Checklist │
                    │  View Revision Quota         │
                    │  Generate Magic Link         │
                    │  View Revision History       │
                    │                             │
   Client      ────▶│  View Checklist (via link)  │
                    │  View Scope Classification   │
                    │  Confirm Revision Scope      │
                    └─────────────────────────────┘
```
**Catatan Arsitektur**: Client tidak memiliki use case "login" atau "register". Ini adalah keputusan desain sadar (zero-friction onboarding) yang dienkapsulasi melalui magicToken pad

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
    │               │                 │  BEGIN TRANSACTION                │             │
    │               │                 │  save RevisionBatch (status=DRAFT)│             │
    │               │                 │  save RevisionItems               │             │
    │               │                 │  COMMIT TRANSACTION               │             │
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
    │               │                 │ POST /portal/:token/confirm      │             │
    │               │                 │◀───────────────────────────────────────────────│
    │               │                 │  update status = APPROVED         │             │
    │               │                 │  (usedRevisions dihitung dinamis) │             │
    │               │                 │───────────────────────────────────▶│             │
```

**Catatan Kritis**: Kuota (usedRevisions) TIDAK dikurangi saat POST /batches (status DRAFT). Kuota hanya terpengaruh secara dinamis saat status berubah menjadi APPROVED melalui endpoint 


## 3. State Diagram — RevisionBatch Lifecycle
```
        ┌───────┐
        │ START │
        └───┬───┘
            │ freelancer submits feedback text
            ▼
        ┌───────┐
        │ DRAFT │  (AI processing in progress, quota NOT consumed)
        └───┬───┘
            │ AI extraction succeeds, items saved, link generated
            ▼
┌─────────────────────────┐
│ PENDING_CONFIRMATION     │  (magic link active,
│                          │   waiting for client)
└───────────┬──────────────┘
            │ client clicks "Confirm Revision Scope"
            ▼
        ┌──────────┐
        │ APPROVED │  (counts toward used revision quota)
        └──────────┘
```

**Aturan Transisi & Kuota:** 
1. Transisi status untuk **satu batch** bersifat satu arah (forward-only) dan `APPROVED` adalah status akhir (terminal state). Ini mencegah manipulasi kuota dan menjaga audit trail.
2. Batch yang masih `DRAFT` atau `PENDING_CONFIRMATION` belum memakan kuota.
3. **"Revisi ronde berikutnya"** (jika klien mengirim feedback baru atau menolak scope via WhatsApp) TIDAK dilakukan dengan memundurkan status batch lama. Itu dilakukan dengan membuat **RevisionBatch BARU** di project yang sama, yang nantinya akan memakan kuota jika batch baru tersebut di-APPROVE.

---

## 4. State Diagram — RevisionItem Scope Classification
```
                    ┌──────────────┐
   AI extracts ────▶│ NEEDS_REVIEW │ (default state jika AI tidak yakin)
   item                └──────┬───────┘
                              │
                ┌─────────────┼─────────────┐
                │                           │
                ▼                           ▼
        ┌───────────┐                ┌────────────────┐
        │ IN_SCOPE  │                │ OUT_OF_SCOPE   │
        │           │                │ (reason wajib) │
        └───────────┘                └────────────────┘
```

**Enforcement:** Aturan "reason wajib untuk OUT_OF_SCOPE atau NEEDS_REVIEW" ditegakkan dua kali: (1) di layer validasi respons AI (ai.service.ts), dan (2) di level database via CHECK constraint (reason_required_unless_in_scope).

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

**Catatan Deployment:** Pemisahan 3 lapisan ini dirancang agar tetap valid dan jelas sebagai referensi arsitektur, baik untuk handover tim maupun sebagai dasar penulisan artikel teknis untuk konteks deployment Tencent EdgeOne Makers.
```
