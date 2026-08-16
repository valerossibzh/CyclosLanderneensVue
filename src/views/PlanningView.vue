<template>
  <v-container fluid>
    <v-row class="mb-6 flex-column align-center">
      <div
        class="d-flex align-center w-100 justify-space-between mb-3 px-md-12"
        style="max-width: 800px"
      >
        <div class="text-center">
          <v-btn icon @click="prevMonth" variant="text"
            ><v-icon size="x-large">mdi-chevron-left</v-icon></v-btn
          >
          <div
            class="text-caption text-grey font-weight-medium mt-n1 text-uppercase"
          >
            {{ prevMonthName }}
          </div>
        </div>

        <h2 class="text-center text-capitalize mb-0 text-h4 font-weight-bold">
          {{ currentMonthName }} {{ currentYear }}
        </h2>

        <div class="text-center">
          <v-btn icon @click="nextMonth" variant="text"
            ><v-icon size="x-large">mdi-chevron-right</v-icon></v-btn
          >
          <div
            class="text-caption text-grey font-weight-medium mt-n1 text-uppercase"
          >
            {{ nextMonthName }}
          </div>
        </div>
      </div>

      <div class="d-flex flex-wrap justify-center" style="gap: 16px">
        <v-btn
          v-if="days.length > 0"
          color="success"
          variant="tonal"
          prepend-icon="mdi-content-save-all"
          size="large"
          @click="saveMonth"
        >
          Sauvegarder le mois
        </v-btn>
        <v-btn
          v-if="days.length > 0"
          color="error"
          variant="tonal"
          prepend-icon="mdi-restore"
          size="large"
          @click="showOverwriteDialog = true"
        >
          Importer l'année précédente
        </v-btn>
        <v-btn
          v-if="days.length > 0"
          color="info"
          variant="tonal"
          prepend-icon="mdi-google-drive"
          size="large"
          :loading="loadingDrive"
          @click="openPreviousYearDrive"
        >
          Ouvrir Drive {{ currentYear - 1 }}
        </v-btn>
      </div>
    </v-row>

    <v-row v-if="loading">
      <v-col class="text-center">
        <v-progress-circular indeterminate color="red"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else-if="days.length === 0">
      <v-col class="text-center">
        <v-alert type="info" variant="tonal" class="mb-4">
          Aucun planning défini pour ce mois.
        </v-alert>
        <v-btn
          color="primary"
          prepend-icon="mdi-content-copy"
          @click="duplicatePlanning"
          class="mx-2"
        >
          Dupliquer depuis {{ currentYear - 1 }}
        </v-btn>
        <v-btn
          color="info"
          prepend-icon="mdi-google-drive"
          :loading="loadingDrive"
          @click="openPreviousYearDrive"
          class="mx-2"
        >
          Ouvrir Drive {{ currentYear - 1 }}
        </v-btn>
        <v-btn
          color="secondary"
          prepend-icon="mdi-plus"
          @click="addEmptyDay"
          class="mx-2"
        >
          Ajouter une date manuellement
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-card color="blue-grey-lighten-5">
          <v-tabs v-model="activeTab" bg-color="secondary" hide-slider class="pt-2 px-2">
            <v-tab
              v-for="(day, index) in days"
              :key="index"
              :value="index"
              selected-class="planning-tab-selected"
              class="planning-tab"
              :class="{
                'has-warning': day.is_missing || getDayAnomalies(day, index).length > 0,
              }"
            >
              <v-icon start v-if="day.is_missing" color="warning"
                >mdi-alert</v-icon
              >
              {{ formatDate(day.date) }}
              <v-icon
                v-if="getDayAnomalies(day, index).length > 0"
                end
                color="warning"
                >mdi-alert</v-icon
              >
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <v-window-item
              v-for="(day, index) in days"
              :key="index"
              :value="index"
            >
              <v-container fluid>
                <v-alert
                  v-if="day.is_missing"
                  color="warning"
                  class="mb-4 text-black"
                >
                  <template v-slot:prepend>
                    <v-icon color="black">mdi-alert</v-icon>
                  </template>
                  <strong> Journée manquante :</strong> Ce jour (mercredi,
                  dimanche ou jour férié) n'existait pas l'an dernier. Pensez à
                  compléter ses circuits et à sauvegarder.
                </v-alert>
                <v-alert
                  v-for="(anomaly, aIdx) in getDayAnomalies(day, index)"
                  :key="'anom-' + aIdx"
                  color="warning"
                  class="mb-4 border-warning border-opacity-100 text-black"
                  style="border-width: 2px"
                >
                  <template v-slot:prepend>
                    <v-icon color="black">mdi-alert</v-icon>
                  </template>
                  <strong> Attention :</strong> {{ anomaly }}
                </v-alert>
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex align-center justify-space-between mb-4">
                      <div style="flex: 1">
                        <!-- Left space intentionally left empty to balance the flex -->
                      </div>
                      <div
                        class="d-flex align-center justify-center"
                        style="flex: 1"
                      >
                        <v-btn
                          icon="mdi-chevron-left"
                          size="small"
                          variant="text"
                          @click="activeTab--"
                          :disabled="index === 0"
                        ></v-btn>
                        <v-menu
                          v-model="day._menuOpen"
                          :close-on-content-click="false"
                        >
                          <template v-slot:activator="{ props }">
                            <v-text-field
                              v-bind="props"
                              :model-value="formatDateLong(day.date)"
                              readonly
                              density="compact"
                              hide-details
                              variant="outlined"
                              class="mx-2 flex-grow-0"
                              style="width: 350px"
                              prepend-inner-icon="mdi-calendar"
                              @click:clear="day.date = ''"
                            ></v-text-field>
                          </template>
                          <v-date-picker
                            color="primary"
                            :model-value="new Date(day.date)"
                            :min="minDate"
                            :max="maxDate"
                            @update:model-value="
                              (val) => updateDayDate(day, val)
                            "
                          ></v-date-picker>
                        </v-menu>
                        <v-btn
                          icon="mdi-chevron-right"
                          size="small"
                          variant="text"
                          @click="activeTab++"
                          :disabled="index === days.length - 1"
                        ></v-btn>
                      </div>
                      <div
                        class="text-right d-flex justify-end align-center"
                        style="flex: 1; gap: 8px"
                      >
                        <v-btn
                          color="primary"
                          variant="tonal"
                          size="small"
                          @click="addGroup(day)"
                        >
                          <v-icon start>mdi-account-multiple-plus</v-icon>
                          Ajouter un groupe
                        </v-btn>
                        <v-btn
                          color="secondary"
                          variant="tonal"
                          size="small"
                          @click="addEmptyDay"
                        >
                          <v-icon start>mdi-calendar-plus</v-icon>
                          Ajouter un jour
                        </v-btn>
                        <v-btn
                          color="warning"
                          variant="tonal"
                          size="small"
                          @click="resetDay(day)"
                        >
                          <v-icon start>mdi-restore</v-icon>
                          Réinitialiser
                        </v-btn>
                        <v-btn
                          color="error"
                          variant="tonal"
                          size="small"
                          @click="deleteDay(day, index)"
                        >
                          <v-icon start>mdi-delete</v-icon>
                          Supprimer
                        </v-btn>
                      </div>
                    </div>
                    <v-textarea
                      v-model="day.observations"
                      label="Observations de la journée"
                      rows="1"
                      auto-grow
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="mb-4"
                    ></v-textarea>
                  </v-col>
                </v-row>

                <v-row
                  v-if="day.routes && day.routes.length > 0"
                  class="flex-nowrap overflow-x-auto"
                >
                  <v-col
                    v-for="(routeGroup, rIdx) in day.routes"
                    :key="rIdx"
                    cols="12"
                    md
                    style="min-width: 250px"
                  >
                    <v-card
                      class="h-100 elevation-3 border-t-lg"
                      :style="'border-top-color: var(--v-primary-base) !important;'"
                    >
                      <v-card-title
                        class="d-flex align-center bg-grey-lighten-4"
                      >
                        <v-text-field
                          v-model="routeGroup.group_name"
                          density="compact"
                          hide-details
                          variant="underlined"
                          class="font-weight-bold"
                          style="font-size: 1.1rem"
                        ></v-text-field>
                        <v-spacer></v-spacer>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          @click="removeGroup(day, rIdx)"
                        ></v-btn>
                      </v-card-title>
                      <v-card-text class="pt-4">
                        <v-autocomplete
                          v-model="routeGroup.route_id"
                          :items="allRoutes"
                          item-title="name"
                          item-value="id"
                          label="Sélectionner un circuit"
                          variant="outlined"
                          density="comfortable"
                          clearable
                          prepend-inner-icon="mdi-map-marker-path"
                          hide-details="auto"
                          class="mb-2"
                        >
                          <template v-slot:append-inner v-if="routeGroup.route_id && getRouteDetails(routeGroup.route_id)?.recent_usages?.length">
                            <v-tooltip location="top" open-delay="100">
                              <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" size="small" class="text-info mt-1" icon="mdi-information"></v-icon>
                              </template>
                              <div class="text-caption font-weight-bold mb-1">Dernières utilisations :</div>
                              <div v-for="(usage, uIdx) in getRouteDetails(routeGroup.route_id)?.recent_usages" :key="uIdx" class="text-caption">
                                {{ formatLastUsed(usage.date) }} - {{ usage.group }}
                              </div>
                            </v-tooltip>
                          </template>
                          
                          <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props" :title="item.raw.name">
                              <template v-slot:append v-if="item.raw.recent_usages?.length">
                                <v-tooltip location="left" open-delay="100">
                                  <template v-slot:activator="{ props: tooltipProps }">
                                    <v-icon v-bind="tooltipProps" size="small" class="text-grey-darken-1" icon="mdi-information"></v-icon>
                                  </template>
                                  <div class="text-caption font-weight-bold mb-1">Dernières utilisations :</div>
                                  <div v-for="(usage, uIdx) in item.raw.recent_usages" :key="uIdx" class="text-caption">
                                    {{ formatLastUsed(usage.date) }} - {{ usage.group }}
                                  </div>
                                </v-tooltip>
                              </template>
                            </v-list-item>
                          </template>
                        </v-autocomplete>

                        <v-btn
                          v-if="!routeGroup.route_id"
                          color="info"
                          variant="tonal"
                          size="small"
                          class="w-100 mb-3"
                          prepend-icon="mdi-lightbulb-on-outline"
                          @click="suggestRouteForGroup(day.date, routeGroup)"
                        >
                          Suggérer un circuit
                        </v-btn>

                        <div
                          v-if="getRouteDetails(routeGroup.route_id)"
                          class="mt-3"
                        >
                          <div class="d-flex mb-4" style="gap: 8px">
                            <v-btn
                              color="info"
                              variant="tonal"
                              size="small"
                              style="flex: 1"
                              prepend-icon="mdi-trending-down"
                              @click="
                                suggestRouteForGroup(
                                  day.date,
                                  routeGroup,
                                  'easier',
                                )
                              "
                            >
                              Plus facile
                            </v-btn>
                            <v-btn
                              color="success"
                              variant="tonal"
                              size="small"
                              style="flex: 1"
                              prepend-icon="mdi-swap-horizontal"
                              @click="
                                suggestRouteForGroup(
                                  day.date,
                                  routeGroup,
                                  'equivalent',
                                )
                              "
                            >
                              Équivalent
                            </v-btn>
                            <v-btn
                              color="warning"
                              variant="tonal"
                              size="small"
                              style="flex: 1"
                              prepend-icon="mdi-trending-up"
                              @click="
                                suggestRouteForGroup(
                                  day.date,
                                  routeGroup,
                                  'harder',
                                )
                              "
                            >
                              Plus dur
                            </v-btn>
                          </div>
                          <v-row dense>
                            <v-col cols="4">
                              <div class="text-caption text-grey-darken-1">
                                Distance
                              </div>
                              <div class="text-h6 font-weight-bold">
                                {{
                                  (
                                    getRouteDetails(routeGroup.route_id)
                                      ?.length! / 1000
                                  ).toFixed(1)
                                }}
                                <span class="text-body-2">km</span>
                              </div>
                            </v-col>
                            <v-col cols="4">
                              <div class="text-caption text-grey-darken-1">
                                Dénivelé
                              </div>
                              <div class="text-h6 font-weight-bold">
                                {{
                                  getRouteDetails(routeGroup.route_id)
                                    ?.elevation
                                }}
                                <span class="text-body-2">m</span>
                              </div>
                            </v-col>
                            <v-col cols="4">
                              <div class="text-caption text-grey-darken-1">
                                Difficulté
                              </div>
                              <div>
                                <v-chip
                                  variant="flat"
                                  size="large"
                                  :color="
                                    getDifficultyColor(
                                      getRouteDetails(routeGroup.route_id)
                                        ?.difficulty,
                                    )
                                  "
                                  style="font-size: 1.25rem"
                                  class="font-weight-bold text-black"
                                >
                                  {{
                                    getRouteDetails(routeGroup.route_id)
                                      ?.difficulty
                                  }}
                                </v-chip>
                              </div>
                            </v-col>
                          </v-row>
                          <div class="mt-3 mb-3 text-body-2">
                            <strong>Villes : </strong>
                            {{
                              formatTowns(
                                getRouteDetails(routeGroup.route_id)?.towns,
                              )
                            }}
                          </div>

                          <!-- Independent Map for this group -->
                          <Map
                            :polylineStr="
                              getRouteDetails(routeGroup.route_id)
                                ?.strava_polyline
                            "
                            style="
                              height: 250px;
                              border-radius: 8px;
                              overflow: hidden;
                            "
                          />
                        </div>
                        <div v-else class="text-center text-grey py-8">
                          Aucun circuit sélectionné
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-row class="mt-4">
                  <v-col class="text-right">
                    <v-btn
                      color="primary"
                      size="large"
                      prepend-icon="mdi-content-save"
                      @click="saveDay(day)"
                    >
                      Enregistrer la journée
                    </v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>

    <v-dialog v-model="showOverwriteDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title
          class="text-h5 text-error pt-4 pb-2 px-6 d-flex align-center"
        >
          <v-icon size="large" class="mr-2">mdi-alert-circle</v-icon> Attention
        </v-card-title>
        <v-card-text class="px-6 py-4 text-body-1">
          Vous êtes sur le point d'effacer
          <strong
            >tout le planning défini pour {{ currentMonthName }}
            {{ currentYear }}</strong
          >
          et de le remplacer par celui de l'année précédente. <br /><br />
          Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
        </v-card-text>
        <v-card-actions class="px-6 pb-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showOverwriteDialog = false"
            >Annuler</v-btn
          >
          <v-btn color="error" variant="flat" @click="confirmOverwritePlanning"
            >Oui, écraser le mois</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="genericConfirmDialog.show" max-width="500">
      <v-card rounded="xl">
        <v-card-title
          class="text-h5 pt-4 pb-2 px-6 d-flex align-center"
          :class="`text-${genericConfirmDialog.color}`"
        >
          <v-icon size="large" class="mr-2">mdi-help-circle</v-icon>
          {{ genericConfirmDialog.title }}
        </v-card-title>
        <v-card-text class="px-6 py-4 text-body-1">
          {{ genericConfirmDialog.message }}
        </v-card-text>
        <v-card-actions class="px-6 pb-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="genericConfirmDialog.show = false"
            >Annuler</v-btn
          >
          <v-btn
            :color="genericConfirmDialog.color"
            variant="flat"
            @click="confirmGenericAction"
            >Confirmer</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { PlanningService, type PlanningDay } from "@/services/planning.service";
