# Known Issues

## Stable Bugs (NOT flaky)

### TEST 1-5: Revision creation fails consistently
- **Status**: Stable FAIL (not flaky)
- **Affects**: Day 2 suite TEST 1, TEST 2, TEST 3, TEST 4, TEST 5
- **Symptom**: POST `/api/projects/:id/revisions` returns non-201 status
- **Root cause**: Likely AI provider API key misconfiguration or database state issue at project creation
- **Phase**: Present since Day 2 baseline
- **Fix needed**: Yes — investigate API key env vars and project creation flow

### TEST 20: Batch list retrieval fails consistently
- **Status**: Stable FAIL (not flaky)
- **Affects**: Day 2 suite TEST 20
- **Symptom**: GET `/api/projects/:id/batches` returns unexpected response
- **Root cause**: Likely related to same DB state issue as TEST 1-5
- **Phase**: Present since Day 2 baseline
- **Fix needed**: Yes — investigate batch list query and test data isolation

## Fixed Issues

### TEST 29: magicToken leaked in GET /api/batches/:id response (HOTFIX)
- **Status**: FIXED — TEST 29 now PASS
- **Root cause**: `toBatchDetailDTO()` in `revision.service.ts` included `magicToken` in the response DTO, violating §3.2 contract
- **Fix**: Removed `magicToken` from `RevisionBatchDetailDTO` interface and `toBatchDetailDTO()` transform
- **Side effect**: Frontend `BatchDetailView.vue` read `batchData.magicToken` from detail response — also fixed by using `portalUrl` ref from share endpoint instead
- **Commit**: Phase 2E hotfix (separate commit from 2E feature changes)

## Pre-Existing Flakiness Confirmed

### TEST 1-5 and TEST 20 — NOT flaky, they are stable bugs
After running the Day 2 suite three times, TEST 1-5 and TEST 20 consistently FAIL in all runs. They are stable bugs, not test isolation flakiness.
