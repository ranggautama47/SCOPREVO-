<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

function handleAction() {
  if (authStore.isAuthenticated) {
    router.push('/dashboard');
  } else {
    router.push('/login');
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvasBg flex items-center justify-center p-4">
    <div
      class="max-w-[480px] w-full bg-canvasBg border-2 border-nearBlack rounded-none p-6 md:p-8 shadow-brutal text-center"
    >
      <h1 class="font-mono text-5xl text-nearBlack mb-2">404</h1>
      <h2 class="font-editorial text-2xl text-nearBlack mb-3">Page not found</h2>
      <p class="font-body text-sm text-nearBlack/60 mb-8">
        The page you are looking for does not exist or has been moved.
      </p>

      <button
        type="button"
        @click="handleAction"
        class="bg-tealAccent text-canvasBg border-2 border-nearBlack px-6 py-3 font-ui text-sm uppercase font-semibold tracking-wide shadow-brutal rounded-none transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-active cursor-pointer"
      >
        {{ authStore.isAuthenticated ? 'BACK TO DASHBOARD' : 'GO TO LOGIN' }}
      </button>
    </div>
  </div>
</template>
