<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import { apiClient, ApiError } from "../../api/client";
import { networkState } from "../../services/resilience/network-state";
import AppTopbar from "../../components/features/AppTopbar.vue";
import {
  Eye,
  EyeOff,
  Save,
  KeyRound,
  User,
  Sliders,
  Check,
  Mail,
  Info
} from "lucide-vue-next";

const authStore = useAuthStore();

const isMutationsDisabled = computed(() =>
  ['OFFLINE', 'BACKEND_DEGRADED'].includes(networkState.value.status),
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

const defaultQuota = ref<number>(3);
const quotaSaved = ref(false);

const isEmailVerified = computed(
  () => authStore.account?.emailVerified === true,
);

function loadDefaultQuota() {
  const stored = localStorage.getItem(DEFAULT_QUOTA_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed > 0) {
      defaultQuota.value = parsed;
    }
  }
}

onMounted(() => {
  loadDefaultQuota();
  authStore.refreshAccount();
});

async function handleSendVerification() {
  if (isMutationsDisabled.value) {
    verificationMessage.value = "Tidak dapat mengirim email verifikasi saat offline / sistem terdegradasi.";
    return;
  }
  verificationMessage.value = null;
  isSendingVerification.value = true;
  try {
    const res = await apiClient.auth.sendVerification();
    if (res.deliveredVia === "console") {
      verificationMessage.value =
        "Link verifikasi dibuat (mode pengujian backend). Periksa log konsol.";
    } else {
      verificationMessage.value =
        "Email verifikasi telah dikirim. Silakan periksa inbox Anda.";
    }
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      verificationMessage.value = err.message;
    } else {
      verificationMessage.value = "Gagal mengirim email verifikasi.";
    }
  } finally {
    isSendingVerification.value = false;
  }
}

function validatePasswordForm(): string | null {
  if (passwordForm.value.newPassword.length < 8) {
    return "Kata sandi baru minimal 8 karakter.";
  }
  if (passwordForm.value.newPassword.length > 72) {
    return "Kata sandi baru maksimal 72 karakter.";
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    return "Konfirmasi kata sandi baru tidak cocok.";
  }
  return null;
}

