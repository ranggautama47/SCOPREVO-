<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// Polaroid collage image sources (served from public/ — bound to avoid Vite static import resolution)
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
    localError.value = "All fields are required.";
    return;
  }

  try {
    await authStore.register(name.value, email.value, password.value);
    router.push("/dashboard");
  } catch (err: any) {
    localError.value = err?.message || "Registration failed.";
  }
}
</script>

<template>
  <div class="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-canvasBg">
    <!-- LEFT HEMISPHERE: Auth Form -->
    <div
      class="flex flex-col justify-center items-center px-6 py-12 md:px-12 lg:px-20 overflow-y-auto min-h-screen"
    >
      <!-- Branding Block with Logo -->
      <div class="w-full max-w-md mb-8">
        <div class="flex items-center gap-3 justify-center md:justify-start">
          <!-- Logo tanpa border, tanpa background, tanpa padding -->
          <img
            src="/asset/logo.png"
            alt="SCOPREVO Logo"
            draggable="false"
            class="w-11 h-11 object-contain select-none"
          />
          <h1
            class="font-editorial text-4xl font-normal leading-none tracking-tight text-[#1A1A1A]"
          >
            SCOPREVO
          </h1>
        </div>
        <p
          class="font-body text-sm text-[#1A1A1A]/60 mt-2 text-center md:text-left"
        >
          AI-powered Scope & Revision Intelligence
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
              alt="AI Filter Engine"
              draggable="false"
              class="w-full h-full object-cover object-center select-none"
              @error="onImgError"
            />
          </div>
          <p
            class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold mt-2"
          >
            AI FILTER ENGINE
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
              alt="Structured Output"
              draggable="false"
              class="w-full h-full object-contain p-0.5 select-none"
              @error="onImgError"
            />
          </div>
          <p
            class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] text-center font-bold mt-2"
          >
            STRUCTURED OUTPUT
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <div
        class="w-full max-w-md bg-canvasBg border-2 border-[#1A1A1A] p-8 shadow-[8px_8px_0px_0px_#1A1A1A] rounded-none"
      >
        <!-- Header -->
        <div class="mb-6 border-b-2 border-[#1A1A1A] pb-4">
          <h2 class="font-editorial text-2xl">Create Account</h2>
          <p class="font-body text-sm mt-1 opacity-70">
            Start managing your revisions.
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
          <div>
            <label
              for="name"
              class="block font-mono text-xs uppercase tracking-wider mb-1"
              >Name</label
            >
            <input
              id="name"
              v-model="name"
              type="text"
              autocomplete="name"
              required
              class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              for="email"
              class="block font-mono text-xs uppercase tracking-wider mb-1"
              >Email</label
            >
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              for="password"
              class="block font-mono text-xs uppercase tracking-wider mb-1"
              >Password</label
            >
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-4 py-3 pr-12 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-[#1A1A1A]/40"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                aria-label="Toggle password visibility"
                class="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 flex items-center justify-center cursor-pointer"
              >
                <!-- Eye Open Icon -->
                <svg
                  v-if="!showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-5 h-5 text-[#1A1A1A] hover:text-[#006D77]"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <!-- Eye Off Icon -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
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

          <!-- Error Box -->
          <div
            v-if="localError || authStore.error"
            class="border-2 border-[#1A1A1A] bg-[#FEE2E2] text-[#991B1B] px-4 py-3 font-mono text-xs rounded-none"
          >
            {{ localError || authStore.error }}
          </div>

          <!-- Tombol Register -->
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active transition-shadow disabled:opacity-50 rounded-none"
          >
            {{ authStore.isLoading ? "Creating account…" : "Create Account" }}
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t-2 border-[#1A1A1A] text-center">
          <p class="font-body text-sm">
            Already have an account?
            <router-link
              to="/login"
              class="font-ui text-[#006D77] underline underline-offset-2 ml-1 font-semibold"
            >
              Sign in
            </router-link>
          </p>
        </div>
      </div>
    </div>

    <!-- RIGHT HEMISPHERE: Gallery49 Polaroid Collage -->
    <div
      class="hidden md:flex flex-col justify-between bg-sage border-l-2 border-[#1A1A1A] p-8 lg:p-12 relative overflow-hidden min-h-screen select-none"
    >
      <!-- Header Block -->
      <div class="relative z-10 space-y-1">
        <div
          class="font-mono text-xs uppercase tracking-widest text-[#1A1A1A]/70"
        >
          System Capabilities // Visualizing AI Scope
        </div>
        <h2 class="font-editorial text-2xl text-[#1A1A1A]">
          AI Visual Workspace
        </h2>
        <p class="font-body text-xs text-[#1A1A1A]/60">
          Transforming messy client feedback into clear, structured revision
          scope.
        </p>
      </div>

      <!-- Gallery49 Polaroid Collage Grid -->
      <div
        class="my-auto grid grid-cols-2 gap-4 lg:gap-6 relative z-10 py-6 max-w-lg mx-auto w-full"
      >
        <!-- Frame 1: Top Left - Gemini Scope Filter -->
        <div
          class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform -rotate-2 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 cursor-pointer relative"
        >
          <div
            class="w-full h-40 lg:h-48 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-canvasBg flex items-center justify-center"
          >
            <img
              :src="IMG_1"
              alt="AI Filter Engine"
              draggable="false"
              class="w-full h-full object-cover object-center select-none"
              @error="onImgError"
            />
            <div
              class="w-full h-full bg-canvasBg flex items-center justify-center font-mono text-xs text-[#1A1A1A]/60 text-center p-2"
              style="display: none"
            >
              AI Filter Engine
            </div>
          </div>
          <p
            class="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A] mt-2 text-center font-bold"
          >
            AI Filter Engine
          </p>
        </div>

        <!-- Frame 2: Top Right - Qwen Organized Cards (FIXED UNTUK GAMBAR PORTRAIT REGISTER3) -->
        <div
          class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform rotate-3 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 mt-4 cursor-pointer relative"
        >
          <div
            class="w-full h-40 lg:h-48 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-[#FAFAF9] flex items-center justify-center"
          >
            <img
              :src="IMG_2"
              alt="Structured Output"
              draggable="false"
              class="w-full h-full object-contain p-0.5 select-none"
              @error="onImgError"
            />
            <div
              class="w-full h-full bg-canvasBg flex items-center justify-center font-mono text-xs text-[#1A1A1A]/60 text-center p-2"
              style="display: none"
            >
              Structured Output
            </div>
          </div>
          <p
            class="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A] mt-2 text-center font-bold"
          >
            Structured Output
          </p>
        </div>

        <!-- Frame 3: Bottom Left - Qwen Funnel -->
        <div
          class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 -mt-2 cursor-pointer relative"
        >
          <div
            class="w-full h-40 lg:h-48 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-canvasBg flex items-center justify-center"
          >
            <img
              :src="IMG_3"
              alt="Scope Extraction"
              draggable="false"
              class="w-full h-full object-cover object-center select-none"
              @error="onImgError"
            />
            <div
              class="w-full h-full bg-canvasBg flex items-center justify-center font-mono text-xs text-[#1A1A1A]/60 text-center p-2"
              style="display: none"
            >
              Scope Extraction
            </div>
          </div>
          <p
            class="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A] mt-2 text-center font-bold"
          >
            Scope Extraction
          </p>
        </div>

        <!-- Frame 4: Bottom Right - Gemini Items Checklist -->
        <div
          class="bg-canvasBg border-2 border-[#1A1A1A] p-3 shadow-brutal rounded-none transform -rotate-3 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 cursor-pointer relative"
        >
          <div
            class="w-full h-40 lg:h-48 overflow-hidden border-2 border-[#1A1A1A] rounded-none bg-canvasBg flex items-center justify-center"
          >
            <img
              :src="IMG_4"
              alt="Clear Revisions"
              draggable="false"
              class="w-full h-full object-cover object-center select-none"
              @error="onImgError"
            />
            <div
              class="w-full h-full bg-canvasBg flex items-center justify-center font-mono text-xs text-[#1A1A1A]/60 text-center p-2"
              style="display: none"
            >
              Clear Revisions
            </div>
          </div>
          <p
            class="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A] mt-2 text-center font-bold"
          >
            Clear Revisions
          </p>
        </div>
      </div>

      <!-- Signature Footer Upgrade (Avatar Logo + Brutalist Badge) -->
      <div class="relative z-10 flex justify-end items-center">
        <div
          class="inline-flex items-center gap-2.5 bg-[#FAFAF9] border-2 border-[#1A1A1A] px-3 py-1.5 shadow-[3px_3px_0px_0px_#1A1A1A] rounded-none"
        >
          <!-- Avatar Logo (Non-draggable) -->
          <img
            src="/asset/logo.png"
            alt="SCOPREVO Logo"
            draggable="false"
            class="w-5 h-5 object-contain border border-[#1A1A1A] bg-[#C9CBA3] p-0.5 rounded-none select-none"
          />
          <!-- Text dengan Highlight Teal Underline/Text -->
          <span
            class="font-mono text-[11px] uppercase tracking-wider text-[#1A1A1A] font-bold"
          >
            crafted by
            <span
              class="text-[#006D77] underline decoration-2 underline-offset-4 decoration-[#006D77]"
            >
              SCOPREVO
            </span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
