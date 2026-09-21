<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AuthNavbar from "@/components/auth/AuthNavbar.vue";
import AuthFooter from "@/components/auth/AuthFooter.vue";
import { useI18n } from "@/composables/useI18n";

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const IMG_1 = "/asset/register/register1.png";
const IMG_2 = "/asset/register/register3.jpg";
const IMG_3 = "/asset/register/register4.jpg";
const IMG_4 = "/asset/register/register2.png";

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = "none";
  const fallback = img.nextElementSibling as HTMLElement | null;
  if (fallback) fallback.style.display = "flex";
}

const name = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const localError = ref<string | null>(null);

async function handleRegister() {
  localError.value = null;
  if (!name.value || !email.value || !password.value) {
    localError.value = t("auth.register.allFieldsRequired");
    return;
  }

  try {
    await authStore.register(name.value, email.value, password.value);
    router.push("/dashboard");
  } catch (err: any) {
    localError.value = err?.message || t("auth.register.registrationFailed");
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-canvasBg overflow-hidden select-none">
    <AuthNavbar />

    <!-- MAIN GRID: Kunci total dengan overflow-hidden -->
    <main
      class="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-canvasBg"
    >
      <!-- LEFT: Form Register (Padding dipresisikan agar TIDAK memicu scrollbar horizontal/vertical bug) -->
      <div
        class="flex flex-col items-center px-6 py-10 md:py-16 md:px-10 lg:px-16 w-full h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <!-- Inner wrapper dengan my-auto: di tengah saat layar besar, scroll aman saat layar kecil -->
        <div class="w-full max-w-md my-auto">
          <!-- Branding Block dengan Logo -->
          <div class="w-full max-w-md mx-auto mb-4 md:mb-5">
            <div
              class="flex items-center gap-3 justify-center md:justify-start"
            >
              <img
                src="/asset/logo.png"
                :alt="t('common.appName')"
                draggable="false"
                class="w-14 h-14 object-contain select-none"
              />
              <h1
                class="font-editorial text-3xl md:text-4xl font-normal leading-none tracking-tight text-[#1A1A1A]"
              >
                {{ t("common.appName") }}
              </h1>
            </div>
            <p
              class="font-body text-xs md:text-sm text-[#1A1A1A]/60 mt-1.5 text-center md:text-left"
            >
              {{ t("common.tagline") }}
            </p>
          </div>

          <!-- Mobile Collage (visible only on < md) -->
          <div
            class="md:hidden w-full mx-auto mb-8 grid grid-cols-2 gap-3 select-none"
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
                  :alt="t('auth.register.collage.aiFilterEngine')"
                  draggable="false"
                  class="w-full h-full object-cover object-center select-none"
                  @error="onImgError"
                />
              </div>
              <p
                class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold mt-2"
              >
                {{ t("auth.register.collage.aiFilterEngine") }}
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
                  :alt="t('auth.register.collage.structuredOutput')"
                  draggable="false"
                  class="w-full h-full object-contain p-0.5 select-none"
                  @error="onImgError"
                />
              </div>
              <p
                class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold mt-2"
              >
                {{ t("auth.register.collage.structuredOutput") }}
              </p>
            </div>
          </div>

          <!-- Form Card Terkoreksi (p-8, gap-5, shadow brutalist murni 4px) -->
          <div
            class="w-full bg-canvasBg border-2 border-[#1A1A1A] p-6 md:p-8 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none"
          >
            <div class="mb-6 border-b-2 border-[#1A1A1A] pb-4">
              <h2 class="font-editorial text-2xl md:text-3xl">
                {{ t("auth.register.title") }}
              </h2>
              <p class="font-body text-sm mt-1 opacity-70">
                {{ t("auth.register.description") }}
              </p>
            </div>

            <form @submit.prevent="handleRegister" class="flex flex-col gap-5">
              <div>
                <label
                  for="name"
                  class="block font-mono text-[11px] uppercase tracking-wider mb-1.5"
                  >{{ t("auth.register.nameLabel") }}</label
                >
                <input
                  id="name"
                  v-model="name"
                  type="text"
                  autocomplete="name"
                  required
                  class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-sm rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
                  :placeholder="t('auth.register.namePlaceholder')"
                />
              </div>

              <div>
                <label
                  for="email"
                  class="block font-mono text-[11px] uppercase tracking-wider mb-1.5"
                  >{{ t("auth.register.emailLabel") }}</label
                >
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-sm rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
                  :placeholder="t('auth.register.emailPlaceholder')"
                />
              </div>

              <div>
                <label
                  for="password"
                  class="block font-mono text-[11px] uppercase tracking-wider mb-1.5"
                  >{{ t("auth.register.passwordLabel") }}</label
                >
                <div class="relative">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    required
                    class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 pr-10 font-body text-sm rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40"
                    :placeholder="t('auth.register.passwordPlaceholder')"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    :aria-label="t('auth.register.togglePassword')"
                    class="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 flex items-center justify-center cursor-pointer"
                  >
                    <svg
                      v-if="!showPassword"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="w-4 h-4 text-[#1A1A1A] hover:text-[#006D77]"
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
                      class="w-4 h-4 text-[#1A1A1A] hover:text-[#006D77]"
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
                class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-5 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 rounded-none mt-2"
              >
                {{
                  authStore.isLoading
                    ? t("auth.register.creating")
                    : t("auth.register.createAccount")
                }}
              </button>
            </form>

            <div class="mt-6 pt-4 border-t-2 border-[#1A1A1A] text-center">
              <p class="font-body text-sm">
                {{ t("auth.register.alreadyHaveAccount") }}
                <router-link
                  to="/login"
                  class="font-ui text-[#006D77] underline underline-offset-2 ml-1 font-semibold"
                >
                  {{ t("auth.register.signIn") }}
                </router-link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Polaroid Gallery (Pembungkus luar TERKUNCI PERMANEN overflow-hidden & h-full) -->
      <div
        class="hidden md:flex flex-col justify-between bg-sage border-l-2 border-[#1A1A1A] relative overflow-hidden select-none h-full"
      >
        <!-- Inner Scroll Area (Bisa di-scroll ke bawah saat layar laptop sempit, scrollbar tersembunyi rapi) -->
        <div
          class="flex-1 flex flex-col justify-between p-6 lg:p-8 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <!-- Header Info -->
          <div class="relative z-10 space-y-1 mb-4 shrink-0">
            <div
              class="font-mono text-xs uppercase tracking-widest text-[#1A1A1A]/70"
            >
              {{ t("auth.register.rightPanel.systemAccess") }}
            </div>
            <h2 class="font-editorial text-2xl text-[#1A1A1A]">
              {{ t("auth.register.rightPanel.welcomeBack") }}
            </h2>
            <p class="font-body text-xs text-[#1A1A1A]/60">
              {{ t("auth.register.rightPanel.secureWorkspace") }}
            </p>
          </div>

          <!-- Inner Grid Gallery: Ukuran gambar KEMBALI NORMAL (h-28 lg:h-36) -->
          <div
            class="my-auto grid grid-cols-2 gap-3 lg:gap-4 relative z-10 py-2 max-w-md lg:max-w-lg mx-auto w-full"
          >
            <!-- Frame 1 -->
            <div
              class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transform -rotate-2 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 cursor-pointer relative"
            >
              <div
                class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-canvasBg flex items-center justify-center"
              >
                <img
                  :src="IMG_1"
                  :alt="t('auth.register.collage.aiFilterEngine')"
                  draggable="false"
                  class="w-full h-full object-cover select-none"
                  @error="onImgError"
                />
              </div>
              <p
                class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold"
              >
                {{ t("auth.register.collage.aiFilterEngine") }}
              </p>
            </div>

            <!-- Frame 2 -->
            <div
              class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transform rotate-3 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 mt-2 cursor-pointer relative"
            >
              <div
                class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-[#FAFAF9] flex items-center justify-center"
              >
                <img
                  :src="IMG_2"
                  :alt="t('auth.register.collage.structuredOutput')"
                  draggable="false"
                  class="w-full h-full object-contain p-0.5 select-none"
                  @error="onImgError"
                />
              </div>
              <p
                class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold"
              >
                {{ t("auth.register.collage.structuredOutput") }}
              </p>
            </div>

            <!-- Frame 3 -->
            <div
              class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 -mt-1 cursor-pointer relative"
            >
              <div
                class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-canvasBg flex items-center justify-center"
              >
                <img
                  :src="IMG_3"
                  :alt="t('auth.register.collage.scopeExtraction')"
                  draggable="false"
                  class="w-full h-full object-cover select-none"
                  @error="onImgError"
                />
              </div>
              <p
                class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold"
              >
                {{ t("auth.register.collage.scopeExtraction") }}
              </p>
            </div>

            <!-- Frame 4 -->
            <div
              class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none transform -rotate-3 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 cursor-pointer relative"
            >
              <div
                class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-canvasBg flex items-center justify-center"
              >
                <img
                  :src="IMG_4"
                  :alt="t('auth.register.collage.clearRevisions')"
                  draggable="false"
                  class="w-full h-full object-cover select-none"
                  @error="onImgError"
                />
              </div>
              <p
                class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold"
              >
                {{ t("auth.register.collage.clearRevisions") }}
              </p>
            </div>
          </div>

          <!-- Signature Badge (Dipastikan di dasar area scroll dan tidak terpotong) -->
          <div
            class="relative z-10 flex justify-end items-center pt-4 shrink-0"
          >
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
                {{ t("auth.register.rightPanel.craftedBy") }}
                <span
                  class="text-[#006D77] underline decoration-2 underline-offset-4 decoration-[#006D77]"
                >
                  {{ t("common.appName") }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AuthFooter />
  </div>
</template>
