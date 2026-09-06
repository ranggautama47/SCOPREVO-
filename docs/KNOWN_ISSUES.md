# Known Issues

## Fixed Issues

### TEST 29: magicToken leaked in GET /api/batches/:id response (HOTFIX)
- **Status**: FIXED — TEST 29 now PASS
- **Root cause**: `toBatchDetailDTO()` in `revision.service.ts` included `magicToken` in the response DTO, violating §3.2 contract
- **Fix**: Removed `magicToken` from `RevisionBatchDetailDTO` interface and `toBatchDetailDTO()` transform
- **Side effect**: Frontend `BatchDetailView.vue` read `batchData.magicToken` from detail response — also fixed by using `portalUrl` ref from share endpoint instead
- **Commit**: Phase 2E hotfix

### TEST 1-5 and TEST 20: LLM provider downtime causing AI_PROCESSING_FAILED
- **Status**: RESOLVED — all 34/34 green since 2G
- **Root cause**: LLM provider API keys were unreachable, causing all AI-dependent tests to fail
- **Fix**: No code change needed — provider recovered (PRIMARY 4/4 HTTP 200)
- **Phase**: Present since Day 2 baseline, resolved after LLM provider recovery

## Pre-Existing Flakiness Confirmed

### TEST 1-5 and TEST 20 — were previously "stable bugs"
 These were actually LLM provider downtime issues, not code bugs. After LLM provider recovery, all 34/34 tests pass consistently.

## Phase 2E.1 Notes

### Document context integration (buildDocumentContext)
- Added to `revision.service.ts` — wires project document context into AI analysis
- When `env.ENABLE_PROJECT_CONTEXT === true`: fetches completed documents, builds context string, passes to `extractRevisions(rawInput, context)`
- Document fetch failure → graceful fallback to no-context AI call
- Flag OFF → exact same behavior as before (zero change)
