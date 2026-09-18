<template>
  <section id="tech-stack" class="bg-[#C9CBA3] border-y-2 border-[#1A1A1A] py-16 px-4 md:px-8">
    <div class="max-w-[1200px] mx-auto">
      <!-- Headline -->
      <div class="text-center mb-10">
        <h2 class="font-['Baskervville',serif] text-3xl md:text-4xl lg:text-5xl leading-[1.15] text-[#1A1A1A]">
          {{ t('landing.tech.headline') }}
        </h2>
      </div>

      <!-- Tech Stack Badges (Product tokens - keep literal) -->
      <div class="flex flex-wrap gap-3 justify-center mb-10">
        <span class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-full px-4 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">Vue 3 + Vite</span>
        <span class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-full px-4 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">Express.js + TypeScript</span>
        <span class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-full px-4 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">PostgreSQL (Supabase)</span>
        <span class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-full px-4 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">Tencent EdgeOne Makers</span>
        <span class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-full px-4 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">AI Classification Pipeline</span>
      </div>

      <!-- Callout Box (Lavender Pastel Style) -->
      <div class="bg-[#EBE5FF] border border-[#C7D2FE] rounded-none p-5 max-w-3xl mx-auto">
        <div class="flex items-center gap-4">
          <!-- Icon Code </> tanpa background kotak hitam -->
          <div class="flex-shrink-0 text-[#4338CA]  font-['JetBrains_Mono',monospace] text-xl font-extrabold tracking-tighter">
            &lt;/&gt;
          </div>
          <!-- Paragraph dengan bold di kata tertentu -->
          <p class="font-['Noto_Serif',serif] text-sm md:text-base leading-[1.6] text-[#3730A3]">
            <strong class="font-bold text-[#1E1B4B]">{{ t('landing.tech.callout') }}</strong>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>