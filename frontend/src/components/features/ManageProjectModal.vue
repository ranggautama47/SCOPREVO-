<script setup lang="ts">
import { ref, computed } from "vue";
import { apiClient, ApiError } from "../../api/client";
import type { Project } from "../../types/api";

const props = defineProps<{
  project: Project;
  revisionBatchCount: number;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "project-updated"): void;
  (e: "project-deleted"): void;
}>();

const isUpdating = ref(false);
const isDeleting = ref(false);
const errorMsg = ref("");
const errorCode = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const showCompleteConfirm = ref(false); // State baru untuk konfirmasi complete

const isBusy = computed(() => isUpdating.value || isDeleting.value);

function handleClose() {
  if (isBusy.value) return;
  errorMsg.value = "";
  errorCode.value = null;
  showDeleteConfirm.value = false;
  showCompleteConfirm.value = false;
  emit("close");
}

function getStatusBadgeClass(): string {
  if (props.project.status === "COMPLETED") {
    return "bg-[#DCCCFF] text-[#1A1A1A] border-2 border-[#1A1A1A]";
  }
  return "bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A]";
}

function getStatusLabel(): string {
  return props.project.status === "COMPLETED" ? "COMPLETED" : "ACTIVE";
}

function requestComplete() {
  if (isBusy.value) return;
  showCompleteConfirm.value = true;
}

function cancelComplete() {
  showCompleteConfirm.value = false;
}

async function confirmCompleteProject() {
  isUpdating.value = true;
  errorMsg.value = "";
  errorCode.value = null;

  try {
    await apiClient.projects.update(props.project.id, { status: "COMPLETED" });
    emit("project-updated");
    emit("close");
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      errorCode.value = err.code;
      switch (err.code) {
        case "PROJECT_HAS_PENDING_BATCH":
          errorMsg.value = "Cannot complete project while a revision batch is awaiting client confirmation. Please resolve or confirm the pending batch first.";
          break;
        case "INVALID_STATUS_TRANSITION":
          errorMsg.value = err.message;
          break;
        case "PROJECT_COMPLETED":
          errorMsg.value = "This project is completed. Reopen the project before creating or sharing revision batches.";
          break;
        default:
          errorMsg.value = err.message;
      }
    } else {
      errorMsg.value = "An unexpected error occurred.";
    }
  } finally {
    isUpdating.value = false;
    showCompleteConfirm.value = false;
  }
}

async function handleReopenProject() {
  isUpdating.value = true;
  errorMsg.value = "";
  errorCode.value = null;

  try {
    await apiClient.projects.update(props.project.id, { status: "ACTIVE" });
    emit("project-updated");
    emit("close");
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      errorCode.value = err.code;
      switch (err.code) {
        case "INVALID_STATUS_TRANSITION":
          errorMsg.value = err.message;
          break;
        default:
          errorMsg.value = err.message;
      }
    } else {
      errorMsg.value = "An unexpected error occurred.";
    }
  } finally {
    isUpdating.value = false;
  }
}

function requestDelete() {
  if (isBusy.value) return;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
}

