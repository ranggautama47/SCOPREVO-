<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AuthNavbar from "@/components/auth/AuthNavbar.vue";
import AuthFooter from "@/components/auth/AuthFooter.vue";

const router = useRouter();
const authStore = useAuthStore();

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
  <div class="h-screen flex flex-col bg-canvasBg overflow-hidden select-none">
    <AuthNavbar />
    
    <!-- MAIN GRID: Kunci total dengan overflow-hidden -->
    <main class="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-canvasBg">
      
      <!-- LEFT: Form Register (Padding dipresisikan agar TIDAK memicu scrollbar) -->
      <div class="flex flex-col justify-center items-center px-6 py-4 md:px-10 lg:px-16 w-full h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        <!-- Branding Block dengan Logo -->
        <div class="w-full max-w-md mx-auto mb-4 md:mb-5">
          <div class="flex items-center gap-3 justify-center md:justify-start">
            <img
              src="/asset/logo.png"
              alt="SCOPREVO Logo"
              draggable="false"
              class="w-10 h-10 object-contain select-none"
            />
            <h1 class="font-editorial text-3xl md:text-4xl font-normal leading-none tracking-tight text-[#1A1A1A]">
              SCOPREVO
            </h1>
          </div>
          <p class="font-body text-xs md:text-sm text-[#1A1A1A]/60 mt-1.5 text-center md:text-left">
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
        <div class="w-full max-w-md bg-canvasBg border-2 border-[#1A1A1A] p-5 md:p-6 shadow-[6px_6px_0px_0px_#1A1A1A] rounded-none">
          <div class="mb-4 border-b-2 border-[#1A1A1A] pb-3">
            <h2 class="font-editorial text-xl md:text-2xl">Create Account</h2>
            <p class="font-body text-xs md:text-sm mt-0.5 opacity-70">
              Start managing your revisions.
            </p>
          </div>

          <form @submit.prevent="handleRegister" class="flex flex-col gap-3">
            <div>
              <label for="name" class="block font-mono text-[11px] uppercase tracking-wider mb-1">Name</label>
              <input id="name" v-model="name" type="text" autocomplete="name" required class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-3.5 py-2.5 font-body text-sm rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40" placeholder="Your name" />
            </div>

            <div>
              <label for="email" class="block font-mono text-[11px] uppercase tracking-wider mb-1">Email</label>
              <input id="email" v-model="email" type="email" autocomplete="email" required class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-3.5 py-2.5 font-body text-sm rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40" placeholder="you@example.com" />
            </div>

            <div>
              <label for="password" class="block font-mono text-[11px] uppercase tracking-wider mb-1">Password</label>
              <div class="relative">
                <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required class="w-full bg-canvasBg border-2 border-[#1A1A1A] px-3.5 py-2.5 pr-10 font-body text-sm rounded-none outline-none focus:bg-[#FDFFB6] placeholder:text-[#1A1A1A]/40" placeholder="••••••••" />
                <button type="button" @click="showPassword = !showPassword" aria-label="Toggle password visibility" class="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 flex items-center justify-center cursor-pointer">
                  <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-[#1A1A1A] hover:text-[#006D77]">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-[#1A1A1A] hover:text-[#006D77]">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="localError || authStore.error" class="border-2 border-[#1A1A1A] bg-[#FEE2E2] text-[#991B1B] px-3 py-2 font-mono text-xs rounded-none">
              {{ localError || authStore.error }}
            </div>

            <button type="submit" :disabled="authStore.isLoading" class="w-full bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-5 py-2.5 font-ui text-xs md:text-sm font-semibold uppercase tracking-wide shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all disabled:opacity-50 rounded-none mt-1">
              {{ authStore.isLoading ? "Creating account…" : "Create Account" }}
            </button>
          </form>

          <div class="mt-4 pt-3 border-t-2 border-[#1A1A1A] text-center">
            <p class="font-body text-xs md:text-sm">
              Already have an account?
              <router-link to="/login" class="font-ui text-[#006D77] underline underline-offset-2 ml-1 font-semibold">
                Sign in
              </router-link>
            </p>
          </div>
        </div>
      </div>

      <!-- RIGHT: Polaroid Gallery (TERKUNCI PENUH overflow-hidden & h-full) -->
      <div class="hidden md:flex flex-col justify-between bg-sage border-l-2 border-[#1A1A1A] p-6 lg:p-8 relative overflow-hidden select-none h-full">
        <div class="relative z-10 space-y-1">
          <div class="font-mono text-xs uppercase tracking-widest text-[#1A1A1A]/70">
            System Capabilities // Visualizing AI Scope
          </div>
          <h2 class="font-editorial text-2xl text-[#1A1A1A]">AI Visual Workspace</h2>
          <p class="font-body text-xs text-[#1A1A1A]/60">
            Transforming messy client feedback into clear, structured revision scope.
          </p>
        </div>

        <div class="my-auto grid grid-cols-2 gap-3 lg:gap-4 relative z-10 py-2 max-w-md lg:max-w-lg mx-auto w-full">
          <!-- Frame 1 -->
          <div class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-brutal rounded-none transform -rotate-2 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 cursor-pointer relative">
            <div class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-canvasBg flex items-center justify-center">
              <img :src="IMG_1" alt="AI Filter Engine" draggable="false" class="w-full h-full object-cover select-none" @error="onImgError" />
            </div>
            <p class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold">
              AI Filter Engine
            </p>
          </div>

          <!-- Frame 2 -->
          <div class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-brutal rounded-none transform rotate-3 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 mt-2 cursor-pointer relative">
            <div class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-[#FAFAF9] flex items-center justify-center">
              <img :src="IMG_2" alt="Structured Output" draggable="false" class="w-full h-full object-contain p-0.5 select-none" @error="onImgError" />
            </div>
            <p class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold">
              Structured Output
            </p>
          </div>

          <!-- Frame 3 -->
          <div class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-brutal rounded-none transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 -mt-1 cursor-pointer relative">
            <div class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-canvasBg flex items-center justify-center">
              <img :src="IMG_3" alt="Scope Extraction" draggable="false" class="w-full h-full object-cover select-none" @error="onImgError" />
            </div>
            <p class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold">
              Scope Extraction
            </p>
          </div>

          <!-- Frame 4 -->
          <div class="bg-canvasBg border-2 border-[#1A1A1A] p-2.5 shadow-brutal rounded-none transform -rotate-3 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[8px_8px_0px_0px_#1A1A1A] hover:z-30 transition-all duration-200 cursor-pointer relative">
            <div class="w-full h-28 lg:h-36 overflow-hidden border-2 border-[#1A1A1A] bg-canvasBg flex items-center justify-center">
              <img :src="IMG_4" alt="Clear Revisions" draggable="false" class="w-full h-full object-cover select-none" @error="onImgError" />
            </div>
            <p class="font-mono text-[9px] uppercase tracking-wider text-[#1A1A1A] mt-1.5 text-center font-bold">
              Clear Revisions
            </p>
          </div>
        </div>

        <!-- Signature Badge -->
        <div class="relative z-10 flex justify-end items-center pt-2">
          <div class="inline-flex items-center gap-2 bg-[#FAFAF9] border-2 border-[#1A1A1A] px-2.5 py-1 shadow-[2px_2px_0px_0px_#1A1A1A] rounded-none">
            <img src="/asset/logo.png" alt="SCOPREVO Logo" draggable="false" class="w-4 h-4 object-contain border border-[#1A1A1A] bg-[#C9CBA3] p-0.5 rounded-none select-none" />
            <span class="font-mono text-[10px] uppercase tracking-wider text-[#1A1A1A] font-bold">
              crafted by
              <span class="text-[#006D77] underline decoration-2 underline-offset-4 decoration-[#006D77]">SCOPREVO</span>
            </span>
          </div>
        </div>
      </div>
    </main>

    <AuthFooter />
  </div>
</template>