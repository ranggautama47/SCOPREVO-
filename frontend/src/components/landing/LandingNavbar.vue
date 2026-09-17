<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-16 bg-[#FAFAF9] border-b-2 border-[#1A1A1A] flex items-center px-4 md:px-8"
  >
    <div
      class="flex items-center justify-between w-full max-w-[1200px] mx-auto"
    >
      <!-- Logo -->
      <router-link
        to="/"
        class="flex items-center gap-2.5 no-underline"
        :aria-label="t('landing.nav.ariaHome')"
      >
        <img
          src="/asset/logo.png"
          alt="SCOPREVO icon"
          width="32"
          height="32"
          class="border-2 border-[#1A1A1A] bg-[#C9CBA3] p-0.5"
          draggable="false"
        />
        <span
          class="font-['Baskervville',serif] text-2xl tracking-tight text-[#1A1A1A]"
          >SCOPREVO</span
        >
      </router-link>

      <!-- Center Nav Links (desktop) -->
      <div class="hidden md:flex items-center gap-8">
        <a
          href="#how-it-works"
          class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-4 transition-all"
          >{{ t('landing.nav.howItWorks') }}</a
        >
        <a
          href="#why-scoprevo"
          class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-4 transition-all"
          >{{ t('landing.nav.whyScoprevo') }}</a
        >
        <a
          href="#tech-stack"
          class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-4 transition-all"
          >{{ t('landing.nav.techStack') }}</a
        >
      </div>

      <!-- Right CTAs (desktop) -->
      <div class="hidden md:flex items-center gap-3">
        <!-- Locale Toggle (desktop) -->
        <div
          role="group"
          :aria-label="t('landing.nav.languageGroup')"
          class="hidden md:flex items-center border-2 border-[#1A1A1A] rounded-none overflow-hidden"
        >
          <button
            v-for="loc in (['id', 'en'] as const)"
            :key="loc"
            type="button"
            :aria-pressed="prefs.locale === loc"
            @click="prefs.setLocale(loc)"
            class="px-2.5 py-2 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider border-r-2 border-[#1A1A1A] last:border-r-0 transition-colors cursor-pointer"
            :class="prefs.locale === loc
              ? 'bg-[#1A1A1A] text-[#FAFAF9]'
              : 'bg-[#FAFAF9] text-[#1A1A1A] hover:bg-[#FDFFB6]'"
          >
            {{ loc }}
          </button>
        </div>

        <!-- TAMPILAN JIKA SUDAH LOGIN -->
        <template v-if="authStore.isAuthenticated">
          <router-link
            to="/dashboard"
            class="font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wider px-5 py-2 border-2 border-[#1A1A1A] bg-[#006D77] text-[#FAFAF9] shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all focus:ring-2 focus:ring-[#006D77] focus:outline-none"
          >
            {{ t('landing.nav.dashboard') }}
          </router-link>
        </template>

        <!-- TAMPILAN JIKA BELUM LOGIN -->
        <template v-else>
          <router-link
            to="/login"
            class="font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wider px-5 py-2 border-2 border-[#1A1A1A] bg-transparent text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF9] transition-colors focus:ring-2 focus:ring-[#006D77] focus:outline-none"
          >
            {{ t('landing.nav.signIn') }}
          </router-link>
          <router-link
            to="/register"
            class="font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wider px-5 py-2 border-2 border-[#1A1A1A] bg-[#006D77] text-[#FAFAF9] shadow-[4px_4px_0px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] transition-all focus:ring-2 focus:ring-[#006D77] focus:outline-none"
          >
            {{ t('landing.nav.getStarted') }}
          </router-link>
        </template>
      </div>

      <!-- Mobile hamburger -->
      <button
        @click="menuOpen = !menuOpen"
        class="md:hidden p-2 border-2 border-[#1A1A1A] bg-[#FAFAF9] focus:ring-2 focus:ring-[#006D77] focus:outline-none"
        :aria-label="menuOpen ? t('landing.nav.menuClose') : t('landing.nav.menuOpen')"
        :aria-expanded="menuOpen"
      >
        <X v-if="menuOpen" :size="20" :stroke-width="2" />
        <Menu v-else :size="20" :stroke-width="2" />
      </button>
    </div>

    <!-- Mobile slide-in menu -->
    <Transition name="slide-down">
      <div
        v-if="menuOpen"
        class="absolute top-16 left-0 right-0 bg-[#FAFAF9] border-b-2 border-[#1A1A1A] flex flex-col p-6 gap-5 md:hidden shadow-[0_4px_0px_0px_#1A1A1A]"
      >
        <!-- Locale Toggle (mobile) - FIRST row inside menu panel -->
        <div
          role="group"
          :aria-label="t('landing.nav.languageGroup')"
          class="flex items-center border-2 border-[#1A1A1A] rounded-none overflow-hidden"
        >
          <button
            v-for="loc in (['id', 'en'] as const)"
            :key="loc"
            type="button"
            :aria-pressed="prefs.locale === loc"
            @click="prefs.setLocale(loc)"
            class="px-3 py-3 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider border-r-2 border-[#1A1A1A] last:border-r-0 transition-colors cursor-pointer"
            :class="prefs.locale === loc
              ? 'bg-[#1A1A1A] text-[#FAFAF9]'
              : 'bg-[#FAFAF9] text-[#1A1A1A] hover:bg-[#FDFFB6]'"
          >
            {{ loc }}
          </button>
        </div>

        <a
          href="#how-it-works"
          @click="menuOpen = false"
          class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] uppercase tracking-wider hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-4"
          >{{ t('landing.nav.howItWorks') }}</a
        >
        <a
          href="#why-scoprevo"
          @click="menuOpen = false"
          class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] uppercase tracking-wider hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-4"
          >{{ t('landing.nav.whyScoprevo') }}</a
        >
        <a
          href="#tech-stack"
          @click="menuOpen = false"
          class="font-['Inter',sans-serif] text-sm font-medium text-[#1A1A1A] uppercase tracking-wider hover:underline hover:decoration-[#DCCCFF] hover:decoration-2 underline-offset-4"
          >{{ t('landing.nav.techStack') }}</a
        >
        <hr class="border-[#1A1A1A] border" />

        <!-- MOBILE: JIKA SUDAH LOGIN -->
        <template v-if="authStore.isAuthenticated">
          <router-link
            to="/dashboard"
            @click="menuOpen = false"
            class="font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wider px-5 py-2.5 border-2 border-[#1A1A1A] bg-[#006D77] text-[#FAFAF9] text-center shadow-[4px_4px_0px_0px_#1A1A1A]"
          >
            {{ t('landing.nav.dashboard') }}
          </router-link>
        </template>

        <!-- MOBILE: JIKA BELUM LOGIN -->
        <template v-else>
          <router-link
            to="/login"
            @click="menuOpen = false"
            class="font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wider px-5 py-2.5 border-2 border-[#1A1A1A] text-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF9] transition-colors"
          >
            {{ t('landing.nav.signIn') }}
          </router-link>
          <router-link
            to="/register"
            @click="menuOpen = false"
            class="font-['Inter',sans-serif] text-sm font-semibold uppercase tracking-wider px-5 py-2.5 border-2 border-[#1A1A1A] bg-[#006D77] text-[#FAFAF9] text-center shadow-[4px_4px_0px_0px_#1A1A1A]"
          >
            {{ t('landing.nav.getStarted') }}
          </router-link>
        </template>
      </div>
    </Transition>
  </nav>
  <!-- Spacer for fixed navbar -->
  <div class="h-16"></div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Menu, X } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { usePreferencesStore } from "@/stores/preferences";
import { useI18n } from "@/composables/useI18n";

const menuOpen = ref(false);
const authStore = useAuthStore();
const prefs = usePreferencesStore();
const { t } = useI18n();
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
