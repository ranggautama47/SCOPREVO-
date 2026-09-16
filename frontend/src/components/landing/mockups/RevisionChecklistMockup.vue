<template>
  <!-- Step 03: Revision Checklist -->
  <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none p-4 shadow-[4px_4px_0px_0px_#1A1A1A]">
    <p class="font-['Inter',sans-serif] text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 mb-3">Revision Checklist</p>
    <div class="space-y-2">
      <!-- IN_SCOPE item -->
      <div class="flex items-start gap-3 p-2.5 border border-[#1A1A1A]/15 bg-[#FAFAF9]">
        <CheckCircle :size="16" :stroke-width="2" class="text-[#166534] mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] flex-1">Update hero section copy</span>
        <span class="bg-[#DCFCE7] text-[#166534] rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] uppercase font-bold">IN_SCOPE</span>
      </div>

      <!-- NEEDS_REVIEW item -->
      <div class="border border-[#1A1A1A]/15 bg-[#FDFFB6]/30 p-2.5">
        <div class="flex items-start gap-3">
          <HelpCircle :size="16" :stroke-width="2" class="text-[#1A1A1A] mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] flex-1">Add analytics dashboard</span>
          <span class="bg-[#FDFFB6] text-[#1A1A1A] rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] uppercase font-bold">NEEDS_REVIEW</span>
        </div>
        <p class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/60 mt-1 ml-7">Requires human verification — new admin feature</p>
      </div>

      <!-- OUT_OF_SCOPE item -->
      <div class="border border-[#1A1A1A]/15 bg-[#FEE2E2]/20 p-2.5">
        <div class="flex items-start gap-3">
          <XCircle :size="16" :stroke-width="2" class="text-[#991B1B] mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] flex-1">Add payment gateway integration</span>
          <span class="bg-[#FEE2E2] text-[#991B1B] rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] uppercase font-bold">OUT_OF_SCOPE</span>
        </div>
        <p class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/60 mt-1 ml-7">Reason: Out of scope — requires separate contract</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, HelpCircle, XCircle } from 'lucide-vue-next'
</script>
