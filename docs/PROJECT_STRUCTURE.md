# SCOPREVO — Project Structure & Clean Code Guidelines
Auto-generated: 2026-08-27
Version: 1.0

## 1. Actual Structure (Current)

### Frontend
```
frontend/src/
├── api/
│   └── client.ts
├── assets/
│   ├── hero.png
│   ├── vite.svg
│   └── vue.svg
├── components/
│   ├── features/          # empty scaffold
│   └── ui/                # empty scaffold
├── composables/           # empty scaffold
├── constants/             # empty scaffold
├── layouts/
│   └── DashboardLayout.vue
├── router/
│   └── index.ts
├── stores/
│   └── auth.ts
├── types/
│   └── api.ts
├── utils/                 # empty scaffold
├── views/
│   ├── auth/              # empty scaffold
│   ├── error/             # empty scaffold
│   ├── portal/            # empty scaffold
│   ├── BatchDetailView.vue
│   ├── DashboardView.vue
│   ├── LoginView.vue
│   ├── NotFoundView.vue
│   ├── ProjectDetailView.vue
│   ├── ProjectsView.vue
│   └── RegisterView.vue
├── App.vue
├── main.ts
└── style.css
```

### Backend
```
backend/src/
├── app.d.ts
├── app.ts
├── server.d.ts
├── server.ts
├── config/
│   ├── database.ts
│   └── env.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── project.controller.ts
│   └── revision.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validate.middleware.ts
├── repositories/
│   ├── account.repository.ts
│   ├── project.repository.ts
│   └── revision.repository.ts
├── routes/
│   ├── auth.routes.ts
│   ├── batch.routes.ts
│   ├── overview.routes.ts
│   ├── project.routes.ts
│   └── revision.routes.ts
├── services/
│   ├── ai.service.ts
│   ├── auth.service.ts
│   ├── overview.service.ts
│   ├── project.service.ts
│   └── revision.service.ts
├── tests/
│   └── day2.test.ts
├── types/
│   ├── db.types.ts
│   └── express.d.ts
└── validators/
    ├── ai-response.schema.ts
    ├── auth.schema.ts
    ├── project.schema.ts
    └── revision.schema.ts
```

## 2. Target Clean Architecture

### Frontend
```
frontend/src/
├── api/              # API client & service modules (client.ts, auth.service.ts, etc.)
├── assets/           # Static assets, global CSS
├── components/
│   ├── ui/           # ATOMIC: BaseButton, BaseInput, BaseBadge, BaseCard, BaseModal
│   └── features/     # DOMAIN: ProjectCard, BatchItem, QuotaProgress, ScopeBadge
├── composables/      # Reusable Vue logic: useAuth, useProject, useBatch, useQuota
├── constants/        # Magic strings/enums: scope-status.ts, batch-status.ts, routes.ts
├── layouts/          # DashboardLayout, PublicLayout
├── router/           # Vue Router + navigation guards
├── stores/           # Pinia stores (auth.ts, project.ts)
├── types/            # TypeScript interfaces (api.ts, project.ts, batch.ts)
├── utils/            # Pure helpers: date.ts, quota.ts, validators.ts
├── views/
│   ├── auth/         # LoginView.vue, RegisterView.vue
│   ├── dashboard/    # DashboardView.vue
│   ├── projects/     # ProjectsView.vue, ProjectDetailView.vue
│   ├── batches/      # BatchDetailView.vue
│   ├── portal/       # Client Portal (M3.4) — public, no sidebar
│   └── error/        # NotFoundView.vue
├── App.vue
└── main.ts
```

### Backend
```
backend/src/
├── config/           # DB pool, env validation
├── controllers/      # HTTP handlers
├── middleware/       # Auth, error, validation
├── routes/           # Route definitions
├── services/         # Business logic + AI integration
├── repositories/     # Database access layer
├── types/            # Shared TS types
├── utils/            # Helpers, JWT, password
├── validators/       # Zod schemas
└── index.ts          # Entry point
```

## 3. Migration Notes

| Folder | Status | Action |
|--------|--------|--------|
| frontend/src/api/ | ✅ Correct | No change needed |
| frontend/src/assets/ | ✅ Correct | No change needed |
| frontend/src/components/ | ✅ Correct | Subfolders ui/ and features/ created as empty scaffolds |
| frontend/src/composables/ | 🔴 Missing | Created as empty scaffold |
| frontend/src/constants/ | 🔴 Missing | Created as empty scaffold |
| frontend/src/layouts/ | ✅ Correct | No change needed |
| frontend/src/router/ | ✅ Correct | No change needed |
| frontend/src/stores/ | ✅ Correct | No change needed |
| frontend/src/types/ | ✅ Correct | No change needed |
| frontend/src/utils/ | 🔴 Missing | Created as empty scaffold |
| frontend/src/views/ | ✅ Correct | Subfolders auth/, error/, portal/ created as empty scaffolds |
| backend/src/config/ | ✅ Correct | No change needed |
| backend/src/controllers/ | ✅ Correct | No change needed |
| backend/src/middleware/ | ✅ Correct | No change needed |
| backend/src/repositories/ | ✅ Correct | No change needed |
| backend/src/routes/ | ✅ Correct | No change needed |
| backend/src/services/ | ✅ Correct | No change needed |
| backend/src/tests/ | ✅ Correct | No change needed |
| backend/src/types/ | ✅ Correct | No change needed |
| backend/src/validators/ | ✅ Correct | No change needed |

## 4. AI Agent Rules (MUST FOLLOW)

When generating code for SCOPREVO, AI agents MUST:

- **components/ui/** → Hanya komponen atomik (Button, Input, Badge). Tidak boleh ada business logic.
- **components/features/** → Komponen domain (ProjectCard, BatchItem). Boleh pakai composables.
- **composables/** → Logic reuse Vue (fetch, state lokal). Jangan taruh di views/.
- **constants/** → Semua string enum/status WAJIB disini. Jangan hardcode di template.
- **utils/** → Pure functions (formatDate, calculatePercentage). No Vue imports.
- **views/** → Hanya layout page + wiring. Logic ke composables, UI ke components/.
- **No `any` type** — pakai `unknown` + narrowing.
- **No new dependencies** tanpa approval GPT.
- **Design System** — baca docs/architecture/DESIGN_SYSTEM_BRUTALIST.md v2.1.
- **API Contract** — baca docs/architecture/APPLICATION_ARCHITECTURE.md.
