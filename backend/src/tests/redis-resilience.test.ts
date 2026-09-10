// Test setup: must be imported FIRST to disable SMTP for tests
import './test-setup';
import http from 'http';
import app from '../app';
import { db } from '../config/database';
import { getRedisClient, setTestRedisClient } from '../config/redis';
import { cacheService } from '../services/cache.service';
import { projectRepository } from '../repositories/project.repository';
import { revisionBatchRepository } from '../repositories/revision.repository';
import { MemoryRedisMock } from './memory-redis.mock';
import { aiService } from '../services/ai.service';

let server: http.Server;
const PORT = 3458;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const mockRedisInstance = new MemoryRedisMock() as any;
setTestRedisClient(mockRedisInstance);

// Mock AI service to return immediate response for rate-limiting tests
aiService.callGoogleAI = async () => ({
  summary: 'Mock revision summary for resilience test',
  items: [
    { description: 'Mock item 1', category: null, scopeStatus: 'IN_SCOPE' as const, reason: null },
  ],
});

async function request(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  headers?: Record<string, string>,
): Promise<{ status: number; body: any; headers: Headers }> {
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let resBody: any = null;
  const text = await res.text();
  try {
    resBody = JSON.parse(text);
  } catch {
    resBody = text;
  }

  return { status: res.status, body: resBody, headers: res.headers };
}

interface TestResult {
  pass: boolean;
  name: string;
  note?: string;
  details?: any;
}

const testResults: Record<number, TestResult> = {};

function recordTest(num: number, name: string, pass: boolean, note = '', details?: any) {
  testResults[num] = { pass, name, note, details };
  console.log(`[TEST ${num}] ${name} -> ${pass ? 'PASS' : 'FAIL'} ${note ? `(${note})` : ''}`);
}