import { RoutesService, type RouteBean } from "@/services/routes.service";
import Map from "@/components/Map.vue";

const currentDate = ref(new Date());
const loading = ref(false);
const loadingDrive = ref(false);
const days = ref<PlanningDay[]>([]);
const allRoutes = ref<RouteBean[]>([]);
const activeTab = ref(0);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const showOverwriteDialog = ref(false);

const genericConfirmDialog = ref({
  show: false,
  title: "",
  message: "",
  color: "warning",
  onConfirm: () => {},
});

function confirmAction(
  title: string,
  message: string,
  color: string,
  onConfirm: () => void,
) {
  genericConfirmDialog.value.title = title;
  genericConfirmDialog.value.message = message;
  genericConfirmDialog.value.color = color;
  genericConfirmDialog.value.onConfirm = onConfirm;
  genericConfirmDialog.value.show = true;
}

function confirmGenericAction() {
  genericConfirmDialog.value.show = false;
  if (genericConfirmDialog.value.onConfirm) {
    genericConfirmDialog.value.onConfirm();
  }
}

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonthName = computed(() =>
  currentDate.value.toLocaleString("fr-FR", { month: "long" }),
);
const minDate = computed(() => {
  const d = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1,
  );
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
});
const maxDate = computed(() => {
  const d = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    0,
  );
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
});
const prevMonthName = computed(() => {
  const d = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );
  return d.toLocaleString("fr-FR", { month: "short" });
});
const nextMonthName = computed(() => {
  const d = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );
  return d.toLocaleString("fr-FR", { month: "short" });
});

