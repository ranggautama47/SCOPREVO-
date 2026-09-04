<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient, ApiError } from '../../api/client';
import type { RevisionBatchDetail, RevisionBatchStatus, ScopeStatus, ShareBatchResponse } from '../../types/api';

const route = useRoute();
const router = useRouter();

const batchId = computed(() => route.params.id as string);

const batchData = ref<RevisionBatchDetail | null>(null);
const isLoading = ref(true);
const notFound = ref(false);
const networkError = ref(false);

// Share state
const isSharing = ref(false);
const showModal = ref(false);
const portalUrl = ref('');
const shareError = ref<string | null>(null);
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');

async function fetchBatchDetail(id: string) {
  isLoading.value = true;
  notFound.value = false;
  networkError.value = false;
  try {
    const res = await apiClient.batches.getDetail(id);
    batchData.value = res.batch;
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.code === 'NOT_FOUND' || err.status === 404)) {
      notFound.value = true;
    } else {
      networkError.value = true;
    }
  } finally {
    isLoading.value = false;
  }
}

function goBackToProject() {
  if (batchData.value?.projectId) {
    router.push(`/projects/${batchData.value.projectId}`);
  } else {
    router.push('/projects');
  }
}

function retryFetch() {
  fetchBatchDetail(batchId.value);
}

function formatCreatedDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getBatchStatusBadgeClass(status: RevisionBatchStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-[#E5E7EB] text-[#1A1A1A]';
    case 'PENDING_CONFIRMATION':
      return 'bg-[#FDFFB6] text-[#1A1A1A]';
    case 'APPROVED':
      return 'bg-[#DCFCE7] text-[#166534]';
    default:
      return 'bg-[#E5E7EB] text-[#1A1A1A]';
  }
}

function getScopeStatusBadgeClass(status: ScopeStatus): string {
  switch (status) {
    case 'IN_SCOPE':
      return 'bg-[#DCFCE7] text-[#166534]';
    case 'OUT_OF_SCOPE':
      return 'bg-[#FEE2E2] text-[#991B1B]';
    case 'NEEDS_REVIEW':
      return 'bg-[#FDFFB6] text-[#1A1A1A]';
    default:
      return 'bg-[#E5E7EB] text-[#1A1A1A]';
  }
}

function shouldShowReason(item: { scopeStatus: ScopeStatus; reason: string | null }): boolean {
  return item.scopeStatus !== 'IN_SCOPE' && !!item.reason && item.reason.trim().length > 0;
}

const inScopeCount = computed(() => {
  if (!batchData.value?.items) return 0;
  return batchData.value.items.filter((item) => item.scopeStatus === 'IN_SCOPE').length;
});

const outOfScopeCount = computed(() => {
  if (!batchData.value?.items) return 0;
  return batchData.value.items.filter((item) => item.scopeStatus === 'OUT_OF_SCOPE').length;
});

async function handleShare() {
  if (!batchData.value || isSharing.value) return;
  isSharing.value = true;
  shareError.value = null;
  try {
    const res: ShareBatchResponse = await apiClient.batches.share(batchId.value);
    const magicToken = res.batch.magicToken;
    portalUrl.value = `${window.location.origin}/portal/${magicToken}`;
    showModal.value = true;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (err.code === 'INVALID_STATE' || err.status === 409) {
        await fetchBatchDetail(batchId.value);
        isSharing.value = false;
        return;
      }
      shareError.value = err.status && err.status >= 500
        ? 'Server error. Please try again later.'
        : 'Failed to generate magic link. Please try again.';
    } else {
      shareError.value = 'An unexpected error occurred.';
    }
  } finally {
    isSharing.value = false;
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(portalUrl.value);
    copyState.value = 'copied';
    setTimeout(() => { copyState.value = 'idle'; }, 2000);
    return true;
  } catch {
    copyState.value = 'failed';
    setTimeout(() => { copyState.value = 'idle'; }, 3000);
    return false;
  }
}

function closeModal() {
  showModal.value = false;
  portalUrl.value = '';
  fetchBatchDetail(batchId.value);
}

onMounted(() => {
  fetchBatchDetail(batchId.value);
});

watch(
  () => route.params.id,
  (newId) => {
    if (typeof newId === 'string') {
      fetchBatchDetail(newId);
    }
  }
);
</script>

