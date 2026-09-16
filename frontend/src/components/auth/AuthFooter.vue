<template>
  <footer class="bg-canvasBg border-t-2 border-[#1A1A1A] py-3 px-4 md:px-8 shrink-0">
    <div class="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#1A1A1A] font-bold">
      
      <p>© {{ currentYear }} SCOPREVO — All rights reserved.</p>
      
      <div class="flex items-center gap-4">
        <!-- Hover efek menggunakan lavender discipline -->
        <router-link 
          to="/" 
          class="hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 hover:underline-offset-4 transition-all"
        >
          Home
        </router-link>
        
        <span class="text-[#1A1A1A]/30 font-normal">•</span>
        
        <!-- Badge text untuk build info -->
        <span class="bg-[#1A1A1A] text-[#FAFAF9] px-2 py-0.5">
          Built on Tencent EdgeOne
        </span>
      </div>

    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>