<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { apiClient } from "../../api/client";
import type { OverviewData, Project } from "../../types/api";
import {
  FolderKanban,
  History,
  Hourglass,
  AlertCircle,
  Bell,
  User,
  Calendar,
  ExternalLink,
} from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

const overviewData = ref<OverviewData | null>(null);
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Ambil 3 proyek terbaru dari array `projects` yang memiliki field quota lengkap (PM Approved)
const recentProjectsWithQuota = computed(() => {
  return projects.value.slice(0, 3);
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
  try {
    const [overviewRes, projectsRes] = await Promise.all([
      apiClient.overview.get(),
      apiClient.projects.list(),
    ]);
    overviewData.value = overviewRes;
    projects.value = projectsRes.projects;
  } catch (err: any) {
    error.value = err.message || "Failed to load dashboard";
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
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getClientName(projectId: string): string {
  const project = projects.value.find((p) => p.id === projectId);
  return project?.clientName || "";
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <section class="p-6 md:p-10 max-w-[1300px] mx-auto min-h-screen bg-[#FAFAF9]">
    <!-- TOP BAR -->
    <div class="flex items-center justify-between mb-6">
      <nav aria-label="Breadcrumb">
        <router-link
          to="/dashboard"
          class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:underline decoration-[#DCCCFF] decoration-2 underline-offset-4 transition-all"
        >
          WORKSPACE
        </router-link>
      </nav>

      <div class="flex items-center gap-2">
        <button
          title="Notifications"
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-2 rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Bell class="w-4 h-4 text-[#1A1A1A]" />
        </button>
        <button
          title="User Profile"
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-2 rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <User class="w-4 h-4 text-[#1A1A1A]" />
        </button>
      </div>
    </div>

    <!-- GREETING + DATE -->
    <div class="mb-8">
      <p
        class="font-['Baskervville',serif] text-3xl md:text-4xl font-normal leading-[1.2] text-[#1A1A1A]"
      >
        {{ getGreeting() }}, {{ authStore.account?.name || "User" }}
      </p>
      <p
        class="font-['Noto_Serif',serif] text-sm md:text-base leading-[1.6] text-[#1A1A1A]/60 mt-1"
      >
        {{ formatFullDate() }}
      </p>
    </div>

    <!-- PAGE TITLE -->
    <div class="border-b-2 border-[#1A1A1A] pb-6 mb-8">
      <h1
        class="font-['Baskervville',serif] text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight text-[#1A1A1A]"
      >
        Overview
      </h1>
      <p
        class="font-['Noto_Serif',serif] text-base leading-[1.6] text-[#1A1A1A]/60 mt-2"
      >
        Here is a summary of your workspace activity.
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/60 py-12"
    >
      <span class="animate-pulse">■</span>
      <span>Loading dashboard...</span>
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
              ACTIVE PROJECTS
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
              REVISIONS USED
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
              REVISIONS LEFT
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
              PENDING REVIEW
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
            Recent Projects
          </h2>
          <router-link
            to="/projects"
            class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2 flex items-center gap-1"
          >
            <span>View All</span>
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
            No recent projects
          </p>
          <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">
            Create your first project to get started
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
                  ACTIVE
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
                    Quota
                  </span>
                  <span
                    class="font-['JetBrains_Mono',monospace] text-[10px] text-[#1A1A1A]/70"
                  >
                    {{ project.usedRevisions ?? 0 }} /
                    {{ project.totalAllowedRevisions ?? 0 }} used
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
                <span
                  class="font-['JetBrains_Mono',monospace] text-[11px] text-[#1A1A1A]/50 uppercase tracking-wide flex items-center gap-1.5"
                >
                  <Calendar class="w-3 h-3 text-[#1A1A1A]/50" />
                  {{ formatDate(project.createdAt) }}
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
            Recent Revision Batches
          </h2>
          <router-link
            to="/revisions"
            class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2 flex items-center gap-1"
          >
            <span>View All</span>
            <span class="font-mono text-xs">&rarr;</span>
          </router-link>
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
            No revision batches available yet.
          </p>
          <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/50 mt-1">
            Revision batch activity will appear here when available.
          </p>
        </div>

        <!-- Recent Revision Batches List -->
        <div v-else class="space-y-4">
          <div
            v-for="(batch, index) in overviewData?.recentBatches"
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
                  #{{
                    String(batch.id).replace("batch-", "").padStart(3, "0") ||
                    "00" + (4 - index)
                  }}
                </span>

                <!-- Status Badge -->
                <span
                  :class="{
                    'bg-[#DCFCE7] text-[#166534]':
                      String(batch.status) === 'APPROVED',
                    'bg-[#DCCCFF] text-[#1A1A1A]':
                      String(batch.status) === 'PENDING_CONFIRMATION',
                    'bg-[#E5E7EB] text-[#1A1A1A]':
                      String(batch.status) === 'DRAFT',
                    'bg-[#FDE68A] text-[#92400E]':
                      String(batch.status) === 'NEEDS_REVIEW',
                  }"
                  class="border-2 border-[#1A1A1A] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] uppercase font-bold tracking-wider rounded-none"
                >
                  {{ batch.status }}
                </span>

                <!-- Item Count -->
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/50"
                >
                  • {{ batch.itemCount }} items
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

            <!-- Baris 3: Client Name (warna teal #006D77) -->
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
        </div>
      </div>
    </div>
  </section>
</template>
