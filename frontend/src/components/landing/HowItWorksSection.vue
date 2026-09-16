<template>
  <section id="how-it-works" class="py-16 md:py-24 px-4 md:px-8">
    <div class="max-w-[1200px] mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 mb-14">
        <!-- Eyebrow Pill (Fixed Rounded Capsule) -->
        <span 
          style="border-radius: 9999px !important;"
          class="w-fit inline-flex items-center justify-center bg-[#FDFFB6] border-2 border-[#1A1A1A] px-3 py-3 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#1A1A1A] leading-none shrink-0"
        >
          HOW IT WORKS
        </span>
        <h2 class="font-['Baskervville',serif] text-3xl md:text-4xl lg:text-5xl leading-[1.15] text-[#1A1A1A] max-w-2xl">
          From scattered feedback to a clear scope decision in four steps.
        </h2>
      </div>

      <!-- Steps Grid: 2x2 on desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">

        <!-- Step 01 -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 mb-1">
            <!-- Fixed Circle Badge -->
            <span 
              style="border-radius: 9999px !important;"
              class="w-8 h-8 aspect-square shrink-0 bg-[#1A1A1A] text-[#FAFAF9] flex items-center justify-center font-['JetBrains_Mono',monospace] text-xs font-bold leading-none"
            >
              01
            </span>
            <h3 class="font-['Baskervville',serif] text-xl font-bold text-[#1A1A1A]">Paste the feedback you received</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">
            Copy feedback from WhatsApp, email, or chat and paste it into SCOPREVO.
          </p>
          <FeedbackInputMockup />
        </div>

        <!-- Step 02 -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 mb-1">
            <!-- Fixed Circle Badge -->
            <span 
              style="border-radius: 9999px !important;"
              class="w-8 h-8 aspect-square shrink-0 bg-[#1A1A1A] text-[#FAFAF9] flex items-center justify-center font-['JetBrains_Mono',monospace] text-xs font-bold leading-none"
            >
              02
            </span>
            <h3 class="font-['Baskervville',serif] text-xl font-bold text-[#1A1A1A]">AI classifies each request</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">
            SCOPREVO extracts individual items and flags ambiguity with NEEDS_REVIEW instead of forcing false confidence.
          </p>
          <AiAnalysisMockup />
        </div>

        <!-- Step 03 -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 mb-1">
            <!-- Fixed Circle Badge -->
            <span 
              style="border-radius: 9999px !important;"
              class="w-8 h-8 aspect-square shrink-0 bg-[#1A1A1A] text-[#FAFAF9] flex items-center justify-center font-['JetBrains_Mono',monospace] text-xs font-bold leading-none"
            >
              03
            </span>
            <h3 class="font-['Baskervville',serif] text-xl font-bold text-[#1A1A1A]">Get a structured revision checklist</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">
            Every request becomes an actionable checklist item complete with scope status and reasoning.
          </p>
          <RevisionChecklistMockup />
        </div>

        <!-- Step 04 -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 mb-1">
            <!-- Fixed Circle Badge -->
            <span 
              style="border-radius: 9999px !important;"
              class="w-8 h-8 aspect-square shrink-0 bg-[#1A1A1A] text-[#FAFAF9] flex items-center justify-center font-['JetBrains_Mono',monospace] text-xs font-bold leading-none"
            >
              04
            </span>
            <h3 class="font-['Baskervville',serif] text-xl font-bold text-[#1A1A1A]">Track quota &amp; let client confirm</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">
            Revision usage only updates when the batch is approved. Share a magic link for zero-login client confirmation.
          </p>
          <ClientConfirmationMockup />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import FeedbackInputMockup from '@/components/landing/mockups/FeedbackInputMockup.vue'
import AiAnalysisMockup from '@/components/landing/mockups/AiAnalysisMockup.vue'
import RevisionChecklistMockup from '@/components/landing/mockups/RevisionChecklistMockup.vue'
import ClientConfirmationMockup from '@/components/landing/mockups/ClientConfirmationMockup.vue'
</script>