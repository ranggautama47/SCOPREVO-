<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { apiClient, ApiError } from "../../api/client";
import type {
  ProjectDocument,
  ProjectDocumentExtractionStatus,
} from "../../types/api";

const props = defineProps<{
  projectId: string;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const MAX_DOCUMENTS = 3;
const MAX_FILE_SIZE = 2097152;
const ALLOWED_EXTENSIONS = ["pdf", "docx", "md"];
const ACCEPT_ATTR = ".pdf,.docx,.md";
const POLIFY_INTERVAL_MS = 2000;
const POLIFY_MAX_ATTEMPTS = 3;

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  md: "text/markdown",
};

const documents = ref<ProjectDocument[]>([]);
const isLoading = ref(false);
const isUploading = ref(false);
const isDeleting = ref(false);
const errorMsg = ref("");
const uploadErrorMsg = ref("");
const confirmDeleteId = ref<string | null>(null);

const fileInput = ref<HTMLInputElement | null>(null);
const pendingFile = ref<File | null>(null);

const isBusy = computed(() => isUploading.value || isDeleting.value);
const isAtLimit = computed(() => documents.value.length >= MAX_DOCUMENTS);
const canAttach = computed(() => !isBusy.value && !isAtLimit.value);

async function fetchDocuments() {
  isLoading.value = true;
  errorMsg.value = "";
  try {
    const res = await apiClient.documents.list(props.projectId);
    documents.value = res.documents;
  } catch (err: unknown) {
    errorMsg.value =
      err instanceof ApiError
        ? `${err.code}: ${err.message}`
        : "Failed to load documents.";
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  if (isBusy.value) return;
  resetFileSelection();
  confirmDeleteId.value = null;
  uploadErrorMsg.value = "";
  errorMsg.value = "";
  emit("close");
}

function resetFileSelection() {
  pendingFile.value = null;
  if (fileInput.value) fileInput.value.value = "";
}

function openFilePicker() {
  if (!canAttach.value) return;
  fileInput.value?.click();
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

function onFileChange(event: Event) {
  uploadErrorMsg.value = "";
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  pendingFile.value = null;
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    uploadErrorMsg.value =
      "File is too large. Maximum allowed size is 2.00 MB (2097152 bytes).";
    target.value = "";
    return;
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    uploadErrorMsg.value =
      `Unsupported file type ".${ext || "?"}". Allowed: .pdf, .docx, .md.`;
    target.value = "";
    return;
  }

  pendingFile.value = new File([file], file.name, {
    type: EXT_TO_MIME[ext] ?? file.type,
    lastModified: file.lastModified,
  });
}

function cancelFileSelection() {
  resetFileSelection();
  uploadErrorMsg.value = "";
}

async function handleUpload() {
  if (!pendingFile.value) return;
  if (isAtLimit.value) {
    uploadErrorMsg.value = `Document limit reached (${MAX_DOCUMENTS}/${MAX_DOCUMENTS}). Delete a document to upload a new one.`;
    return;
  }

  isUploading.value = true;
  uploadErrorMsg.value = "";
  try {
    const form = new FormData();
    form.append("file", pendingFile.value);
    const res = await apiClient.documents.upload(props.projectId, form);
    documents.value = [...documents.value, res.document];
    resetFileSelection();
    if (res.document.extractionStatus === "pending") {
      pollDocumentStatus(res.document.id, 0);
    }
  } catch (err: unknown) {
    uploadErrorMsg.value =
      err instanceof ApiError
        ? `${err.code}: ${err.message}`
        : "Upload failed.";
  } finally {
    isUploading.value = false;
  }
}

async function pollDocumentStatus(documentId: string, attempt: number) {
  if (attempt >= POLIFY_MAX_ATTEMPTS) return;
  await new Promise((r) => setTimeout(r, POLIFY_INTERVAL_MS));
  try {
    const res = await apiClient.documents.list(props.projectId);
    documents.value = res.documents;
    const target = res.documents.find((d) => d.id === documentId);
    if (!target) return;
    if (target.extractionStatus === "pending") {
      pollDocumentStatus(documentId, attempt + 1);
    }
  } catch {
    // swallow polling errors — keep last-known list visible
  }
}

function requestDelete(id: string) {
  if (isBusy.value) return;
  confirmDeleteId.value = id;
}

function cancelDelete() {
  confirmDeleteId.value = null;
}

async function confirmDeleteAction(id: string) {
  isDeleting.value = true;
  errorMsg.value = "";
  try {
    await apiClient.documents.remove(props.projectId, id);
    documents.value = documents.value.filter((d) => d.id !== id);
    confirmDeleteId.value = null;
  } catch (err: unknown) {
    errorMsg.value =
      err instanceof ApiError
        ? `${err.code}: ${err.message}`
        : "Delete failed.";
  } finally {
    isDeleting.value = false;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusBadgeClass(status: ProjectDocumentExtractionStatus): string {
  switch (status) {
    case "completed":
      return "bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A]";
    case "failed":
      return "bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A]";
    case "pending":
    default:
      return "bg-[#E5E7EB] text-[#1A1A1A] border-2 border-[#1A1A1A]";
  }
}

function statusLabel(status: ProjectDocumentExtractionStatus): string {
  switch (status) {
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "pending":
    default:
      return "PENDING";
  }
}

onMounted(() => {
  if (props.open) fetchDocuments();
});
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-[#1A1A1A]/50 flex items-center justify-center z-50 p-4"
    @click.self="handleClose"
  >
    <div
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] max-w-2xl w-full rounded-none shadow-[8px_8px_0px_0px_#1A1A1A] flex flex-col max-h-[90vh]"
    >
      <!-- HEADER -->
      <div
        class="flex items-start justify-between border-b-2 border-[#1A1A1A] px-6 py-4"
      >
        <div>
          <p
            class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#006D77] font-bold mb-1"
          >
            PROJECT CONTEXT
          </p>
          <h2
            class="font-['Baskervville',serif] text-2xl font-normal leading-[1.2] text-[#1A1A1A]"
          >
            Manage Documents
          </h2>
        </div>
        <button
          type="button"
          @click="handleClose"
          :disabled="isBusy"
          class="font-['JetBrains_Mono',monospace] text-xs uppercase font-bold text-[#1A1A1A] border-2 border-[#1A1A1A] bg-[#FAFAF9] px-3 py-1 rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FDFFB6] transition-colors"
        >
          × CLOSE
        </button>
      </div>

      <!-- BODY -->
      <div class="px-6 py-5 overflow-y-auto">
        <!-- Top-level error -->
        <div
          v-if="errorMsg"
          class="mb-4 border-2 border-[#E63946] bg-[#FEE2E2] p-3 rounded-none"
        >
          <p
            class="font-['Inter',sans-serif] text-[10px] uppercase tracking-wide text-[#991B1B] font-bold"
          >
            ERROR
          </p>
          <p
            class="font-['Noto_Serif',serif] text-sm text-[#991B1B] mt-1"
          >
            {{ errorMsg }}
          </p>
        </div>

        <!-- Counter row -->
        <div class="flex items-center justify-between mb-3">
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70 font-bold"
          >
            ATTACHED DOCUMENTS
          </p>
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#1A1A1A]/80"
          >
            {{ documents.length }} / {{ MAX_DOCUMENTS }}
          </p>
        </div>

        <!-- Loading state -->
        <div
          v-if="isLoading"
          class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A]/60 py-6"
        >
          <span class="animate-pulse">■</span>
          <span>Loading documents...</span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="documents.length === 0"
          class="border-2 border-dashed border-[#1A1A1A]/30 p-6 rounded-none text-center mb-4"
        >
          <p class="font-['Baskervville',serif] text-base text-[#1A1A1A]/60">
            No documents attached.
          </p>
          <p
            class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/40 mt-1"
          >
            Upload up to {{ MAX_DOCUMENTS }} files (.pdf, .docx, .md).
          </p>
        </div>

        <!-- Document list -->
        <ul v-else class="space-y-3 mb-4">
          <li
            v-for="doc in documents"
            :key="doc.id"
            class="border-2 border-[#1A1A1A] bg-[#FAFAF9] p-3 rounded-none flex items-center justify-between gap-3"
          >
            <div class="min-w-0 flex-1">
              <p
                class="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#1A1A1A] truncate"
              >
                {{ doc.filename }}
              </p>
              <p
                class="font-['JetBrains_Mono',monospace] text-[11px] text-[#1A1A1A]/60 mt-0.5"
              >
                {{ formatSize(doc.sizeBytes) }} · {{ doc.mimeType }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span
                :class="statusBadgeClass(doc.extractionStatus)"
                class="font-['JetBrains_Mono',monospace] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-none"
              >
                {{ statusLabel(doc.extractionStatus) }}
              </span>
              <button
                v-if="confirmDeleteId !== doc.id"
                type="button"
                @click="requestDelete(doc.id)"
                :disabled="isBusy"
                class="font-['JetBrains_Mono',monospace] text-xs uppercase font-bold text-[#FAFAF9] bg-[#E63946] border-2 border-[#1A1A1A] px-3 py-1 rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#991B1B] transition-colors"
                :title="`Delete ${doc.filename}`"
              >
                ×
              </button>
              <button
                v-else
                type="button"
                @click="confirmDeleteAction(doc.id)"
                :disabled="isDeleting"
                class="font-['JetBrains_Mono',monospace] text-xs uppercase font-bold text-[#FAFAF9] bg-[#1A1A1A] border-2 border-[#E63946] px-3 py-1 rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E63946] transition-colors"
              >
                {{ isDeleting ? "DELETING..." : "CONFIRM?" }}
              </button>
              <button
                v-if="confirmDeleteId === doc.id"
                type="button"
                @click="cancelDelete"
                :disabled="isDeleting"
                class="font-['JetBrains_Mono',monospace] text-xs uppercase font-bold text-[#1A1A1A] bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-1 rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FDFFB6] transition-colors"
              >
                CANCEL
              </button>
            </div>
          </li>
        </ul>

        <!-- ATTACH block -->
        <div class="border-t-2 border-[#1A1A1A] pt-4">
          <p
            class="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-widest text-[#1A1A1A]/70 font-bold mb-2"
          >
            ATTACH NEW DOCUMENT
          </p>
          <p
            class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/60 mb-3"
          >
            Allowed: .pdf, .docx, .md · Max 2.00 MB per file.
          </p>

          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            :accept="ACCEPT_ATTR"
            class="hidden"
            @change="onFileChange"
          />

          <!-- Limit reached message -->
          <p
            v-if="isAtLimit"
            class="border-2 border-[#E63946] bg-[#FEE2E2] text-[#991B1B] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide rounded-none"
          >
            Document limit reached ({{MAX_DOCUMENTS}}/{{MAX_DOCUMENTS}}). Delete
            a document to upload a new one.
          </p>

          <!-- Pending file -->
          <div
            v-else-if="pendingFile"
            class="border-2 border-[#1A1A1A] bg-[#FDFFB6] p-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <p
                class="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#1A1A1A] truncate"
              >
                {{ pendingFile.name }}
              </p>
              <p
                class="font-['JetBrains_Mono',monospace] text-[11px] text-[#1A1A1A]/70"
              >
                {{ formatSize(pendingFile.size) }} · ready
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="cancelFileSelection"
                :disabled="isUploading"
                class="font-['JetBrains_Mono',monospace] text-xs uppercase font-bold text-[#1A1A1A] bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-1 rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FDFFB6] transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                @click="handleUpload"
                :disabled="isUploading"
                class="font-['JetBrains_Mono',monospace] text-xs uppercase font-bold text-[#FAFAF9] bg-[#006D77] border-2 border-[#1A1A1A] px-4 py-1 rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#024f56] transition-colors shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                {{ isUploading ? "UPLOADING..." : "UPLOAD" }}
              </button>
            </div>
          </div>

          <!-- Pick file button -->
          <button
            v-else
            type="button"
            @click="openFilePicker"
            :disabled="!canAttach"
            class="w-full bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_#1A1A1A]"
          >
            + SELECT FILE
          </button>

          <!-- Upload validation error -->
          <p
            v-if="uploadErrorMsg"
            class="mt-3 border-2 border-[#E63946] bg-[#FEE2E2] text-[#991B1B] px-3 py-2 font-['Noto_Serif',serif] text-sm rounded-none"
          >
            {{ uploadErrorMsg }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>