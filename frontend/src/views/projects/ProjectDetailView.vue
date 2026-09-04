<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient, ApiError } from "../../api/client";
import type {
  Project,
  RevisionBatchSummary,
  RevisionBatchStatus,
} from "../../types/api";
import UiQuotaBar from "../../components/ui/UiQuotaBar.vue";

const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.id as string);

const project = ref<Project | null>(null);
const batches = ref<RevisionBatchSummary[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Feedback submission state
const rawInput = ref("");
const isSubmitting = ref(false);
const errorMsg = ref("");
const errorCode = ref<string | null>(null);
const feedbackSection = ref<HTMLElement | null>(null);

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
    error.value =
      err instanceof ApiError ? err.message : "Failed to load project detail";
  } finally {
    isLoading.value = false;
  }
}

function navigateToBatch(batchId: string) {
  router.push(`/batches/${batchId}`);
}

function scrollToFeedback() {
  feedbackSection.value?.scrollIntoView({ behavior: "smooth" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadgeClass(status: RevisionBatchStatus): string {
  switch (status) {
    case "DRAFT":
      return "bg-[#E5E7EB] text-[#1A1A1A] border-2 border-[#1A1A1A]";
    case "PENDING_CONFIRMATION":
      return "bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A]";
    case "APPROVED":
      return "bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A]";
    default:
      return "bg-[#E5E7EB] text-[#1A1A1A] border-2 border-[#1A1A1A]";
  }
}

const progressPercent = computed(() => {
  if (!project.value || project.value.totalAllowedRevisions === 0) return 0;
  return Math.min(
    (project.value.usedRevisions / project.value.totalAllowedRevisions) * 100,
    100,
  );
});

const isQuotaExhausted = computed(() => {
  return project.value && project.value.remainingRevisions === 0;
});

// Pagination for Recent Revision Batches
const PAGE_SIZE = 5;
const currentPage = ref(1);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(batches.value.length / PAGE_SIZE));
});

const paginatedBatches = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return batches.value.slice(start, start + PAGE_SIZE);
});

// Base pagination button class (shared)
const basePaginationBtnClass =
  "font-['JetBrains_Mono',monospace] text-xs font-bold uppercase border-2 border-[#1A1A1A] rounded-none px-3 py-1.5";

function clearError() {
  errorMsg.value = "";
  errorCode.value = null;
}

