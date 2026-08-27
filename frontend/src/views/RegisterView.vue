<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const localError = ref<string | null>(null);

async function handleRegister() {
  localError.value = null;
  if (!name.value || !email.value || !password.value) {
    localError.value = 'All fields are required.';
    return;
  }

  try {
    await authStore.register(name.value, email.value, password.value);
    router.push('/dashboard');
  } catch (err: any) {
    localError.value = err?.message || 'Registration failed.';
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-sage p-6 font-sans">
    <!-- Branding Block -->
    <div class="w-full max-w-md text-center mb-8">
      <h1 class="font-editorial text-3xl font-normal leading-none tracking-tight text-nearBlack">SCOPREVO</h1>
      <p class="font-body text-sm text-nearBlack/60 mt-1">AI-powered Scope & Revision Intelligence</p>
    </div>

    <!-- Form Card -->
    <div class="w-full max-w-md bg-canvasBg border-2 border-nearBlack p-8 shadow-[8px_8px_0px_0px_#1A1A1A] rounded-none">
      <!-- Header -->
      <div class="mb-6 border-b-2 border-nearBlack pb-4">
        <h2 class="font-editorial text-2xl">Create Account</h2>
        <p class="font-body text-sm mt-1 opacity-70">Start managing your revisions.</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
        <div>
          <label for="name" class="block font-mono text-xs uppercase tracking-wider mb-1">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            autocomplete="name"
            required
            class="w-full bg-canvasBg border-2 border-nearBlack px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-nearBlack/40"
            placeholder="Your name"
          />
        </div>

        <div>
          <label for="email" class="block font-mono text-xs uppercase tracking-wider mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full bg-canvasBg border-2 border-nearBlack px-4 py-3 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-nearBlack/40"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="password" class="block font-mono text-xs uppercase tracking-wider mb-1">Password</label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              class="w-full bg-canvasBg border-2 border-nearBlack px-4 py-3 pr-12 font-body text-base rounded-none outline-none focus:bg-[#FDFFB6] focus:outline-none placeholder:text-nearBlack/40"
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
                class="w-5 h-5 text-nearBlack hover:text-tealAccent"
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
                class="w-5 h-5 text-nearBlack hover:text-tealAccent"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Error Box - Sesuai Spec §3.2 (solid bg error) -->
        <div
          v-if="localError || authStore.error"
          class="border-2 border-nearBlack bg-[#FEE2E2] text-[#991B1B] px-4 py-3 font-mono text-xs rounded-none"
        >
          {{ localError || authStore.error }}
        </div>

        <!-- Tombol Register - Sesuai Spec §6.1 (UI Font, padding tebal) -->
        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full bg-tealAccent text-canvasBg border-2 border-nearBlack px-6 py-3 font-ui text-sm font-semibold uppercase tracking-wide shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active transition-shadow disabled:opacity-50 rounded-none"
        >
          {{ authStore.isLoading ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <!-- Footer -->
      <div class="mt-6 pt-4 border-t-2 border-nearBlack text-center">
        <p class="font-body text-sm">
          Already have an account?
          <router-link to="/login" class="font-ui text-tealAccent underline underline-offset-2 ml-1 font-semibold">
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>