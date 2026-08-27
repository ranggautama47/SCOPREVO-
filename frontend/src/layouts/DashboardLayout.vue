<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isDrawerOpen = ref(false);

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value;
}

function closeDrawer() {
  isDrawerOpen.value = false;
}

function logout() {
  authStore.logout();
  router.push('/login');
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Projects', path: '/projects' },
];

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}
</script>

<template>
  <div class="min-h-screen flex bg-canvasBg text-nearBlack font-sans">
    <!-- Mobile Menu Button -->
    <button
      v-if="!isDrawerOpen"
      @click="toggleDrawer"
      class="md:hidden fixed top-4 left-4 z-30 bg-sage border-2 border-nearBlack px-3 py-2 font-mono text-sm"
      aria-label="Open menu"
    >
      ☰ MENU
    </button>

    <!-- Backdrop for mobile drawer -->
    <div
      v-if="isDrawerOpen"
      @click="closeDrawer"
      class="md:hidden fixed inset-0 bg-nearBlack bg-opacity-40 z-40"
    ></div>

    <!-- Sidebar / Drawer -->
    <aside
      :class="[
        'fixed md:sticky top-0 left-0 h-screen w-60 bg-sage border-r-2 border-nearBlack flex flex-col z-50 transition-transform',
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <!-- Logo / Brand -->
      <div class="p-6 border-b-2 border-nearBlack">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-editorial text-2xl font-semibold leading-none">SCOPREVO</h1>
            <p class="font-mono text-xs mt-1">B2B Workspace</p>
          </div>
          <button
            v-if="isDrawerOpen"
            @click="closeDrawer"
            class="md:hidden font-mono text-xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 flex flex-col gap-2">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          @click="closeDrawer"
          :class="[
            'px-4 py-3 font-mono text-sm uppercase tracking-wider border-2 transition-all',
            isActive(item.path)
              ? 'bg-nearBlack text-sage border-nearBlack'
              : 'bg-transparent text-nearBlack border-transparent hover:border-lavender hover:underline decoration-lavender underline-offset-4',
          ]"
        >
          {{ item.name }}
        </router-link>
      </nav>

      <!-- User / Logout -->
      <div class="p-4 border-t-2 border-nearBlack">
        <div v-if="authStore.account" class="mb-3">
          <p class="font-mono text-xs uppercase opacity-60">Logged in as</p>
          <p class="font-sans text-sm font-medium truncate">{{ authStore.account.name }}</p>
        </div>
        <button
          @click="logout"
          class="w-full bg-dangerRed text-canvasBg border-2 border-nearBlack px-3 py-2 font-mono text-xs uppercase shadow-brutal hover:shadow-brutal-hover active:shadow-brutal-active transition-shadow"
        >
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Canvas -->
    <main class="flex-1 min-h-screen bg-canvasBg overflow-x-hidden">
      <router-view />
    </main>
  </div>
</template>
