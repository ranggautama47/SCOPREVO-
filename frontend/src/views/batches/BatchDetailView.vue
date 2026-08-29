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
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBatchStatusBadgeClass(status: RevisionBatchStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-[#E5E7EB] text-[#1A1A1A] border-2 border-[#1A1A1A]';
    case 'PENDING_CONFIRMATION':
      return 'bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A]';
    case 'APPROVED':
      return 'bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A]';
    default:
      return 'bg-[#E5E7EB] text-[#1A1A1A] border-2 border-[#1A1A1A]';
  }
}

function getScopeStatusBadgeClass(status: ScopeStatus): string {
  switch (status) {
    case 'IN_SCOPE':
      return 'bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A]';
    case 'OUT_OF_SCOPE':
      return 'bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A]';
    case 'NEEDS_REVIEW':
      return 'bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A]';
    default:
      return 'bg-[#E5E7EB] text-[#1A1A1A] border-2 border-[#1A1A1A]';
  }
}

function shouldShowReason(item: { scopeStatus: ScopeStatus; reason: string | null }): boolean {
  return item.scopeStatus !== 'IN_SCOPE' && !!item.reason && item.reason.trim().length > 0;
}

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
        // Re-fetch to get updated status, do not show error
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

async function copyMagicLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

function closeModal() {
  showModal.value = false;
  portalUrl.value = '';
  fetchBatchDetail(batchId.value);
}

function getPortalOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