onMounted(async () => {
  loading.value = true;
  try {
    allRoutes.value = await RoutesService.getRoutes();
  } catch (e) {
    console.error(e);
  }
  await loadPlanning();
});

async function loadPlanning() {
  loading.value = true;
  try {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth() + 1;
    days.value = await PlanningService.getPlanning(year, month);
    activeTab.value = 0;
  } catch (e) {
    showSnackbar("Erreur lors du chargement", "error");
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [yStr = '0', mStr = '0', dStr = '0'] = dateStr.split("-");
  const dateObj = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));
  return dateObj.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function formatDateLong(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTowns(townsStr?: string) {
  if (!townsStr) return "";
  return Array.from(new Set(townsStr.split(","))).join(", ");
}

function formatLastUsed(dateStr?: string) {
  if (!dateStr || dateStr === "0000-00-00") return 'Jamais';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getRouteDetails(
  routeId: string | number | null,
): RouteBean | undefined {
  if (!routeId) return undefined;
  return allRoutes.value.find((r) => String(r.id) === String(routeId));
}

function prevMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );
  loadPlanning();
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );
  loadPlanning();
}

function getDayAnomalies(day: PlanningDay, index: number): string[] {
  const anomalies: string[] = [];
  if (!day.routes || day.routes.length === 0) return anomalies;

  for (const r of day.routes) {
    if (!r.route_id) {
      anomalies.push(`Aucun circuit sélectionné pour le ${r.group_name}.`);
    }
  }

  const getRank = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("a/b") || n.includes("long")) return 1;
    if (n.includes(" a") || n === "a" || n === "grp a" || n === "groupe a")
      return 1;
    if (n.includes(" b") || n === "b" || n === "grp b" || n === "groupe b")
      return 2;
    if (n.includes(" c") || n === "c" || n === "grp c" || n === "groupe c")
      return 3;
    if (
      n.includes(" d") ||
      n === "d" ||
      n === "grp d" ||
      n === "groupe d" ||
      n.includes("court")
    )
      return 4;
    if (n.includes(" e") || n === "e" || n === "grp e" || n === "groupe e")
      return 5;
    if (n.includes(" f") || n === "f" || n === "grp f" || n === "groupe f")
      return 6;
    return 99;
  };

  const validRoutes = day.routes.filter(
    (r) => r.route_id && getRouteDetails(r.route_id),
  );

  for (let i = 0; i < validRoutes.length; i++) {
    for (let j = i + 1; j < validRoutes.length; j++) {
      const r1 = validRoutes[i]!;
      const r2 = validRoutes[j]!;
      const rank1 = getRank(r1.group_name);
      const rank2 = getRank(r2.group_name);

      if (rank1 === 99 || rank2 === 99 || rank1 === rank2) continue;

      const [rHarder, rEasier] = rank1 < rank2 ? [r1, r2] : [r2, r1];

      const detailsHarder = getRouteDetails(rHarder.route_id)!;
      const detailsEasier = getRouteDetails(rEasier.route_id)!;

      const distEasier = detailsEasier.length || 0;
      const distHarder = detailsHarder.length || 0;
      const elevEasier = detailsEasier.elevation || 0;
      const elevHarder = detailsHarder.elevation || 0;
      const difficultyEasier = detailsEasier.difficulty || 0;
      const difficultyHarder = detailsHarder.difficulty || 0;

      // Le groupe "fort" doit être strictement supérieur en distance OU en dénivelé
      if (distHarder <= distEasier && elevHarder <= elevEasier) {
        // Exception: S'ils ont le même circuit exact
        if (String(rHarder.route_id) !== String(rEasier.route_id)) {
          anomalies.push(
            `Le ${rHarder.group_name} devrait avoir un circuit plus long ou plus dur que le ${rEasier.group_name}.`,
          );
        }
      }

      // La difficulté du groupe "fort" ne doit pas être inférieure à celle du groupe "faible"
      if (difficultyHarder < difficultyEasier) {
        anomalies.push(
          `Le ${rHarder.group_name} a un circuit moins difficile (niveau ${difficultyHarder}) que le ${rEasier.group_name} (niveau ${difficultyEasier}).`,
        );
      }
    }
  }

  // Vérification de l'écart avec la sortie précédente (dans le même mois)
  if (index > 0) {
    for (const r of validRoutes) {
      let prevRouteDetails = null;
      let daysBetween = 0;

      for (let k = index - 1; k >= 0; k--) {
        const prevDay = days.value[k]!;
        const prevGroupRoute = prevDay.routes?.find(
          (pr) => pr.group_name === r.group_name && pr.route_id,
        );
        if (prevGroupRoute) {
          prevRouteDetails = getRouteDetails(prevGroupRoute.route_id);
          const t1 = new Date(day.date).getTime();
          const t2 = new Date(prevDay.date).getTime();
          daysBetween = Math.round((t1 - t2) / (1000 * 3600 * 24));
          break;
        }
      }

      if (prevRouteDetails && daysBetween > 0 && daysBetween <= 14) {
        const currentDetails = getRouteDetails(r.route_id)!;
        const distDiff =
          Math.abs(
            (currentDetails.length || 0) - (prevRouteDetails.length || 0),
          ) / 1000;
        const elevDiff = Math.abs(
          (currentDetails.elevation || 0) - (prevRouteDetails.elevation || 0),
        );

        if (
          distDiff > 20 ||
          elevDiff > 500 ||
          (distDiff > 10 && elevDiff > 300)
        ) {
          anomalies.push(
            `Écart de difficulté important pour le ${r.group_name} par rapport à sa précédente sortie il y a ${daysBetween} jours (différence de ${Math.round(distDiff)} km et ${elevDiff} m de D+).`,
          );
        }
      }
    }
  }

  return anomalies;
}

