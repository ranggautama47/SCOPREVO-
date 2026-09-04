<script setup lang="ts">
import { computed } from "vue";
import type { RevisionBatchStatus, ScopeStatus } from "../../types/api";

const props = defineProps<{
  status: RevisionBatchStatus | ScopeStatus;
  kind: "batch" | "scope";
  size?: "sm" | "md";
}>();

const colorClass = computed(() => {
  if (props.kind === "batch") {
    switch (props.status) {
      case "DRAFT":
        return "bg-[#E5E7EB] text-[#1A1A1A]";
      case "PENDING_CONFIRMATION":
        return "bg-[#DCCCFF] text-[#1A1A1A]";
      case "APPROVED":
        return "bg-[#DCFCE7] text-[#166534]";
      case "NEEDS_REVIEW":
        return "bg-[#FDFFB6] text-[#92400E]";
      default:
        return "bg-[#E5E7EB] text-[#1A1A1A]";
    }
  } else {
    switch (props.status) {
      case "IN_SCOPE":
        return "bg-[#DCFCE7] text-[#166534]";
      case "OUT_OF_SCOPE":
        return "bg-[#FEE2E2] text-[#991B1B]";
      case "NEEDS_REVIEW":
        return "bg-[#FDFFB6] text-[#92400E]";
      default:
        return "bg-[#E5E7EB] text-[#1A1A1A]";
    }
  }
});

const label = computed(() => props.status.replace(/_/g, " "));
const sizeClass = computed(() =>
  (props.size ?? "md") === "md"
    ? "px-3 py-1 text-xs"
    : "px-2 py-0.5 text-[10px]",
);
</script>

<template>
  <span
    :class="[
      colorClass,
      sizeClass,
      'border-2 border-[#1A1A1A] rounded-none font-mono uppercase font-bold tracking-wider inline-block',
    ]"
  >
    {{ label }}
  </span>
</template>
