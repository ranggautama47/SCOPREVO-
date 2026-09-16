<template>
  <!-- Step 04: Client Confirmation with two panels -->
  <div
    class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] overflow-hidden"
  >
    <div class="grid grid-cols-2">
      <!-- Left: Freelancer Panel -->
      <div class="p-4 border-r-2 border-[#1A1A1A]">
        <p
          class="font-['Inter',sans-serif] text-[9px] uppercase tracking-wider text-[#1A1A1A]/50 mb-2"
        >
          Freelancer
        </p>
        <h4 class="font-['Baskervville',serif] text-sm text-[#1A1A1A] mb-3">
          REVISION QUOTA
        </h4>

        <!-- Progress bar -->
        <div class="mb-1">
          <div
            class="w-full h-4 bg-[#E5E7EB] border-2 border-[#1A1A1A] rounded-none overflow-hidden"
          >
            <div class="h-full bg-[#006D77]" style="width: 66%"></div>
          </div>
        </div>
        <p
          class="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#1A1A1A] mb-3"
        >
          2 / 3 USED
        </p>

        <!-- Batch Status Row with Highlight Yellow Badge -->
        <div class="flex items-center gap-1.5 mb-4">
          <span class="font-['Inter',sans-serif] text-[10px] text-[#1A1A1A]/70"
            >Batch Status:</span
          >

          <!-- Highlighting khusus PENDING_CONFIRMATION (Kuning Pill Neo-Brutalist) -->
          <span
            style="border-radius: 9999px !important"
            class="inline-flex items-center bg-[#FDFFB6] border border-[#1A1A1A] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-bold text-[#1A1A1A] leading-none shrink-0"
          >
            PENDING_CONFIRMATION
          </span>
        </div>

        <button
          class="w-full font-['Inter',sans-serif] text-[9px] font-medium uppercase tracking-wider px-2 py-2 border-2 border-[#1A1A1A] bg-[#006D77] text-[#FAFAF9] shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all focus:ring-2 focus:ring-[#006D77] focus:outline-none"
          aria-label="Share magic link with client"
        >
          SHARE MAGIC LINK
        </button>
      </div>

      <!-- Right: Client Panel -->
      <div class="p-4 bg-[#FAFAF9]">
        <p
          class="font-['Inter',sans-serif] text-[9px] uppercase tracking-wider text-[#1A1A1A]/50 mb-2"
        >
          Client Portal (Public View)
        </p>
        <h4 class="font-['Baskervville',serif] text-sm text-[#1A1A1A] mb-3">
          REVISION SCOPE
        </h4>

        <!-- Mini checklist -->
        <div class="space-y-1 mb-3">
          <div class="flex items-center gap-1.5">
            <span
              class="bg-[#DCFCE7] text-[#166534] rounded-full px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[8px]"
              >IN_SCOPE</span
            >
            <span class="font-['Inter',sans-serif] text-[9px] text-[#1A1A1A]"
              >(3)</span
            >
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="bg-[#FDFFB6] text-[#1A1A1A] rounded-full px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[8px]"
              >NEEDS_REVIEW</span
            >
            <span class="font-['Inter',sans-serif] text-[9px] text-[#1A1A1A]"
              >(2)</span
            >
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="bg-[#FEE2E2] text-[#991B1B] rounded-full px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[8px]"
              >OUT_OF_SCOPE</span
            >
            <span class="font-['Inter',sans-serif] text-[9px] text-[#1A1A1A]"
              >(1)</span
            >
          </div>
        </div>

        <button
          class="w-full font-['Inter',sans-serif] text-[9px] font-medium uppercase tracking-wider px-2 py-2 border-2 border-[#1A1A1A] bg-[#FAFAF9] text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF9] transition-colors focus:ring-2 focus:ring-[#006D77] focus:outline-none"
          aria-label="Confirm revision scope"
        >
          CONFIRM REVISION SCOPE
        </button>
        <p
          class="font-['Inter',sans-serif] text-[8px] text-[#1A1A1A]/40 mt-2 text-center"
        >
          No login required
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
