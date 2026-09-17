<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { apiClient, ApiError } from "../../api/client";
import AuthNavbar from "@/components/auth/AuthNavbar.vue";
import AuthFooter from "@/components/auth/AuthFooter.vue";
import { useI18n } from "@/composables/useI18n";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const localError = ref<string | null>(null);
const showForgotPassword = ref(false);
const forgotEmail = ref("");
const forgotMessage = ref<string | null>(null);
const forgotError = ref<string | null>(null);
const isSubmittingForgot = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const resetMessage = ref<string | null>(null);
const resetError = ref<string | null>(null);
const isSubmittingReset = ref(false);
const mode = computed<"login" | "request" | "reset">(() =>
  route.name === "reset-password"
    ? "reset"
    : showForgotPassword.value
      ? "request"
      : "login",
);
const resetToken = computed(() => (route.params.token as string) ?? "");

async function handleLogin() {
  localError.value = null;
  if (!email.value || !password.value) {
    localError.value = t('auth.login.validation.emailPasswordRequired');
    return;
  }

  try {
    await authStore.login(email.value, password.value);
    router.push("/dashboard");
  } catch (err: any) {
    localError.value = err?.message || t('auth.login.validation.loginFailed');
  }
}

const IMG_1 = "/asset/login/gemini1.jpg";
const IMG_2 = "/asset/login/Qwen1.png";
const IMG_3 = "/asset/login/gemini2.jpg";
const IMG_4 = "/asset/login/Qwen2.png";

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = "none";
  const fallback = img.nextElementSibling as HTMLElement | null;
  if (fallback) fallback.style.display = "flex";
}

function toggleForgotPassword() {
  showForgotPassword.value = !showForgotPassword.value;
  forgotMessage.value = null;
  forgotError.value = null;
  if (showForgotPassword.value && email.value) forgotEmail.value = email.value;
}

async function handleForgotPassword() {
  forgotError.value = null;
  forgotMessage.value = null;
  isSubmittingForgot.value = true;
  try {
    const res = await apiClient.auth.forgotPassword({
      email: forgotEmail.value,
    });
    forgotMessage.value =
      res.deliveredVia === "console"
        ? t('auth.login.forgot.resetLinkGenerated')
        : t('auth.login.forgot.resetLinkSent', { email: forgotEmail.value });
  } catch (err: unknown) {
    forgotError.value =
      err instanceof ApiError ? err.message : t('auth.login.forgot.failedSend');
  } finally {
    isSubmittingForgot.value = false;
  }
}