async function handleSubmitFeedback() {
  if (!rawInput.value.trim()) {
    errorMsg.value = "Feedback cannot be empty.";
    errorCode.value = "VALIDATION_ERROR";
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = "";
  errorCode.value = null;

  try {
    const res = await apiClient.projects.submitRevision(
      projectId.value,
      rawInput.value,
    );
    const batchId = res.batch.id;
    rawInput.value = "";
    isSubmitting.value = false;
    router.push(`/batches/${batchId}`);
  } catch (err: unknown) {
    isSubmitting.value = false;
    if (err instanceof ApiError) {
      errorCode.value = err.code;
      switch (err.code) {
        case "QUOTA_EXHAUSTED":
          errorMsg.value = "Quota exhausted. Wait for client approval.";
          break;
        case "AI_PROCESSING_FAILED":
          errorMsg.value = "AI analysis failed. Please try again.";
          break;
        case "NETWORK_ERROR":
          errorMsg.value =
            "Unable to reach the server. Please check your connection.";
          break;
        default:
          errorMsg.value =
            err.status && err.status >= 500
              ? "Server error. Please try again later."
              : "Failed to analyze feedback. Please try again.";
          break;
      }
    } else {
      errorMsg.value = "An unexpected error occurred.";
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
  <section class="bg-[#FAFAF9] min-h-screen">
    <!-- ── 1. TOP BAR ─────────────────────────────────────────── -->
    <div
      class="flex items-center justify-between border-b-2 border-[#1A1A1A] px-8 md:px-12 py-4 bg-[#FAFAF9]"
    >
      <router-link
        to="/projects"
        class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 transition-all duration-100"
      >
        ← PROJECTS
      </router-link>

      <button
        v-if="project"
        @click="scrollToFeedback"
        class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-2.5 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
      >
        + SUBMIT FEEDBACK
      </button>
    </div>

    <!-- ── LOADING ──────────────────────────────────────────────── -->
    <div
      v-if="isLoading"
      class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/60 px-8 md:px-12 py-12"
    >
      <span class="animate-pulse">■</span>
      <span>Loading project...</span>
    </div>

    <!-- ── ERROR ────────────────────────────────────────────────── -->
    <div
      v-else-if="error"
      class="bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] p-6 rounded-none font-['Noto_Serif',serif] mx-8 md:mx-12 mt-8"
    >
      {{ error }}
    </div>

    <!-- ── MAIN CONTENT ─────────────────────────────────────────── -->
    <div v-else-if="project" class="px-8 md:px-12 py-8">
      <!-- ── 2. HEADER ─────────────────────────────────────────── -->
      <div class="border-b-2 border-[#1A1A1A] pb-6 mb-8">
        <h1
          class="font-['Baskervville',serif] text-5xl font-normal leading-[1.1] tracking-tight text-[#1A1A1A]"
        >
          {{ project.name }}
        </h1>
        <div class="flex flex-wrap items-center gap-3 mt-3">
          <!-- Client tag (lavender) -->
          <span
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide bg-[#DCCCFF] text-[#1A1A1A] border border-[#1A1A1A] px-3 py-1 rounded-none font-bold"
          >
            {{ project.clientName }}
          </span>
          <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/60">
            Created {{ formatDate(project.createdAt) }}
          </span>
        </div>
      </div>

      <!-- ── 3. QUOTA STAT ROW ──────────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <!-- Card 1: Total Allowed -->
        <div
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-6 rounded-none flex flex-col justify-between min-h-[130px]"
        >
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70"
          >
            TOTAL ALLOWED
          </p>
          <p
            class="font-['JetBrains_Mono',monospace] text-5xl font-bold text-[#1A1A1A] leading-none mt-4"
          >
            {{ project.totalAllowedRevisions }}
          </p>
        </div>

        <!-- Card 2: Revisions Used -->
        <div
          class="bg-[#FDFFB6] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-6 rounded-none flex flex-col justify-between min-h-[130px]"
        >
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70"
          >
            REVISIONS USED
          </p>
          <p
            class="font-['JetBrains_Mono',monospace] text-5xl font-bold text-[#1A1A1A] leading-none mt-2"
          >
            {{ project.usedRevisions }}
          </p>
          <!-- Progress bar h-6 -->
          <div class="mt-4">
            <div
              class="w-full h-3 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden"
            >
              <div
                class="h-full bg-[#006D77] transition-all duration-300 ease-out"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
            <p
              class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/60 mt-1"
            >
              {{ project.usedRevisions }} /
              {{ project.totalAllowedRevisions }} used
            </p>
          </div>
        </div>

        <!-- Card 3: Remaining -->
        <div
          class="bg-[#DCCCFF] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-6 rounded-none flex flex-col justify-between min-h-[130px]"
        >
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70"
          >
            REVISIONS REMAINING
          </p>
          <p
            class="font-['JetBrains_Mono',monospace] text-5xl font-bold text-[#1A1A1A] leading-none mt-4"
          >
            {{ project.remainingRevisions }}
          </p>
          <p
            class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/60 mt-2"
          >
            available to use
          </p>
        </div>
      </div>

      <!-- ── 4. TWO-COLUMN WORKSPACE ───────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
        <!-- LEFT COLUMN: Recent Revision Batches -->
        <div class="lg:col-span-2 space-y-5">
          <!-- Section header -->
          <div
            class="flex items-center justify-between pb-3 border-b-2 border-[#1A1A1A]"
          >
            <h2
              class="font-['Baskervville',serif] text-2xl font-normal text-[#1A1A1A]"
            >
              Recent Revision Batches
            </h2>
            <span
              v-if="batches.length > 0"
              class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/70"
            >
              {{ batches.length }}
              {{ batches.length === 1 ? "BATCH" : "BATCHES" }}
            </span>
          </div>

          <!-- Empty state -->
          <div
            v-if="batches.length === 0"
            class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-10 rounded-none text-center"
          >
            <p class="font-['Baskervville',serif] text-xl text-[#1A1A1A]/60">
              No revision batches yet
            </p>
            <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/40 mt-2">
              Submit your first feedback to get AI analysis.
            </p>
          </div>

          <!-- Batch cards -->
          <div v-else class="space-y-4">
            <div
              v-for="batch in paginatedBatches"
              :key="batch.id"
              @click="navigateToBatch(batch.id)"
              class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none cursor-pointer transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] overflow-hidden"
            >
              <div class="p-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <!-- Status badge + Batch ID -->
                    <div class="flex items-center gap-3 mb-2">
                      <span
                        :class="getStatusBadgeClass(batch.status)"
                        class="px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wide rounded-none font-bold"
                      >
                        {{
                          batch.status === "PENDING_CONFIRMATION"
                            ? "PENDING"
                            : batch.status
                        }}
                      </span>
                      <span
                        class="font-['Baskervville',serif] text-xl font-normal text-[#1A1A1A]"
                      >
                        Batch #{{
                          String(
                            batches.length - batches.indexOf(batch),
                          ).padStart(3, "0")
                        }}
                      </span>
                    </div>

                    <!-- Item count + Date -->
                    <div class="flex items-center gap-3">
                      <span
                        class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/50"
                      >
                        {{ batch.itemCount }} item{{
                          batch.itemCount !== 1 ? "s" : ""
                        }}
                      </span>
                      <span
                        class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/30"
                        >·</span
                      >
                      <span
                        class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/50"
                      >
                        {{ formatDate(batch.createdAt) }}
                      </span>
                    </div>

                    <!-- Pagination controls -->
                    <nav
                      v-if="totalPages > 1"
                      class="flex items-center justify-center gap-2 pt-4"
                      aria-label="Revision batches pagination"
                    >
                      <button
                        type="button"
                        @click="currentPage = Math.max(1, currentPage - 1)"
                        :disabled="currentPage === 1"
                        :class="[
                          basePaginationBtnClass,
                          'bg-[#FAFAF9] text-[#1A1A1A] hover:bg-[#DCCCFF]',
                          currentPage === 1
                            ? 'opacity-50 cursor-not-allowed'
                            : '',
                        ]"
                      >
                        &larr; PREV
                      </button>

                      <button
                        v-for="page in totalPages"
                        :key="page"
                        type="button"
                        @click="currentPage = page"
                        :class="[
                          basePaginationBtnClass,
                          currentPage === page
                            ? 'bg-[#1A1A1A] text-[#FAFAF9]'
                            : 'bg-[#FAFAF9] text-[#1A1A1A] hover:bg-[#DCCCFF] transition-colors',
                        ]"
                      >
                        {{ page }}
                      </button>

                      <button
                        type="button"
                        @click="
                          currentPage = Math.min(totalPages, currentPage + 1)
                        "
                        :disabled="currentPage === totalPages"
                        :class="[
                          basePaginationBtnClass,
                          'bg-[#FAFAF9] text-[#1A1A1A] hover:bg-[#DCCCFF]',
                          currentPage === totalPages
                            ? 'opacity-50 cursor-not-allowed'
                            : '',
                        ]"
                      >
                        NEXT &rarr;
                      </button>
                    </nav>
                  </div>

                  <!-- Right action button -->
                  <div class="shrink-0">
                    <button
                      @click.stop="navigateToBatch(batch.id)"
                      class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Project Context Panel (sticky) -->
        <div class="lg:col-span-1 lg:sticky lg:top-6">
          <div
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none p-6"
          >
            <p
              class="font-['JetBrains_Mono',monospace] text-xl uppercase tracking-widest text-[#1A1A1A] font-bold mb-3"
            >
              PROJECT CONTEXT
            </p>
            <hr class="border-t border-[#1A1A1A] mb-4" />

            <!-- Context rows -->
            <div>
              <div
                class="flex items-start justify-between py-3 gap-4 border-b border-dashed border-[#1A1A1A]/70"
              >
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/50 shrink-0"
                  >CLIENT</span
                >
                <span
                  class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] text-right font-medium"
                  >{{ project.clientName }}</span
                >
              </div>
              <div
                class="flex items-start justify-between py-3 gap-4 border-b border-dashed border-[#1A1A1A]/70"
              >
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/50 shrink-0"
                  >CREATED</span
                >
                <span
                  class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] text-right"
                  >{{ formatDate(project.createdAt) }}</span
                >
              </div>
              <div
                class="flex items-start justify-between py-3 gap-4 border-b border-dashed border-[#1A1A1A]/70"
              >
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/50 shrink-0"
                  >QUOTA</span
                >
                <span
                  class="font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A] text-right"
                >
                  {{ project.usedRevisions }} /
                  {{ project.totalAllowedRevisions }}
                </span>
              </div>
              <div
                class="flex items-start justify-between py-2 gap-4 border-b border-dashed border-[#1A1A1A]/70"
              >
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/50 shrink-0"
                  >REVISIONS USED</span
                >
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/70 text-right"
                >
                  {{ project.usedRevisions }} /
                  {{ project.totalAllowedRevisions }} revisions used
                </span>
              </div>
              <UiQuotaBar
                :used="project.usedRevisions"
                :total="project.totalAllowedRevisions"
                size="sm"
                class="mt-2"
              />
              <div
                class="flex items-start justify-between py-3 gap-4 border-b border-dashed border-[#1A1A1A]/70"
              >
                <span
                  class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/50 shrink-0"
                  >REMAINING</span
                >
                <span
                  class="font-['JetBrains_Mono',monospace] text-sm text-right font-bold"
                  :class="
                    isQuotaExhausted ? 'text-[#E63946]' : 'text-[#006D77]'
                  "
                >
                  {{ project.remainingRevisions }} left
                </span>
              </div>
            </div>

            <!-- MANAGE PROJECT button -->
            <button
              disabled
              title="Document upload (PDF/MD/DOCX) — planned for a future release"
              class="w-full mt-5 bg-[#FAFAF9] text-[#1A1A1A]/40 border-2 border-[#1A1A1A]/40 px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide rounded-none cursor-not-allowed"
            >
              MANAGE PROJECT — COMING SOON
            </button>
          </div>
        </div>
      </div>

      <!-- ── 5. SUBMIT REVISION FEEDBACK SECTION ────────────────── -->
      <div
        ref="feedbackSection"
        id="submit-feedback-section"
        class="border-t-2 border-[#1A1A1A] pt-8"
      >
        <div
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none p-6 md:p-8"
        >
          <!-- NEXT ACTION label -->
          <p
            class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#006D77] mb-2 font-bold"
          >
            NEXT ACTION
          </p>

          <!-- Section title -->
          <h2
            class="font-['Baskervville',serif] text-2xl font-normal leading-[1.3] text-[#1A1A1A] mb-1"
          >
            Submit Revision Feedback
          </h2>

          <!-- Description -->
          <p
            class="font-['Noto_Serif',serif] text-sm leading-[1.6] text-[#1A1A1A]/70 mb-5"
          >
            Paste raw client feedback below. AI will analyze and classify scope.
          </p>

          <!-- Feedback Notes label -->
          <label
            class="block font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A] mb-2"
          >
            FEEDBACK NOTES
          </label>

          <!-- Textarea -->
          <textarea
            v-model="rawInput"
            @input="clearError"
            :disabled="isSubmitting"
            class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] p-4 font-['Noto_Serif',serif] text-base leading-[1.6] rounded-none w-full outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40 resize-y min-h-[180px] disabled:opacity-50"
            placeholder="Detail the requested changes here..."
          ></textarea>

          <!-- Error block -->
          <div
            v-if="errorMsg"
            class="mt-4 w-full border-2 border-[#E63946] bg-[#FEE2E2] p-4 rounded-none"
          >
            <p
              class="font-['Inter',sans-serif] text-xs uppercase tracking-wide text-[#991B1B] mb-1 font-bold"
            >
              {{ errorCode }}
            </p>
            <p class="font-['Noto_Serif',serif] text-base text-[#991B1B]">
              {{ errorMsg }}
            </p>
            <button
              v-if="
                errorCode === 'AI_PROCESSING_FAILED' ||
                errorCode === 'NETWORK_ERROR' ||
                (errorCode &&
                  !['QUOTA_EXHAUSTED', 'VALIDATION_ERROR'].includes(errorCode))
              "
              @click="handleRetryFeedback"
              class="mt-3 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer"
            >
              Retry
            </button>
          </div>

          <!-- Submit + Loading indicator -->
          <div class="mt-5 flex items-center gap-4">
            <button
              @click="handleSubmitFeedback"
              :disabled="isQuotaExhausted || isSubmitting"
              class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-8 py-3 font-['Inter',sans-serif] text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_#1A1A1A] cursor-pointer"
            >
              {{ isQuotaExhausted ? "QUOTA EXHAUSTED" : "ANALYZE FEEDBACK" }}
            </button>

            <div
              v-if="isSubmitting"
              class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/70"
            >
              <span class="animate-pulse">■</span>
              <span>Processing AI scope analysis...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
