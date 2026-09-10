<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { RevisionBatchSummary, RevisionBatchStatus } from "../../types/api";
import { useAuthStore } from "../../stores/auth";
import { swrService } from "../../services/resilience/swr.service";
import UiStatusBadge from "../../components/ui/UiStatusBadge.vue";
import UiEmptyState from "../../components/ui/UiEmptyState.vue";
import AppTopbar from "../../components/features/AppTopbar.vue";
import { Search } from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

interface BatchWithProject extends RevisionBatchSummary {
  projectName: string;
  clientName: string;
}

const allBatches = ref<BatchWithProject[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const searchQuery = ref("");
const activeStatus = ref<RevisionBatchStatus | "ALL">("ALL");

const STATUS_TABS: Array<RevisionBatchStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "PENDING_CONFIRMATION",
  "APPROVED",
];

async function fetchHistory() {
  isLoading.value = true;
  error.value = null;
  const accountId = authStore.account?.id;
  if (!accountId) {
    error.value = "Account not found";
    isLoading.value = false;
    return;
  }
  try {
    const projects = await swrService.fetchProjects(accountId);

    const batchResults = await Promise.all(
      projects.map((p) => swrService.fetchProjectBatches(accountId, p.id)),
    );

    const flat: BatchWithProject[] = [];
    batchResults.forEach((batches, idx) => {
      const project = projects[idx];
      batches.forEach((b) => {
        flat.push({
          ...b,
          projectName: project.name,
          clientName: project.clientName,
        });
      });
    });

    flat.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    allBatches.value = flat;
  } catch (err: any) {
    error.value = err?.message || "Failed to load history.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchHistory();
});

const tabCounts = computed(() => {
  const counts: Record<string, number> = { ALL: allBatches.value.length };
  allBatches.value.forEach((b) => {
    counts[b.status] = (counts[b.status] || 0) + 1;
  });
  return counts;
});

const filteredBatches = computed(() => {
  let result = [...allBatches.value];

  if (activeStatus.value !== "ALL") {
    result = result.filter((b) => b.status === activeStatus.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (b) =>
        b.projectName.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q),
    );
  }

  return result;
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function openBatch(batch: BatchWithProject) {
  router.push(`/batches/${batch.id}`);
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-10 space-y-6 bg-[#FAFAF9] min-h-screen">
    <!-- 1. HEADER NAV (Seragam dengan ProjectsView) -->
    <div class="flex items-center justify-between mb-6">
      <nav aria-label="Breadcrumb">
        <router-link
          to="/dashboard"
          class="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:underline decoration-[#DCCCFF] decoration-2 underline-offset-4 transition-all"
        >
          WORKSPACE
        </router-link>
        <span class="font-mono text-xs text-[#1A1A1A]/30">/</span>
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
          HISTORY
        </span>
      </nav>
      <AppTopbar />
    </div>

    <!-- 2. JUDUL HALAMAN -->
    <div class="border-b-2 border-[#1A1A1A] pb-6">
      <h1 class="font-['Baskervville',serif] text-4xl text-[#1A1A1A] mb-1">History</h1>
      <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/60">All revision batches across your projects.</p>
    </div>

    <!-- 3. FILTER BAR -->
    <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in STATUS_TABS"
          :key="tab"
          @click="activeStatus = tab"
          :class="[
            'px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border-2 border-[#1A1A1A] rounded-none cursor-pointer',
            activeStatus === tab
              ? 'bg-[#1A1A1A] text-[#FAFAF9]'
              : 'bg-[#FAFAF9] text-[#1A1A1A] hover:bg-[#FDFFB6]',
          ]"
        >
          {{ tab.replace(/_/g, " ") }} ({{ tabCounts[tab] || 0 }})
        </button>
      </div>
      <div class="relative">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/50" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search project or client..."
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] pl-9 pr-3 py-2 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] w-full md:w-64"
        />
      </div>
    </div>

    <div v-if="error" class="bg-[#FEE2E2] border-2 border-[#E63946] px-4 py-3 font-['Noto_Serif',serif] text-sm text-[#991B1B]">
      {{ error }}
    </div>

    <div v-if="isLoading" class="text-center py-16 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/50">Loading history...</div>

    <UiEmptyState
      v-else-if="filteredBatches.length === 0"
      title="No batches found"
      subtitle="Try a different filter or submit your first revision."
    />

    <div v-else class="space-y-4">
      <article
        v-for="batch in filteredBatches"
        :key="batch.id"
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out"
      >
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="font-['Baskervville',serif] text-xl text-[#1A1A1A] line-clamp-1">{{ batch.projectName }}</h3>
            <span class="inline-block bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-none mt-1">
              {{ batch.clientName }}
            </span>
          </div>
          <UiStatusBadge :status="batch.status" kind="batch" size="sm" />
        </div>

        <p v-if="batch.summary" class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/80 line-clamp-2 mb-2">
          {{ batch.summary }}
        </p>

        <div class="flex flex-wrap items-center gap-3 mb-3">
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A]/50">
            {{ formatDate(batch.createdAt) }} • {{ batch.itemCount }} {{ batch.itemCount === 1 ? "item" : "items" }}
          </span>
          <span v-if="batch.scopeCounts" class="flex gap-2">
            <UiStatusBadge status="IN_SCOPE" kind="scope" size="sm" />
            <span class="font-mono text-[10px] font-bold text-[#166534]">{{ batch.scopeCounts.inScope }}</span>
            <UiStatusBadge status="OUT_OF_SCOPE" kind="scope" size="sm" />
            <span class="font-mono text-[10px] font-bold text-[#991B1B]">{{ batch.scopeCounts.outScope }}</span>
            <UiStatusBadge status="NEEDS_REVIEW" kind="scope" size="sm" />
            <span class="font-mono text-[10px] font-bold text-[#92400E]">{{ batch.scopeCounts.needsReview }}</span>
          </span>
        </div>

        <div class="pt-3 border-t-2 border-[#1A1A1A]/10 flex justify-end">
          <button
            @click="openBatch(batch)"
            class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#006D77] hover:underline cursor-pointer"
          >
            VIEW BATCH →
          </button>
        </div>
      </article>
    </div>
  </div>
</template>