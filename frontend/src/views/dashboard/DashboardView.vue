<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useI18n } from "../../composables/useI18n";

const { t, locale } = useI18n();
import type { OverviewData, Project } from "../../types/api";
import { swrService } from "../../services/resilience/swr.service";
import {
  FolderKanban,
  History,
  Hourglass,
  AlertCircle,
  Calendar,
  ExternalLink,
  FileText,
} from "lucide-vue-next";
import UiStatusBadge from "../../components/ui/UiStatusBadge.vue";
import AppTopbar from "../../components/features/AppTopbar.vue";

const router = useRouter();
const authStore = useAuthStore();

const overviewData = ref<OverviewData | null>(null);
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Ambil proyek terbaru (max 6) dari array `projects` yang memiliki field quota lengkap (PM Approved)
const recentProjectsWithQuota = computed(() => {
  return projects.value.slice(0, 6);
});

const BATCHES_PER_PAGE = 5;
const currentBatchPage = ref(1);

const totalBatchPages = computed(() => {
  const total = overviewData.value?.recentBatches?.length ?? 0;
  return total > BATCHES_PER_PAGE ? Math.ceil(total / BATCHES_PER_PAGE) : 0;
});

const paginatedBatches = computed(() => {
  const all = overviewData.value?.recentBatches ?? [];
  if (all.length <= BATCHES_PER_PAGE) return all;
  const start = (currentBatchPage.value - 1) * BATCHES_PER_PAGE;
  return all.slice(start, start + BATCHES_PER_PAGE);
});

const totalAllowedRevisions = computed(() => {
  return projects.value.reduce(
    (sum, p) => sum + (p.totalAllowedRevisions ?? 0),
    0,
  );
});

const revisionsLeft = computed(() => {
  const used = overviewData.value?.revisionsUsed ?? 0;
  const total = totalAllowedRevisions.value;
  return Math.max(0, total - used);
});

async function fetchDashboardData() {
  isLoading.value = true;
  error.value = null;
  const accountId = authStore.account?.id;
  if (!accountId) {
    error.value = t("dashboard.accountNotFound");
    isLoading.value = false;
    return;
  }
  try {
    const [overviewRes, projectsRes] = await Promise.all([
      swrService.fetchOverview(accountId),
      swrService.fetchProjects(accountId),
    ]);
    overviewData.value = overviewRes;
    projects.value = projectsRes;
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : t("dashboard.failedOverview");
  } finally {
    isLoading.value = false;
  }
}

function navigateToProject(id: string) {
  router.push(`/projects/${id}`);
}

