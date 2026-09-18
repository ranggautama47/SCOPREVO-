<template>
  <!-- Background Light Sage Muted -->
  <section class="bg-[#E6E7D5] border-y-2 border-[#1A1A1A] py-20 px-4 md:px-8">
    <div class="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

      <!-- KOLOM KIRI: Eyebrow Pill & Headline -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        <!-- Eyebrow Pill Bulat Sempurna via Inline Style Force -->
        <span
          style="border-radius: 9999px !important;"
          class="w-fit inline-flex items-center justify-center bg-[#FDFFB6] border-2 border-[#1A1A1A] px-4 py-3 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#1A1A1A] leading-none shrink-0"
        >
          {{ t('landing.problem.eyebrow') }}
        </span>

        <h2 class="font-['Baskervville',serif] text-2xl md:text-3xl lg:text-4xl leading-[1.15] text-[#1A1A1A]">
          {{ t('landing.problem.headline') }}
        </h2>
      </div>

      <!-- KOLOM KANAN: Subheadline & Cards Row -->
      <div class="lg:col-span-7 flex flex-col gap-6 lg:mt-2">
        <p class="font-['Noto_Serif',serif] text-sm md:text-base text-[#1A1A1A] font-medium">
          {{ t('landing.problem.subheadline') }}
        </p>

        <!-- Cards Grid (3 Kolom Sejajar) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <!-- Card 01: Messy Feedback (Lavender Header) -->
          <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none flex flex-col shadow-[4px_4px_0px_0px_#1A1A1A]">
            <div class="bg-[#DCCCFF] border-b-2 border-[#1A1A1A] p-4 flex items-center gap-3">
              <!-- Lingkaran Angka Bulat Sempurna via Inline Style Force -->
              <span
                style="border-radius: 9999px !important;"
                class="w-7 h-7 aspect-square shrink-0 bg-[#1A1A1A] text-[#FAFAF9] flex items-center justify-center font-['JetBrains_Mono',monospace] text-xs font-bold leading-none"
              >
                01
              </span>
              <h3 class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-tight text-[#1A1A1A]">
                {{ t('landing.problem.card1.title') }}
              </h3>
            </div>
            <div class="p-4 flex-grow">
              <p class="font-['Noto_Serif',serif] text-sm md:text-base leading-[1.6] text-[#1A1A1A]/80">
                {{ t('landing.problem.card1.description') }}
              </p>
            </div>
          </div>

          <!-- Card 02: Unclear Boundaries (Yellow Header) -->
          <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none flex flex-col shadow-[4px_4px_0px_0px_#1A1A1A]">
            <div class="bg-[#FDFFB6] border-b-2 border-[#1A1A1A] p-4 flex items-center gap-3">
              <!-- Lingkaran Angka Bulat Sempurna via Inline Style Force -->
              <span
                style="border-radius: 9999px !important;"
                class="w-7 h-7 aspect-square shrink-0 bg-[#1A1A1A] text-[#FAFAF9] flex items-center justify-center font-['JetBrains_Mono',monospace] text-xs font-bold leading-none"
              >
                02
              </span>
              <h3 class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-tight text-[#1A1A1A]">
                {{ t('landing.problem.card2.title') }}
              </h3>
            </div>
            <div class="p-4 flex-grow">
              <p class="font-['Noto_Serif',serif] text-sm md:text-base leading-[1.6] text-[#1A1A1A]/80">
                {{ t('landing.problem.card2.description') }}
              </p>
            </div>
          </div>

          <!-- Card 03: PM Tools Are Too Heavy (Sage Header) -->
          <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none flex flex-col shadow-[4px_4px_0px_0px_#1A1A1A]">
            <div class="bg-[#C9CBA3] border-b-2 border-[#1A1A1A] p-4 flex items-center gap-3">
              <!-- Lingkaran Angka Bulat Sempurna via Inline Style Force -->
              <span
                style="border-radius: 9999px !important;"
                class="w-7 h-7 aspect-square shrink-0 bg-[#1A1A1A] text-[#FAFAF9] flex items-center justify-center font-['JetBrains_Mono',monospace] text-xs font-bold leading-none"
              >
                03
              </span>
              <h3 class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-tight text-[#1A1A1A]">
                {{ t('landing.problem.card3.title') }}
              </h3>
            </div>
            <div class="p-4 flex-grow">
              <p class="font-['Noto_Serif',serif] text-sm md:text-base leading-[1.6] text-[#1A1A1A]/80">
                {{ t('landing.problem.card3.description') }}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>