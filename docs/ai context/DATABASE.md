# DATABASE.md — SCOPREVO Relational Data Model

Target: PostgreSQL via Supabase, accessed from an Express.js backend (deployed as an EdgeOne Cloud Function). This model is genuinely relational — foreign keys, enums, and quota counts that depend on filtered aggregates — which is why Postgres was chosen over EdgeOne's native KV/Blob storage.

---

## Entity Relationship Diagram (text form)

```
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│   Account   │ 1   * │   Project   │ 1   * │   RevisionBatch   │
│ (freelancer/│──────▶│             │──────▶│  (satu submission  │
│  agency)    │       │             │       │   feedback klien)  │
└─────────────┘       └─────────────┘       └────────┬──────────┘
                                                       │ 1
                                                       │
                                                       │ *
                                              ┌────────▼──────────┐
                                              │   RevisionItem     │
                                              │ (satu task hasil   │
                                              │  ekstraksi AI)     │
                                              └─────────────────────┘
```

Relasi:
- Satu **Account** punya banyak **Project**.
- Satu **Project** punya banyak **RevisionBatch** (setiap kali klien kirim feedback baru = 1 batch).
- Satu **RevisionBatch** punya banyak **RevisionItem** (hasil ekstraksi AI, satu task per baris).
- **Project.usedRevisions** dihitung dari jumlah RevisionBatch yang sudah **APPROVED saja** — DRAFT dan PENDING_CONFIRMATION tidak mengurangi kuota. Ini penting supaya freelancer tidak dirugikan kalau klien belum sempat konfirmasi.

---

## Entities

### Account
Freelancer / pemilik agency — pengguna utama yang login.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | String | |
| email | String, unique | |
| passwordHash | String | |
| createdAt | DateTime | |

### Project
Satu proyek dengan satu klien.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| accountId | UUID (FK → Account) | |
| name | String | e.g. "Landing Page PT ABC" |
| clientName | String | |
| totalAllowedRevisions | Int | default 3 |
| createdAt | DateTime | |

Derived (dihitung, tidak disimpan langsung):
- `usedRevisions` = count(RevisionBatch where status = APPROVED)
- `remainingRevisions` = totalAllowedRevisions − usedRevisions

### RevisionBatch
Satu submission feedback dari klien (satu sesi paste teks).

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| projectId | UUID (FK → Project) | |
| rawInput | Text | teks mentah yang di-paste |
| aiSummary | Text | ringkasan hasil AI |
| status | Enum | DRAFT / PENDING_CONFIRMATION / APPROVED |
| magicToken | UUID, unique | dipakai di URL `/portal/:token` |
| createdAt | DateTime | |

### RevisionItem
Satu task hasil ekstraksi AI dari sebuah batch.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| revisionBatchId | UUID (FK → RevisionBatch) | |
| description | Text | e.g. "Increase CTA button size" |
| category | String | e.g. "UI refinement", "new_feature" |
| scopeStatus | Enum | IN_SCOPE / OUT_OF_SCOPE / NEEDS_REVIEW |
| reason | Text, nullable | wajib diisi kalau OUT_OF_SCOPE atau NEEDS_REVIEW |
| isCompleted | Boolean | default false — field ada di model, tapi TIDAK ada UI/checkbox di MVP |

---

## Enums

```
RevisionStatus:
  DRAFT
  PENDING_CONFIRMATION
  APPROVED

ScopeStatus:
  IN_SCOPE
  OUT_OF_SCOPE
  NEEDS_REVIEW
```

---

## Reference schema — PostgreSQL (raw DDL)

```sql
CREATE TYPE revision_status AS ENUM ('DRAFT', 'PENDING_CONFIRMATION', 'APPROVED');
CREATE TYPE scope_status AS ENUM ('IN_SCOPE', 'OUT_OF_SCOPE', 'NEEDS_REVIEW');

CREATE TABLE account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES account(id),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  total_allowed_revisions INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revision_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id),
  raw_input TEXT NOT NULL,
  ai_summary TEXT,
  status revision_status NOT NULL DEFAULT 'DRAFT',
  magic_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revision_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_batch_id UUID NOT NULL REFERENCES revision_batch(id),
  description TEXT NOT NULL,
  category TEXT,
  scope_status scope_status NOT NULL DEFAULT 'NEEDS_REVIEW',
  reason TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT reason_required_unless_in_scope CHECK (
    scope_status = 'IN_SCOPE' OR (reason IS NOT NULL AND reason <> '')
  )
);
```

Catatan: `CHECK` constraint di atas menegakkan aturan "reason wajib kalau OUT_OF_SCOPE atau NEEDS_REVIEW" di level database, bukan cuma di aplikasi — ini penting karena batch AI-generated harus tervalidasi sebelum tersimpan.

## Reference schema — Drizzle ORM (TypeScript, untuk Express backend)

```ts
import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const revisionStatus = pgEnum('revision_status', ['DRAFT', 'PENDING_CONFIRMATION', 'APPROVED']);
export const scopeStatus = pgEnum('scope_status', ['IN_SCOPE', 'OUT_OF_SCOPE', 'NEEDS_REVIEW']);

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const project = pgTable('project', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => account.id),
  name: text('name').notNull(),
  clientName: text('client_name').notNull(),
  totalAllowedRevisions: integer('total_allowed_revisions').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const revisionBatch = pgTable('revision_batch', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => project.id),
  rawInput: text('raw_input').notNull(),
  aiSummary: text('ai_summary'),
  status: revisionStatus('status').notNull().default('DRAFT'),
  magicToken: uuid('magic_token').notNull().unique().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const revisionItem = pgTable('revision_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  revisionBatchId: uuid('revision_batch_id').notNull().references(() => revisionBatch.id),
  description: text('description').notNull(),
  category: text('category'),
  scopeStatus: scopeStatus('scope_status').notNull().default('NEEDS_REVIEW'),
  reason: text('reason'),
  isCompleted: boolean('is_completed').notNull().default(false),
});
```

---

## Connection note — Supabase + serverless (unverified, must confirm before build)

Express running inside an EdgeOne Cloud Function is serverless: each invocation may be a cold start, and a naive long-lived `pg.Pool` can exhaust Supabase's direct connection limit under concurrent invocations. Supabase provides **Supavisor** (connection pooler) for exactly this scenario — use the pooled connection string (transaction mode) rather than the direct database connection string when connecting from the Cloud Function. **This has not yet been tested end-to-end in this project** — confirm it works before building Stage 3 (the AI write path), since that's the highest-traffic write endpoint.