async function handleChangePassword() {
  if (isMutationsDisabled.value) {
    passwordError.value = "Tidak dapat mengubah kata sandi saat offline / sistem terdegradasi.";
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
    passwordSuccess.value = "Kata sandi berhasil diperbarui.";
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      passwordError.value = err.message;
    } else {
      passwordError.value = "Gagal memperbarui kata sandi.";
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
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10 space-y-8 bg-[#FAFAF9] min-h-screen">
    <!-- 1. HEADER NAV (Seragam dengan ProjectsView) -->
    <div class="flex items-center justify-between mb-6">
      <nav aria-label="Breadcrumb">
        <router-link
          to="/dashboard"
          class="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:underline decoration-[#DCCCFF] decoration-2 underline-offset-4 transition-all"
        >
          WORKSPACE
        </router-link>
        <span class="font-mono text-xs text-[#1A1A1A]/30">/</span>
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
          SETTINGS
        </span>
      </nav>
      <AppTopbar />
    </div>

    <!-- 2. JUDUL HALAMAN -->
    <div class="border-b-2 border-[#1A1A1A] pb-6">
      <h1 class="font-['Baskervville',serif] text-4xl text-[#1A1A1A] mb-2">
        Workspace Settings
      </h1>
      <p class="font-['Noto_Serif',serif] text-sm text-[#1A1A1A]/70">
        Configure account profile, security, and default quota limits for the new project.
      </p>
    </div>

    <!-- 3. PROFILE CARD -->
    <section class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
      <div class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3">
        <User class="w-5 h-5 text-[#1A1A1A]" />
        <h2 class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
          Profile Information
        </h2>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">
            Full Name
          </label>
          <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2.5 font-['Noto_Serif',serif] text-sm text-[#1A1A1A]">
            {{ authStore.account?.name || "—" }}
          </div>
        </div>

        <div>
          <label class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">
            Email Address
          </label>
          <div class="bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2.5 font-['Noto_Serif',serif] text-sm text-[#1A1A1A]">
            {{ authStore.account?.email || "—" }}
          </div>
        </div>

        <div>
          <label class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">
            Email Verification Status
          </label>
          <div class="flex flex-wrap items-center gap-3">
            <span
              v-if="isEmailVerified"
              class="bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] px-3 py-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5"
            >
              <Check class="w-3.5 h-3.5" />
              EMAIL VERIFIED
            </span>
            <span
              v-else
              class="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-3 py-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider rounded-none"
            >
              UNVERIFIED
            </span>

            <button
              v-if="!isEmailVerified"
              @click="handleSendVerification"
              :disabled="isSendingVerification"
              class="bg-[#FDFFB6] text-[#1A1A1A] border-2 border-[#1A1A1A] px-3 py-1 font-['Inter',sans-serif] text-[10px] font-bold uppercase tracking-wider rounded-none hover:bg-[#DCCCFF] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Mail class="w-3.5 h-3.5" />
              {{ isSendingVerification ? "SENDING..." : "SEND VERIFICATION EMAIL" }}
            </button>
          </div>
          <p v-if="verificationMessage" class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/80 mt-2 bg-[#FDFFB6]/50 border border-[#1A1A1A] p-2">
            {{ verificationMessage }}
          </p>
        </div>
      </div>
    </section>

    <!-- 4. CHANGE PASSWORD CARD -->
    <section class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
      <div class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3">
        <KeyRound class="w-5 h-5 text-[#1A1A1A]" />
        <h2 class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
          Change Password
        </h2>
      </div>

      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <label class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">
            Current Password
          </label>
          <div class="relative flex items-center">
            <input
              v-model="passwordForm.currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              required
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6]"
              placeholder="Masukkan kata sandi saat ini..."
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
          <label class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">
            New Password (min 8 characters)
          </label>
          <div class="relative flex items-center">
            <input
              v-model="passwordForm.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              required
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6]"
              placeholder="Masukkan kata sandi baru..."
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
          <label class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">
            Confirm New Password
          </label>
          <div class="relative flex items-center">
            <input
              v-model="passwordForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              class="w-full bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 pr-10 font-['Noto_Serif',serif] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6]"
              placeholder="Konfirmasi kata sandi baru..."
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

        <div v-if="passwordError" class="bg-[#FEE2E2] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-xs text-[#991B1B]">
          {{ passwordError }}
        </div>
        <div v-if="passwordSuccess" class="bg-[#DCFCE7] border-2 border-[#1A1A1A] px-3 py-2 font-['Noto_Serif',serif] text-xs text-[#166534] flex items-center gap-1.5">
          <Check class="w-4 h-4" />
          {{ passwordSuccess }}
        </div>

        <button
          type="submit"
          :disabled="isSubmittingPassword"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-2.5 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 cursor-pointer"
        >
          {{ isSubmittingPassword ? "UPDATING..." : "UPDATE PASSWORD" }}
        </button>
      </form>
    </section>

    <!-- 5. WORKSPACE DEFAULTS CARD -->
    <section class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
      <div class="flex items-center gap-2 mb-6 border-b-2 border-[#1A1A1A]/10 pb-3">
        <Sliders class="w-5 h-5 text-[#1A1A1A]" />
        <h2 class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
          Workspace Defaults
        </h2>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1">
            Total Allowed Revisions (Default)
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="defaultQuota"
              type="number"
              min="1"
              max="100"
              class="bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-2 font-['JetBrains_Mono',monospace] text-sm text-[#1A1A1A] rounded-none focus:outline-none focus:bg-[#FDFFB6] w-32"
            />
            <span class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/60">revisi per proyek</span>
          </div>
        </div>

        <p class="font-['Noto_Serif',serif] text-xs text-[#1A1A1A]/70 italic border-l-2 border-[#006D77] pl-3 py-1 bg-[#006D77]/5">
          Local preference only — nilai ini otomatis mengisi opsi
          <strong class="font-mono text-[#1A1A1A]">TOTAL ALLOWED REVISIONS</strong>
          saat membuat proyek baru.
        </p>

        <div class="flex items-center gap-3 pt-2">
          <button
            @click="saveDefaultQuota"
            class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-2.5 font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all cursor-pointer flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            SAVE PREFERENCE
          </button>
          <span
            v-if="quotaSaved"
            class="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#166534] bg-[#DCFCE7] border border-[#1A1A1A] px-2 py-1 flex items-center gap-1"
          >
            <Check class="w-3.5 h-3.5" />
            Saved!
          </span>
        </div>
      </div>
    </section>

    <!-- 6. APPLICATION VERSION & INFO SECTION -->
    <section class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
      <div class="flex items-center gap-2 mb-4 border-b-2 border-[#1A1A1A]/10 pb-3">
        <Info class="w-5 h-5 text-[#1A1A1A]" />
        <h2 class="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
          Application Version & Info
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-['JetBrains_Mono',monospace] text-xs">
        <div class="border-2 border-[#1A1A1A] p-3 bg-[#FDFFB6]">
          <span class="block text-[10px] uppercase text-[#1A1A1A]/60 font-bold">APP VERSION</span>
          <span class="font-bold text-sm text-[#1A1A1A]">v1.1.0 (Build 2026.09)</span>
        </div>

        <div class="border-2 border-[#1A1A1A] p-3 bg-[#FAFAF9]">
          <span class="block text-[10px] uppercase text-[#1A1A1A]/60 font-bold">DEPLOYMENT ENGINE</span>
          <span class="font-bold text-sm text-[#1A1A1A]">Tencent EdgeOne</span>
        </div>

        <div class="border-2 border-[#1A1A1A] p-3 bg-[#FAFAF9]">
          <span class="block text-[10px] uppercase text-[#1A1A1A]/60 font-bold">DATABASE SYSTEM</span>
          <span class="font-bold text-sm text-[#1A1A1A]">Supabase PostgreSQL</span>
        </div>
      </div>
    </section>

    <!-- 7. FOOTER STATUS -->
    <footer class="pt-4 border-t-2 border-[#1A1A1A]/20">
      <p class="font-['JetBrains_Mono',monospace] text-[10px] text-[#1A1A1A]/50 uppercase tracking-wider text-center">
        SCOPREVO • EdgeOne Cloud Functions • Supabase Postgres • v1.1.0 | OPERATIONAL
      </p>
    </footer>
  </div>
</template>