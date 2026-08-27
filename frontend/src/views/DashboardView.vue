<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../api/client';
import type { OverviewData, Project } from '../types/api';

const router = useRouter();

const overviewData = ref<OverviewData | null>(null);
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

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
    error.value = err.message || 'Failed to load dashboard';
  } finally {
    isLoading.value = false;
  }
}

function navigateToProject(id: string) {
  router.push(`/projects/${id}`);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <section class="p-8 md:p-12">
    <div class="border-b-2 border-[#1A1A1A] pb-6 mb-8">
      <h1 class="font-['Baskervville',serif] text-5xl font-normal leading-[1.1] tracking-tight">Dashboard</h1>
      <p class="font-['Noto Serif',serif] text-base leading-[1.6] text-[#1A1A1A]/60 mt-2">Overview of your revision workspace</p>
    </div>

    <div v-if="isLoading" class="flex items-center gap-2 font-['JetBrains Mono',monospace] text-sm text-[#1A1A1A]/60">
      <span class="animate-pulse">■</span>
      <span>Loading dashboard...</span>
    </div>

    <div v-else-if="error" class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-6 rounded-none font-['Noto Serif',serif]">
      {{ error }}
    </div>

    <div v-else class="space-y-8">
      <!-- Metric Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Active Projects -->
        <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none">
          <p class="font-['JetBrains Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/60">Active Projects</p>
          <p class="font-['JetBrains Mono',monospace] text-4xl font-bold mt-2">{{ overviewData?.activeProjects ?? 0 }}</p>
        </div>

        <!-- Card 2: Revisions Used (Yellow) -->
        <div class="bg-[#FFE1A8] border-2 border-[#1A1A1A] p-6 rounded-none">
          <p class="font-['JetBrains Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/60">Revisions Used</p>
          <p class="font-['JetBrains Mono',monospace] text-4xl font-bold mt-2">{{ overviewData?.revisionsUsed ?? 0 }}</p>
        </div>

        <!-- Card 3: Pending Review (Lavender - MAX 1 per view) -->
        <div class="bg-[#DCCCFF] border-2 border-[#1A1A1A] p-6 rounded-none">
          <p class="font-['JetBrains Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/60">Pending Review</p>
          <p class="font-['JetBrains Mono',monospace] text-4xl font-bold mt-2">{{ overviewData?.pendingConfirmations ?? 0 }}</p>
        </div>

        <!-- Card 4: Total Projects -->
        <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none">
          <p class="font-['JetBrains Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/60">Total Projects</p>
          <p class="font-['JetBrains Mono',monospace] text-4xl font-bold mt-2">{{ projects.length }}</p>
        </div>
      </div>

      <!-- Recent Projects Section -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-['Baskervville',serif] text-2xl font-normal leading-[1.3]">Recent Projects</h2>
          <router-link
            to="/projects"
            class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-2"
          >
            View All
          </router-link>
        </div>

        <div v-if="overviewData?.recentProjects.length === 0" class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center">
          <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/60">No recent projects</p>
          <p class="font-['Noto Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">Create your first project to get started</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="project in overviewData?.recentProjects"
            :key="project.id"
            @click="navigateToProject(project.id)"
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-5 rounded-none cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out"
          >
            <h3 class="font-['Baskervville',serif] text-xl font-normal leading-[1.4]">{{ project.name }}</h3>
            <p class="font-['Noto Serif',serif] text-sm leading-[1.5] text-[#1A1A1A]/60 mt-1">{{ project.clientName }}</p>
            <p class="font-['JetBrains Mono',monospace] text-xs text-[#1A1A1A]/40 mt-3">{{ formatDate(project.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>