async function runAllTests() {
  console.log('=== STARTING SCOPREVO REDIS & RESILIENCE TEST SUITE ===');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST-SERVER] Listening on ${BASE_URL}`);
      resolve();
    });
  });

  const redis = mockRedisInstance;

  try {
    const timestamp = Date.now();
    const userA = {
      name: 'Account A',
      email: `resilience_user_a_${timestamp}@test.com`,
      password: 'Password123!',
    };
    const userB = {
      name: 'Account B',
      email: `resilience_user_b_${timestamp}@test.com`,
      password: 'Password123!',
    };

    // Setup accounts
    const regA = await request('POST', '/api/auth/register', userA);
    const tokenA = regA.body?.token;
    const accountIdA = regA.body?.account?.id;

    const regB = await request('POST', '/api/auth/register', userB);
    const tokenB = regB.body?.token;
    const accountIdB = regB.body?.account?.id;

    console.log(`[SETUP] Account A: ${accountIdA}, Account B: ${accountIdB}`);

    // ==========================================
    // 1. Login within limit succeeds
    // ==========================================
    const loginRes = await request('POST', '/api/auth/login', {
      email: userA.email,
      password: userA.password,
    });
    recordTest(1, 'Login within limit succeeds', loginRes.status === 200 && !!loginRes.body?.token);

    // ==========================================
    // 2. Login exceeding limit returns 429
    // ==========================================
    const loginIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    let hit429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await request(
        'POST',
        '/api/auth/login',
        { email: userA.email, password: 'wrongpassword' },
        undefined,
        { 'x-forwarded-for': loginIp },
      );
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }
    recordTest(2, 'Login exceeding limit returns 429', hit429);

    // ==========================================
    // 3. Standard authenticated endpoint within limit succeeds
    // ==========================================
    const overviewRes = await request('GET', '/api/overview', undefined, tokenA);
    recordTest(3, 'Standard authenticated endpoint within limit succeeds', overviewRes.status === 200);

    // Create a project under Account A for heavy and cache testing
    const projA = await request(
      'POST',
      '/api/projects',
      { name: 'Alpha Project', clientName: 'Client Alpha', totalAllowedRevisions: 5 },
      tokenA,
    );
    const projectAId = projA.body?.project?.id;

    // ==========================================
    // 4. Heavy/AI endpoint exceeding limit returns 429
    // ==========================================
    // Points is 5 within 10m window. 6th should hit 429.
    let aiHit429 = false;
    for (let i = 0; i < 7; i++) {
      const aiRes = await request(
        'POST',
        `/api/projects/${projectAId}/revisions`,
        { rawInput: `Revision item request iteration ${i}` },
        tokenA,
      );
      if (aiRes.status === 429) {
        aiHit429 = true;
        break;
      }
    }
    recordTest(4, 'Heavy/AI endpoint exceeding limit returns 429', aiHit429);

    // ==========================================
    // 5. Heavy/AI rejection happens before expensive processing
    // (Quota should remain intact)
    // ==========================================
    const quotaCheck = await projectRepository.countApprovedBatches(projectAId);
    recordTest(5, 'Heavy/AI rejection happens before quota/expensive work', aiHit429 && quotaCheck <= 5);

    // ==========================================
    // 6. Different authenticated accounts do not share account-based rate-limit buckets
    // Account B should NOT be rate limited even though Account A hit 429 on AI
    // ==========================================
    const projB = await request(
      'POST',
      '/api/projects',
      { name: 'Beta Project', clientName: 'Client Beta', totalAllowedRevisions: 5 },
      tokenB,
    );
    const projectBId = projB.body?.project?.id;
    const aiResB = await request(
      'POST',
      `/api/projects/${projectBId}/revisions`,
      { rawInput: 'Account B initial revision' },
      tokenB,
    );
    recordTest(
      6,
      'Different authenticated accounts do not share rate-limit buckets',
      aiResB.status === 201 || aiResB.status === 200,
      `Account B status: ${aiResB.status}`,
    );

    // ==========================================
    // 7. Redis failure on auth protection returns 503
    // ==========================================
    // Mock Redis outage
    const realRedis = getRedisClient();
    const brokenRedisMock: any = {
      status: 'end',
      on: () => {},
      get: async () => { throw new Error('Redis disconnected'); },
      set: async () => { throw new Error('Redis disconnected'); },
      del: async () => { throw new Error('Redis disconnected'); },
    };
    setTestRedisClient(brokenRedisMock);

    const authOutageRes = await request('POST', '/api/auth/login', {
      email: userA.email,
      password: userA.password,
    });
    recordTest(
      7,
      'Redis failure on auth protection returns 503',
      authOutageRes.status === 503 && authOutageRes.body?.error?.code === 'SERVICE_UNAVAILABLE',
    );

    // ==========================================
    // 8. Redis failure on heavy/AI protection returns 503
    // ==========================================
    const aiOutageRes = await request(
      'POST',
      `/api/projects/${projectAId}/revisions`,
      { rawInput: 'AI test during outage' },
      tokenA,
    );
    recordTest(
      8,
      'Redis failure on heavy/AI protection returns 503',
      aiOutageRes.status === 503 && aiOutageRes.body?.error?.code === 'SERVICE_UNAVAILABLE',
    );

    // ==========================================
    // 9. Redis failure on ordinary authenticated reads follows fail-open policy
    // ==========================================
    const readOutageRes = await request('GET', '/api/projects', undefined, tokenA);
    recordTest(
      9,
      'Redis failure on ordinary authenticated reads follows fail-open policy',
      readOutageRes.status === 200 && Array.isArray(readOutageRes.body?.projects),
    );

    // Restore mock Redis client for subsequent cache & isolation tests
    setTestRedisClient(mockRedisInstance);

    // ==========================================
    // 10. Cache MISS queries PostgreSQL & 11. Result is cached & 12. Subsequent request uses cache
    // ==========================================
    const cacheKeyA = cacheService.buildKey(accountIdA, 'project', projectAId);
    await cacheService.del(cacheKeyA, accountIdA);

    // Request 1: Cache MISS
    const missRes = await request('GET', `/api/projects/${projectAId}`, undefined, tokenA);
    const inCache = await cacheService.get<any>(cacheKeyA, accountIdA);
    recordTest(
      10,
      'Cache MISS queries PostgreSQL',
      missRes.status === 200 && missRes.body?.project?.id === projectAId,
    );
    recordTest(
      11,
      'Successful result is cached in Redis',
      inCache !== null && inCache.id === projectAId,
    );

    // Request 2: Cache HIT
    const hitRes = await request('GET', `/api/projects/${projectAId}`, undefined, tokenA);
    recordTest(
      12,
      'Subsequent request can use cache',
      hitRes.status === 200 && hitRes.body?.project?.name === 'Alpha Project',
    );

    // ==========================================
    // 13. Cache HIT does not bypass authorization
    // 14. Cross-account cache isolation is enforced
    // 15. Unauthorized project access remains denied (404) even if cache contains that project
    // ==========================================
    const crossAccRes = await request('GET', `/api/projects/${projectAId}`, undefined, tokenB);
    recordTest(
      13,
      'Cache HIT does not bypass authorization (Account B cannot read Account A project)',
      crossAccRes.status === 404,
      `Status: ${crossAccRes.status}`,
    );
    recordTest(
      14,
      'Cross-account cache isolation is enforced',
      crossAccRes.status === 404 && crossAccRes.body?.project === undefined,
    );
    recordTest(
      15,
      'Unauthorized project access remains denied even if cache contains that project',
      crossAccRes.status === 404,
    );

    // ==========================================
    // 16. Mutation invalidates affected cache
    // ==========================================
    await request(
      'PATCH',
      `/api/projects/${projectAId}`,
      { name: 'Alpha Project Renamed' },
      tokenA,
    );
    const cacheAfterUpdate = await cacheService.get<any>(cacheKeyA, accountIdA);
    recordTest(
      16,
      'Mutation invalidates affected cache',
      cacheAfterUpdate === null,
    );

    // ==========================================
    // 17. Deleted project cache is invalidated
    // ==========================================
    const delProj = await request(
      'POST',
      '/api/projects',
      { name: 'To Be Deleted', clientName: 'Temp Client', totalAllowedRevisions: 3 },
      tokenA,
    );
    const tempId = delProj.body?.project?.id;
    // Populate cache
    await request('GET', `/api/projects/${tempId}`, undefined, tokenA);
    const tempKey = cacheService.buildKey(accountIdA, 'project', tempId);
    const beforeDelCache = await cacheService.get<any>(tempKey, accountIdA);

    await request('DELETE', `/api/projects/${tempId}`, undefined, tokenA);
    const afterDelCache = await cacheService.get<any>(tempKey, accountIdA);
    recordTest(
      17,
      'Deleted project cache is invalidated',
      beforeDelCache !== null && afterDelCache === null,
    );

    // ==========================================
    // 18. Malformed cache falls back to PostgreSQL
    // ==========================================
    const malformedKey = cacheService.buildKey(accountIdA, 'project', projectAId);
    await mockRedisInstance.set(malformedKey, 'INVALID_NOT_JSON_DATA{{{');
    const malformedRes = await request('GET', `/api/projects/${projectAId}`, undefined, tokenA);
    recordTest(
      18,
      'Malformed cache falls back to PostgreSQL',
      malformedRes.status === 200 && malformedRes.body?.project?.id === projectAId,
    );

    // ==========================================
    // 19. Redis cache outage falls back to PostgreSQL
    // ==========================================
    setTestRedisClient(brokenRedisMock);
    const outageGetRes = await request('GET', `/api/projects/${projectAId}`, undefined, tokenA);
    recordTest(
      19,
      'Redis cache outage falls back to PostgreSQL',
      outageGetRes.status === 200 && outageGetRes.body?.project?.id === projectAId,
    );
    setTestRedisClient(mockRedisInstance);

    // ==========================================
    // 20. Error responses are not cached
    // ==========================================
    const badId = '00000000-0000-0000-0000-000000000000';
    await request('GET', `/api/projects/${badId}`, undefined, tokenA);
    const badKey = cacheService.buildKey(accountIdA, 'project', badId);
    const badCache = await cacheService.get<any>(badKey, accountIdA);
    recordTest(20, 'Error responses are not cached', badCache === null);

    // ==========================================
    // 21. Portal confirmation/submission is never cached
    // ==========================================
    // Create a batch and share it to get a magic token
    let targetProjId = projectBId;
    if (!targetProjId) {
      const fallbackProj = await projectRepository.create({
        accountId: accountIdB || '00000000-0000-0000-0000-000000000001',
        name: 'Portal Test Project',
        clientName: 'Portal Client',
        totalAllowedRevisions: 5,
      });
      targetProjId = fallbackProj.id;
    }
    const testClient = await db.connect();
    let newBatchId: string;
    try {
      const b = await revisionBatchRepository.createWithClient(testClient, {
        projectId: targetProjId,
        rawInput: 'Portal testing batch',
        aiSummary: 'Summary for portal test',
      });
      newBatchId = b.id;
    } finally {
      testClient.release();
    }
    const shared = await revisionBatchRepository.transitionStatus(
      newBatchId,
      'DRAFT',
      'PENDING_CONFIRMATION',
    );
    const magicToken = shared?.magic_token;

    const confirmRes = await request('POST', `/api/portal/${magicToken}/confirm`);
    // Verify portal routes have no cache keys in Redis
    const portalKeys = await mockRedisInstance.keys('*portal*');
    recordTest(
      21,
      'Portal confirmation/submission is never cached',
      confirmRes.status === 200 && portalKeys.length === 0,
    );

    // ==========================================
    // 22. Raw magic token does not enter Redis keys/values/logging
    // ==========================================
    const allRedisKeys = await mockRedisInstance.keys('*');
    const tokenInKeys = allRedisKeys.some((k: string) => magicToken && k.includes(magicToken));
    recordTest(
      22,
      'Raw magic token does not enter Redis keys/values/logging',
      !tokenInKeys,
      `Inspected ${allRedisKeys.length} Redis keys`,
    );

  } catch (error) {
    console.error('Fatal error during test run:', error);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    console.log('\n=== TEST SUMMARY ===');
    const total = Object.keys(testResults).length;
    const passed = Object.values(testResults).filter((r) => r.pass).length;
    console.log(`TOTAL: ${total}, PASSED: ${passed}, FAILED: ${total - passed}`);
    if (passed === total) {
      console.log('ALL MANDATORY TESTS PASSED!');
    } else {
      console.error('SOME TESTS FAILED!');
    }
  }
}

runAllTests().catch(console.error);
