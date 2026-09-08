<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient, ApiError } from "../../api/client";

const route = useRoute();
const router = useRouter();

const status = ref<"pending" | "success" | "error">("pending");
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  const token = route.params.token as string;
  if (!token) {
    status.value = "error";
    errorMessage.value = "No verification token provided.";
    return;
  }

  try {
    await apiClient.auth.verifyEmail(token);
    status.value = "success";
  } catch (err: unknown) {
    status.value = "error";
    if (err instanceof ApiError) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = "An unexpected error occurred while verifying your email.";
    }
  }
});

function goToDashboard() {
  router.push("/dashboard");
}

function goToLogin() {
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
    <div class="max-w-md w-full">
      <div v-if="status === 'pending'" class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center">
        <h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">Verifying...</h1>
        <p class="font-body text-sm text-[#1A1A1A]/60">Please wait while we verify your email address.</p>
      </div>

      <div
        v-else-if="status === 'success'"
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center"
      >
        <div class="mb-4 inline-block bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
          SUCCESS
        </div>
        <h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">Email Verified Successfully</h1>
        <p class="font-body text-sm text-[#1A1A1A]/60 mb-6">Your email address has been verified. You can now continue using all SCOPREVO features.</p>
        <button
          @click="goToDashboard"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer"
        >
          GO TO DASHBOARD
        </button>
      </div>

      <div
        v-else
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center"
      >
        <div class="mb-4 inline-block bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
          ERROR
        </div>
        <h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">Invalid or Expired Link</h1>
        <p v-if="errorMessage" class="font-body text-sm text-[#991B1B] mb-6">{{ errorMessage }}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            @click="goToLogin"
            class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer"
          >
            GO TO LOGIN
          </button>
          <button
            @click="goToDashboard"
            class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer"
          >
            GO TO DASHBOARD
          </button>
        </div>
      </div>
    </div>
  </div>
</template>