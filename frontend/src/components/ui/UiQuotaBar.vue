<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  used: number;
  total: number;
  size?: "lg" | "sm";
  caption?: string;
}>();

const percent = computed(() =>
  props.total > 0 ? Math.min((props.used / props.total) * 100, 100) : 0
);
const heightClass = computed(() => ((props.size ?? "lg") === "lg" ? "h-6" : "h-3"));
</script>

<template>
  <div>
    <div
      :class="[
        heightClass,
        'w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden',
      ]"
    >
      <div
        class="h-full bg-[#006D77] transition-all duration-300 ease-out"
        :style="{ width: percent + '%' }"
      ></div>
    </div>
    <p v-if="caption" class="font-mono text-xs text-[#1A1A1A]/60 mt-1">
      {{ caption }}
    </p>
  </div>
</template>