function getDifficultyColor(diff?: number) {
  if (!diff) return "grey";
  if (diff <= 2) return "light-green-lighten-3";
  if (diff <= 4) return "green-lighten-1";
  if (diff <= 6) return "yellow-lighten-2";
  if (diff <= 8) return "orange-lighten-2";
  return "red-lighten-2";
}

async function duplicatePlanning() {
  try {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth() + 1;
    const duplicatedDays = await PlanningService.duplicatePlanning(year, month);
    days.value = duplicatedDays;
    activeTab.value = 0;
    showSnackbar(
      "Planning dupliqué ! N'oubliez pas d'enregistrer chaque journée.",
      "info",
    );
  } catch (e: any) {
    showSnackbar(e.message || "Erreur lors de la duplication", "error");
  }
}

async function openPreviousYearDrive() {
  loadingDrive.value = true;
  try {
    const year = currentDate.value.getFullYear() - 1;
    const month = currentDate.value.getMonth() + 1;
    const res = await PlanningService.getDriveUrl(year, month);
    if (res && res.url) {
      window.open(res.url, '_blank');
    } else {
      showSnackbar("Fichier introuvable sur Google Drive", "warning");
    }
  } catch (e: any) {
    showSnackbar(e.message || "Fichier introuvable sur Google Drive", "error");
  } finally {
    loadingDrive.value = false;
  }
}