async function handleResetPassword() {
  resetError.value = null;
  resetMessage.value = null;
  if (newPassword.value.length < 8) {
    resetError.value = t('auth.login.reset.passwordMinLength');
    return;
  }
  if (newPassword.value.length > 72) {
    resetError.value = t('auth.login.reset.passwordMaxLength');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    resetError.value = t('auth.login.reset.passwordsMismatch');
    return;
  }
  isSubmittingReset.value = true;
  try {
    const res = await apiClient.auth.resetPassword({
      token: resetToken.value,
      newPassword: newPassword.value,
    });
    resetMessage.value = res.message;
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (err: unknown) {
    resetError.value =
      err instanceof ApiError ? err.message : t('auth.login.reset.failedReset');
  } finally {
    isSubmittingReset.value = false;
  }
}

function backToLogin() {
  router.push("/login");
}
</script>

<template>
  <div class="h-screen flex flex-col bg-canvasBg overflow-hidden">
    <AuthNavbar />

    <!-- MAIN GRID 50-50 -->
    <main
      class="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-y-auto bg-canvasBg"
    >
      <!-- LEFT: Form Login -->
      <div
        class="flex flex-col justify-center items-center px-6 py-6 md:px-12 lg:px-20 w-full my-auto"
      >
        <!-- Branding Block with Logo (Menggantikan Mobile Collage lama) -->
        <div class="w-full max-w-md mx-auto mb-8">
          <div class="flex items-center gap-3 justify-center md:justify-start">
            <img
              src="/asset/logo.png"
              :alt="t('common.appName')"
              draggable="false"
              class="w-11 h-11 object-contain select-none"
            />
            <h1
              class="font-editorial text-4xl font-normal leading-none tracking-tight text-[#1A1A1A]"
            >
              {{ t('common.appName') }}
            </h1>
          </div>
          <p
            class="font-body text-sm text-[#1A1A1A]/60 mt-2 text-center md:text-left"
          >
            {{ t('common.tagline') }}
          </p>
        </div>
        <!-- Mobile Collage (visible only on < md) -->
        <div
          class="md:hidden w-full max-w-md mx-auto mb-6 grid grid-cols-2 gap-3 select-none"
        >
          <!-- Frame 1: Left -->
          <div
            class="bg-canvasBg border-2 border-[#1A1A1A] p-2 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transform -rotate-2"
          >
            <div
              class="w-full h-28 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-canvasBg flex items-center justify-center"
            >
              <img
                :src="IMG_1"
                :alt="t('auth.login.rightPanel.scopeControl')"
                draggable="false"
                class="w-full h-full object-cover object-center select-none"
                @error="onImgError"
              />
            </div>
            <p
              class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold mt-2"
            >
              {{ t('auth.login.rightPanel.scopeControl') }}
            </p>
          </div>
          <!-- Frame 2: Right (PORTRAIT SAFE) -->
          <div
            class="bg-canvasBg border-2 border-[#1A1A1A] p-2 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transform rotate-2 mt-3"
          >
            <div
              class="w-full h-28 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-[#FAFAF9] flex items-center justify-center"
            >
              <img
                :src="IMG_2"
                :alt="t('auth.login.rightPanel.projectVault')"
                draggable="false"
                class="w-full h-full object-contain p-0.5 select-none"
                @error="onImgError"
              />
            </div>
            <p
              class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold mt-2"
            >
              {{ t('auth.login.rightPanel.projectVault') }}
            </p>
          </div>
        </div>

        <!-- Form Card -->
        <div
          class="w-full max-w-md bg-canvasBg border-2 border-[#1A1A1A] p-6 md:p-8 shadow-[8px_8px_0px_0px_#1A1A1A] rounded-none"
        >
          <div class="mb-6 border-b-2 border-[#1A1A1A] pb-4">
            <h2 class="font-editorial text-2xl">
              {{
                mode === "login"
                  ? t('auth.login.title')
                  : mode === "request"
                    ? t('auth.login.forgotPassword')
                    : t('auth.login.resetPassword')
              }}
            </h2>
            <p class="font-body text-sm mt-1 opacity-70">
              {{
                mode === "login"
                  ? t('auth.login.description')
                  : mode === "request"
                    ? t('auth.login.descriptionRequest')
                    : t('auth.login.descriptionReset')
              }}
            </p>
          </div>

          <!-- Form Login -->
          <form
            v-if="mode === 'login'"
            @submit.prevent="handleLogin"
            class="flex flex-col gap-4"
          >
            <div>
              <label
                for="email"
                class="block font-mono text-xs uppercase tracking-wider mb-1"
                >{{ t('auth.login.emailLabel') }}</label
              >
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
                :placeholder="t('auth.login.emailPlaceholder')"
              />
            </div>

            <div>
              <label
                for="password"
                class="block font-mono text-xs uppercase tracking-wider mb-1"
                >{{ t('auth.login.passwordLabel') }}</label
              >
              <div class="relative">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 pr-12 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
                  :placeholder="t('auth.login.passwordPlaceholder')"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  :aria-label="t('auth.login.togglePassword')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 flex items-center justify-center cursor-pointer"
                >
                  <svg
                    v-if="!showPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="w-5 h-5 text-[#1A1A1A] hover:text-[#006D77]"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="w-5 h-5 text-[#1A1A1A] hover:text-[#006D77]"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path
                      d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
                    />
                    <path
                      d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
                    />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-if="localError || authStore.error"
              class="border-2 border-[#1A1A1A] bg-[#FEE2E2] text-[#991B1B] px-4 py-3 font-mono text-xs rounded-none"
            >
              {{ localError || authStore.error }}
            </div>

            <button
              type="submit"
              :disabled="authStore.isLoading"
              class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 rounded-none"
            >
              {{ authStore.isLoading ? t('auth.login.signingIn') : t('auth.login.signIn') }}
            </button>
          </form>

          <!-- Form Forgot / Reset -->
          <form
            v-else-if="mode === 'request'"
            @submit.prevent="handleForgotPassword"
            class="flex flex-col gap-4"
          >
            <div>
              <label
                for="forgotEmail"
                class="block font-mono text-xs uppercase tracking-wider mb-1"
                >{{ t('auth.login.emailLabel') }}</label
              >
              <input
                id="forgotEmail"
                v-model="forgotEmail"
                type="email"
                required
                class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6]"
                :placeholder="t('auth.login.emailPlaceholder')"
              />
            </div>
            <div
              v-if="forgotError"
              class="border-2 border-[#1A1A1A] bg-[#FEE2E2] text-[#991B1B] px-4 py-3 font-mono text-xs rounded-none"
            >
              {{ forgotError }}
            </div>
            <div
              v-if="forgotMessage"
              class="border-2 border-[#1A1A1A] bg-[#DCFCE7] text-[#166534] px-4 py-3 font-mono text-xs rounded-none"
            >
              {{ forgotMessage }}
            </div>
            <button
              type="submit"
              :disabled="isSubmittingForgot"
              class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-50 rounded-none"
            >
              {{ isSubmittingForgot ? t('auth.login.sending') : t('auth.login.sendResetLink') }}
            </button>
            <button
              type="button"
              @click="toggleForgotPassword"
              class="font-body text-sm text-[#1A1A1A]/70 cursor-pointer hover:underline"
            >
              {{ t('auth.login.backToSignIn') }}
            </button>
          </form>

          <form
            v-else
            @submit.prevent="handleResetPassword"
            class="flex flex-col gap-4"
          >
            <div>
              <label
                for="newPassword"
                class="block font-mono text-xs uppercase tracking-wider mb-1"
                >{{ t('auth.login.newPasswordLabel') }}</label
              >
              <input
                id="newPassword"
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                required
                class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6]"
                :placeholder="t('auth.login.newPasswordPlaceholder')"
              />
            </div>
            <div>
              <label
                for="confirmPassword"
                class="block font-mono text-xs uppercase tracking-wider mb-1"
                >{{ t('auth.login.confirmPasswordLabel') }}</label
              >
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6]"
                :placeholder="t('auth.login.confirmPasswordPlaceholder')"
              />
            </div>
            <div
              v-if="resetError"
              class="border-2 border-[#1A1A1A] bg-[#FEE2E2] text-[#991B1B] px-4 py-3 font-mono text-xs rounded-none"
            >
              {{ resetError }}
            </div>
            <div
              v-if="resetMessage"
              class="border-2 border-[#1A1A1A] bg-[#DCFCE7] text-[#166534] px-4 py-3 font-mono text-xs rounded-none"
            >
              {{ resetMessage }}
              <button
                type="button"
                @click="backToLogin"
                class="underline font-semibold"
              >
                {{ t('auth.login.signInNow') }}
              </button>
            </div>
            <button
              type="submit"
              :disabled="isSubmittingReset"
              class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-brutal transition-all disabled:opacity-50 rounded-none"
            >
              {{ isSubmittingReset ? t('auth.login.resetting') : t('auth.login.setNewPassword') }}
            </button>
            <button
              type="button"
              @click="backToLogin"
              class="font-body text-sm text-[#1A1A1A]/70 cursor-pointer hover:underline"
            >
              {{ t('auth.login.backToSignIn') }}
            </button>
          </form>

          <!-- Links bawah card -->
          <div
            class="mt-6 pt-4 border-t-2 border-[#1A1A1A] text-center space-y-2"
          >
            <p v-if="mode === 'login'" class="font-body text-sm">
              <button
                type="button"
                @click="toggleForgotPassword"
                class="font-ui text-[#006D77] underline underline-offset-4 decoration-2 font-semibold cursor-pointer hover:text-[#004d54]"
              >
                {{ t('auth.login.forgotPasswordLink') }}
              </button>
            </p>
            <p class="font-body text-sm">
              {{ t('auth.login.noAccount') }}
              <router-link
                to="/register"
                class="font-ui text-[#006D77] underline underline-offset-2 ml-1 font-semibold"
              >
                {{ t('auth.login.register') }}
              </router-link>
            </p>
          </div>
        </div>
      </div>

      <!-- RIGHT: Polaroid Gallery -->
      <div
        class="hidden md:flex flex-col justify-between bg-sage border-l-2 border-[#1A1A1A] p-6 lg:p-8 relative overflow-hidden select-none h-full"
      >
        <div class="relative z-10 space-y-1">
          <div
            class="font-mono text-xs uppercase tracking-widest text-[#1A1A1A]/70"
          >
            {{ t('auth.login.rightPanel.systemAccess') }}
          </div>
          <h2 class="font-editorial text-2xl text-[#1A1A1A]">{{ t('auth.login.rightPanel.welcomeBack') }}</h2>
          <p class="font-body text-xs text-[#1A1A1A]/60">
            {{ t('auth.login.rightPanel.secureWorkspace') }}
          </p>
        </div>

        <!-- Collage Grid (Hover:scale-105 dikembalikan) -->
        <div
          class="my-auto grid grid-cols-2 gap-3 lg:gap-4 relative z-10 py-2 max-w-md lg:max-w-lg mx-auto w-full"
        >
          <div
            class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 -mt-2 cursor-pointer relative"
          >
            <div
              class="w-full h-38 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-canvasBg flex items-center justify-center"
            >
              <img
                :src="IMG_1"
                :alt="t('auth.login.rightPanel.scopeControl')"
                draggable="false"
                class="w-full h-full object-cover select-none"
                @error="onImgError"
              />
            </div>
            <div
              class="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold"
            >
              {{ t('auth.login.rightPanel.scopeControl') }}
            </div>
          </div>

          <div
            class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 -mt-2 cursor-pointer relative"
          >
            <div
              class="w-full h-38 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-[#FAFAF9] flex items-center justify-center"
            >
              <img
                :src="IMG_2"
                :alt="t('auth.login.rightPanel.projectVault')"
                draggable="false"
                class="w-full h-full object-contain p-0.5 select-none"
                @error="onImgError"
              />
            </div>
            <div
              class="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold"
            >
              {{ t('auth.login.rightPanel.projectVault') }}
            </div>
          </div>

          <div
            class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 -mt-2 cursor-pointer relative"
          >
            <div
              class="w-full h-48 lg:h-46 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-canvasBg flex items-center justify-center"
            >
              <img
                :src="IMG_3"
                :alt="t('auth.login.rightPanel.intelligenceCore')"
                draggable="false"
                class="w-full h-full object-cover select-none"
                @error="onImgError"
              />
            </div>
            <div
              class="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold"
            >
              {{ t('auth.login.rightPanel.intelligenceCore') }}
            </div>
          </div>

          <div
            class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 -mt-2 cursor-pointer relative"
          >
            <div
              class="w-full h-48 lg:h-46 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-canvasBg flex items-center justify-center"
            >
              <img
                :src="IMG_4"
                :alt="t('auth.login.rightPanel.scopeInspector')"
                draggable="false"
                class="w-full h-full object-cover select-none"
                @error="onImgError"
              />
            </div>
            <div
              class="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold"
            >
              {{ t('auth.login.rightPanel.scopeInspector') }}
            </div>
          </div>
        </div>

        <!-- Signature Badge -->
        <div class="relative z-10 flex justify-end items-center pt-2">
          <div
            class="inline-flex items-center gap-2 bg-[#FAFAF9] border-2 border-[#1A1A1A] px-2.5 py-1 shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none"
          >
            <img
              src="/asset/logo.png"
              :alt="t('common.appName')"
              draggable="false"
              class="w-4 h-4 object-contain border border-[#1A1A1A] bg-[#C9CBA3] p-0.5 rounded-none select-none"
            />
            <span
              class="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A] font-bold"
            >
              {{ t('auth.login.rightPanel.craftedBy') }}
              <span class="text-[#006D77] underline decoration-2 underline-offset-4 decoration-[#006D77]">
                {{ t('common.appName') }}
              </span>
            </span>
          </div>
        </div>
      </div>
    </main>

    <AuthFooter />
  </div>
</template>