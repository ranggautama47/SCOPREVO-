<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient, ApiError } from "../../api/client";
import { useI18n } from "@/composables/useI18n";
import { trackEvent } from "@/services/analytics";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const status = ref<"pending" | "success" | "error">("pending");
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  const token = route.params.token as string;
  if (!token) {
    status.value = "error";
    errorMessage.value = t('auth.verify.noToken');
    return;
  }

  try {
    await apiClient.auth.verifyEmail(token);
    trackEvent("verify_email");
    status.value = "success";
  } catch (err: unknown) {
    status.value = "error";
    if (err instanceof ApiError) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = t('auth.verify.unexpectedError');
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
        <h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">{{ t('auth.verify.verifying') }}</h1>
        <p class="font-body text-sm text-[#1A1A1A]/60">{{ t('auth.verify.pleaseWait') }}</p>
      </div>

      <div
        v-else-if="status === 'success'"
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center"
      >
        <div class="mb-4 inline-block bg-[#DCFCE7] text-[#166534] border-2 border-[#1A1A1A] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
          {{ t('auth.verify.success.badge') }}
        </div>
        <h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">{{ t('auth.verify.success.title') }}</h1>
        <p class="font-body text-sm text-[#1A1A1A]/60 mb-6">{{ t('auth.verify.success.description') }}</p>
        <button
          @click="goToDashboard"
          class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer"
        >
          {{ t('auth.verify.success.goToDashboard') }}
        </button>
      </div>

      <div
        v-else
        class="bg-[#FAFAF9] border-2 border-[#1A1A1A] p-8 shadow-[4px_4px_0px_0px_#1A1A1A] text-center"
      >
        <div class="mb-4 inline-block bg-[#FEE2E2] text-[#991B1B] border-2 border-[#1A1A1A] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
          {{ t('auth.verify.error.badge') }}
        </div>
        <h1 class="font-editorial text-3xl text-[#1A1A1A] mb-3">{{ t('auth.verify.error.title') }}</h1>
        <p v-if="errorMessage" class="font-body text-sm text-[#991B1B] mb-6">{{ errorMessage }}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            @click="goToLogin"
            class="bg-[#FAFAF9] text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer"
          >
            {{ t('auth.verify.error.goToLogin') }}
          </button>
          <button
            @click="goToDashboard"
            class="bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-6 py-3 font-ui text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all duration-100 ease-out cursor-pointer"
          >
            {{ t('auth.verify.success.goToDashboard') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
