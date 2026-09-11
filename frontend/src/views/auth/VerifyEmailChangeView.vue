<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient, ApiError } from "../../api/client";
import { useAuthStore } from "../../stores/auth";
import { Check, X } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const status = ref<"pending" | "success" | "error">("pending");
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  const token = route.params.token as string;
  if (!token) { status.value = "error"; errorMessage.value = "No verification token provided."; return; }
  try {
    await apiClient.auth.verifyEmailChange(token);
    authStore.logout();
    status.value = "success";
  } catch (err: unknown) {
    status.value = "error";
    errorMessage.value = err instanceof ApiError ? err.message : "An unexpected error occurred while verifying your email change.";
  }
});

function goToLogin() { router.push("/login"); }
</script>

<template>
  <div class="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6"><div class="max-w-md w-full">
    <div v-if="status === 'pending'" class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center"><h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">Verifying...</h1><p class="font-body text-sm text-[#1A1A1A]/60">Please wait while we verify your new email address.</p></div>
    <div v-else-if="status === 'success'" class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center"><div class="mb-4 flex justify-center"><div class="w-16 h-16 bg-[#DCFCE7] border-2 border-[#1A1A1A] rounded-none flex items-center justify-center"><Check class="w-8 h-8 text-[#166534]" /></div></div><h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">Email Changed Successfully</h1><p class="font-body text-sm text-[#1A1A1A]/60 mb-6">Your email address has been updated. Please log in again with your new email address.</p><button @click="goToLogin" class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer">GO TO LOGIN</button></div>
    <div v-else class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center"><div class="mb-4 flex justify-center"><div class="w-16 h-16 bg-[#FEE2E2] border-2 border-[#1A1A1A] rounded-none flex items-center justify-center"><X class="w-8 h-8 text-[#991B1B]" /></div></div><h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">Verification Failed</h1><p v-if="errorMessage" class="font-body text-sm text-[#991B1B] mb-6">{{ errorMessage }}</p><button @click="goToLogin" class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer">BACK TO LOGIN</button></div>
  </div></div>
</template>
