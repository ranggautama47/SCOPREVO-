<template>
  <!-- Step 01: Paste Feedback Input -->
  <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none p-4 shadow-[4px_4px_0px_0px_#1A1A1A]">
    <p class="font-['Inter',sans-serif] text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 mb-2">Feedback Input</p>
    <textarea
      class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none p-3 min-h-[140px] font-['Noto_Serif',serif] text-sm text-[#1A1A1A] resize-none focus:outline-none focus:ring-2 focus:ring-[#006D77]"
      placeholder="Can we make the CTA button bigger? Also, can you add an analytics dashboard for the admin? Hi team, just a few updates: — update the hero section copy — add analytics dashboard for admin — can we also integrate payment gateway? Thanks!"
      aria-label="Client feedback input"
    ></textarea>
    <button
      class="mt-3 w-full font-['Inter',sans-serif] text-xs font-medium uppercase tracking-wider px-4 py-2.5 border-2 border-[#1A1A1A] bg-[#006D77] text-[#FAFAF9] shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#1A1A1A] transition-all focus:ring-2 focus:ring-[#006D77] focus:outline-none"
      aria-label="Process feedback with AI"
    >
      PROCESS WITH AI
    </button>
  </div>
</template>

<script setup lang="ts">
</script>