async function confirmDelete() {
  isDeleting.value = true;
  errorMsg.value = "";
  errorCode.value = null;

  try {
    await apiClient.projects.remove(props.project.id);
    emit("project-deleted");
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      errorCode.value = err.code;
      errorMsg.value = err.message;
    } else {
      errorMsg.value = "An unexpected error occurred.";
    }
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50 p-4" @click.self="handleClose">
    <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] max-w-lg w-full rounded-none shadow-[8px_8px_0px_0px_#1A1A1A]">
      <!-- HEADER -->
      <div class="flex items-start justify-between border-b-2 border-[#1A1A1A] px-6 py-4">
        <div>
          <p class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#006D77] font-bold mb-1">
            PROJECT CONTEXT
          </p>
          <h2 class="font-['Baskervville',serif] text-2xl font-normal leading-[1.2] text-[#1A1A1A]">
            Manage Project Settings
          </h2>
          <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/60 mt-1">
            {{ project.name }} — {{ project.clientName }}
          </p>
        </div>
        <button type="button" @click="handleClose" :disabled="isBusy" class="font-['JetBrains_Mono',monospace] text-xs uppercase font-bold text-[#1A1A1A] border-2 border-[#1A1A1A] bg-[#FAFAF9] px-3 py-1 rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FDFFB6] transition-colors">
          × CLOSE
        </button>
      </div>

      <!-- BODY -->
      <div class="px-6 py-5">
        <!-- Error block -->
        <div v-if="errorMsg" class="mb-4 border-2 border-[#E63946] bg-[#FEE2E2] p-3 rounded-none">
          <p class="font-['Inter',sans-serif] text-[10px] uppercase tracking-wide text-[#991B1B] font-bold">
            {{ errorCode || "ERROR" }}
          </p>
          <p class="font-['Noto_Serif',serif] text-sm text-[#991B1B] mt-1">
            {{ errorMsg }}
          </p>
        </div>

        <!-- Current Status Display -->
        <div class="mb-6">
          <p class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70 font-bold mb-2">
            CURRENT STATUS
          </p>
          <span :class="[getStatusBadgeClass(), 'px-2 py-0.5 font-[\'JetBrains_Mono\',monospace] text-[10px] uppercase tracking-wide rounded-none font-bold']">
            [ STATUS: {{ getStatusLabel() }} ]
          </span>
        </div>

        <!-- Action Controls -->
        <div class="space-y-3">
          <!-- ACTIVE Project Actions -->
          <template v-if="props.project.status === 'ACTIVE'">
            <div v-if="!showCompleteConfirm">
              <button
                type="button"
                @click="requestComplete"
                :disabled="isBusy"
                class="w-full bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {{ isUpdating ? "COMPLETING..." : "MARK AS COMPLETED" }}
              </button>
            </div>

            <!-- Konfirmasi Complete Kustom (Ganti window.confirm) -->
            <div v-else class="space-y-3 bg-[#FDFFB6]/20 border-2 border-[#1A1A1A] p-4 rounded-none">
              <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] leading-[1.5]">
                MARK PROJECT AS COMPLETED? This closes the project. New revision batches cannot be submitted until reopened.
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="confirmCompleteProject"
                  :disabled="isUpdating"
                  class="flex-1 bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{ isUpdating ? "COMPLETING..." : "YES, COMPLETE" }}
                </button>
                <button
                  type="button"
                  @click="cancelComplete"
                  :disabled="isUpdating"
                  class="flex-1 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="border-t-2 border-[#1A1A1A] pt-4 mt-4">
              <p class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#E63946] font-bold mb-3">
                DANGER ZONE
              </p>
              <button
                type="button"
                v-if="!showDeleteConfirm"
                @click="requestDelete"
                :disabled="isBusy"
                class="w-full bg-[#FAFAF9] text-[#E63946] border-2 border-[#E63946] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#E63946] rounded-none transition-all duration-100 ease-out hover:bg-[#FEE2E2] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#E63946] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#E63946] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                DELETE PROJECT
              </button>

              <div v-else class="space-y-2 bg-[#FEE2E2]/30 border-2 border-[#E63946] p-4 rounded-none">
                <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] leading-[1.5]">
                  DELETE PROJECT PERMANENTLY? This will permanently delete this project, {{ revisionBatchCount }} revision batch{{ revisionBatchCount !== 1 ? 'es' : '' }}, and attached documents. This action CANNOT be undone.
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="confirmDelete"
                    :disabled="isDeleting"
                    class="flex-1 bg-[#E63946] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {{ isDeleting ? "DELETING..." : "YES, DELETE" }}
                  </button>
                  <button
                    type="button"
                    @click="cancelDelete"
                    :disabled="isDeleting"
                    class="flex-1 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- COMPLETED Project Actions -->
          <template v-else>
            <button
              type="button"
              @click="handleReopenProject"
              :disabled="isBusy"
              class="w-full bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ isUpdating ? "REOPENING..." : "REOPEN PROJECT" }}
            </button>

            <!-- Danger Zone -->
            <div class="border-t-2 border-[#1A1A1A] pt-4 mt-4">
              <p class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#E63946] font-bold mb-3">
                DANGER ZONE
              </p>
              <button
                type="button"
                v-if="!showDeleteConfirm"
                @click="requestDelete"
                :disabled="isBusy"
                class="w-full bg-[#FAFAF9] text-[#E63946] border-2 border-[#E63946] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#E63946] rounded-none transition-all duration-100 ease-out hover:bg-[#FEE2E2] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#E63946] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                DELETE PROJECT
              </button>

              <div v-else class="space-y-2 bg-[#FEE2E2]/30 border-2 border-[#E63946] p-4 rounded-none">
                <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A] leading-[1.5]">
                  DELETE PROJECT PERMANENTLY? This will permanently delete this project, {{ revisionBatchCount }} revision batch{{ revisionBatchCount !== 1 ? 'es' : '' }}, and attached documents. This action CANNOT be undone.
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="confirmDelete"
                    :disabled="isDeleting"
                    class="flex-1 bg-[#E63946] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {{ isDeleting ? "DELETING..." : "YES, DELETE" }}
                  </button>
                  <button
                    type="button"
                    @click="cancelDelete"
                    :disabled="isDeleting"
                    class="flex-1 bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-semibold uppercase tracking-wide shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>