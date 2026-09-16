<template>
  <footer class="bg-[#FAFAF9] border-t-2 border-[#1A1A1A] py-8 px-4 md:px-8">
    <div class="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

      <!-- Left: Logo + Tagline -->
      <div class="flex flex-col items-center md:items-start gap-1">
        <div class="flex items-center gap-2">
          <img src="/asset/logo.png" alt="SCOPREVO icon" width="24" height="24" class="border border-[#1A1A1A]" />
          <span class="font-['Baskervville',serif] text-xl text-[#1A1A1A]">SCOPREVO</span>
        </div>
        <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/60">AI-powered Scope &amp; Revision Intelligence.</p>
      </div>

      <!-- Center: Nav links (desktop) -->
      <nav class="hidden md:flex items-center gap-6" aria-label="Footer navigation">
        <a href="#how-it-works" class="font-['Inter',sans-serif] text-sm text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] underline-offset-4 transition-all">How It Works</a>
        <a href="#why-scoprevo" class="font-['Inter',sans-serif] text-sm text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] underline-offset-4 transition-all">Why SCOPREVO</a>
        <a href="#tech-stack" class="font-['Inter',sans-serif] text-sm text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] underline-offset-4 transition-all">Tech Stack</a>
      </nav>

      <!-- Right: Copyright -->
      <p class="font-['Inter',sans-serif] text-xs text-[#1A1A1A]/40 text-center md:text-right">
        © {{ currentYear }} SCOPREVO — Built on Tencent EdgeOne Makers
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Tahun otomatis ter-update sesuai tahun berjalan di sistem pengguna
const currentYear = computed(() => new Date().getFullYear())
</script>
