<template>
  <v-app>
    <v-app-bar app v-if="!isMobile" class="glass-bar" elevation="0">
      <v-toolbar-title
        class="font-weight-bold text-primary"
        style="font-size: 1.4rem"
      >
        <img
          src="/assets/logo.png"
          height="40"
          class="mr-3"
          style="vertical-align: middle; border-radius: 8px"
        />
        Cyclotouristes Landernéens
      </v-toolbar-title>

      <v-btn to="/" exact variant="text" class="mx-1 nav-btn"
        >Bibliothèque des circuits</v-btn
      >
      <v-btn to="/planning" variant="text" class="mx-1 nav-btn">Planning</v-btn>

      <v-spacer></v-spacer>

      <v-btn
        v-if="isAdmin"
        @click="openTrombi"
        variant="tonal"
        color="secondary"
        class="mx-1"
      >
        Trombinoscope
      </v-btn>
      <v-btn
        v-if="isAdmin"
        @click="synchronize"
        variant="tonal"
        color="primary"
        class="mx-1"
      >
        <v-icon start>mdi-refresh</v-icon> Sync Strava
      </v-btn>
      <v-btn
        v-if="isAdmin"
        @click="synchronizeAll"
        :loading="syncingAll"
        variant="tonal"
        color="success"
        class="mx-1"
      >
        <v-icon start>mdi-cloud-sync</v-icon> Tout Synchroniser
      </v-btn>

    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>

    <!-- Snackbar equivalent for messages -->
    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn color="pink" variant="text" @click="snackbar.show = false"
          >Fermer</v-btn
        >
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { RoutesService } from "@/services/routes.service";

const route = useRoute();

const isAdmin = true; //computed(() => route.query.isAdmin === "true");
const isMobile = computed(() => window.location.href.indexOf("mobile") > 0);

const snackbar = ref({
  show: false,
  text: "",
  timeout: 3000,
});

const syncingAll = ref(false);

function showMessage(text: string) {
  snackbar.value.text = text;
  snackbar.value.show = true;
}

function openTrombi() {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  window.open(`${API_URL}/api2/getTrombinoscope?write=true`, "_blank");
}

async function synchronize() {
  showMessage("Synchronisation en cours...");
  try {
    const r = await RoutesService.synchronizeRoutes();
    if (r) {
      showMessage("Synchronisation terminée, vous pouvez recharger la page");
    } else {
      showMessage(
        "Une erreur est survenue durant la synchronisation, veuillez rééessayer plus tard...",
      );
    }
  } catch (e) {
    showMessage("Erreur de réseau lors de la synchronisation.");
  }
}

async function synchronizeAll() {
  syncingAll.value = true;
  showMessage("Mise à jour globale depuis Google Drive en cours...");
  try {
    const resExcel = await RoutesService.synchronizeExcelRoutes();
    console.log("Excel sync result:", resExcel);

    await RoutesService.updateLanderneauData();
    console.log("Planning sync completed");

    showMessage("Synchronisation globale terminée !");

    // Si on est sur la page des circuits, on voudrait idéalement rafraîchir la liste,
    // mais le rechargement de la page fonctionnera aussi, ou on peut juste laisser
    // l'utilisateur naviguer.
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (e) {
    console.error(e);
    showMessage("Erreur lors de la synchronisation globale.");
  } finally {
    syncingAll.value = false;
  }
}

</script>

<style>
.glass-bar {
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-btn {
  font-weight: 600 !important;
  color: var(--color-text) !important;
  transition: all 0.3s ease;
}
.nav-btn:hover {
  color: #e63946 !important;
  background: rgba(230, 57, 70, 0.08);
}
</style>