<template>
  <section class="bg-[#FAFAF9] min-h-screen">
    <!-- ── 1. TOP BAR ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between border-b-2 border-[#1A1A1A] px-8 md:px-12 py-4 bg-[#FAFAF9]">
      <button
        @click="goBackToProject"
        class="font-mono text-xs uppercase tracking-widest text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 transition-all duration-100 cursor-pointer"
      >
        ← Back to Project
      </button>

      <div v-if="batchData">
        <span
          :class="getBatchStatusBadgeClass(batchData.status)"
          class="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-none border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]"
        >
          [{{ batchData.status.replace(/_/g, ' ') }}]
        </span>
      </div>
    </div>

    <!-- ── LOADING ──────────────────────────────────────────────── -->
    <div
      v-if="isLoading"
      class="flex items-center gap-2 font-mono text-sm text-[#1A1A1A]/60 px-8 md:px-12 py-12"
    >
      <span class="animate-pulse">■</span>
      <span>Loading batch analysis...</span>
    </div>

    <!-- ── NOT FOUND ────────────────────────────────────────────── -->
    <div v-else-if="notFound" class="px-8 md:px-12 py-12 space-y-4">
      <p class="font-editorial text-xl font-normal leading-[1.3] text-[#1A1A1A]/60">
        Batch not found or access denied.
      </p>
      <router-link
        to="/projects"
        class="inline-block font-ui text-sm text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2"
      >
        ← Back to Projects
      </router-link>
    </div>

    <!-- ── NETWORK ERROR ────────────────────────────────────────── -->
    <div v-else-if="networkError" class="px-8 md:px-12 py-12 space-y-4">
      <p class="font-editorial text-xl font-normal leading-[1.3] text-[#1A1A1A]/60">
        Unable to load batch data.
      </p>
      <button
        @click="retryFetch"
        class="inline-block bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
      >
        Retry
      </button>
    </div>

    <!-- ── MAIN CONTENT ─────────────────────────────────────────── -->
    <div v-else-if="batchData" class="px-8 md:px-12 py-8">
      <!-- ── 2. HEADER ─────────────────────────────────────────── -->
      <div class="border-b-2 border-[#1A1A1A] pb-4 mb-8">
        <h1 class="font-editorial text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight text-[#1A1A1A]">
          Batch #{{ batchData.id.slice(0, 3) }} — Revision Feedback
        </h1>
        <p class="font-body text-base leading-[1.6] text-[#1A1A1A]/60 mt-2">
          Analyzed {{ formatCreatedDate(batchData.createdAt) }}
        </p>
      </div>

      <!-- ── TWO-COLUMN SPLIT: SUMMARY + STATS (LEFT) | ITEMS (RIGHT) ── -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        
        <!-- LEFT COLUMN: AI Summary & Stat Counters -->
        <div class="lg:col-span-4 space-y-6">
          <!-- ── 3. AI SUMMARY CARD ─────────────────────────────── -->
          <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none p-6 transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]">
            <p class="font-mono text-[11px] uppercase tracking-wider text-[#1A1A1A]/60 mb-3 font-bold border-b-2 border-[#1A1A1A] pb-1 inline-block">
              AI Summary
            </p>
            <p class="font-body text-base leading-[1.6] text-[#1A1A1A] mt-2">
              {{ batchData.summary || 'No summary generated for this batch.' }}
            </p>
          </div>

          <!-- ── STAT COUNTER CARDS (BRUTALIST HOVER & SHADOWS) ── -->
          <div class="grid grid-cols-2 gap-4">
            <!-- In Scope Card -->
            <div class="bg-[#DCFCE7] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none p-4 text-center transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]">
              <p class="font-mono text-4xl font-bold text-[#166534] leading-none mb-2">
                {{ inScopeCount }}
              </p>
              <p class="font-mono text-[10px] uppercase tracking-widest text-[#166534] font-bold border-t-2 border-[#1A1A1A] pt-2">
                IN SCOPE
              </p>
            </div>

            <!-- Out of Scope Card -->
            <div class="bg-[#FEE2E2] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none p-4 text-center transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]">
              <p class="font-mono text-4xl font-bold text-[#991B1B] leading-none mb-2">
                {{ outOfScopeCount }}
              </p>
              <p class="font-mono text-[10px] uppercase tracking-widest text-[#991B1B] font-bold border-t-2 border-[#1A1A1A] pt-2">
                OUT OF SCOPE
              </p>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: 4. REVISION ITEMS LIST (BRUTALIST HOVER & SHADOWS) ── -->
        <div class="lg:col-span-8 space-y-5">
          <div
            v-for="item in batchData.items"
            :key="item.id"
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none p-6 transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]"
          >
            <!-- Item Header: Category Tag (Left) + Scope Badge (Right) -->
            <div class="flex items-center justify-between gap-4 mb-4 pb-3 border-b-2 border-[#1A1A1A]/10">
              <span
                v-if="item.category"
                class="inline-block bg-[#DCCCFF] text-[#1A1A1A] border-2 border-[#1A1A1A] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded-none font-bold shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                [{{ item.category }}]
              </span>
              <span v-else class="inline-block bg-[#DCCCFF] text-[#1A1A1A] border-2 border-[#1A1A1A] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded-none font-bold shadow-[2px_2px_0px_0px_#1A1A1A]">
                [GENERAL]
              </span>

              <span
                :class="getScopeStatusBadgeClass(item.scopeStatus)"
                class="px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded-none font-bold border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                [{{ item.scopeStatus.replace(/_/g, ' ') }}]
              </span>
            </div>

            <!-- Item Description -->
            <p class="font-body text-base text-[#1A1A1A] leading-[1.6] whitespace-pre-line font-medium">
              {{ item.description }}
            </p>

            <!-- Reason Box for OUT_OF_SCOPE & NEEDS_REVIEW -->
            <div
              v-if="shouldShowReason(item)"
              class="border-l-4 border-[#1A1A1A] bg-[#FDFFB6]/30 p-3 mt-4"
            >
              <p class="font-body text-sm text-[#1A1A1A] leading-[1.5]">
                <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mr-1">REASON:</span>
                <span class="italic">{{ item.reason }}</span>
              </p>
            </div>
          </div>

          <!-- Empty state for items -->
          <div
            v-if="batchData.items.length === 0"
            class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/40 p-12 rounded-none text-center"
          >
            <p class="font-editorial text-xl text-[#1A1A1A]/60">No items extracted</p>
            <p class="font-body text-sm text-[#1A1A1A]/40 mt-2">
              The AI could not identify structured revisions from this feedback.
            </p>
          </div>
        </div>
      </div>

      <!-- ── 5. BOTTOM ACTIONS ─────────────────────────────────── -->
      <div class="border-t-2 border-[#1A1A1A] pt-6 flex justify-end">
        <!-- DRAFT → GENERATE MAGIC LINK -->
        <button
          v-if="batchData.status === 'DRAFT'"
          @click="handleShare"
          :disabled="isSharing"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          <span>⚭</span>
          <span>{{ isSharing ? 'GENERATING LINK...' : 'GENERATE MAGIC LINK' }}</span>
        </button>

        <!-- PENDING_CONFIRMATION → VIEW PORTAL -->
        <button
          v-else-if="batchData.status === 'PENDING_CONFIRMATION' && batchData.magicToken"
          @click="router.push(`/portal/${batchData.magicToken}`)"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer flex items-center gap-2"
        >
          <span>↗</span>
          <span>VIEW PORTAL</span>
        </button>

        <!-- PENDING without magicToken (edge case) -->
        <span
          v-else-if="batchData.status === 'PENDING_CONFIRMATION' && !batchData.magicToken"
          :class="getBatchStatusBadgeClass(batchData.status)"
          class="px-3 py-1 font-mono text-xs uppercase rounded-none border-2 border-[#1A1A1A]"
        >
          {{ batchData.status.replace(/_/g, ' ') }}
        </span>
      </div>

      <!-- Share Error -->
      <div v-if="shareError" class="mt-4 border-2 border-[#E63946] bg-[#FEE2E2] p-4 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A]">
        <p class="font-ui text-sm uppercase text-[#991B1B] mb-1 font-bold">{{ shareError }}</p>
        <button
          @click="handleShare"
          class="mt-2 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-xs uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- ── MAGIC LINK MODAL ────────────────────────────────────── -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 max-w-lg w-full rounded-none shadow-[8px_8px_0px_0px_#1A1A1A]">
        <div class="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3 mb-4">
          <h2 class="font-editorial text-2xl font-normal text-[#1A1A1A]">
            Magic Link Generated
          </h2>
          <button
            @click="closeModal"
            class="font-mono text-sm font-bold text-[#1A1A1A] hover:opacity-70 cursor-pointer"
          >
            [✕]
          </button>
        </div>

        <p class="font-body text-sm text-[#1A1A1A]/80 leading-[1.6] mb-4">
          Share this link with your client. They can review and confirm the scope without needing to log in.
        </p>

        <div class="flex items-center gap-2 mb-6">
          <input
            type="text"
            readonly
            :value="portalUrl"
            class="flex-1 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-3 py-2 font-mono text-xs rounded-none outline-none select-all"
          />
          <button
            @click="copyToClipboard"
            class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 shrink-0 cursor-pointer"
          >
            {{ copyState === 'copied' ? 'COPIED!' : 'COPY' }}
          </button>
        </div>

        <div class="flex justify-end">
          <button
            @click="closeModal"
            class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-2.5 font-ui text-xs font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all duration-100 cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  </section>
</template>