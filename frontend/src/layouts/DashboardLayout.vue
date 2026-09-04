<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import {
  LayoutDashboard,
  FolderKanban,
  History,
  Settings,
  LogOut,
} from "lucide-vue-next";

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
  router.push("/login");
}

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "History", path: "/history", icon: History },
  { name: "Settings", path: "/settings", icon: Settings },
];

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + "/");
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
      <!-- Logo / Brand Header -->
      <div class="p-5 border-b-2 border-nearBlack">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Brand Logo -->
            <img
              src="/asset/logo.png"
              alt="SCOPREVO Logo"
              class="w-10 h-10 object-contain border-2 border-nearBlack bg-white p-1 rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] select-none"
              draggable="false"
            />
            <div>
              <h1
                class="font-editorial text-2xl font-normal leading-none text-nearBlack tracking-tight"
              >
                SCOPREVO
              </h1>
              <p
                class="font-mono text-[10px] uppercase tracking-wider mt-1 text-nearBlack/70"
              >
                B2B Workspace
              </p>
            </div>
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

      <!-- User Profile Row & Danger Logout Button -->
      <div
        class="px-5 py-3 border-b-2 border-nearBlack bg-nearBlack/5 flex items-center justify-between"
      >
        <div v-if="authStore.account" class="overflow-hidden pr-2">
          <p class="font-mono text-[9px] uppercase tracking-wider opacity-60">
            User
          </p>
          <p class="font-sans text-xs font-semibold truncate text-nearBlack">
            {{ authStore.account.name }}
          </p>
        </div>
        <!-- Button Logout Merah Brutalist (Compact Danger Button) -->
        <button
          @click="logout"
          title="Logout"
          class="bg-[#E63946] text-white border border-nearBlack p-1.5 rounded-none shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <LogOut class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Navigation Items (Clean Hover without Border Clashes) -->
      <nav class="flex-1 p-4 flex flex-col gap-1.5">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          @click="closeDrawer"
          :class="[
            'px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-3 rounded-none border-2',
            isActive(item.path)
              ? 'bg-nearBlack text-sage border-nearBlack shadow-[2px_2px_0px_0px_#1A1A1A]'
              : 'bg-transparent text-nearBlack border-transparent hover:text-nearBlack hover:underline hover:decoration-lavender hover:decoration-2 underline-offset-4',
          ]"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Primary CTA at bottom (+ NEW PROJECT) -->
      <div class="p-4  bg-sage">
        <router-link
          to="/projects"
          class="w-full block bg-[#006D77] text-[#FAFAF9] border-2 border-[#1A1A1A] px-4 py-3 font-ui text-xs uppercase font-semibold tracking-wider shadow-[4px_4px_0px_0px_#1A1A1A] rounded-none text-center transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
        >
          + NEW PROJECT
        </router-link>
      </div>
    </aside>

    <!-- Main Canvas -->
    <main class="flex-1 min-h-screen bg-canvasBg overflow-x-hidden">
      <router-view />
    </main>
  </div>
</template>
