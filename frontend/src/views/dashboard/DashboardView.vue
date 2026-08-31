<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "../../api/client";
import type { OverviewData, Project } from "../../types/api";
import {
  FolderKanban,
  History,
  Hourglass,
  AlertCircle,
  Bell,
  ExternalLink,
  User,
  Calendar,
} from "lucide-vue-next";

const router = useRouter();

const overviewData = ref<OverviewData | null>(null);
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <section class="p-6 md:p-10 max-w-[1300px] mx-auto">
    <!-- Top Bar: Interactive Breadcrumb & Actions (Stitch Style) -->
    <div class="flex items-center justify-between mb-4">
      <nav
        aria-label="Breadcrumb"
        class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70 flex items-center"
      >
        <router-link
          to="/dashboard"
          class="hover:text-[#1A1A1A] hover:underline decoration-[#DCCCFF] decoration-2 underline-offset-4 transition-all"
        >
          WORKSPACE
        </router-link>
        <span class="mx-2 text-[#1A1A1A]/40 font-bold">&gt;</span>
        <span class="font-bold text-[#1A1A1A]" aria-current="page"
          >OVERVIEW</span
        >
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

    <!-- Page Title -->
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

    <!-- Main Content Grid -->
    <div v-else class="space-y-8">
      <!-- 4 Stat Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Card 1: ACTIVE PROJECTS (Canvas bg) -->
        <div
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] relative hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              ACTIVE PROJECTS
            </p>
            <FolderKanban class="w-4 h-4 text-[#1A1A1A]/70" />
          </div>
          <p class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4">
            {{ overviewData?.activeProjects ?? 0 }}
          </p>
        </div>

        <!-- Card 2: REVISIONS USED (Yellow bg) -->
        <div
          class="bg-[#FDFFB6] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] relative hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              REVISIONS USED
            </p>
            <History class="w-4 h-4 text-[#1A1A1A]/70" />
          </div>
          <p class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4">
            {{ overviewData?.revisionsUsed ?? 0 }}
            <span class="text-xl font-normal text-[#1A1A1A]/60">
              /{{ totalAllowedRevisions }}
            </span>
          </p>
          <!-- Brutalist Progress Bar -->
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

        <!-- Card 3: REVISIONS LEFT (Canvas bg) -->
        <div
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] relative hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              REVISIONS LEFT
            </p>
            <Hourglass class="w-4 h-4 text-[#1A1A1A]/70" />
          </div>
          <p class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4">
            {{ revisionsLeft }}
          </p>
        </div>

        <!-- Card 4: PENDING REVIEW (Lavender bg) -->
        <div
          class="bg-[#DCCCFF] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] relative hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all"
        >
          <div class="flex justify-between items-start">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[#1A1A1A]/70"
            >
              PENDING REVIEW
            </p>
            <AlertCircle class="w-4 h-4 text-[#E63946]" />
          </div>
          <p class="font-['JetBrains_Mono',monospace] text-4xl font-bold mt-4">
            {{ overviewData?.pendingConfirmations ?? 0 }}
          </p>
        </div>
      </div>

      <!-- Recent Projects Section -->
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
          v-if="overviewData?.recentProjects.length === 0"
          class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center flex flex-col items-center justify-center"
        >
          <img
            src="/src/assets/project.png"
            alt="No projects illustration"
            class="w-32 h-32 md:w-40 md:h-40 object-contain select-none pointer-events-none opacity-70"
            draggable="false"
          />
          <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/60 mt-4">
            No recent projects
          </p>
          <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">
            Create your first project to get started
          </p>
        </div>

        <!-- Projects Grid (Polished & Interactive) -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <div
            v-for="project in overviewData?.recentProjects"
            :key="project.id"
            @click="navigateToProject(project.id)"
            class="group bg-[#FAFAF9] border-2 border-[#1A1A1A] p-5 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-150 ease-out cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <!-- Card Header: Badge & Hover Icon -->
            <div className="flex justify-between items-start mb-3">
              <span
                className="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] uppercase font-bold tracking-wider"
              >
                ACTIVE
              </span>

              <ExternalLink className="w-4 h-4 text-[#1A1A1A] opacity-100" />
            </div>

            <!-- Card Body: Title & Client -->
            <div class="flex-1">
              <h3
                class="font-['Baskervville',serif] text-xl font-normal leading-[1.3] text-[#1A1A1A] line-clamp-1"
              >
                {{ project.name }}
              </h3>
              <p
                class="font-['Noto_Serif',serif] text-sm leading-[1.5] text-[#1A1A1A]/60 mt-1 line-clamp-2"
              >
                {{ project.clientName }}
              </p>
            </div>

            <!-- Card Footer: Dashed Line & Date -->
            <div
              class="mt-4 pt-3 border-t-2 border-dashed border-[#1A1A1A]/20 flex justify-between items-center"
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
  </section>
</template>
