<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card width="400" elevation="10" rounded="xl">
      <v-card-title class="text-center text-h5 pt-6 pb-2">Authentification</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="password"
            label="Mot de passe"
            type="password"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock"
            class="mt-4"
            :error-messages="errorMsg"
          ></v-text-field>

          <v-btn
            type="submit"
            color="primary"
            block
            class="mt-6 text-none"
            size="large"
            elevation="2"
          >
            Se connecter
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const password = ref('');
const errorMsg = ref('');
const router = useRouter();
const route = useRoute();

function handleLogin() {
  errorMsg.value = '';
  // VITE_ADMIN_PASSWORD is set in the .env file
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';
  
  if (password.value === adminPassword) {
    localStorage.setItem('isAuthenticated', 'true');
    // Dispatch an event so App.vue can update reactivity if needed
    window.dispatchEvent(new Event('auth-changed'));
    
    // Redirect to requested page or home
    const redirect = route.query.redirect as string || '/';
    router.push(redirect);
  } else {
    errorMsg.value = 'Mot de passe incorrect';
  }
}
</script>

<style scoped>
</style>
