<template>
  <!-- Side-by-Side Comparison Mockup -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
    
    <!-- LEFT: Generic PM Suites (Faded Gray Block) -->
    <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden opacity-60">
      <!-- Gray Header Strip -->
      <div class="bg-[#E5E7EB] border-b-2 border-[#1A1A1A] p-2.5">
        <p class="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#1A1A1A] uppercase tracking-tight">
          {{ t('landing.mockup.genericPmSuites') }}
        </p>
      </div>
      <!-- Items List -->
      <div class="p-3.5 space-y-2.5 font-['Inter',sans-serif] text-xs text-[#1A1A1A]/70">
        <div class="flex items-center gap-2">
          <Layers :size="14" class="shrink-0" />
          <span>{{ t('landing.mockup.pmTasks') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Users :size="14" class="shrink-0" />
          <span>{{ t('landing.mockup.pmTeams') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Calendar :size="14" class="shrink-0" />
          <span>{{ t('landing.mockup.pmCalendars') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <CreditCard :size="14" class="shrink-0" />
          <span>{{ t('landing.mockup.pmCrm') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <FileText :size="14" class="shrink-0" />
          <span>{{ t('landing.mockup.pmInvoicing') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Kanban :size="14" class="shrink-0" />
          <span>{{ t('landing.mockup.pmKanban') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <BarChart3 :size="14" class="shrink-0" />
          <span>{{ t('landing.mockup.pmReports') }}</span>
        </div>
      </div>
    </div>

    <!-- RIGHT: SCOPREVO Core Loop (Teal Header + Colored Vertical Flow with Arrows) -->
    <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden shadow-[4px_4px_0px_0px_#1A1A1A]">
      <!-- Teal Header Strip -->
      <div class="bg-[#006D77] border-b-2 border-[#1A1A1A] p-2.5">
        <p class="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#FAFAF9] uppercase tracking-tight">
          {{ t('landing.mockup.scoprevoCoreLoop') }}
        </p>
      </div>

      <!-- 5-Step Vertical Flow with Pastel Backgrounds & ArrowDown -->
      <div class="p-3 flex flex-col gap-0.5">
        
        <!-- Step 1: Raw Feedback (Yellow) -->
        <div class="bg-[#FDFFB6] border border-[#1A1A1A]/30 rounded-none p-2 flex items-center gap-2">
          <span 
            style="border-radius: 9999px !important;"
            class="w-4 h-4 aspect-square shrink-0 bg-[#1A1A1A] text-[#FDFFB6] flex items-center justify-center font-['JetBrains_Mono',monospace] text-[9px] font-bold leading-none"
          >
            01
          </span>
          <span class="font-['Inter',sans-serif] text-[11px] text-[#1A1A1A] font-medium">{{ t('landing.mockup.coreStep1') }}</span>
        </div>

        <div class="flex justify-center py-0.5">
          <ArrowDown :size="12" :stroke-width="2.5" class="text-[#1A1A1A]/60" />
        </div>

        <!-- Step 2: AI Scope Analysis (Lavender) -->
        <div class="bg-[#DCCCFF] border border-[#1A1A1A]/30 rounded-none p-2 flex items-center gap-2">
          <span 
            style="border-radius: 9999px !important;"
            class="w-4 h-4 aspect-square shrink-0 bg-[#1A1A1A] text-[#DCCCFF] flex items-center justify-center font-['JetBrains_Mono',monospace] text-[9px] font-bold leading-none"
          >
            02
          </span>
          <span class="font-['Inter',sans-serif] text-[11px] text-[#1A1A1A] font-medium">{{ t('landing.mockup.coreStep2') }}</span>
        </div>

        <div class="flex justify-center py-0.5">
          <ArrowDown :size="12" :stroke-width="2.5" class="text-[#1A1A1A]/60" />
        </div>

        <!-- Step 3: Revision Checklist (Sage Green) -->
        <div class="bg-[#DCFCE7] border border-[#1A1A1A]/30 rounded-none p-2 flex items-center gap-2">
          <span 
            style="border-radius: 9999px !important;"
            class="w-4 h-4 aspect-square shrink-0 bg-[#166534] text-[#DCFCE7] flex items-center justify-center font-['JetBrains_Mono',monospace] text-[9px] font-bold leading-none"
          >
            03
          </span>
          <span class="font-['Inter',sans-serif] text-[11px] text-[#166534] font-medium">{{ t('landing.mockup.coreStep3') }}</span>
        </div>

        <div class="flex justify-center py-0.5">
          <ArrowDown :size="12" :stroke-width="2.5" class="text-[#1A1A1A]/60" />
        </div>

        <!-- Step 4: Quota Tracking (Warm Orange) -->
        <div class="bg-[#FFE1A8] border border-[#1A1A1A]/30 rounded-none p-2 flex items-center gap-2">
          <span 
            style="border-radius: 9999px !important;"
            class="w-4 h-4 aspect-square shrink-0 bg-[#1A1A1A] text-[#FFE1A8] flex items-center justify-center font-['JetBrains_Mono',monospace] text-[9px] font-bold leading-none"
          >
            04
          </span>
          <span class="font-['Inter',sans-serif] text-[11px] text-[#1A1A1A] font-medium">{{ t('landing.mockup.coreStep4') }}</span>
        </div>

        <div class="flex justify-center py-0.5">
          <ArrowDown :size="12" :stroke-width="2.5" class="text-[#1A1A1A]/60" />
        </div>

        <!-- Step 5: Client Confirmation (Teal Solid) -->
        <div class="bg-[#006D77] border border-[#006D77] rounded-none p-2 flex items-center gap-2">
          <span 
            style="border-radius: 9999px !important;"
            class="w-4 h-4 aspect-square shrink-0 bg-[#FAFAF9] text-[#006D77] flex items-center justify-center font-['JetBrains_Mono',monospace] text-[9px] font-bold leading-none"
          >
            05
          </span>
          <span class="font-['Inter',sans-serif] text-[11px] text-[#FAFAF9] font-medium">{{ t('landing.mockup.coreStep5') }}</span>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { 
  Layers, 
  Users, 
  Calendar, 
  CreditCard, 
  FileText, 
  Kanban, 
  BarChart3, 
  ArrowDown 
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
</script>