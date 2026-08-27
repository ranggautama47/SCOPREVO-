<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient } from '../api/client';
import type { RevisionBatchDetail, RevisionBatchStatus, ScopeStatus } from '../types/api';

const route = useRoute();
const router = useRouter();

const batchId = computed(() => route.params.id as string);

const batchData = ref<RevisionBatchDetail | null>(null);
const isLoading = ref(true);
const notFound = ref(false);

async function fetchBatchDetail(id: string) {
  isLoading.value = true;
  notFound.value = false;
  try {
    const res = await apiClient.batches.getDetail(id);
    batchData.value = res.batch;
  } catch {
    notFound.value = true;
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
      <p class="font-editorial text-xl font-normal leading-[1.3] text-[#1A1A1A]/60">Batch not found.</p>
      <router-link
        to="/projects"
        class="inline-block font-ui text-sm text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2"
      >
        ← Back to Projects
      </router-link>
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
          <p class="font-editorial text-xl font-normal leading-[1.3] text-[#1A1A1A]/60">No items extracted</p>
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
    </div>
  </section>
</template>