async function confirmOverwritePlanning() {
  showOverwriteDialog.value = false;
  loading.value = true;
  try {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth() + 1;
    const duplicatedDays = await PlanningService.duplicateAndOverwritePlanning(
      year,
      month,
    );
    days.value = duplicatedDays;
    activeTab.value = 0;
    showSnackbar(
      "Planning ré-importé ! N'oubliez pas d'enregistrer chaque journée.",
      "success",
    );
  } catch (e: any) {
    showSnackbar(e.message || "Erreur lors de la ré-importation", "error");
  } finally {
    loading.value = false;
  }
}

function addEmptyDay() {
  let newDateStr: string;
  if (days.value.length > 0 && days.value[activeTab.value]) {
    const currentDay = new Date(days.value[activeTab.value]!.date);
    currentDay.setDate(currentDay.getDate() + 1);
    newDateStr = currentDay.toISOString().split("T")[0]!;
  } else {
    newDateStr = new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth(),
      1,
    )
      .toISOString()
      .split("T")[0]!;
  }

  days.value.push({
    appointment_id: null,
    date: newDateStr,
    observations: "",
    routes: [
      { group_name: "Groupe A/B", route_id: null },
      { group_name: "Groupe C", route_id: null },
      { group_name: "Groupe D", route_id: null },
      { group_name: "Groupe E", route_id: null },
    ],
  });

  activeTab.value = days.value.length - 1;
  sortDays();
}

