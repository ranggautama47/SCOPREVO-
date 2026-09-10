<script setup lang="ts">
import { computed } from 'vue';
import { networkState } from "@/services/resilience/network-state";

const stateClasses = computed(() => {
  if (networkState.value.showRecoveredToast) {
    return 'bg-[#2A9D8F] text-[#FAFAF9]';
  }
  switch (networkState.value.status) {
    case 'OFFLINE':
      return 'bg-[#E63946] text-[#FAFAF9]';
    case 'SERVER_ERROR':
      return 'bg-[#F4A261] text-[#1A1A1A]';
    case 'SLOW_NETWORK':
      return 'bg-[#FDFFB6] text-[#1A1A1A]';
    default:
      return 'bg-[#FDFFB6] text-[#1A1A1A]';
  }
});

const stateTitle = computed(() => {
  if (networkState.value.showRecoveredToast) {
    return 'KONEKSI KEMBALI NORMAL';
  }
  switch (networkState.value.status) {
    case 'OFFLINE':
      return 'INTERNET TERPUTUS';
    case 'SERVER_ERROR':
      return 'GANGGUAN SERVER';
    case 'SLOW_NETWORK':
      return 'KONEKSI LAMBAT / TIDAK STABIL';
    default:
      return 'KONEKSI LAMBAT / TIDAK STABIL';
  }
});

const stateMessage = computed(() => {
  if (networkState.value.showRecoveredToast) {
    return 'Data berhasil disinkronkan kembali dengan server SCOPREVO.';
  }
  switch (networkState.value.status) {
    case 'OFFLINE':
      return 'Koneksi internet Anda terputus total. SCOPREVO menampilkan data lokal terakhir yang tersedia.';
    case 'SERVER_ERROR':
      return 'Koneksi ke server SCOPREVO sedang mengalami gangguan. Data lokal terakhir tetap ditampilkan. Silakan coba lagi beberapa saat.';
    case 'SLOW_NETWORK':
      return 'Sinyal internet Anda lemah atau tidak stabil. SCOPREVO beralih menggunakan data lokal.';
    default:
      return 'Sinyal internet Anda lemah atau tidak stabil. SCOPREVO beralih menggunakan data lokal.';
  }
});
</script>

<template>
  <div
    v-if="networkState.status !== 'ONLINE' || networkState.showRecoveredToast"
    role="alert"
    class="w-full border-2 border-[#1A1A1A] rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] p-4 md:px-6 md:py-5 transition-opacity duration-200"
    :class="stateClasses"
  >
    <div class="flex items-start gap-3 md:items-center md:gap-4">
      <svg
        v-if="networkState.status === 'OFFLINE'"
        class="mt-0.5 h-7 w-7 shrink-0 md:h-8 md:w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="square"
        stroke-linejoin="miter"
        aria-hidden="true"
      >
        <path d="M1 9.5a16 16 0 0 1 22 0" />
        <path d="M5 13.5a10.5 10.5 0 0 1 14 0" />
        <path d="M9 17.5a5 5 0 0 1 6 0" />
        <path d="m3 3 18 18" />
        <path d="M12 21h.01" />
      </svg>

      <svg
        v-else-if="networkState.status === 'SERVER_ERROR'"
        class="mt-0.5 h-7 w-7 shrink-0 md:h-8 md:w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="square"
        stroke-linejoin="miter"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>

      <svg
        v-else-if="networkState.status === 'SLOW_NETWORK'"
        class="mt-0.5 h-7 w-7 shrink-0 md:h-8 md:w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="square"
        stroke-linejoin="miter"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="13" />
        <path d="M8 21h8M12 17v4M7 8h10M7 12h5" />
        <path d="M18 12h.01" />
      </svg>

      <svg
        v-else-if="networkState.showRecoveredToast"
        class="mt-0.5 h-7 w-7 shrink-0 md:h-8 md:w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="square"
        stroke-linejoin="miter"
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01l-3-3" />
      </svg>

      <div class="min-w-0">
        <p class="font-['JetBrains_Mono',monospace] text-sm font-bold uppercase tracking-wider">
          {{ stateTitle }}
        </p>
        <p class="mt-1 font-['Noto_Serif',serif] text-sm leading-relaxed">
          {{ stateMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
