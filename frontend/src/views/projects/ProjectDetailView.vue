<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient, ApiError } from '../../api/client';
import type { Project, RevisionBatchSummary, RevisionBatchStatus } from '../../types/api';

const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.id as string);

const project = ref<Project | null>(null);
const batches = ref<RevisionBatchSummary[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Feedback submission state
const rawInput = ref('');
const isSubmitting = ref(false);
const errorMsg = ref('');
const errorCode = ref<string | null>(null);

async function fetchProjectDetail() {
  isLoading.value = true;
  error.value = null;
  try {
    const [projectRes, batchesRes] = await Promise.all([
      apiClient.projects.getDetail(projectId.value),
      apiClient.projects.getBatches(projectId.value),
    ]);
    project.value = projectRes.project;
    batches.value = batchesRes.batches;
  } catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Failed to load project detail';
  } finally {
    isLoading.value = false;
  }
}

function navigateToBatch(batchId: string) {
  router.push(`/batches/${batchId}`);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusBadgeClass(status: RevisionBatchStatus): string {
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

function getShortId(id: string): string {
  return id.slice(0, 8) + '...';
}

const progressPercent = computed(() => {
  if (!project.value || project.value.totalAllowedRevisions === 0) return 0;
  return Math.min((project.value.usedRevisions / project.value.totalAllowedRevisions) * 100, 100);
});

const isQuotaExhausted = computed(() => {
  return project.value && project.value.remainingRevisions === 0;
});

function clearError() {
  errorMsg.value = '';
  errorCode.value = null;
}

async function handleSubmitFeedback() {
  if (!rawInput.value.trim()) {
    errorMsg.value = 'Feedback cannot be empty.';
    errorCode.value = 'VALIDATION_ERROR';
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = '';
  errorCode.value = null;

  try {
    const res = await apiClient.projects.submitRevision(projectId.value, rawInput.value);
    const batchId = res.batch.id;
    rawInput.value = '';
    isSubmitting.value = false;
    router.push(`/batches/${batchId}`);
  } catch (err: unknown) {
    isSubmitting.value = false;
    if (err instanceof ApiError) {
      errorCode.value = err.code;
      switch (err.code) {
        case 'QUOTA_EXHAUSTED':
          errorMsg.value = 'Quota exhausted. Wait for client approval.';
          break;
        case 'AI_PROCESSING_FAILED':
          errorMsg.value = 'AI analysis failed. Please try again.';
          break;
        case 'NETWORK_ERROR':
          errorMsg.value = 'Unable to reach the server. Please check your connection.';
          break;
        default:
          // 500/504 and other server errors
          errorMsg.value = err.status && err.status >= 500
            ? 'Server error. Please try again later.'
            : 'Failed to analyze feedback. Please try again.';
          break;
      }
    } else {
      errorMsg.value = 'An unexpected error occurred.';
    }
  }
}

function handleRetryFeedback() {
  handleSubmitFeedback();
}

onMounted(() => {
  fetchProjectDetail();
});
</script>

<template>
  <section class="p-8 md:p-12">
    <div v-if="isLoading" class="flex items-center gap-2 font-mono text-sm text-[#1A1A1A]/60">
      <span class="animate-pulse">■</span>
      <span>Loading project...</span>
    </div>

    <div v-else-if="error" class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-6 rounded-none font-body">
      {{ error }}
    </div>

    <div v-else-if="project" class="space-y-8">
      <!-- Header Section -->
      <div class="border-b-2 border-[#1A1A1A] pb-6">
        <h1 class="font-editorial text-5xl font-normal leading-[1.1] tracking-tight">{{ project.name }}</h1>
        <div class="flex flex-wrap items-center gap-4 mt-3">
          <span class="font-mono text-xs uppercase tracking-wide bg-[#DCCCFF] text-[#1A1A1A] border border-[#1A1A1A] px-3 py-1 rounded-none">
            {{ project.clientName }}
          </span>
          <span class="font-mono text-xs text-[#1A1A1A]/60">Created {{ formatDate(project.createdAt) }}</span>
        </div>
      </div>

      <!-- Quota Banner Section -->
      <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p class="font-body text-lg font-bold text-[#1A1A1A]">
              {{ project.usedRevisions }} / {{ project.totalAllowedRevisions }} revisions used
            </p>
            <p
              class="font-body text-base mt-1"
              :class="isQuotaExhausted ? 'text-[#E63946]' : 'text-[#1A1A1A]/60'"
            >
              {{ project.remainingRevisions }} revision{{ project.remainingRevisions !== 1 ? 's' : '' }} remaining
            </p>
          </div>

          <div class="w-full md:w-96 flex-shrink-0">
            <div class="w-full h-6 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden">
              <div
                class="h-full bg-[#006D77] transition-all duration-300 ease-out"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
            <p class="font-mono text-xs text-[#1A1A1A] mt-1 text-right">
              {{ project.usedRevisions }}/{{ project.totalAllowedRevisions }} used
            </p>
          </div>
        </div>
      </div>

      <!-- Revision Batches History Section -->
      <div>
        <h2 class="font-editorial text-2xl font-normal leading-[1.3] mb-4">Revision Batches</h2>

        <div v-if="batches.length === 0" class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center">
          <p class="font-editorial text-xl text-[#1A1A1A]/60">No revision batches yet</p>
          <p class="font-body text-sm text-[#1A1A1A]/40 mt-2">Submit your first feedback to get AI analysis.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="batch in batches"
            :key="batch.id"
            @click="navigateToBatch(batch.id)"
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-4 rounded-none cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out"
          >
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="font-mono text-sm text-[#1A1A1A]">{{ getShortId(batch.id) }}</span>
                <span class="font-mono text-xs text-[#1A1A1A]/60">{{ formatDate(batch.createdAt) }}</span>
              </div>

              <div class="flex items-center gap-3">
                <span class="font-mono text-xs text-[#1A1A1A]/60">{{ batch.itemCount }} item{{ batch.itemCount !== 1 ? 's' : '' }}</span>
                <span
                  :class="getStatusBadgeClass(batch.status) + ' px-3 py-1 font-mono text-xs uppercase rounded-none'"
                >
                  {{ batch.status.replace('_', ' ') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Submission Panel -->
      <div class="border-t-2 border-[#1A1A1A] pt-8">
        <h2 class="font-editorial text-xl font-normal leading-[1.3] tracking-tight">Submit Revision Feedback</h2>
        <p class="font-body text-sm leading-[1.6] text-[#1A1A1A]/70 mt-1 mb-4">
          Paste raw client feedback below. AI will analyze and classify scope.
        </p>

        <textarea
          v-model="rawInput"
          @input="clearError"
          :disabled="isSubmitting"
          class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] p-4 font-body text-base leading-[1.6] rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40 resize-y min-h-[200px] disabled:opacity-50"
          placeholder="e.g., Please adjust hero spacing, change CTA button to dark mode, and add mobile animations."
        ></textarea>

        <div class="mt-4 flex flex-col items-start gap-3">
          <div v-if="errorMsg" class="w-full border-2 border-[#E63946] bg-[#FEE2E2] p-4 rounded-none">
            <p class="font-ui text-sm uppercase text-[#991B1B] mb-1">{{ errorCode }}</p>
            <p class="font-body text-base text-[#991B1B]">{{ errorMsg }}</p>
            <button
              v-if="errorCode === 'AI_PROCESSING_FAILED' || errorCode === 'NETWORK_ERROR' || (errorCode && !['QUOTA_EXHAUSTED', 'VALIDATION_ERROR'].includes(errorCode))"
              @click="handleRetryFeedback"
              class="mt-3 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-ui text-xs uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
            >
              Retry
            </button>
          </div>

          <button
            @click="handleSubmitFeedback"
            :disabled="isQuotaExhausted || isSubmitting"
            class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_#1A1A1A]"
          >
            {{ isQuotaExhausted ? 'QUOTA EXHAUSTED' : 'ANALYZE FEEDBACK' }}
          </button>

          <div v-if="isSubmitting" class="flex items-center gap-2 font-mono text-sm text-[#1A1A1A]/70">
            <span class="animate-pulse">■</span>
            <span>Processing AI scope analysis...</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>