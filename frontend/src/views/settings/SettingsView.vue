<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import { apiClient, ApiError } from "../../api/client";
import { networkState } from "../../services/resilience/network-state";
import AppTopbar from "../../components/features/AppTopbar.vue";
import { useI18n } from "../../composables/useI18n";
import { usePreferencesStore } from "../../stores/preferences";
import type { AIQuota } from "../../types/api";
import {
  User,
  Eye,
  EyeOff,
  Check,
  Mail,
  KeyRound,
  Sliders,
  Info,
  Save,
  Shield,
  RotateCcw,
  Trash2,
} from "lucide-vue-next";
import { getLlmProvider, getLlmKey, setLlmProvider, setLlmKey, clearLlmKey, type LlmProvider } from "../../services/llm-key";
import type { ValidateKeyResponse } from "../../types/api";

const { t, locale, setFontSize } = useI18n();

const authStore = useAuthStore();

const preferencesStore = usePreferencesStore();

const isMutationsDisabled = computed(() =>
  ["OFFLINE", "BACKEND_DEGRADED"].includes(networkState.value.status),
);

const DEFAULT_QUOTA_KEY = "scoprevo_default_revisions";

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const passwordError = ref<string | null>(null);
const passwordSuccess = ref<string | null>(null);
const isSubmittingPassword = ref(false);

const verificationMessage = ref<string | null>(null);
const isSendingVerification = ref(false);

const emailChangeForm = ref({ newEmail: "", currentPassword: "" });
const showEmailChangePassword = ref(false);
const emailChangeError = ref<string | null>(null);
const emailChangeSuccess = ref<string | null>(null);
const isSubmittingEmailChange = ref(false);

const defaultQuota = ref<number>(3);
const quotaSaved = ref(false);

// AI Quota
const aiQuota = ref<AIQuota | null>(null);
const isLoadingAiQuota = ref(true);
const aiQuotaError = ref<string | null>(null);

// BYOK (Bring Your Own Key)
const byokMode = ref<'server' | 'own'>('server');
const byokProvider = ref<LlmProvider>('openrouter');
const byokKey = ref<string>('');
const showByokKey = ref(false);
const byokStatus = ref<'idle' | 'validating' | 'valid' | 'invalid' | 'rate_limited'>('idle');
const byokMessage = ref<string | null>(null);
const isValidatingByok = ref(false);
const isSavingByok = ref(false);
const lastValidatedProvider = ref<LlmProvider | null>(null);
const lastValidatedKey = ref<string | null>(null);

function loadByokSettings() {
  const provider = getLlmProvider();
  const key = getLlmKey();
  if (provider && key) {
    byokMode.value = 'own';
    byokProvider.value = provider;
    byokKey.value = key;
    byokStatus.value = 'valid';
    lastValidatedProvider.value = provider;
    lastValidatedKey.value = key;
  } else {
    byokMode.value = 'server';
    byokStatus.value = 'idle';
    lastValidatedProvider.value = null;
    lastValidatedKey.value = null;
  }
}

async function handleValidateByok() {
  if (!byokKey.value.trim()) {
    byokMessage.value = t('settings.aiProvider.keyPlaceholder');
    byokStatus.value = 'invalid';
    return;
  }
  byokMessage.value = null;
  byokStatus.value = 'validating';
  isValidatingByok.value = true;
  try {
    const res: ValidateKeyResponse = await apiClient.ai.validateKey(byokProvider.value, byokKey.value);
    if (res.valid) {
      byokStatus.value = 'valid';
      lastValidatedProvider.value = byokProvider.value;
      lastValidatedKey.value = byokKey.value;
      byokMessage.value = t('settings.aiProvider.validOk');
    } else {
      byokStatus.value = 'invalid';
      byokMessage.value = res.error || t('settings.aiProvider.validFail');
    }
  } catch (err: unknown) {
    if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
      byokStatus.value = 'rate_limited';
      byokMessage.value = t('settings.aiProvider.rateLimited');
    } else {
      byokStatus.value = 'invalid';
      byokMessage.value = err instanceof ApiError ? err.message : t('settings.aiProvider.validFail');
    }
  } finally {
    isValidatingByok.value = false;
  }
}

