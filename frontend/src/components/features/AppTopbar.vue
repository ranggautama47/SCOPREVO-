<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Bell } from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth";
import { apiClient } from "../../api/client";

const authStore = useAuthStore();
const router = useRouter();
const pendingCount = ref(0);

const showBellPopover = ref(false);
const showUserPopover = ref(false);
const bellRef = ref<HTMLElement | null>(null);
const userRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  try {
    const overview = await apiClient.overview.get();
    pendingCount.value = overview.pendingConfirmations ?? 0;
  } catch {
    pendingCount.value = 0; // shell tidak boleh pernah merobohkan halaman
  }
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
  if (showBellPopover.value) showUserPopover.value = false;
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
</script>

<template>
  <header
    class="flex items-center justify-end gap-2 px-6 md:px-10 py-4 bg-[#FAFAF9] relative"
  >
    <div ref="bellRef" class="relative">
      <button
        title="Notifications"
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
        class="absolute right-0 mt-2 w-64 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] p-3 z-50"
      >
        <p
          class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 mb-2 border-b border-[#1A1A1A]/20 pb-1"
        >
          NOTIFICATIONS
        </p>
        <p
          v-if="pendingCount === 0"
          class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]"
        >
          No pending confirmations
        </p>
        <p v-else class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]">
          {{ pendingCount }} pending confirmation{{
            pendingCount === 1 ? "" : "s"
          }}
        </p>
      </div>
    </div>

    <div ref="userRef" class="relative">
      <button
        title="User Profile"
        @click="toggleUser"
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-2 rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider"
      >
        {{ authStore.account?.name || "User" }}
      </button>
      <div
        v-if="showUserPopover"
        class="absolute right-0 mt-2 w-64 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] p-3 z-50"
      >
        <p
          class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 mb-2 border-b border-[#1A1A1A]/20 pb-1"
        >
          ACCOUNT
        </p>
        <p
          class="font-['Baskervville',serif] text-base text-[#1A1A1A] leading-tight"
        >
          {{ authStore.account?.name || "User" }}
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
          LOGOUT
        </button>
      </div>
    </div>
  </header>
</template>