function updateDayDate(day: any, newDateObj: Date) {
  if (newDateObj) {
    const offset = newDateObj.getTimezoneOffset();
    const localDate = new Date(newDateObj.getTime() - offset * 60 * 1000);
    day.date = localDate.toISOString().split("T")[0];
    day._menuOpen = false;
    sortDays();
  }
}

function sortDays() {
  if (days.value.length <= 1) return;
  const activeDay = days.value[activeTab.value];

  days.value.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (activeDay) {
    const newIndex = days.value.findIndex((d) => d === activeDay);
    if (newIndex !== -1) {
      activeTab.value = newIndex;
    }
  }
}

function addGroup(day: any) {
  if (!day.routes) day.routes = [];
  day.routes.push({ group_name: "Nouveau Groupe", route_id: null });
}

function removeGroup(day: any, rIdx: number) {
  confirmAction(
    "Supprimer le groupe",
    "Voulez-vous vraiment supprimer ce groupe ?",
    "error",
    () => {
      day.routes.splice(rIdx, 1);
    },
  );
}

async function suggestRouteForGroup(
  dateStr: string,
  routeGroup: any,
  mode?: "easier" | "harder" | "equivalent",
) {
  loading.value = true;
  try {
    const suggestion = await PlanningService.suggestRoute(
      dateStr,
      routeGroup.group_name,
      routeGroup.route_id,
      mode,
    );
    routeGroup.route_id = suggestion.route_id;
    showSnackbar(`Circuit suggéré: ${suggestion.route_name}`, "success");
  } catch (e: any) {
    showSnackbar(e.message || "Erreur de suggestion", "error");
  } finally {
    loading.value = false;
  }
}