async function handleSaveByok() {
  if (!byokKey.value.trim()) {
    byokMessage.value = t('settings.aiProvider.keyPlaceholder');
    byokStatus.value = 'invalid';
    return;
  }
  byokMessage.value = null;
  isSavingByok.value = true;
  try {
    const res: ValidateKeyResponse = await apiClient.ai.validateKey(byokProvider.value, byokKey.value);
    if (res.valid) {
      setLlmProvider(byokProvider.value);
      setLlmKey(byokKey.value);
      byokMode.value = 'own';
      byokStatus.value = 'valid';
      lastValidatedProvider.value = byokProvider.value;
      lastValidatedKey.value = byokKey.value;
      byokMessage.value = t('settings.aiProvider.saved');
    } else {
      byokStatus.value = 'invalid';
      byokMessage.value = res.error || t('settings.aiProvider.validFail');
    }
  } catch (err: unknown) {
    if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
      byokStatus.value = 'rate_limited';
      byokMessage.value = t('settings.aiProvider.rateLimited');
    } else {
      byokStatus.value = 'invalid';
      byokMessage.value = err instanceof ApiError ? err.message : t('settings.aiProvider.validFail');
    }
  } finally {
    isSavingByok.value = false;
  }
}

function handleDeleteByok() {
  clearLlmKey();
  byokMode.value = 'server';
  byokKey.value = '';
  byokStatus.value = 'idle';
  lastValidatedProvider.value = null;
  lastValidatedKey.value = null;
  byokMessage.value = t('settings.aiProvider.deleted');
}

const isKeyMismatch = computed(() => {
  return byokStatus.value === 'valid' &&
    (lastValidatedProvider.value !== byokProvider.value ||
     lastValidatedKey.value !== byokKey.value);
});

const isEmailVerified = computed(
  () => authStore.account?.emailVerified === true,
);

async function fetchAiQuota() {
  isLoadingAiQuota.value = true;
  aiQuotaError.value = null;
  try {
    const res = await apiClient.ai.quota();
    aiQuota.value = res;
  } catch (err: unknown) {
    aiQuotaError.value =
      err instanceof ApiError ? err.message : t("settings.aiQuota.exhaustedNote");
  } finally {
    isLoadingAiQuota.value = false;
  }
}

async function handleRequestEmailChange() {
  if (isMutationsDisabled.value) {
    emailChangeError.value = t("settings.changeEmail.failedMsg");
    return;
  }
  emailChangeError.value = null;
  emailChangeSuccess.value = null;
  isSubmittingEmailChange.value = true;
  try {
    const res = await apiClient.auth.requestEmailChange(emailChangeForm.value);
    emailChangeSuccess.value =
      res.deliveredVia === "console"
        ? t("settings.profile.verificationSentTest")
        : t("settings.changeEmail.successMsg");
    emailChangeForm.value = { newEmail: "", currentPassword: "" };
  } catch (err: unknown) {
    emailChangeError.value =
      err instanceof ApiError
        ? err.message
        : t("settings.changeEmail.failedMsg");
  } finally {
    isSubmittingEmailChange.value = false;
  }
}

function loadDefaultQuota() {
  const stored = localStorage.getItem(DEFAULT_QUOTA_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed > 0) {
      defaultQuota.value = parsed;
    }
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

onMounted(() => {
  loadDefaultQuota();
  loadByokSettings();
  authStore.refreshAccount();
  fetchAiQuota();
});

async function handleSendVerification() {
  if (isMutationsDisabled.value) {
    verificationMessage.value = t("common.offlineNotice");
    return;
  }
  verificationMessage.value = null;
  isSendingVerification.value = true;
  try {
    const res = await apiClient.auth.sendVerification();
    if (res.deliveredVia === "console") {
      verificationMessage.value = t("settings.profile.verificationSentTest");
    } else {
      verificationMessage.value = t("settings.profile.verificationSent");
    }
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      verificationMessage.value = err.message;
    } else {
      verificationMessage.value = t("settings.profile.failedSend");
    }
  } finally {
    isSendingVerification.value = false;
  }
}

