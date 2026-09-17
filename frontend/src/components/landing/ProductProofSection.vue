<template>
  <section id="why-scoprevo" class="w-full border-t-2 border-[#1A1A1A] overflow-hidden">
    <!-- Outer Grid 100% Full Width tanpa max-w di wrapper paling luar -->
    <div class="w-full grid grid-cols-1 lg:grid-cols-2">

      <!-- SISI KIRI: Revision Quota Tracking (Sage Background Full Width) -->
      <div class="bg-[#E6E7D5] w-full border-b-2 lg:border-b-0 lg:border-r-2 border-[#1A1A1A] py-16 md:py-20 px-6 md:px-12 flex justify-end">
        <!-- Container Dalam untuk Menjaga Batas Teks Konten -->
        <div class="w-full max-w-[560px] flex flex-col justify-between">
          <div>
            <!-- Eyebrow Pill Bulat -->
            <span
              style="border-radius: 9999px !important;"
              class="w-fit inline-flex items-center justify-center bg-[#FDFFB6] border-2 border-[#1A1A1A] px-3.5 py-1 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#1A1A1A] leading-none shrink-0 mb-6"
            >
              {{ t('landing.proof.quotaEyebrow') }}
            </span>
            <h2 class="font-['Baskervville',serif] text-3xl md:text-4xl leading-[1.15] text-[#1A1A1A] mb-4">
              {{ t('landing.proof.quotaHeadline') }}
            </h2>
            <p class="font-['Noto_Serif',serif] text-sm md:text-base leading-[1.65] text-[#1A1A1A]/80 mb-8">
              {{ t('landing.proof.quotaDescription') }}
            </p>
          </div>
          <QuotaProgressMockup />
        </div>
      </div>

      <!-- SISI KANAN: Why SCOPREVO (Cream Yellow Background Full Width) -->
      <div class="bg-[#FEFEE8] w-full py-16 md:py-20 px-6 md:px-12 flex justify-start">
        <!-- Container Dalam untuk Menjaga Batas Teks Konten -->
        <div class="w-full max-w-[560px] flex flex-col justify-between">
          <div>
            <!-- Eyebrow Pill Bulat -->
            <span
              style="border-radius: 9999px !important;"
              class="w-fit inline-flex items-center justify-center bg-[#FDFFB6] border-2 border-[#1A1A1A] px-3.5 py-1 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#1A1A1A] leading-none shrink-0 mb-6"
            >
              {{ t('landing.proof.whyEyebrow') }}
            </span>
            <h2 class="font-['Baskervville',serif] text-3xl md:text-4xl leading-[1.15] text-[#1A1A1A] mb-4">
              {{ t('landing.proof.whyHeadline') }}
            </h2>
            <p class="font-['Noto_Serif',serif] text-sm md:text-base leading-[1.65] text-[#1A1A1A]/80 mb-6">
              {{ t('landing.proof.whyDescription') }}
            </p>
          </div>
          <WhyScoprevoComparisonMockup />
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import QuotaProgressMockup from '@/components/landing/mockups/QuotaProgressMockup.vue'
import WhyScoprevoComparisonMockup from '@/components/landing/mockups/WhyScoprevoComparisonMockup.vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>