<template>
  <!-- Background Soft Lavender Pastel murni sesuai mockup -->
  <section
    class="bg-[#EBE5FF] border-y-2 border-[#1A1A1A] py-16 md:py-20 px-4 md:px-8"
  >
    <div
      class="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
    >
      <!-- KOLOM KIRI: Eyebrow Pill & Headline -->
      <div class="lg:col-span-5 flex flex-col gap-5">
        <!-- Eyebrow Pill Bulat Sempurna (style inline force) -->
        <span
          style="border-radius: 9999px !important"
          class="w-fit inline-flex items-center justify-center bg-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-3 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#1A1A1A] leading-none shrink-0"
        >
          THREE-WAY SCOPE INTELLIGENCE
        </span>

        <h2
          class="font-['Baskervville',serif] text-4xl md:text-5xl leading-[1.15] text-[#1A1A1A]"
        >
          Not every request needs a binary yes or no.
        </h2>
      </div>

      <!-- KOLOM KANAN: 3 Colored Status Cards -->
      <div class="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 1. IN_SCOPE CARD (Pastel Green) -->
        <div
          class="bg-[#DCFCE7] border-2 border-[#1A1A1A] rounded-none p-5 flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <!-- Header Row: Icon Lingkaran Hijau Gelap + Badge Status -->
            <div class="flex items-center gap-2.5 mb-4">
              <div
                style="border-radius: 9999px !important"
                class="w-8 h-8 aspect-square shrink-0 bg-[#166534] text-[#DCFCE7] flex items-center justify-center"
              >
                <CheckCircle :size="20" :stroke-width="3" />
              </div>
              <span
                class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wide text-[#166534]"
              >
                IN_SCOPE
              </span>
            </div>
            <!-- Body Content -->
            <p
              class="font-['Noto_Serif',serif] text-sm leading-[1.6] text-[#166534] font-medium"
            >
              Matches the agreed project specification — safe to execute.
            </p>
          </div>
        </div>

        <!-- 2. NEEDS_REVIEW CARD (Pastel Yellow) -->
        <div
          class="bg-[#FDFFB6] border-2 border-[#1A1A1A] rounded-none p-5 flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <!-- Header Row: Icon Lingkaran Hitam/Kuning Gelap + Badge Status -->
            <div class="flex items-center gap-2.5 mb-4">
              <div
                style="border-radius: 9999px !important"
                class="w-8 h-8 aspect-square shrink-0 bg-[#1A1A1A] text-[#FDFFB6] flex items-center justify-center font-['JetBrains_Mono',monospace] text-sm font-bold leading-none"
              >
                <HelpCircle :size="20" :stroke-width="3" />
              </div>
              <span
                class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wide text-[#1A1A1A]"
              >
                NEEDS_REVIEW
              </span>
            </div>
            <!-- Body Content -->
            <p
              class="font-['Noto_Serif',serif] text-sm leading-[1.6] text-[#1A1A1A]/90 font-medium"
            >
              AI detects ambiguity and defers to human judgment. Protects
              freelancer–client trust by avoiding AI overconfidence.
            </p>
          </div>
        </div>

        <!-- 3. OUT_OF_SCOPE CARD (Pastel Red) -->
        <div
          class="bg-[#FEE2E2] border-2 border-[#1A1A1A] rounded-none p-5 flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <!-- Header Row: Icon Lingkaran Merah Gelap + Badge Status -->
            <div class="flex items-center gap-2.5 mb-4">
              <div
                style="border-radius: 9999px !important"
                class="w-8 h-8 aspect-square shrink-0 bg-[#991B1B] text-[#FEE2E2] flex items-center justify-center"
              >
                <XCircle :size="20" :stroke-width="3" />
              </div>
              <span
                class="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wide text-[#991B1B]"
              >
                OUT_OF_SCOPE
              </span>
            </div>
            <!-- Body Content -->
            <p
              class="font-['Noto_Serif',serif] text-sm leading-[1.6] text-[#991B1B] font-medium"
            >
              Goes beyond the original agreement — requires additional scope
              approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CheckCircle, HelpCircle, XCircle } from "lucide-vue-next";
</script>