function validatePasswordForm(): string | null {
  if (passwordForm.value.newPassword.length < 8) {
    return t("settings.changePassword.errMinLength");
  }
  if (passwordForm.value.newPassword.length > 72) {
    return t("settings.changePassword.errMaxLength");
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    return t("settings.changePassword.errMismatch");
  }
  return null;
}

async function handleChangePassword() {
  if (isMutationsDisabled.value) {
    passwordError.value = t("common.offlineNotice");
    return;
  }
  passwordError.value = null;
  passwordSuccess.value = null;

  const validationError = validatePasswordForm();
  if (validationError) {
    passwordError.value = validationError;
    return;
  }

  isSubmittingPassword.value = true;
  try {
    await apiClient.auth.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    });
    passwordSuccess.value = t("settings.changePassword.success");
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      passwordError.value = err.message;
    } else {
      passwordError.value = t("settings.changePassword.failed");
    }
  } finally {
    isSubmittingPassword.value = false;
  }
}

function saveDefaultQuota() {
  if (defaultQuota.value < 1) {
    defaultQuota.value = 1;
  }
  localStorage.setItem(DEFAULT_QUOTA_KEY, String(defaultQuota.value));
  quotaSaved.value = true;
  setTimeout(() => {
    quotaSaved.value = false;
  }, 2500);
}

const fontSizeOptions = computed<
  { value: "sm" | "md" | "lg"; label: string }[]
>(() => [
  { value: "sm", label: t("settings.preferences.fontSizeSm") },
  { value: "md", label: t("settings.preferences.fontSizeMd") },
  { value: "lg", label: t("settings.preferences.fontSizeLg") },
]);

