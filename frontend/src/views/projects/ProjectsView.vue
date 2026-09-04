<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "../../api/client";
import type { Project } from "../../types/api";
import {
  FolderKanban,
  History,
  ClipboardList,
  ArrowUpRight,
  ArrowUpDown,
  Search,
} from "lucide-vue-next";
import AppTopbar from "../../components/features/AppTopbar.vue";

const router = useRouter();

const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const isSubmitting = ref(false);

// Filter & Sort States
const searchQuery = ref("");
const sortBy = ref<"name" | "client" | "revisions">("name");

const form = ref({
  name: "",
  clientName: "",
  totalAllowedRevisions: 3,
});

// --- Dynamic Color Palette for Project Card Top Bar ---
const topBarColors = ["bg-[#006D77]", "bg-[#FDFFB6]", "bg-[#DCCCFF]"];

function getCardTopBarClass(index: number): string {
  return topBarColors[index % topBarColors.length];
}

// --- Filtered and Sorted Projects ---
const filteredProjects = computed(() => {
  let result = [...projects.value];

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q),
    );
  }

  result.sort((a, b) => {
    if (sortBy.value === "name") return a.name.localeCompare(b.name);
    if (sortBy.value === "client")
      return a.clientName.localeCompare(b.clientName);
    if (sortBy.value === "revisions") return b.usedRevisions - a.usedRevisions;
    return 0;
  });

  return result;
});

// --- Computed Stats ---
const totalUsedRevisions = computed(() =>
  projects.value.reduce((sum, p) => sum + (p.usedRevisions ?? 0), 0),
);

const totalAllowedRevisions = computed(() =>
  projects.value.reduce((sum, p) => sum + (p.totalAllowedRevisions ?? 0), 0),
);

const totalRemainingRevisions = computed(() =>
  projects.value.reduce((sum, p) => sum + (p.remainingRevisions ?? 0), 0),
);

const totalUsedPercent = computed(() => {
  if (totalAllowedRevisions.value === 0) return 0;
  return Math.min(
    (totalUsedRevisions.value / totalAllowedRevisions.value) * 100,
    100,
  );
});

async function fetchProjects() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await apiClient.projects.list();
    projects.value = res.projects;
  } catch (err: any) {
    error.value = err.message || "Failed to load projects";
  } finally {
    isLoading.value = false;
  }
}

function openModal() {
  form.value = { name: "", clientName: "", totalAllowedRevisions: 3 };
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
    error.value = err.message || "Failed to create project";
  } finally {
    isSubmitting.value = false;
  }
}

function navigateToProject(id: string) {
  router.push(`/projects/${id}`);
}

function getProgressPercent(project: Project): number {
  if (project.totalAllowedRevisions === 0) return 0;
  return Math.min(
    (project.usedRevisions / project.totalAllowedRevisions) * 100,
    100,
  );
}

function toggleSort() {
  if (sortBy.value === "name") sortBy.value = "client";
  else if (sortBy.value === "client") sortBy.value = "revisions";
  else sortBy.value = "name";
}

onMounted(() => {
  fetchProjects();
});
</script>