async function saveDay(day: PlanningDay) {
  try {
    const res = await PlanningService.savePlanningDay(day);
    day.appointment_id = res.appointment_id;
    showSnackbar("Enregistré !", "success");
  } catch (e) {
    showSnackbar("Erreur lors de la sauvegarde", "error");
  }
}

async function saveMonth() {
  loading.value = true;
  try {
    for (const day of days.value) {
      const res = await PlanningService.savePlanningDay(day);
      day.appointment_id = res.appointment_id;
    }
    showSnackbar("Mois entier sauvegardé avec succès !", "success");
    // Trigger file generation on disk
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth() + 1;
    const exportRes = await PlanningService.exportPlanning(year, month);
    
    showSnackbar(`Fichier généré sur Google Drive : ${exportRes.filename}`, "success");

  } catch (e) {
    showSnackbar("Erreur lors de la sauvegarde du mois", "error");
  } finally {
    loading.value = false;
  }
}

async function resetDay(day: PlanningDay) {
  confirmAction(
    "Réinitialiser la journée",
    "Voulez-vous réinitialiser ce jour avec le modèle de l'année précédente ? (Ceci modifie l'affichage, vous devrez enregistrer ensuite)",
    "warning",
    async () => {
      loading.value = true;
      try {
        const eqDay = await PlanningService.getEquivalentDay(day.date);
        day.routes = eqDay.routes;
        day.observations = eqDay.observations;
        showSnackbar(
          "Jour réinitialisé ! N'oubliez pas de sauvegarder.",
          "info",
        );
      } catch (e: any) {
        showSnackbar(
          e.message || "Erreur lors de la réinitialisation",
          "error",
        );
      } finally {
        loading.value = false;
      }
    },
  );
}