const languageOptions = computed<{ value: "en" | "id"; label: string }[]>(
  () => [
    { value: "en", label: t("settings.preferences.langEn") },
    { value: "id", label: t("settings.preferences.langId") },
  ],
);
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10 space-y-8 bg-[#FAFAF9] min-h-screen">
    <div class="flex items-center justify-between mb-6">
      <nav aria-label="Breadcrumb">
        <router-link
          to="/dashboard"
          class="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:underline decoration-[#DCCCFF] decoration-2 underline-offset-4 transition-all"
        >
          {{ t("settings.breadcrumbWorkspace") }}
        </router-link>
        <span class="font-mono text-xs text-[#1A1A1A]/30">/</span>
        <span
          class="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.breadcrumbSettings") }}
        </span>
      </nav>
      <AppTopbar />
    </div>

    <div class="border-b-2 border-[#1A1A1A] pb-6">
      <h1 class="font-['Baskervville',serif] text-4xl text-[#1A1A1A] mb-2">
        {{ t("settings.title") }}
      </h1>
      <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/70">
        {{ t("settings.subtitle") }}
      </p>
    </div>

    <!-- 1. PROFILE CARD -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <User class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.profile.title") }}
        </h2>
      </div>

      <div class="space-y-4">
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.profile.fullName") }}
          </label>
          <div
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2.5 font-['Noto_Serif',serif] text-sm text-[#1A1A1A]"
          >
            {{ authStore.account?.name || "—" }}
          </div>
        </div>

        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.profile.emailAddress") }}
          </label>
          <div
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2.5 font-['Noto_Serif',serif] text-sm text-[#1A1A1A]"
          >
            {{ authStore.account?.email || "—" }}
          </div>
        </div>

        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.profile.verificationStatus") }}
          </label>
          <div class="flex flex-wrap items-center gap-3">
            <span
              v-if="isEmailVerified"
              class="bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] px-3 py-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5"
            >
              <Check class="w-3.5 h-3.5" />
              {{ t("settings.profile.verified") }}
            </span>
            <span
              v-else
              class="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-3 py-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider rounded-none"
            >
              {{ t("settings.profile.unverified") }}
            </span>

            <button
              v-if="!isEmailVerified"
              @click="handleSendVerification"
              :disabled="isSendingVerification"
              class="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-3 py-1 font-['Inter',sans-serif] text-[10px] font-bold uppercase tracking-wider rounded-none hover:bg-[#DCCCFF] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Mail class="w-3.5 h-3.5" />
              {{
                isSendingVerification
                  ? t("settings.profile.sending")
                  : t("settings.profile.sendVerification")
              }}
            </button>
          </div>
          <p
            v-if="verificationMessage"
            class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/80 mt-2 bg-[#FDFFB6]/50 border border-[#1A1A1A] p-2"
          >
            {{ verificationMessage }}
          </p>
        </div>
      </div>
    </section>

    <!-- 2. CHANGE EMAIL CARD -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <Mail class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.changeEmail.title") }}
        </h2>
      </div>
      <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/70 mb-4">
        {{ t("settings.changeEmail.description") }}
      </p>
      <form @submit.prevent="handleRequestEmailChange" class="space-y-4">
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.changeEmail.currentEmail") }}
          </label>
          <div
            class="bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2.5 font-['Noto_Serif',serif] text-sm text-[#1A1A1A]"
          >
            {{ authStore.account?.email || "—" }}
          </div>
        </div>
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.changeEmail.newEmail") }}
          </label>
          <input
            v-model="emailChangeForm.newEmail"
            type="email"
            required
            class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
            :placeholder="t('settings.changeEmail.newEmailPlaceholder')"
          />
        </div>
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.changeEmail.currentPassword") }}
          </label>
          <div class="relative flex items-center">
            <input
              v-model="emailChangeForm.currentPassword"
              :type="showEmailChangePassword ? 'text' : 'password'"
              required
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
              :placeholder="
                t('settings.changeEmail.currentPasswordPlaceholder')
              "
            />
            <button
              type="button"
              @click="showEmailChangePassword = !showEmailChangePassword"
              class="absolute right-3 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
            >
              <EyeOff v-if="showEmailChangePassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div
          v-if="emailChangeError"
          class="bg-[#FEE2E2] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-xs text-[#991B1B]"
        >
          {{ emailChangeError }}
        </div>
        <div
          v-if="emailChangeSuccess"
          class="bg-[#DCFCE7] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-xs text-[#166534] flex items-center gap-1.5"
        >
          <Check class="w-4 h-4" />
          {{ emailChangeSuccess }}
        </div>
        <button
          type="submit"
          :disabled="isSubmittingEmailChange"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-2.5 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 cursor-pointer"
        >
          {{
            isSubmittingEmailChange
              ? t("settings.changeEmail.sending")
              : t("settings.changeEmail.sendVerification")
          }}
        </button>
      </form>
    </section>

    <!-- 3. CHANGE PASSWORD CARD -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <KeyRound class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.changePassword.title") }}
        </h2>
      </div>

      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.changePassword.currentPassword") }}
          </label>
          <div class="relative flex items-center">
            <input
              v-model="passwordForm.currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              required
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
              :placeholder="
                t('settings.changePassword.currentPasswordPlaceholder')
              "
            />
            <button
              type="button"
              @click="showCurrentPassword = !showCurrentPassword"
              class="absolute right-3 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
            >
              <EyeOff v-if="showCurrentPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.changePassword.newPassword") }}
          </label>
          <div class="relative flex items-center">
            <input
              v-model="passwordForm.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              required
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
              :placeholder="t('settings.changePassword.newPasswordPlaceholder')"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute right-3 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
            >
              <EyeOff v-if="showNewPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.changePassword.confirmPassword") }}
          </label>
          <div class="relative flex items-center">
            <input
              v-model="passwordForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
              :placeholder="
                t('settings.changePassword.confirmPasswordPlaceholder')
              "
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
            >
              <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          v-if="passwordError"
          class="bg-[#FEE2E2] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-xs text-[#991B1B]"
        >
          {{ passwordError }}
        </div>
        <div
          v-if="passwordSuccess"
          class="bg-[#DCFCE7] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-xs text-[#166534] flex items-center gap-1.5"
        >
          <Check class="w-4 h-4" />
          {{ passwordSuccess }}
        </div>

        <button
          type="submit"
          :disabled="isSubmittingPassword"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-2.5 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 cursor-pointer"
        >
          {{
            isSubmittingPassword
              ? t("settings.changePassword.updating")
              : t("settings.changePassword.updateBtn")
          }}
        </button>
      </form>
    </section>

    <!-- 4. PREFERENCES SECTION (Immediate Apply - No Save Button) -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <Sliders class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.preferences.title") }}
        </h2>
      </div>

      <div class="space-y-6">
        <!-- Font Size Selector -->
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2"
          >
            {{ t("settings.preferences.fontSize") }}
          </label>
          <p class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/70 mb-3">
            {{ t("settings.preferences.fontSizeDesc") }}
          </p>
          <div class="flex gap-2">
            <button
              v-for="option in fontSizeOptions"
              :key="option.value"
              @click="setFontSize(option.value)"
              v-bind:class="[
                'px-4 py-2 font-[\'Inter\',sans-serif] text-xs font-bold uppercase tracking-wider border-2 rounded-none transition-all cursor-pointer',
                preferencesStore.fontSize === option.value
                  ? 'bg-[#006D77] text-[#FAFAF9] border-[#006D77]'
                  : 'bg-[#FAFAF9] text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#FDFFB6]',
              ]"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Language Selector -->
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2"
          >
            {{ t("settings.preferences.language") }}
          </label>
          <p class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/70 mb-3">
            {{ t("settings.preferences.languageDesc") }}
          </p>
          <div class="flex gap-2">
            <button
              v-for="option in languageOptions"
              :key="option.value"
              @click="locale = option.value"
              v-bind:class="[
                'px-4 py-2 font-[\'Inter\',sans-serif] text-xs font-bold uppercase tracking-wider border-2 rounded-none transition-all cursor-pointer',
                locale === option.value
                  ? 'bg-[#006D77] text-[#FAFAF9] border-[#006D77]'
                  : 'bg-[#FAFAF9] text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#FDFFB6]',
              ]"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. WORKSPACE DEFAULTS CARD -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <Sliders class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.workspaceDefaults.title") }}
        </h2>
      </div>

      <div class="space-y-4">
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
          >
            {{ t("settings.workspaceDefaults.revisionsLabel") }}
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="defaultQuota"
              type="number"
              min="1"
              max="100"
              class="bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] w-32"
            />
            <span class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/60">
              {{ t("settings.workspaceDefaults.revisionsSuffix") }}
            </span>
          </div>
        </div>

        <p
          class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/70 italic border-l-2 border-[#006D77] pl-3 py-1 bg-[#006D77]/5"
        >
          {{ t("settings.workspaceDefaults.hint") }}
        </p>

        <div class="flex items-center gap-3 pt-2">
          <button
            @click="saveDefaultQuota"
            class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-2.5 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all cursor-pointer flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            {{ t("settings.workspaceDefaults.saveBtn") }}
          </button>
          <span
            v-if="quotaSaved"
            class="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#166534] bg-[#DCFCE7] border border-[#1A1A1A] px-2 py-1 flex items-center gap-1"
          >
            <Check class="w-3.5 h-3.5" />
            {{ t("settings.workspaceDefaults.saved") }}
          </span>
        </div>
      </div>
    </section>

    <!-- 6. AI USAGE QUOTA CARD -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <Info class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.aiQuota.title") }}
        </h2>
      </div>

      <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/70 mb-4">
        {{ t("settings.aiQuota.desc") }}
      </p>

      <div v-if="isLoadingAiQuota" class="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/60">
        <span class="animate-pulse">■</span>
        <span>{{ t("common.loading") }}</span>
      </div>

      <div v-else-if="aiQuotaError" class="bg-[#FEE2E2] border-2 border-[#1A1A1A] p-4 rounded-none font-['Noto_Serif',serif] text-sm text-[#991B1B]">
        {{ aiQuotaError }}
      </div>

      <div v-else-if="aiQuota" class="space-y-4">
        <!-- Brutalist Progress Bar -->
        <div class="w-full h-10 bg-[#FAFAF9] border-2 border-[#1A1A1A] rounded-none overflow-hidden relative">
          <div
            class="h-full bg-[#006D77] transition-all duration-500 ease-out"
            :style="{ width: aiQuota.limit > 0 ? (aiQuota.used / aiQuota.limit) * 100 + '%' : '0%' }"
          ></div>
          <div v-if="aiQuota.used >= aiQuota.limit" class="absolute inset-0 bg-[#E63946]/20"></div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 font-['JetBrains_Mono',monospace] text-xs">
            <span class="text-[#1A1A1A]/60">{{ t("settings.aiQuota.usedLabel") }}</span>
            <span class="font-bold text-[#1A1A1A]">{{ aiQuota.used }}</span>
            <span class="text-[#1A1A1A]/40">/</span>
            <span class="font-bold text-[#1A1A1A]">{{ aiQuota.limit }}</span>
          </div>
          <div class="flex items-center gap-3 font-['JetBrains_Mono',monospace] text-xs text-[#1A1A1A]/60">
            <span>{{ t("settings.aiQuota.resetLabel") }}</span>
            <span class="font-medium">{{ formatDate(aiQuota.resetAt) }}</span>
          </div>
        </div>

        <div
          v-if="aiQuota.used >= aiQuota.limit"
          class="bg-[#FEE2E2] border-2 border-[#E63946] p-3 rounded-none font-['Noto_Serif',serif] text-sm text-[#991B1B]"
        >
          {{ t("settings.aiQuota.exhaustedNote") }}
        </div>
      </div>
    </section>

    <!-- BYOK AI PROVIDER CARD -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <Shield class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.aiProvider.title") }}
        </h2>
      </div>

      <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/70 mb-6">
        {{ t("settings.aiProvider.desc") }}
      </p>

      <!-- Mode Selection -->
      <div class="space-y-4">
        <div>
          <label
            class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2"
          >
            {{ t("settings.aiProvider.modeServer") }} / {{ t("settings.aiProvider.modeOwn") }}
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="byokMode"
                value="server"
                class="w-4 h-4 border-2 border-[#1A1A1A] accent-[#006D77] focus:ring-2 focus:ring-[#006D77]"
              />
              <span class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                {{ t("settings.aiProvider.modeServer") }}
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="byokMode"
                value="own"
                class="w-4 h-4 border-2 border-[#1A1A1A] accent-[#006D77] focus:ring-2 focus:ring-[#006D77]"
              />
              <span class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                {{ t("settings.aiProvider.modeOwn") }}
              </span>
            </label>
          </div>
        </div>

        <!-- Own Key Fields -->
        <div v-if="byokMode === 'own'" class="space-y-4 border-2 border-[#1A1A1A] p-4 bg-[#FDFFB6]/30">
          <div>
            <label
              class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
            >
              {{ t("settings.aiProvider.providerLabel") }}
            </label>
            <select
              v-model="byokProvider"
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6]"
            >
              <option value="openrouter">{{ t("settings.aiProvider.openRouter") }}</option>
              <option value="google">{{ t("settings.aiProvider.googleAiStudio") }}</option>
            </select>
          </div>

          <div>
            <label
              class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1"
            >
              {{ t("settings.aiProvider.keyLabel") }}
            </label>
            <div class="relative flex items-center">
              <input
                v-model="byokKey"
                :type="showByokKey ? 'text' : 'password'"
                maxlength="512"
                class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
                :placeholder="t('settings.aiProvider.keyPlaceholder')"
              />
              <button
                type="button"
                @click="showByokKey = !showByokKey"
                class="absolute right-3 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
              >
                <EyeOff v-if="showByokKey" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              @click="handleValidateByok"
              :disabled="isValidatingByok || !byokKey.trim() || byokStatus === 'rate_limited'"
              class="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider rounded-none hover:bg-[#DCCCFF] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isValidatingByok }" />
              {{ isValidatingByok ? t('settings.aiProvider.validating') : byokStatus === 'rate_limited' ? t('settings.aiProvider.rateLimited') : t('settings.aiProvider.validate') }}
            </button>
            <button
              @click="handleSaveByok"
              :disabled="isSavingByok || !byokKey.trim()"
              class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-2 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Save class="w-4 h-4" />
              {{ t('settings.aiProvider.save') }}
            </button>
            <button
              @click="handleDeleteByok"
              class="bg-[#FAFAF9] text-[#E63946] border-2 border-[#E63946] px-4 py-2 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider rounded-none hover:bg-[#FEE2E2] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 class="w-4 h-4" />
              {{ t('settings.aiProvider.delete') }}
            </button>
          </div>

          <!-- Status Message -->
          <div
            v-if="byokMessage"
            :class="[
              'border-2 p-3 rounded-none font-[\'Noto_Serif\',serif] text-xs',
              byokStatus === 'valid' ? 'bg-[#DCFCE7] border-[#166534] text-[#166534]' :
              byokStatus === 'invalid' ? 'bg-[#FEE2E2] border-[#E63946] text-[#991B1B]' :
              byokStatus === 'rate_limited' ? 'bg-[#FDFFB6] border-[#E63946] text-[#991B1B]' :
              'bg-[#FDFFB6] border-[#1A1A1A] text-[#1A1A1B]'
            ]"
          >
            {{ byokMessage }}
          </div>

          <!-- Key Mismatch Warning -->
          <div
            v-if="isKeyMismatch"
            class="bg-[#FDFFB6] border-2 border-[#E63946] px-3 py-2 font-['Noto_Serif',serif] text-xs text-[#991B1B]"
          >
            {{ t('settings.aiProvider.keyMismatch') }}
          </div>

          <!-- Active Badge -->
          <div
            v-if="byokStatus === 'valid'"
            class="bg-[#DCFCE7] border-2 border-[#166534] px-3 py-2 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#166534] flex items-center gap-1.5"
          >
            <Check class="w-3.5 h-3.5" />
            {{ t("settings.aiProvider.activeBadge") }}
          </div>

          <!-- Warning -->
          <p class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/70 italic border-l-2 border-[#E63946] pl-3 py-1 bg-[#FEE2E2]/30">
            {{ t("settings.aiProvider.warning") }}
          </p>
        </div>

        <!-- Server Key Note -->
        <div v-if="byokMode === 'server'" class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-4">
          <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/70">
            {{ t("settings.aiQuota.desc") }}
          </p>
          <p class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/60 mt-2">
            {{ t("settings.aiQuota.exhaustedNote") }}
          </p>
        </div>
      </div>
    </section>

    <!-- 7. APPLICATION VERSION & INFO SECTION -->
    <section
      class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]"
    >
      <div
        class="flex items-center gap-2 mb-4 border-b-2 border-[#1A1A1A]/10 pb-3"
      >
        <Info class="w-5 h-5 text-[#1A1A1A]" />
        <h2
          class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
        >
          {{ t("settings.appInfo.title") }}
        </h2>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-4 font-['JetBrains_Mono',monospace] text-xs"
      >
        <div class="border-2 border-[#1A1A1A] p-3 bg-[#FDFFB6]">
          <span
            class="block text-[10px] uppercase text-[#1A1A1A]/60 font-bold"
            >{{ t("settings.appInfo.versionLabel") }}</span
          >
          <span class="font-bold text-sm text-[#1A1A1A]"
            >v1.2.0 (Build 2026.09)</span
          >
        </div>

        <div class="border-2 border-[#1A1A1A] p-3 bg-[#FAFAF9]">
          <span
            class="block text-[10px] uppercase text-[#1A1A1A]/60 font-bold"
            >{{ t("settings.appInfo.deploymentLabel") }}</span
          >
          <span class="font-bold text-sm text-[#1A1A1A]">Tencent EdgeOne</span>
        </div>

        <div class="border-2 border-[#1A1A1A] p-3 bg-[#FAFAF9]">
          <span
            class="block text-[10px] uppercase text-[#1A1A1A]/60 font-bold"
            >{{ t("settings.appInfo.databaseLabel") }}</span
          >
          <span class="font-bold text-sm text-[#1A1A1A]"
            >Supabase PostgreSQL</span
          >
        </div>
      </div>
    </section>

    <!-- 7. FOOTER STATUS -->
    <footer class="pt-4 border-t-2 border-[#1A1A1A]/20">
      <p
        class="font-['JetBrains_Mono',monospace] text-[10px] text-[#1A1A1A]/50 uppercase tracking-wider text-center"
      >
        {{ t("settings.footerStatus") }}
      </p>
    </footer>
  </div>
</template>
