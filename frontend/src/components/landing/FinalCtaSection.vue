<template>
  <section class="bg-[#1A1A1A] py-16 md:py-24 px-4 md:px-8">
    <div class="max-w-[1200px] mx-auto text-center flex flex-col items-center gap-8">
      <!-- Headline -->
      <h2 class="font-['Baskervville',serif] text-2xl md:text-3xl lg:text-5xl leading-[1.1] text-[#FAFAF9] max-w-2xl">
        {{ t('landing.cta.headline') }}
      </h2>

      <!-- Subtext -->
      <p class="font-['Noto_Serif',serif] text-lg leading-[1.7] text-[#FAFAF9]/75 max-w-xl">
        {{ t('landing.cta.subheadline') }}
      </p>

      <!-- CTA Button -->
      <router-link
        to="/register"
        class="font-['Inter',sans-serif] text-sm font-medium uppercase tracking-wider px-9 py-4 border-2 border-[#FAFAF9] bg-[#006D77] text-[#FAFAF9] shadow-[4px_4px_0px_0px_#FAFAF9] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#FAFAF9] transition-all inline-flex items-center gap-2 focus:ring-2 focus:ring-[#FAFAF9] focus:outline-none"
        :aria-label="t('landing.cta.cta')"
      >
        {{ t('landing.cta.cta') }}
        <ArrowRight :size="16" :stroke-width="2" />
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>