function navigateToBatch(id: string) {
  router.push(`/batches/${id}`);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString(locale.value, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.greetingMorning");
  if (hour < 18) return t("dashboard.greetingAfternoon");
  return t("dashboard.greetingEvening");
}

function getClientName(projectId: string): string {
  const project = projects.value.find((p) => p.id === projectId);
  return project?.clientName || "";
}

function formatItemCount(count: number): string {
  return count === 1
    ? t("dashboard.itemsSingle", { count })
    : t("dashboard.itemsPlural", { count });
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <section class="p-6 md:p-10 max-w-[1300px] mx-auto min-h-screen bg-[#FAFAF9]">
    <!-- TOP BAR -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <!-- Breadcrumb -->
        <nav aria-label="Breadcrumb">
          <router-link
            to="/dashboard"
            class="font-['JetBrains_Mono',monospace] text-lg font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:underline decoration-[#DCCCFF] decoration-2 underline-offset-4 transition-all"
          >
            {{ t("dashboard.breadcrumb") }}
          </router-link>
        </nav>

        <!-- Pemisah -->
        <div class="border-l-2 border-[#1A1A1A]/20 h-6"></div>

        <!-- Greeting + Date (di samping WORKSPACE) -->
        <div class="hidden md:block">
          <p
            class="font-['Baskervville',serif] text-lg font-normal text-[#1A1A1A] leading-tight"
          >
            {{ getGreeting() }},
            {{ authStore.account?.name || t("dashboard.userFallback") }}
          </p>
          <p
            class="font-['Noto_Serif',serif] text-lg text-[#1A1A1A] leading-tight"
          >
            {{ formatFullDate() }}
          </p>
        </div>
      </div>

      <!-- AppTopbar -->
      <AppTopbar />
    </div>

    <!-- PAGE TITLE -->
    <div class="border-b-2 border-[#1A1A1A] pb-6 mb-8">
      <h1
        class="font-['Baskervville',serif] text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight text-[#1A1A1A]"
      >
        {{ t("dashboard.title") }}
      </h1>
      <p
        class="font-['Noto_Serif',serif] text-base leading-[1.6] text-[#1A1A1A]/60 mt-2"
      >
        {{ t("dashboard.subtitle") }}
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/60 py-12"
    >
      <span class="animate-pulse">■</span>
      <span>{{ t("dashboard.loadingOverview") }}</span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-6 rounded-none font-['Noto_Serif',serif]"
    >
      {{ error }}
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-10">
      <!-- FOUR KPI CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Card 1: ACTIVE PROJECTS -->
        <div
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              {{ t("dashboard.statActiveProjects") }}
            </p>
            <FolderKanban class="w-4 h-4 text-[#1A1A1A]/70" />
          </div>
          <p
            class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4 text-[#1A1A1A]"
          >
            {{ overviewData?.activeProjects ?? 0 }}
          </p>
        </div>

        <!-- Card 2: REVISIONS USED -->
        <div
          class="bg-[#FDFFB6] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              {{ t("dashboard.statRevisionsUsed") }}
            </p>
            <History class="w-4 h-4 text-[#1A1A1A]/70" />
          </div>
          <p
            class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4 text-[#1A1A1A]"
          >
            {{ overviewData?.revisionsUsed ?? 0 }}
            <span class="text-xl font-normal text-[#1A1A1A]/60">
              /{{ totalAllowedRevisions }}
            </span>
          </p>
          <div
            class="mt-3 w-full h-2 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden"
          >
            <div
              class="h-full bg-[#006D77] transition-all duration-300 ease-out"
              :style="{
                width:
                  Math.min(
                    ((overviewData?.revisionsUsed ?? 0) /
                      (totalAllowedRevisions || 1)) *
                      100,
                    100,
                  ) + '%',
              }"
            ></div>
          </div>
        </div>

        <!-- Card 3: REVISIONS LEFT -->
        <div
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              {{ t("dashboard.statRevisionsLeft") }}
            </p>
            <Hourglass class="w-4 h-4 text-[#1A1A1A]/70" />
          </div>
          <p
            class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4 text-[#1A1A1A]"
          >
            {{ revisionsLeft }}
          </p>
        </div>

        <!-- Card 4: PENDING REVIEW -->
        <div
          class="bg-[#DCCCFF] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              {{ t("dashboard.statPendingConfirmations") }}
            </p>
            <AlertCircle class="w-4 h-4 text-[#E63946]" />
          </div>
          <p
            class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4 text-[#1A1A1A]"
          >
            {{ overviewData?.pendingConfirmations ?? 0 }}
          </p>
        </div>
      </div>

      <!-- RECENT PROJECTS -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2
            class="font-['Baskervville',serif] text-2xl font-normal leading-[1.3] text-[#1A1A1A]"
          >
            {{ t("dashboard.recentProjects") }}
          </h2>
          <router-link
            to="/projects"
            class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2 flex items-center gap-1"
          >
            <span>{{ t("dashboard.viewAll") }}</span>
            <span class="font-mono text-xs">&rarr;</span>
          </router-link>
        </div>

        <!-- Empty State -->
        <div
          v-if="recentProjectsWithQuota.length === 0"
          class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center flex flex-col items-center justify-center"
        >
          <img
            src="/src/assets/project.png"
            alt="No projects illustration"
            class="w-32 h-32 md:w-40 md:h-40 object-contain select-none pointer-events-none opacity-70"
            draggable="false"
          />
          <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/60">
            {{ t("dashboard.emptyRecent") }}
          </p>
          <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">
            {{ t("dashboard.emptyRecentDesc") }}
          </p>
        </div>

        <!-- Projects Grid (Mengambil data dari recentProjectsWithQuota agar Progress Bar Akurat) -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <div
            v-for="project in recentProjectsWithQuota"
            :key="project.id"
            @click="navigateToProject(project.id)"
            class="group bg-[#FAFAF9] border-2 border-[#1A1A1A] p-5 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-150 ease-out cursor-pointer flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <div class="flex justify-between items-start mb-3">
                <span
                  class="bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] uppercase font-bold tracking-wider"
                >
                  {{ t("dashboard.projectActive") }}
                </span>
                <ExternalLink
                  class="w-4 h-4 text-[#1A1A1A] opacity-60 group-hover:opacity-100 transition-opacity duration-150"
                />
              </div>

              <div>
                <h3
                  class="font-['Baskervville',serif] text-xl font-normal leading-[1.3] text-[#1A1A1A] line-clamp-1"
                >
                  {{ project.name }}
                </h3>
                <p
                  class="font-['Noto_Serif',serif] text-sm leading-[1.5] text-[#1A1A1A]/60 mt-1 line-clamp-1"
                >
                  {{ project.clientName }}
                </p>
              </div>
            </div>

            <!-- Progress Bar Kuota Proyek (Data Valid) -->
            <div class="mt-4">
              <div class="mb-3">
                <div class="flex justify-between items-end mb-1">
                  <span
                    class="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[#1A1A1A] uppercase"
                  >
                    {{ t("dashboard.quotaLabel") }}
                  </span>
                  <span
                    class="font-['JetBrains_Mono',monospace] text-[10px] text-[#1A1A1A]/70"
                  >
                    {{
                      t("dashboard.quotaUsed", {
                        used: project.usedRevisions ?? 0,
                        allowed: project.totalAllowedRevisions ?? 0,
                      })
                    }}
                  </span>
                </div>
                <div
                  class="w-full h-1.5 bg-[#FAFAF9] border-[1.5px] border-[#1A1A1A] rounded-none overflow-hidden"
                >
                  <div
                    class="h-full bg-[#006D77] transition-all duration-300 ease-out"
                    :style="{
                      width:
                        Math.min(
                          ((project.usedRevisions ?? 0) /
                            (project.totalAllowedRevisions || 1)) *
                            100,
                          100,
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>

              <div
                class="pt-2 border-t-2 border-dashed border-[#1A1A1A]/20 flex justify-between items-center"
              >
                <!-- Kiri: Tanggal -->
                <span
                  class="font-['JetBrains_Mono',monospace] text-[11px] text-[#1A1A1A]/50 uppercase tracking-wide flex items-center gap-1.5"
                >
                  <Calendar class="w-3 h-3 text-[#1A1A1A]/50" />
                  {{ formatDate(project.createdAt) }}
                </span>

                <!-- Kanan: Indikator Dokumen (hanya jika ada) -->
                <span
                  class="inline-flex items-center gap-1 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold rounded-none"
                  :class="
                    (project.documentCount ?? 0) === 0 ? 'opacity-40' : ''
                  "
                  :title="t('dashboard.attachedDocuments')"
                >
                  <FileText class="w-3 h-3" />
                  {{ project.documentCount ?? 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RECENT REVISION BATCHES -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2
            class="font-['Baskervville',serif] text-2xl font-normal leading-[1.3] text-[#1A1A1A]"
          >
            {{ t("dashboard.recentBatches") }}
          </h2>
          <span
            v-if="overviewData?.recentBatches?.length"
            class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/70"
          >
            {{
              t("dashboard.batchCount", {
                count: overviewData.recentBatches.length,
              })
            }}
          </span>
        </div>

        <!-- Empty State -->
        <div
          v-if="!overviewData?.recentBatches?.length"
          class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-10 rounded-none text-center flex flex-col items-center justify-center"
        >
          <img
            src="/src/assets/Revision.png"
            alt="No revision batches illustration"
            class="w-28 h-28 md:w-36 md:h-36 object-contain select-none pointer-events-none mb-4 opacity-70"
            draggable="false"
          />
          <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/70">
            {{ t("dashboard.emptyBatches") }}
          </p>
          <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/50 mt-1">
            {{ t("dashboard.emptyBatchesDesc") }}
          </p>
        </div>

        <!-- Recent Revision Batches List -->
        <div v-else class="space-y-4">
          <div
            v-for="batch in paginatedBatches"
            :key="batch.id"
            @click="navigateToBatch(batch.id)"
            class="group bg-[#FAFAF9] border-2 border-[#1A1A1A] p-5 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-150 ease-out cursor-pointer"
          >
            <!-- Baris 1: ID + Status + Items (kiri) dan Tanggal (kanan) -->
            <div class="flex justify-between items-start w-full mb-3">
              <div class="flex items-center gap-3 flex-wrap">
                <!-- Batch ID -->
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#1A1A1A]"
                >
                  #{{ batch.id.slice(0, 8) }}
                </span>

                <!-- Status Badge -->
                <UiStatusBadge :status="batch.status" kind="batch" size="sm" />

                <!-- Item Count -->
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/50"
                >
                  • {{ formatItemCount(batch.itemCount) }}
                </span>
              </div>

              <!-- Tanggal (pojok kanan) -->
              <div
                class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/50"
              >
                {{ formatDate(batch.createdAt) }}
              </div>
            </div>

            <!-- Baris 2: Nama Project -->
            <h3
              class="font-['Baskervville',serif] text-xl font-normal leading-[1.3] text-[#1A1A1A]"
            >
              {{ batch.projectName }}
            </h3>

            <!-- Baris 3: Client Name (Background Kuning & Border Hitam) -->
            <div
              class="flex justify-end items-center mt-3 border-t border-[#1A1A1A]/10 pt-3"
            >
              <span
                class="font-['Noto_Serif',serif] text-sm font-semibold text-[#ff002b] bg-[#FDFFB6] px-2 py-0.5 border border-[#ff002b]/20 rounded-none inline-block"
              >
                {{ getClientName(batch.projectId) }}
              </span>
            </div>
          </div>

          <!-- Pagination (Local — muncul hanya jika total batches > 5) -->
          <nav
            v-if="totalBatchPages > 1"
            class="flex items-center justify-center gap-2 pt-2"
            :aria-label="t('dashboard.paginationAria')"
          >
            <button
              type="button"
              @click="currentBatchPage = Math.max(1, currentBatchPage - 1)"
              :disabled="currentBatchPage === 1"
              class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase border-2 border-[#1A1A1A] rounded-none bg-[#FAFAF9] text-[#1A1A1A] px-3 py-1.5 shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#DCCCFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ t("dashboard.paginationPrev") }}
            </button>

            <button
              v-for="page in totalBatchPages"
              :key="page"
              type="button"
              @click="currentBatchPage = page"
              :class="
                currentBatchPage === page
                  ? 'font-[\'JetBrains_Mono\',monospace] text-xs font-bold uppercase border-2 border-[#1A1A1A] rounded-none px-3 py-1.5 bg-[#1A1A1A] text-[#FAFAF9] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'font-[\'JetBrains_Mono\',monospace] text-xs font-bold uppercase border-2 border-[#1A1A1A] rounded-none px-3 py-1.5 bg-[#FAFAF9] text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#DCCCFF] transition-colors'
              "
            >
              {{ page }}
            </button>

            <button
              type="button"
              @click="
                currentBatchPage = Math.min(
                  totalBatchPages,
                  currentBatchPage + 1,
                )
              "
              :disabled="currentBatchPage === totalBatchPages"
              class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase border-2 border-[#1A1A1A] rounded-none bg-[#FAFAF9] text-[#1A1A1A] px-3 py-1.5 shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#DCCCFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ t("dashboard.paginationNext") }} &rarr;
            </button>
          </nav>
        </div>
      </div>
    </div>
  </section>
</template>
