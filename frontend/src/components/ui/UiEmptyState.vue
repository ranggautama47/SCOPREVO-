<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div
    class="bg-[#FAFAF9] border-2 border-dashed border-[#1A1A1A]/30 p-12 rounded-none text-center flex flex-col items-center justify-center"
  >
    <slot name="illustration" />
    <p class="font-editorial text-xl text-[#1A1A1A]/60">{{ title }}</p>
    <p v-if="subtitle" class="font-body text-sm text-[#1A1A1A]/40 mt-2">
      {{ subtitle }}
    </p>
    <slot name="action" />
  </div>
</template>
