<script setup lang="ts">
defineProps<{
  label: string;
  accent?: "canvas" | "yellow" | "lavender";
}>();
</script>

<template>
  <div
    :class="[
      'border-2 border-[#1A1A1A] p-6 rounded-none shadow-[4px_4px_0px_0px_#1A1A1A] flex flex-col justify-between min-h-[140px]',
      (accent ?? 'canvas') === 'canvas' && 'bg-[#FAFAF9]',
      (accent ?? 'canvas') === 'yellow' && 'bg-[#FDFFB6]',
      (accent ?? 'canvas') === 'lavender' && 'bg-[#DCCCFF]',
    ]"
  >
    <p class="font-mono text-xs uppercase tracking-widest text-[#1A1A1A]/70">
      {{ label }}
    </p>
    <slot />
  </div>
</template>
