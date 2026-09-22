<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { apiClient, ApiError } from "../../api/client";
import type { PortalBatchResponse, ScopeStatus } from "../../types/api";
import { useI18n } from "../../composables/useI18n";
import { trackEvent } from "../../services/analytics";

const { t, locale } = useI18n();

const route = useRoute();
const token = computed(() => route.params.token as string);
const currentYear = computed(() => new Date().getFullYear());

const batchData = ref<PortalBatchResponse | null>(null);
const isLoading = ref(true);
const notFound = ref(false);
const networkError = ref(false);
const isConfirming = ref(false);

async function fetchPortalData() {
  isLoading.value = true;
  notFound.value = false;
  networkError.value = false;
  try {
    const res = await apiClient.portal.getByToken(token.value);
    batchData.value = res;
  } catch (err: unknown) {
    if (
      err instanceof ApiError &&
      (err.code === "NOT_FOUND" || err.status === 404)
    ) {
      notFound.value = true;
    } else {
      networkError.value = true;
    }
  } finally {
    isLoading.value = false;
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return t("portal.unknownDate");
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return t("portal.unknownDate");
  return d.toLocaleString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScopeStatusLabel(status: ScopeStatus): string {
  switch (status) {
    case "IN_SCOPE": return t("batch.inScope");
    case "OUT_OF_SCOPE": return t("batch.outOfScope");
    case "NEEDS_REVIEW": return t("batch.needsReview");
    default: return status;
  }
}

function getShortId(id: string): string {
  return id.slice(0, 8).toUpperCase() + "...";
}

function getTokenSnippet(tokenStr: string): string {
  if (!tokenStr) return "N/A";
  return tokenStr.slice(0, 12).toUpperCase() + "...";
}

function getScopeStatusBadgeClass(status: ScopeStatus): string {
  switch (status) {
    case "IN_SCOPE":
      return "bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-mono text-xs font-bold uppercase";
    case "OUT_OF_SCOPE":
      return "bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-mono text-xs font-bold uppercase";
    case "NEEDS_REVIEW":
      return "bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-mono text-xs font-bold uppercase";
    default:
      return "bg-[#E5E7EB] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-none px-3 py-1 font-mono text-xs font-bold uppercase";
  }
}

async function handleConfirm() {
  if (!batchData.value || isConfirming.value) return;
  isConfirming.value = true;
  try {
    await apiClient.portal.confirm(token.value);
    trackEvent("approve_revision_batch");
    await fetchPortalData();
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 409) {
      // Conflict - re-fetch to sync state, no toast
      await fetchPortalData();
    }
  } finally {
    isConfirming.value = false;
  }
}

function retryFetch() {
  fetchPortalData();
}

onMounted(() => {
  fetchPortalData();
});

watch(
  () => route.params.token,
  (newToken) => {
    if (typeof newToken === "string") {
      fetchPortalData();
    }
  },
);
</script>

<template>
  <div class="min-h-screen bg-[#FAFAF9]">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="min-h-screen flex items-center justify-center flex-col gap-2 px-4"
    >
      <span class="animate-pulse font-mono text-sm text-[#1A1A1A]/60">■</span>
       <span class="font-mono text-sm text-[#1A1A1A]/60"
         >{{ t("portal.loading") }}</span
       >
    </div>

    <!-- Not Found State -->
    <div
      v-else-if="notFound"
      class="min-h-screen flex items-center justify-center flex-col gap-4 px-4 py-12 text-center"
    >
      <p
        class="font-editorial text-xl font-normal leading-[1.3] text-[#1A1A1A]/60"
      >
         {{ t("portal.notFound") }}
      </p>
    </div>

    <!-- Network Error State -->
    <div
      v-else-if="networkError"
      class="min-h-screen flex items-center justify-center flex-col gap-4 px-4 py-12 text-center"
    >
      <div
        class="border-2 border-[#E63946] bg-[#FEE2E2] p-4 rounded-none max-w-md text-[#991B1B]"
      >
        <p class="font-body text-base mb-4">
           {{ t("portal.networkError") }}
        </p>
        <button
          @click="retryFetch"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm uppercase font-semibold tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
        >
          {{ t("portal.retry") }}
        </button>
      </div>
    </div>

    <!-- Portal View -->
    <div v-else-if="batchData" class="max-w-[640px] mx-auto py-12 px-4">
      <div
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 md:p-12 shadow-[8px_8px_0px_0px_#1A1A1A] rounded-none"
      >
        <!-- Header Row -->
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
        >
          <div class="flex items-center gap-3">
            <img
              src="/asset/logo.png"
              alt="SCOPREVO Logo"
              class="h-12 w-auto object-contain"
              draggable="false"
            />

           <span class="font-editorial text-2xl md:text-3xl text-[#1A1A1A]"
             >{{ t("portal.heading") }}</span
           >
          </div>
           <span
             class="font-mono text-xs uppercase tracking-widest text-[#1A1A1A]/70"
             >{{ t("portal.clientPortal") }}</span
           >
        </div>

        <hr class="border-b-2 border-[#1A1A1A] my-6" />

        <div v-if="batchData.scopeReviewPending" class="mb-8 border-2 border-[#1A1A1A] bg-[#FDFFB6] p-4 font-body text-sm text-[#1A1A1A]">
          Scope review is still pending for {{ batchData.hiddenItemsCount }} item(s). The freelancer is clarifying the remaining scope items. You can confirm after all items are reviewed.
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
          <div>
            <span
              class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/70"
              >               {{ t("portal.dateLabel") }}</span
            >
            <p
              class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A] mt-0.5"
            >
              {{ formatDate(batchData.batch.createdAt) }}
            </p>
          </div>
          <div>
            <span
              class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/70"
              >               {{ t("portal.revisionId") }}</span
            >
            <p
              class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A] mt-0.5"
            >
              {{ getShortId(batchData.batch.id) }}
            </p>
          </div>
          <div>
             <span
               class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/70"
               >{{ t("portal.clientLabel") }}</span
             >
            <p
              class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A] mt-0.5"
            >
              {{ batchData.batch.project.clientName }}
            </p>
          </div>
          <div>
            <span
              class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/70"
              >               {{ t("portal.portalId") }}</span
            >
            <p
              class="font-mono text-xs uppercase tracking-wider text-[#1A1A1A] mt-0.5"
            >
              {{ getTokenSnippet(String(route.params.token ?? "")) }}
            </p>
          </div>
        </div>

        <!-- Quota Row (P3 - Mandatory) -->
        <div class="mb-6">
          <div class="font-mono text-xs uppercase font-bold text-[#1A1A1A]">
           {{ t("portal.quotaLabel") }}: {{ batchData.batch.project.usedRevisions }}/{{
               batchData.batch.project.totalAllowedRevisions
             }}
             {{ t("portal.quotaUsed") }}
            <span
              :class="
                batchData.batch.project.remainingRevisions === 0
                  ? 'text-[#E63946]'
                  : 'text-[#1A1A1A]'
              "
            >
               • {{ batchData.batch.project.remainingRevisions }} {{ t("portal.quotaRemaining") }}
            </span>
          </div>
        </div>

        <hr class="border-b-2 border-[#1A1A1A] my-6" />

        <!-- Headline Section (P5) -->
        <div class="text-center mb-8">
          <h1 class="font-editorial text-3xl md:text-5xl text-[#1A1A1A] mb-3">
             {{ t("portal.scopeReview") }}
          </h1>
          <div class="w-16 h-1 bg-[#1A1A1A] mx-auto mb-4"></div>
          <p class="font-body text-sm text-center text-[#1A1A1A]/70 mb-8">
             {{ t("portal.reviewItems") }}
          </p>
        </div>

        <!-- AI Summary Card -->
        <div
          class="bg-[#FAFAF9] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] p-6 rounded-none mb-8"
        >
          <h2
            class="font-editorial text-2xl font-normal leading-[1.3] text-[#1A1A1A] mb-3"
          >
             {{ t("portal.aiSummary") }}
          </h2>
          <p
            v-if="batchData.batch.summary"
            class="font-body text-base leading-[1.6] text-[#1A1A1A]"
          >
            {{ batchData.batch.summary }}
          </p>
          <p v-else class="font-body text-sm text-[#1A1A1A]/40">
             {{ t("portal.noSummary") }}
          </p>
        </div>

        <!--              {{ t("portal.itemsTitle") }} List (P6, P7, Q2) -->
        <div
          v-if="batchData.batch.items.length === 0"
          class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center mb-8"
        >
          <p class="font-editorial text-xl text-[#1A1A1A]/60">
             {{ t("portal.noItems") }}
          </p>
          <p class="font-body text-sm text-[#1A1A1A]/40 mt-2">
             {{ t("portal.noItemsDesc") }}
          </p>
        </div>

        <div v-else class="space-y-6 mb-8">
          <div
            v-for="(item, index) in batchData.batch.items"
            :key="item.id"
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A]"
          >
            <!-- Inline Header Bar (P6) -->
            <div
              class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4"
            >
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs text-[#1A1A1A]/70"
                  >{{ t("portal.itemLabel") }} {{ String(index + 1).padStart(2, "0") }}</span
                >
                <span
                  v-if="item.category"
                  class="bg-[#DCCCFF] text-[#1A1A1A] border border-[#1A1A1A] px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded-none"
                >
                  {{ item.category }}
                </span>
              </div>
              <span :class="getScopeStatusBadgeClass(item.scopeStatus)">
                {{ getScopeStatusLabel(item.scopeStatus) }}
              </span>
            </div>

            <!-- Item Description (Q2) -->
            <p
              class="font-body text-sm text-[#1A1A1A]/80 leading-relaxed"
              :class="
                item.scopeStatus === 'OUT_OF_SCOPE'
                  ? 'line-through opacity-70'
                  : ''
              "
            >
              {{ item.description }}
            </p>

            <!-- Reason Box (P7) -->
            <div
              v-if="
                item.scopeStatus !== 'IN_SCOPE' &&
                item.reason &&
                item.reason.trim().length > 0
              "
              class="border-l-4 border-[#1A1A1A] pl-4 py-1 mt-4 bg-transparent"
            >
              <span class="font-mono text-xs font-bold text-[#1A1A1A] mr-1"
                >                 {{ t("portal.reasonLabel") }}</span
              >
              <span class="font-body text-sm text-[#1A1A1A]/80">{{
                item.reason
              }}</span>
            </div>
          </div>
        </div>

        <!-- Confirmation CTA (P4, Q1) -->
        <div
          v-if="batchData.batch.status === 'PENDING_CONFIRMATION'"
          class="space-y-4"
        >
          <p class="font-body text-sm text-center text-[#1A1A1A]/80">
            {{ t("portal.reviewConfirmPrompt") }}
          </p>
          <button
            @click="handleConfirm"
            :disabled="isConfirming || batchData.scopeReviewPending"
            class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] py-4 font-ui text-base font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {{ isConfirming ? t("portal.confirming") : t("portal.confirmBtn") }}
          </button>
        </div>

        <!-- Approved State -->
        <div
          v-else-if="batchData.batch.status === 'APPROVED'"
          class="space-y-4"
        >
          <div
            class="bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] p-4 text-center font-mono text-sm font-bold uppercase shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none"
          >
             {{ t("portal.approvedBadge") }}
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center">
          <p class="font-mono text-xs text-[#1A1A1A]/50">
             © {{ currentYear }} {{ t("portal.copyright") }}
          </p>
          <p class="font-mono text-xs text-[#1A1A1A]/50 mt-1">
             {{ t("portal.clientPortalFooter") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
