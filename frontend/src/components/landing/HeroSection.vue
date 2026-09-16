<template>
  <section class="px-4 py-12 md:px-8 md:py-20 lg:py-24">
    <!-- Diperluas max-w dari 1200px ke 1280px agar gambar di laptop bisa lebih besar lagi -->
    <div class="mx-auto max-w-[1280px]">
      <div
        class="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_1.3fr] lg:grid-cols-[1fr_1.5fr] md:gap-10 lg:gap-16"
      >
        <!-- LEFT: Text & CTA -->
        <div class="flex flex-col gap-5 md:gap-6">
          <div class="inline-flex w-fit">
            <!-- Eyebrow Pill Bulat Kapsul dengan Border Hitam Brutalist -->
            <span
              style="border-radius: 9999px !important"
              class="w-fit inline-flex items-center justify-center bg-[#FDFFB6] border-2 border-[#1A1A1A] px-4 py-1.5 font-['JetBrains_Mono',monospace] text-[11px] md:text-xs font-bold uppercase tracking-wider text-[#1A1A1A] leading-none shrink-0"
            >
              AI-POWERED SCOPE &amp; REVISION INTELLIGENCE
            </span>
          </div>

          <h1
            class="font-['Baskervville',serif] text-3xl leading-[1.1] tracking-tight text-[#1A1A1A] sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl"
          >
            Know what belongs in the scope — before the revision loop gets out
            of control.
          </h1>

          <p
            class="max-w-lg font-['Noto_Serif',serif] text-base leading-[1.7] text-[#1A1A1A]/75 md:text-lg"
          >
            SCOPREVO turns pasted client feedback into structured revisions,
            classifies each request by scope, and helps freelancers keep project
            boundaries under control.
          </p>

          <div>
            <router-link
              to="/register"
              class="inline-flex items-center justify-center gap-2 border-2 border-[#1A1A1A] bg-[#006D77] px-6 py-3 md:px-7 md:py-3.5 font-['Inter',sans-serif] text-xs md:text-sm font-semibold uppercase tracking-wider text-[#FAFAF9] shadow-[4px_4px_0px_0px_#1A1A1A] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
            >
              GET STARTED
              <ArrowRight :size="16" :stroke-width="2" />
            </router-link>
          </div>
        </div>

        <!-- RIGHT: Hero Image (Besar & Sharp) -->
        <div class="min-w-0 w-full flex justify-center lg:justify-end">
          <img
            src="/asset/landingpage/hero-mockup.jpg"
            alt="SCOPREVO revision dashboard"
            class="block w-full h-auto object-contain border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A]"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
</script>
