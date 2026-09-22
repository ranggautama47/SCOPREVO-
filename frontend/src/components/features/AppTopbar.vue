<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { swrService } from "../../services/resilience/swr.service";
import { setupNetworkListeners } from "../../services/resilience/network-state";
import { useI18n } from "@/composables/useI18n";
import { Bell, Trash2 } from "lucide-vue-next";

const authStore = useAuthStore();
const router = useRouter();
const { t, locale } = useI18n();

const actionableCount = ref(0);
const actionableBatches = ref<
  Array<{
    id: string;
    projectId: string;
    projectName: string;
    status: "DRAFT" | "PENDING_CONFIRMATION";
    createdAt: string;
    itemCount: number;
  }>
>([]);
const recentApprovedBatches = ref<
  Array<{
    id: string;
    projectId: string;
    projectName: string;
    createdAt: string;
    itemCount: number;
  }>
>([]);

const showBellPopover = ref(false);
const showUserPopover = ref(false);
const bellRef = ref<HTMLElement | null>(null);
const userRef = ref<HTMLElement | null>(null);
const isRefreshing = ref(false);

const getBatchStatusClass = (status: string): string => {
  switch (status) {
    case "DRAFT":
      return "bg-[#E5E7EB] text-[#1A1A1A]";
    case "PENDING_CONFIRMATION":
      return "bg-[#FDFFB6] text-[#1A1A1A]";
    case "APPROVED":
      return "bg-[#DCFCE7] text-[#166534]";
    default:
      return "bg-[#E5E7EB] text-[#1A1A1A]";
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale.value, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const batchStatusKey = (status: string): string => {
  switch (status) {
    case "DRAFT":
      return "batch.statusDraft";
    case "PENDING_CONFIRMATION":
      return "batch.statusPending";
    case "APPROVED":
      return "batch.statusApproved";
    default:
      return "batch.statusDraft";
  }
};

const getItemCountText = (count: number): string => {
  return count === 1
    ? t("shell.topbar.itemCount", { count })
    : t("shell.topbar.itemCountPlural", { count });
};

async function refreshOverview() {
  const accountId = authStore.account?.id;
  if (!accountId) return;

  isRefreshing.value = true;
  try {
    const overview = await swrService.fetchOverview(accountId);
    actionableCount.value = overview.actionableCount ?? 0;
    actionableBatches.value = overview.actionableBatches ?? [];
    recentApprovedBatches.value = overview.recentApprovedBatches ?? [];
  } catch {
    actionableCount.value = 0;
    actionableBatches.value = [];
    recentApprovedBatches.value = [];
  } finally {
    isRefreshing.value = false;
  }
}

onMounted(async () => {
  setupNetworkListeners();
  await refreshOverview();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node | null;
  if (!target) return;
  if (
    showBellPopover.value &&
    bellRef.value &&
    !bellRef.value.contains(target)
  ) {
    showBellPopover.value = false;
  }
  if (
    showUserPopover.value &&
    userRef.value &&
    !userRef.value.contains(target)
  ) {
    showUserPopover.value = false;
  }
}

function toggleBell(event: MouseEvent) {
  event.stopPropagation();
  showBellPopover.value = !showBellPopover.value;
  if (showBellPopover.value) {
    showUserPopover.value = false;
    refreshOverview();
  }
}

function toggleUser(event: MouseEvent) {
  event.stopPropagation();
  showUserPopover.value = !showUserPopover.value;
  if (showUserPopover.value) showBellPopover.value = false;
}

function handleLogout() {
  showUserPopover.value = false;
  authStore.logout();
  router.push({ name: "login" });
}

function viewActivityHistory() {
  router.push("/history");
  showBellPopover.value = false;
}

function dismissApprovedBatch(batchId: string) {
  recentApprovedBatches.value = recentApprovedBatches.value.filter(
    (batch) => batch.id !== batchId,
  );
}

const bellAriaLabel = computed(() => {
  return actionableCount.value > 0
    ? `${t("shell.topbar.notifications")}, ${actionableCount.value}`
    : t("shell.topbar.notifications");
});
</script>

<template>
  <header
    class="flex items-center justify-end gap-2 px-6 md:px-10 py-4 bg-[#FAFAF9] relative"
  >
    <div ref="bellRef" class="relative">
      <button
        :title="t('shell.topbar.notifications')"
        :aria-label="bellAriaLabel"
        @click="toggleBell"
        class="relative bg-[#FAFAF9] border-2 border-[#1A1A1A] p-2 rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
      >
        <Bell class="w-4 h-4 text-[#1A1A1A]" />
        <span
          v-if="actionableCount > 0"
          class="absolute -top-2 -right-2 bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-1 font-mono text-[10px] font-bold rounded-none"
        >
          {{ actionableCount }}
        </span>
      </button>
      <div
        v-if="showBellPopover"
        class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] p-3 z-50"
      >
        <!-- SECTION A: PERLU TINDAKAN -->
        <div
          v-if="actionableBatches.length > 0"
          class="border-b border-[#1A1A1A]/20 pb-2 mb-2"
        >
          <p
            class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70"
          >
            {{ t("shell.topbar.actionNeeded") }}
          </p>
          <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            <router-link
              v-for="batch in actionableBatches"
              :key="batch.id"
              :to="`/batches/${batch.id}`"
              @click="showBellPopover = false"
              class="flex items-start gap-3 p-2 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 transition-colors rounded-none focus:outline-none focus:ring-2 focus:ring-[#006D77]"
            >
              <div class="flex-1 min-w-0">
                <p
                  class="font-['Baskervville',serif] text-sm text-[#1A1A1A] truncate"
                >
                  {{ batch.projectName }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    :class="[
                      'font-[JetBrains_Mono,monospace] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-none',
                      getBatchStatusClass(batch.status),
                    ]"
                  >
                    {{ t(batchStatusKey(batch.status)) }}
                  </span>
                  <span
                    class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/70"
                  >
                    {{ getItemCountText(batch.itemCount) }} •
                    {{ formatDate(batch.createdAt) }}
                  </span>
                </div>
              </div>
            </router-link>
          </div>
          <div
            v-if="actionableCount > actionableBatches.length"
            class="border-t border-[#1A1A1A]/20 pt-2"
          >
            <router-link
              to="/history"
              class="w-full font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wider px-3 py-2 border-2 border-[#1A1A1A] bg-transparent text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF9] transition-colors rounded-none"
            >
              {{
                t("shell.topbar.more", {
                  count: actionableCount - actionableBatches.length,
                })
              }}
            </router-link>
          </div>
        </div>
        <div v-else class="border-b border-[#1A1A1A]/20 pb-2 mb-2">
          <p
            class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70"
          >
            {{ t("shell.topbar.noOpenWork") }}
          </p>
        </div>

        <!-- SECTION B: BARU DISETUJUI -->
        <div
          v-if="recentApprovedBatches.length > 0"
          class="border-b border-[#1A1A1A]/20 pb-2 mb-2"
        >
          <p
            class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70"
          >
            {{ t("shell.topbar.recentlyApproved") }}
          </p>

          <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            <div
              v-for="batch in recentApprovedBatches"
              :key="batch.id"
              class="flex items-start gap-2 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 transition-colors rounded-none"
            >
              <router-link
                :to="`/batches/${batch.id}`"
                @click="showBellPopover = false"
                class="flex-1 min-w-0 flex items-start gap-3 p-2 focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              >
                <div class="flex-1 min-w-0">
                  <p
                    class="font-['Baskervville',serif] text-sm text-[#1A1A1A] truncate"
                  >
                    {{ batch.projectName }}
                  </p>

                  <div class="flex items-center gap-2 mt-1">
                    <span
                      :class="[
                        'font-[JetBrains_Mono,monospace] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-none',
                        getBatchStatusClass('APPROVED'),
                      ]"
                    >
                      {{ t("batch.statusApproved") }}
                    </span>

                    <span
                      class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/70"
                    >
                      {{ getItemCountText(batch.itemCount) }} •
                      {{ formatDate(batch.createdAt) }}
                    </span>
                  </div>
                </div>
              </router-link>

              <button
                type="button"
                :title="t('shell.topbar.dismissNotification')"
                :aria-label="t('shell.topbar.dismissNotification')"
                @click.stop="dismissApprovedBatch(batch.id)"
                class="shrink-0 m-2 p-1.5 border-2 border-[#1A1A1A] bg-[#FAFAF9] text-[#1A1A1A] rounded-none hover:bg-[#E63946] hover:text-[#FAFAF9] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div v-else>
          <p
            class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70"
          >
            {{ t("shell.topbar.noRecentApprovals") }}
          </p>
        </div>

        <div class="border-t border-[#1A1A1A]/20 pt-2 mt-2">
          <button
            @click="viewActivityHistory"
            class="w-full font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wider px-3 py-2 border-2 border-[#1A1A1A] bg-transparent text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF9] transition-colors rounded-none"
          >
            {{ t("shell.topbar.viewActivityHistory") }}
          </button>
        </div>
      </div>
    </div>

    <div ref="userRef" class="relative">
      <button
        :title="t('shell.topbar.userProfile')"
        @click="toggleUser"
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-2 rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider"
      >
        {{ authStore.account?.name || t("shell.topbar.user") }}
      </button>
      <div
        v-if="showUserPopover"
        class="absolute right-0 mt-2 w-64 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] p-3 z-50"
      >
        <p
          class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 mb-2 border-b border-[#1A1A1A]/20 pb-1"
        >
          {{ t("shell.topbar.account") }}
        </p>
        <p
          class="font-['Baskervville',serif] text-base text-[#1A1A1A] leading-tight"
        >
          {{ authStore.account?.name || t("shell.topbar.user") }}
        </p>
        <p
          v-if="authStore.account?.email"
          class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/60 leading-tight mt-1"
        >
          {{ authStore.account.email }}
        </p>
        <button
          @click="handleLogout"
          class="mt-3 w-full bg-[#E63946] text-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#991B1B] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          {{ t("shell.topbar.logout") }}
        </button>
      </div>
    </div>
  </header>
</template>
