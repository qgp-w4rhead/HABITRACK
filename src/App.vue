<template>
  <ion-app>
    <ion-router-outlet />
    <UsernameModal :open="needsUsername" />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useProfile } from '@/composables/useProfile'
import UsernameModal from '@/components/UsernameModal.vue'

const { needsUsername } = useProfile()
</script>

<style>
ion-app {
  --ion-background-color: var(--neu-bg);
  --ion-text-color: var(--neu-text);
  --ion-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

ion-content {
  --background: var(--neu-bg);
}
</style>