function getMagicLinkUrl(token: string | null | undefined): string {
  if (!token) return '';
  return `${getPortalOrigin()}/portal/${token}`;
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
  <section class="p-8 md:p-12">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center gap-2 font-mono text-sm text-[#1A1A1A]/60">
      <span class="animate-pulse">■</span>
      <span>Loading batch data...</span>
    </div>

    <!-- Not Found State -->
    <div v-else-if="notFound" class="space-y-4">
      <p class="font-editorial text-xl font-normal leading-[1.3] text-[#1A1A1A]/60">Batch not found or access denied.</p>
      <router-link
        to="/projects"
        class="inline-block font-ui text-sm text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2"
      >
        ← Back to Projects
      </router-link>
    </div>

    <!-- Network Error State -->
    <div v-else-if="networkError" class="space-y-4">
      <p class="font-editorial text-xl font-normal leading-[1.3] text-[#1A1A1A]/60">Unable to load batch data.</p>
      <button
        @click="retryFetch"
        class="inline-block bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
      >
        Retry
      </button>
    </div>

    <!-- Batch Detail -->
    <div v-else-if="batchData" class="space-y-6">
      <!-- Header Section -->
      <div class="border-b-2 border-[#1A1A1A] pb-6">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 class="font-editorial text-3xl font-normal leading-[1.2] tracking-tight">Revision Batch</h1>
            <div class="flex flex-wrap items-center gap-3 mt-3">
              <span class="font-mono text-xs text-[#1A1A1A]/60">{{ formatCreatedDate(batchData.createdAt) }}</span>
              <span
                :class="getBatchStatusBadgeClass(batchData.status) + ' px-3 py-1 font-mono text-xs uppercase rounded-none'"
              >
                {{ batchData.status.replace('_', ' ') }}
              </span>
            </div>
          </div>
          <button
            @click="goBackToProject"
            class="font-ui text-sm text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2"
          >
            ← Back to Project
          </button>
        </div>
      </div>

      <!-- AI Summary Card -->
      <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-6 rounded-none mb-6">
        <h2 class="font-editorial text-2xl font-normal leading-[1.3] text-[#1A1A1A] mb-3">AI Summary</h2>
        <p v-if="batchData.summary" class="font-body text-base leading-[1.6] text-[#1A1A1A]">{{ batchData.summary }}</p>
        <p v-else class="font-body text-sm text-[#1A1A1A]/40">No summary available.</p>
      </div>

      <!-- Categorized Revision Items -->
      <div>
        <h2 class="font-editorial text-2xl font-normal leading-[1.3] text-[#1A1A1A] mb-4">Categorized Revision Items</h2>

        <div v-if="batchData.items.length === 0" class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center">
          <p class="font-editorial text-xl text-[#1A1A1A]/60">No items extracted</p>
          <p class="font-body text-sm text-[#1A1A1A]/40 mt-2">The AI could not identify structured revisions from this feedback.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="item in batchData.items"
            :key="item.id"
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-5 rounded-none"
          >
            <div class="flex items-center gap-2 mb-2">
              <span
                v-if="item.category"
                class="bg-[#DCCCFF] text-[#1A1A1A] border border-[#1A1A1A] px-3 py-1 font-mono text-xs uppercase tracking-wide rounded-none"
              >
                {{ item.category }}
              </span>
              <span
                :class="getScopeStatusBadgeClass(item.scopeStatus) + ' px-3 py-1 font-mono text-xs uppercase rounded-none'"
              >
                {{ item.scopeStatus.replace('_', ' ') }}
              </span>
            </div>

            <p class="font-body text-base text-[#1A1A1A] my-2">{{ item.description }}</p>

            <div
              v-if="shouldShowReason(item)"
              class="border-l-4 border-[#1A1A1A] pl-4 py-2 my-2 bg-[#FAFAF9]"
            >
              <p class="font-ui text-xs uppercase tracking-wide text-[#1A1A1A]/60 mb-1">Reason:</p>
              <p class="font-body text-sm text-[#1A1A1A]/80 leading-[1.5]">{{ item.reason }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Share Section (DRAFT) -->
      <div v-if="batchData.status === 'DRAFT'" class="border-t-2 border-[#1A1A1A] pt-6 mt-6">
        <button
          @click="handleShare"
          :disabled="isSharing"
          class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSharing ? 'GENERATING...' : 'GENERATE MAGIC LINK' }}
        </button>

        <div v-if="shareError" class="mt-4 border-2 border-[#E63946] bg-[#FEE2E2] p-4 rounded-none">
          <p class="font-ui text-sm uppercase text-[#991B1B] mb-1">{{ shareError }}</p>
          <button
            @click="handleShare"
            class="mt-2 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-xs uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          >
            Retry
          </button>
        </div>
      </div>

      <!-- Magic Link Active Panel (PENDING_CONFIRMATION with magicToken) -->
      <div v-else-if="batchData.status === 'PENDING_CONFIRMATION' && batchData.magicToken" class="border-t-2 border-[#1A1A1A] pt-6 mt-6">
        <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-4 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A]">
          <p class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/70 mb-2">MAGIC LINK ACTIVE</p>
          <div class="flex flex-col md:flex-row gap-3 items-center">
            <input
              type="text"
              :value="getMagicLinkUrl(batchData.magicToken)"
              readonly
              class="flex-1 bg-[#FDFFB6] border-2 border-[#1A1A1A] px-3 py-2 font-mono text-sm rounded-none outline-none"
            />
            <button
              @click="copyMagicLink(getMagicLinkUrl(batchData.magicToken))"
              class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] whitespace-nowrap"
            >
              COPY LINK
            </button>
          </div>
          <p class="font-ui text-xs text-[#1A1A1A]/60 mt-2">Anyone with this link can approve this revision scope.</p>
        </div>
      </div>

      <!-- PENDING_CONFIRMATION without magicToken (should not happen normally, but render badge only) -->
      <div v-else-if="batchData.status === 'PENDING_CONFIRMATION' && !batchData.magicToken" class="border-t-2 border-[#1A1A1A] pt-6 mt-6">
        <span
          :class="getBatchStatusBadgeClass(batchData.status) + ' px-3 py-1 font-mono text-xs uppercase rounded-none'"
        >
          {{ batchData.status.replace('_', ' ') }}
        </span>
      </div>
    </div>

    <!-- Share Success Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 max-w-[480px] w-[90%] rounded-none shadow-[8px_8px_0px_0px_#1A1A1A]">
        <h2 class="font-editorial text-2xl font-normal leading-[1.3] text-[#1A1A1A] mb-6">Magic Link Generated</h2>
        <div class="space-y-3">
          <div class="flex flex-col md:flex-row gap-3 items-center">
            <input
              type="text"
              :value="portalUrl"
              readonly
              class="flex-1 bg-[#FDFFB6] border-2 border-[#1A1A1A] px-3 py-2 font-mono text-sm rounded-none outline-none"
            />
            <button
              @click="copyToClipboard"
              :disabled="copyState !== 'idle'"
              class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] whitespace-nowrap disabled:opacity-50"
            >
              {{ copyState === 'copied' ? 'COPIED' : copyState === 'failed' ? 'FAILED' : 'COPY LINK' }}
            </button>
          </div>
          <p v-if="copyState === 'failed'" class="font-ui text-xs text-[#E63946]">Select the link and copy manually.</p>
          <p class="font-ui text-xs text-[#1A1A1A]/60">Anyone with this link can approve this revision scope.</p>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            @click="closeModal"
            class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-2 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  </section>
</template>