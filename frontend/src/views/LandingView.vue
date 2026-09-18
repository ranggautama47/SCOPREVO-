<template>
  <div class="landing-page bg-[#FAFAF9] min-h-screen overflow-x-hidden">
    <LandingNavbar />
    <main>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <ScopeIntelligenceSection />
      <ProductProofSection />
      <TechnicalCredibilitySection />
      <FinalCtaSection />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import LandingNavbar from '@/components/landing/LandingNavbar.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import ProblemSection from '@/components/landing/ProblemSection.vue'
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue'
import ScopeIntelligenceSection from '@/components/landing/ScopeIntelligenceSection.vue'
import ProductProofSection from '@/components/landing/ProductProofSection.vue'
import TechnicalCredibilitySection from '@/components/landing/TechnicalCredibilitySection.vue'
import FinalCtaSection from '@/components/landing/FinalCtaSection.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
</script>
