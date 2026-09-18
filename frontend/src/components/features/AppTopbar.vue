<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { Bell } from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth";
import { swrService } from "../../services/resilience/swr.service";
import { setupNetworkListeners } from "../../services/resilience/network-state";
import { useI18n } from "@/composables/useI18n";

const authStore = useAuthStore();
const router = useRouter();
const pendingCount = ref(0);
const recentBatches = ref<Array<{
  id: string;
  projectId: string;
  projectName: string;
  status: "DRAFT" | "PENDING_CONFIRMATION" | "APPROVED";
  createdAt: string;
  itemCount: number;
}>>([]);

const showBellPopover = ref(false);
const showUserPopover = ref(false);
const bellRef = ref<HTMLElement | null>(null);
const userRef = ref<HTMLElement | null>(null);
const isRefreshing = ref(false);

const { t, locale } = useI18n();

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
    pendingCount.value = overview.pendingConfirmations ?? 0;
    recentBatches.value = overview.recentBatches ?? [];
  } catch {
    pendingCount.value = 0;
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

const bellAriaLabel = computed(() => {
  return pendingCount.value > 0
    ? `${t("shell.topbar.notifications")}, ${pendingCount.value}`
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
          v-if="pendingCount > 0"
          class="absolute -top-2 -right-2 bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-1 font-mono text-[10px] font-bold rounded-none"
        >
          {{ pendingCount }}
        </span>
      </button>
      <div
        v-if="showBellPopover"
        class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] p-3 z-50"
      >
        <div class="flex items-center justify-between mb-2">
          <p class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">
            {{ t('shell.topbar.notifications') }}
          </p>
          <p class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">
            {{ t('shell.topbar.totalBatches', { count: recentBatches.length }) }}
          </p>
        </div>
        <div class="border-t border-[#1A1A1A]/20 pt-2">
          <div
            v-if="recentBatches.length === 0"
            class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] py-4 text-center"
          >
            {{ t('shell.topbar.noActivity') }}
          </div>
          <div
            v-else
            class="space-y-2 max-h-[300px] overflow-y-auto pr-1"
          >
            <router-link
              v-for="batch in recentBatches"
              :key="batch.id"
              :to="`/batches/${batch.id}`"
              @click="showBellPopover = false"
              class="flex items-start gap-3 p-2 border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 transition-colors rounded-none focus:outline-none focus:ring-2 focus:ring-[#006D77]"
            >
              <div class="flex-1 min-w-0">
                <p class="font-['Baskervville',serif] text-sm text-[#1A1A1A] truncate">
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
                  <span class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/70">
                    {{ getItemCountText(batch.itemCount) }} • {{ formatDate(batch.createdAt) }}
                  </span>
                </div>
              </div>
            </router-link>
          </div>
        </div>
        <div class="border-t border-[#1A1A1A]/20 pt-2 mt-2">
          <button
            @click="viewActivityHistory"
            class="w-full font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wider px-3 py-2 border-2 border-[#1A1A1A] bg-transparent text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF9] transition-colors rounded-none"
          >
            {{ t('shell.topbar.viewActivityHistory') }}
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
        {{ authStore.account?.name || t('shell.topbar.user') }}
      </button>
      <div
        v-if="showUserPopover"
        class="absolute right-0 mt-2 w-64 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] p-3 z-50"
      >
        <p
          class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 mb-2 border-b border-[#1A1A1A]/20 pb-1"
        >
          {{ t('shell.topbar.account') }}
        </p>
        <p
          class="font-['Baskervville',serif] text-base text-[#1A1A1A] leading-tight"
        >
          {{ authStore.account?.name || t('shell.topbar.user') }}
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
          {{ t('shell.topbar.logout') }}
        </button>
      </div>
    </div>
  </header>
</template>
