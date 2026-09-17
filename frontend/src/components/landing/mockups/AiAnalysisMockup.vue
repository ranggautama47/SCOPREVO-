<template>
  <!-- Step 02: AI Analysis Result -->
  <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none p-4 shadow-[4px_4px_0px_0px_#1A1A1A]">
    <p class="font-['Inter',sans-serif] text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 mb-3">{{ t('landing.mockup.scopeAnalysis') }}</p>

    <!-- Stats row -->
    <div class="flex gap-2 mb-4">
      <div class="flex-1 bg-[#DCFCE7] border-2 border-[#1A1A1A] rounded-none p-2.5 text-center">
        <span class="font-['JetBrains_Mono',monospace] text-xl font-bold text-[#166534]">5</span>
        <p class="font-['Inter',sans-serif] text-[9px] uppercase text-[#166534] mt-0.5">{{ t('landing.mockup.inScope') }}</p>
      </div>
      <div class="flex-1 bg-[#FDFFB6] border-2 border-[#1A1A1A] rounded-none p-2.5 text-center">
        <span class="font-['JetBrains_Mono',monospace] text-xl font-bold text-[#1A1A1A]">2</span>
        <p class="font-['Inter',sans-serif] text-[9px] uppercase text-[#1A1A1A] mt-0.5">{{ t('landing.mockup.needsReview') }}</p>
      </div>
      <div class="flex-1 bg-[#FEE2E2] border-2 border-[#1A1A1A] rounded-none p-2.5 text-center">
        <span class="font-['JetBrains_Mono',monospace] text-xl font-bold text-[#991B1B]">1</span>
        <p class="font-['Inter',sans-serif] text-[9px] uppercase text-[#991B1B] mt-0.5">{{ t('landing.mockup.outOfScope') }}</p>
      </div>
    </div>

    <!-- Highlighted NEEDS_REVIEW item -->
    <div class="border-2 border-[#1A1A1A] bg-[#FDFFB6] rounded-none p-3">
      <p class="font-['Inter',sans-serif] text-[9px] uppercase tracking-wider text-[#1A1A1A]/60 mb-1">{{ t('landing.mockup.highlightedItem') }}</p>
      <div class="flex items-start justify-between gap-2">
        <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] flex-1">{{ t('landing.mockup.aiItem2') }}</span>
        <span class="bg-[#FDFFB6] border border-[#1A1A1A] rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] uppercase font-bold whitespace-nowrap">{{ t('landing.mockup.needsReview') }}</span>
      </div>
      <p class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/70 mt-1.5 leading-tight">{{ t('landing.mockup.aiItem2Reason') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>
