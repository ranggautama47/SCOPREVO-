<template>
  <nav class="h-14 bg-canvasBg border-b-2 border-[#1A1A1A] flex items-center px-4 md:px-8 shrink-0">
    <div class="flex items-center justify-between w-full max-w-[1200px] mx-auto">

      <!-- Logo Tunggal Mengarah ke Home -->
      <router-link to="/" class="flex items-center gap-2.5 no-underline group" :aria-label="t('auth.nav.ariaHome')">
        <!-- Logo dengan border tegas dan background aksen sage -->
        <img
          src="/asset/logo.png"
          :alt="t('common.appName')"
          width="28"
          height="28"
          class="border-2 border-[#1A1A1A] bg-[#C9CBA3] p-0.5 rounded-none transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
          draggable="false"
        />
        <!-- Baskervville DILARANG font-bold sesuai aturan brutalist -->
        <span class="font-editorial text-2xl tracking-tight text-[#1A1A1A]">
          {{ t('common.appName') }}
        </span>
      </router-link>

      <!-- Navigasi Kembali ke Landing Page (Lavender Discipline) -->
      <router-link
        to="/"
        class="font-ui text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 hover:underline-offset-4 transition-all hover:scale-105 origin-right inline-block"
      >
        {{ t('auth.nav.backToHome') }}
      </router-link>

    </div>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
const { t } = useI18n()
</script>