async function deleteDay(day: PlanningDay, index: number) {
  confirmAction(
    "Supprimer la journée",
    "Supprimer cette date ? (Action irréversible si déjà enregistrée)",
    "error",
    async () => {
      if (day.appointment_id) {
        loading.value = true;
        try {
          await PlanningService.deletePlanningDay(day.appointment_id);
          showSnackbar("Date supprimée", "success");
        } catch (e: any) {
          showSnackbar(e.message || "Erreur lors de la suppression", "error");
          loading.value = false;
          return;
        }
        loading.value = false;
      }
      days.value.splice(index, 1);
      if (activeTab.value >= days.value.length && days.value.length > 0) {
        activeTab.value = days.value.length - 1;
      }
    },
  );
}

function showSnackbar(text: string, color: string) {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
}
</script>

<style scoped>
.planning-tab {
  transition: all 0.3s ease;
  border-radius: 12px 12px 0 0 !important;
  margin: 0 4px;
  text-transform: none !important;
  font-weight: 500;
  letter-spacing: normal !important;
  opacity: 0.8;
}

.planning-tab:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

.planning-tab-selected {
  background-color: #eceff1 !important; /* blue-grey-lighten-5 */
  color: #1a237e !important; /* highlight text color */
  opacity: 1;
  font-weight: 800;
  font-size: 1.05rem !important;
  box-shadow: 0px -6px 12px rgba(0, 0, 0, 0.15) !important;
  z-index: 2;
}

.planning-tab-selected.has-warning {
  color: #d84315 !important;
}

.has-warning {
  color: #ffb74d !important;
}

:deep(.v-window-item) {
  transition: none !important;
}
</style>
