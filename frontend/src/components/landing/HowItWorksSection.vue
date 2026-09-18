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
          {{ t('landing.how.eyebrow') }}
        </span>
        <h2 class="font-['Baskervville',serif] text-2xl md:text-3xl lg:text-4xl leading-[1.15] text-[#1A1A1A] max-w-2xl">
          {{ t('landing.how.headline') }}
        </h2>
      </div>

      <!-- Steps Grid: 2x2 on desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-10">

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
            <h3 class="font-['Baskervville',serif] text-base md:text-xl lg:text-xl font-bold text-[#1A1A1A]">{{ t('landing.how.step1.title') }}</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">{{ t('landing.how.step1.description') }}</p>
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
            <h3 class="font-['Baskervville',serif] text-base md:text-xl lg:text-xl font-bold text-[#1A1A1A]">{{ t('landing.how.step2.title') }}</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">{{ t('landing.how.step2.description') }}</p>
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
            <h3 class="font-['Baskervville',serif] text-base md:text-xl lg:text-xl font-bold text-[#1A1A1A]">{{ t('landing.how.step3.title') }}</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">{{ t('landing.how.step3.description') }}</p>
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
            <h3 class="font-['Baskervville',serif] text-base md:text-xl lg:text-xl font-bold text-[#1A1A1A]">{{ t('landing.how.step4.title') }}</h3>
          </div>
          <p class="font-['Noto_Serif',serif] text-sm leading-[1.7] text-[#1A1A1A]/70">{{ t('landing.how.step4.description') }}</p>
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
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>