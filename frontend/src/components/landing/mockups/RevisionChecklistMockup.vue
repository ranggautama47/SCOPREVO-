<template>
  <!-- Step 03: Revision Checklist -->
  <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none p-4 shadow-[4px_4px_0px_0px_#1A1A1A]">
    <p class="font-['Inter',sans-serif] text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 mb-3">{{ t('landing.mockup.revisionChecklist') }}</p>
    <div class="space-y-1.5 md:space-y-2">
      <!-- IN_SCOPE item -->
      <div class="flex items-start gap-3 p-2.5 border border-[#1A1A1A]/15 bg-[#FAFAF9]">
        <CheckCircle :size="16" :stroke-width="2" class="text-[#166534] mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] flex-1">{{ t('landing.mockup.checklistItem1') }}</span>
        <span class="bg-[#DCFCE7] text-[#166534] rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] uppercase font-bold">{{ t('landing.mockup.inScope') }}</span>
      </div>

      <!-- NEEDS_REVIEW item -->
      <div class="border border-[#1A1A1A]/15 bg-[#FDFFB6]/30 p-2.5">
        <div class="flex items-start gap-3">
          <HelpCircle :size="16" :stroke-width="2" class="text-[#1A1A1A] mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] flex-1">{{ t('landing.mockup.checklistItem2') }}</span>
          <span class="bg-[#FDFFB6] text-[#1A1A1A] rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] uppercase font-bold">{{ t('landing.mockup.needsReview') }}</span>
        </div>
        <p class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/60 mt-1 ml-7">{{ t('landing.mockup.checklistItem2Reason') }}</p>
      </div>

      <!-- OUT_OF_SCOPE item -->
      <div class="border border-[#1A1A1A]/15 bg-[#FEE2E2]/20 p-2.5">
        <div class="flex items-start gap-3">
          <XCircle :size="16" :stroke-width="2" class="text-[#991B1B] mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] flex-1">{{ t('landing.mockup.checklistItem3') }}</span>
          <span class="bg-[#FEE2E2] text-[#991B1B] rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] uppercase font-bold">{{ t('landing.mockup.outOfScope') }}</span>
        </div>
        <p class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/60 mt-1 ml-7">{{ t('landing.mockup.checklistItem3Reason') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, HelpCircle, XCircle } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>
