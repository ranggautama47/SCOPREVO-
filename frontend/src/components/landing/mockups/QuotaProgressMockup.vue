<template>
  <!-- Quota Progress Mockup -->
  <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
    <p class="font-['Inter',sans-serif] text-xs uppercase tracking-wider text-[#1A1A1A]/50 mb-1">{{ t('landing.mockup.projectLabel') }}</p>
    <h4 class="font-['Baskervville',serif] text-xl text-[#1A1A1A] mb-5">{{ t('landing.mockup.revisionQuotaTitle') }}</h4>

    <!-- Big counter -->
    <div class="flex items-end gap-2 mb-3">
      <span class="font-['JetBrains_Mono',monospace] text-4xl font-bold text-[#1A1A1A]">2</span>
      <span class="font-['JetBrains_Mono',monospace] text-2xl text-[#1A1A1A]/40 mb-1">/</span>
      <span class="font-['JetBrains_Mono',monospace] text-2xl text-[#1A1A1A]/40 mb-1">3 {{ t('landing.mockup.quotaCounterUsed') }}</span>
    </div>

    <!-- Progress bar -->
    <div class="w-full h-8 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden mb-3">
      <div class="h-full bg-[#006D77] transition-all flex items-center justify-end pr-2" style="width: 66%">
        <span class="font-['JetBrains_Mono',monospace] text-[9px] text-[#FAFAF9] font-bold">66%</span>
      </div>
    </div>

    <!-- Remaining text -->
    <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/60 mb-1">{{ t('landing.mockup.revisionRemaining') }}</p>

    <!-- Progress markers -->
    <div class="flex justify-between mt-1">
      <span class="font-['JetBrains_Mono',monospace] text-[10px] text-[#166534]">{{ t('landing.mockup.revision1') }}</span>
      <span class="font-['JetBrains_Mono',monospace] text-[10px] text-[#166534]">{{ t('landing.mockup.revision2') }}</span>
      <span class="font-['JetBrains_Mono',monospace] text-[10px] text-[#1A1A1A]/40">{{ t('landing.mockup.revision3') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>
