<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../../api/client';
import type { Project } from '../../types/api';

const router = useRouter();

const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const isSubmitting = ref(false);

const form = ref({
  name: '',
  clientName: '',
  totalAllowedRevisions: 3,
});

async function fetchProjects() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await apiClient.projects.list();
    projects.value = res.projects;
  } catch (err: any) {
    error.value = err.message || 'Failed to load projects';
  } finally {
    isLoading.value = false;
  }
}

function openModal() {
  form.value = { name: '', clientName: '', totalAllowedRevisions: 3 };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

async function handleCreateProject() {
  if (!form.value.name.trim() || !form.value.clientName.trim()) return;

  isSubmitting.value = true;
  try {
    await apiClient.projects.create({
      name: form.value.name.trim(),
      clientName: form.value.clientName.trim(),
      totalAllowedRevisions: form.value.totalAllowedRevisions,
    });
    closeModal();
    await fetchProjects();
  } catch (err: any) {
    error.value = err.message || 'Failed to create project';
  } finally {
    isSubmitting.value = false;
  }
}

function navigateToProject(id: string) {
  router.push(`/projects/${id}`);
}

function getProgressPercent(project: Project): number {
  if (project.totalAllowedRevisions === 0) return 0;
  return Math.min((project.usedRevisions / project.totalAllowedRevisions) * 100, 100);
}

onMounted(() => {
  fetchProjects();
});
</script>

<template>
  <section class="p-8 md:p-12">
    <div class="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-6 mb-8">
      <div>
        <h1 class="font-['Baskervville',serif] text-5xl font-normal leading-[1.1] tracking-tight">Projects</h1>
        <p class="font-['Noto Serif',serif] text-base leading-[1.6] text-[#1A1A1A]/60 mt-2">Manage your project workspace</p>
      </div>
      <button
        @click="openModal"
        class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
      >
        + NEW PROJECT
      </button>
    </div>

    <div v-if="isLoading" class="flex items-center gap-2 font-['JetBrains Mono',monospace] text-sm text-[#1A1A1A]/60">
      <span class="animate-pulse">■</span>
      <span>Loading projects...</span>
    </div>

    <div v-else-if="error" class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-6 rounded-none font-['Noto Serif',serif] mb-6">
      {{ error }}
    </div>

    <div v-else-if="projects.length === 0" class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center">
      <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/60">No projects yet</p>
      <p class="font-['Noto Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">Create your first project to get started</p>
      <button
        @click="openModal"
        class="mt-6 bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A]"
      >
        + NEW PROJECT
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="project in projects"
        :key="project.id"
        @click="navigateToProject(project.id)"
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-5 rounded-none cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out"
      >
        <h3 class="font-['Baskervville',serif] text-xl font-normal leading-[1.4]">{{ project.name }}</h3>
        <p class="font-['Noto Serif',serif] text-sm leading-[1.5] text-[#1A1A1A]/60 mt-1">{{ project.clientName }}</p>
        <div class="mt-4">
          <div class="flex items-center justify-between mb-1">
            <span class="font-['JetBrains Mono',monospace] text-xs text-[#1A1A1A]/60">{{ project.usedRevisions }} / {{ project.totalAllowedRevisions }} revisions</span>
            <span class="font-['JetBrains Mono',monospace] text-xs text-[#1A1A1A]/60">{{ project.remainingRevisions }} remaining</span>
          </div>
          <div class="w-full h-3 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden">
            <div
              class="h-full bg-[#006D77] transition-all duration-300 ease-out"
              :style="{ width: getProgressPercent(project) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 max-w-md w-[90%] rounded-none shadow-[8px_8px_0px_0px_#1A1A1A]">
        <h2 class="font-['Baskervville',serif] text-2xl font-normal leading-[1.3] text-[#1A1A1A] mb-6">Create New Project</h2>

        <form @submit.prevent="handleCreateProject" class="flex flex-col gap-4">
          <div>
            <label for="name" class="block font-['JetBrains Mono',monospace] text-xs uppercase tracking-wide mb-1">Project Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-3 font-['Noto Serif',serif] text-base rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="Enter project name..."
            />
          </div>

          <div>
            <label for="clientName" class="block font-['JetBrains Mono',monospace] text-xs uppercase tracking-wide mb-1">Client Name</label>
            <input
              id="clientName"
              v-model="form.clientName"
              type="text"
              required
              class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-3 font-['Noto Serif',serif] text-base rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="Enter client name..."
            />
          </div>

          <div>
            <label for="totalAllowedRevisions" class="block font-['JetBrains Mono',monospace] text-xs uppercase tracking-wide mb-1">Total Allowed Revisions</label>
            <input
              id="totalAllowedRevisions"
              v-model.number="form.totalAllowedRevisions"
              type="number"
              min="1"
              max="100"
              required
              class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-3 font-['Noto Serif',serif] text-base rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="3"
            />
          </div>

          <div v-if="error" class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-3 rounded-none font-['Noto Serif',serif] text-sm">
            {{ error }}
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'CREATING...' : 'CREATE PROJECT' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>