<template>
  <section class="p-8 md:p-12 bg-[#FAFAF9] min-h-screen">
    <!-- ── 1. TOP BAR (Breadcrumb) ─────────────────────────────── -->
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
          PROJECTS
        </span>
      </nav>
      <AppTopbar />
    </div>

    <!-- ── 2. HEADER (Judul + Subtitle + Tombol) ───────────────── -->
    <div
      class="flex items-start justify-between border-b-2 border-[#1A1A1A] pb-6 mb-8"
    >
      <div>
        <h1
          class="font-['Baskervville',serif] text-5xl font-normal leading-[1.1] tracking-tight text-[#1A1A1A]"
        >
          Projects
        </h1>
        <p
          class="font-['Noto_Serif',serif] text-base leading-[1.6] text-[#1A1A1A]/60 mt-2"
        >
          Manage your project workspace and monitor revision quota boundaries
        </p>
      </div>
      <button
        @click="openModal"
        class="shrink-0 ml-6 bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
      >
        + NEW PROJECT
      </button>
    </div>

    <!-- ── LOADING ──────────────────────────────────────────── -->
    <div
      v-if="isLoading"
      class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/60 mb-8"
    >
      <span class="animate-pulse">■</span>
      <span>Loading projects...</span>
    </div>

    <!-- ── ERROR ────────────────────────────────────────────── -->
    <div
      v-if="error"
      class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-6 rounded-none font-['Noto_Serif',serif] mb-6"
    >
      {{ error }}
    </div>

    <!-- ── 3. SUMMARY STAT ROW ───────────────────────────────── -->
    <div v-if="!isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
      <!-- Card 1: Active Projects -->
      <div
        class="bg-[#FDFFB6] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-5 rounded-none flex flex-col justify-between min-h-[140px] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out"
      >
        <div class="flex justify-between items-start">
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70"
          >
            TOTAL ACTIVE PROJECTS
          </p>
          <FolderKanban class="w-7 h-7 text-[#1A1A1A]" :stroke-width="2" />
        </div>
        <p
          class="font-['JetBrains_Mono',monospace] text-5xl font-bold text-[#1A1A1A] mt-4 leading-none"
        >
          {{ projects.length }}
        </p>
      </div>

      <!-- Card 2: Total Revisions Used -->
      <div
        class="bg-[#DCCCFF] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-5 rounded-none flex flex-col justify-between min-h-[140px] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out"
      >
        <div>
          <div class="flex justify-between items-start mb-2">
            <p
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70"
            >
              TOTAL REVISIONS USED
            </p>
            <History class="w-7 h-7 text-[#1A1A1A]" :stroke-width="2" />
          </div>
          <p
            class="font-['JetBrains_Mono',monospace] text-4xl font-bold text-[#1A1A1A] leading-none"
          >
            {{ totalUsedRevisions }}
          </p>
        </div>

        <div class="mt-3">
          <div
            class="w-full h-2.5 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden"
          >
            <div
              class="h-full bg-[#006D77] transition-all duration-300 ease-out"
              :style="{ width: totalUsedPercent + '%' }"
            ></div>
          </div>
          <p
            class="font-['JetBrains_Mono',monospace] text-[11px] text-[#1A1A1A]/70 mt-1"
          >
            {{ totalUsedRevisions }} of {{ totalAllowedRevisions }} revisions
          </p>
        </div>
      </div>

      <!-- Card 3: Revisions Remaining -->
      <div
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-5 rounded-none flex flex-col justify-between min-h-[140px] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out"
      >
        <div class="flex justify-between items-start">
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70"
          >
            REVISIONS REMAINING
          </p>
          <ClipboardList class="w-7 h-7 text-[#1A1A1A]" :stroke-width="2" />
        </div>
        <p
          class="font-['JetBrains_Mono',monospace] text-5xl font-bold text-[#1A1A1A] mt-4 leading-none"
        >
          {{ totalRemainingRevisions }}
        </p>
      </div>
    </div>

    <!-- ── 4. PROJECT GRID ───────────────────────────────────── -->
    <div v-if="!isLoading && projects.length > 0">
      <!-- Current Workspace Header dengan Underline tebal & Interactive Filter/Sort -->
      <div
        class="flex flex-wrap items-center justify-between pb-3 border-b-2 border-[#1A1A1A] mb-6 gap-4"
      >
        <h2
          class="font-['Baskervville',serif] text-2xl font-normal text-[#1A1A1A]"
        >
          Current Workspace
        </h2>

        <div
          class="flex items-center gap-4 font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/70"
        >
          <!-- Search/Filter Input -->
          <div class="relative flex items-center">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search project or client..."
              class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-3 py-1.5 pl-8 text-xs font-['Noto_Serif',serif] rounded-none outline-none focus:bg-[#FDFFB6] w-48 transition-all"
            />
            <Search
              class="w-3.5 h-3.5 absolute left-2.5 text-[#1A1A1A]/50 pointer-events-none"
            />
          </div>

          <!-- Sort Button -->
          <button
            @click="toggleSort"
            class="flex items-center gap-1.5 border-2 border-[#1A1A1A] px-3 py-1.5 bg-[#FAFAF9] hover:bg-[#FDFFB6] transition-colors cursor-pointer"
          >
            <ArrowUpDown class="w-3.5 h-3.5" />
            <span>SORT: {{ sortBy.toUpperCase() }}</span>
          </button>
        </div>
      </div>

      <!-- Grid Cards Proyek -->
      <div
        v-if="filteredProjects.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="(project, index) in filteredProjects"
          :key="project.id"
          @click="navigateToProject(project.id)"
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none cursor-pointer transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] overflow-hidden"
        >
          <!-- Dynamic Accent Bar Color -->
          <div
            class="h-3 border-b-2 border-[#1A1A1A]"
            :class="getCardTopBarClass(index)"
          ></div>

          <div class="p-5">
            <!-- PROJECT Label + Arrow Icon -->
            <div class="flex items-center justify-between mb-3">
              <p
                class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold"
              >
                PROJECT
              </p>
              <ArrowUpRight class="w-4 h-4 text-[#1A1A1A]/60" />
            </div>

            <!-- Project Name -->
            <h3
              class="font-['Baskervville',serif] text-xl font-normal leading-[1.3] text-[#1A1A1A]"
            >
              {{ project.name }}
            </h3>

            <!-- Client Name -->
            <p
              class="font-['Noto_Serif',serif] text-sm leading-[1.5] text-[#1A1A1A]/60 mt-1"
            >
              {{ project.clientName }}
            </p>

            <!-- ACTIVE Badge -->
            <div class="mt-3">
              <span
                class="inline-block bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wide rounded-none font-semibold"
              >
                ACTIVE
              </span>
            </div>
          </div>

          <!-- Quota Section -->
          <div class="border-t-2 border-[#1A1A1A] px-5 pt-4 pb-5">
            <div class="flex items-center justify-between mb-2">
              <p
                class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold"
              >
                REVISION QUOTA
              </p>
              <span
                class="font-['JetBrains_Mono',monospace] text-xs font-semibold text-[#1A1A1A]/80"
              >
                {{ project.usedRevisions }} /
                {{ project.totalAllowedRevisions }}
              </span>
            </div>

            <!-- Progress Bar h-6 -->
            <div
              class="w-full h-6 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden"
            >
              <div
                class="h-full bg-[#006D77] transition-all duration-300 ease-out"
                :style="{ width: getProgressPercent(project) + '%' }"
              ></div>
            </div>

            <div class="flex items-center justify-between mt-2">
              <span
                class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/60"
              >
                {{ project.remainingRevisions }} remaining
              </span>
              <span
                class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/60"
              >
                {{ Math.round(getProgressPercent(project)) }}% used
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Filter Match -->
      <div
        v-else
        class="p-12 text-center border-2 border-dashed border-[#1A1A1A]/30"
      >
        <p class="font-['Baskervville',serif] text-lg text-[#1A1A1A]/60">
          No projects match your filter query.
        </p>
        <button
          @click="searchQuery = ''"
          class="mt-2 text-xs font-['JetBrains_Mono',monospace] underline cursor-pointer"
        >
          Clear filter
        </button>
      </div>
    </div>

    <!-- ── 5. EMPTY STATE ────────────────────────────────────── -->
    <div
      v-else-if="!isLoading && projects.length === 0"
      class="flex flex-col items-center justify-center border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center"
    >
      <img
        src="/src/assets/Projects2.png"
        alt="No projects illustration"
        class="w-28 h-28 md:w-36 md:h-36 object-contain select-none pointer-events-none mb-4 opacity-70"
        draggable="false"
      />
      <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/60">
        No projects yet
      </p>
      <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">
        Create your first project to get started
      </p>
      <button
        @click="openModal"
        class="mt-6 bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
      >
        + NEW PROJECT
      </button>
    </div>

    <!-- ── 6. CREATE PROJECT MODAL ───────────────────────────── -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 max-w-md w-[90%] rounded-none shadow-[8px_8px_0px_0px_#1A1A1A]"
      >
        <h2
          class="font-['Baskervville',serif] text-2xl font-normal leading-[1.3] text-[#1A1A1A] mb-6"
        >
          Create New Project
        </h2>

        <form @submit.prevent="handleCreateProject" class="flex flex-col gap-4">
          <div>
            <label
              for="name"
              class="block font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide mb-1"
            >
              Project Name
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-3 font-['Noto_Serif',serif] text-base rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="Enter project name..."
            />
          </div>

          <div>
            <label
              for="clientName"
              class="block font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide mb-1"
            >
              Client Name
            </label>
            <input
              id="clientName"
              v-model="form.clientName"
              type="text"
              required
              class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-3 font-['Noto_Serif',serif] text-base rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="Enter client name..."
            />
          </div>

          <div>
            <label
              for="totalAllowedRevisions"
              class="block font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide mb-1"
            >
              Total Allowed Revisions
            </label>
            <input
              id="totalAllowedRevisions"
              v-model.number="form.totalAllowedRevisions"
              type="number"
              min="1"
              max="100"
              required
              class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-3 font-['Noto_Serif',serif] text-base rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="3"
            />
          </div>

          <div
            v-if="error"
            class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-3 rounded-none font-['Noto_Serif',serif] text-sm"
          >
            {{ error }}
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ isSubmitting ? "CREATING..." : "CREATE PROJECT" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
