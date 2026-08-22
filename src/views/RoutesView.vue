<template>
  <div>
    <v-row class="mb-2 align-center">
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2 class="text-h5 mb-0">Bibliothèque des circuits</h2>
        <div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
            Ajouter un circuit
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-card class="mb-6 elevation-1 rounded-lg" color="grey-lighten-4">
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <v-icon color="primary" class="mr-2">mdi-filter-variant</v-icon>
          <span class="text-h6 font-weight-bold text-grey-darken-3">Filtres de recherche</span>
        </div>
        
        <v-row dense class="align-center mt-2">
          <v-col cols="12" md="3">
            <v-text-field
              v-model="nameFilter"
              label="Rechercher par nom..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              bg-color="white"
              @update:modelValue="refreshTable"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="3" class="px-4">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-caption font-weight-bold text-grey-darken-1">Distance</span>
              <span class="text-caption font-weight-bold text-primary">{{ distanceRange[0] }} - {{ distanceRange[1] }} km</span>
            </div>
            <v-range-slider
              v-model="distanceRange"
              :min="0"
              :max="200"
              :step="10"
              color="primary"
              track-color="grey-lighten-2"
              hide-details
              @update:modelValue="refreshTable"
            ></v-range-slider>
          </v-col>
          
          <v-col cols="12" md="3" class="px-4">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-caption font-weight-bold text-grey-darken-1">Dénivelé</span>
              <span class="text-caption font-weight-bold text-primary">{{ elevationRange[0] }} - {{ elevationRange[1] }} m</span>
            </div>
            <v-range-slider
              v-model="elevationRange"
              :min="0"
              :max="3000"
              :step="100"
              color="primary"
              track-color="grey-lighten-2"
              hide-details
              @update:modelValue="refreshTable"
            ></v-range-slider>
          </v-col>
          
          <v-col cols="12" md="3" class="px-4">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-caption font-weight-bold text-grey-darken-1">Difficulté</span>
              <span class="text-caption font-weight-bold text-primary">{{ difficultyRange[0] }} - {{ difficultyRange[1] }}</span>
            </div>
            <v-range-slider
              v-model="difficultyRange"
              :min="0"
              :max="15"
              :step="1"
              color="primary"
              track-color="grey-lighten-2"
              hide-details
              @update:modelValue="refreshTable"
            ></v-range-slider>
          </v-col>
        </v-row>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex align-center">
          <span class="text-caption font-weight-bold text-grey-darken-1 mr-4">Orientations :</span>
          <v-chip-group 
            v-model="selectedOrientations" 
            multiple 
            @update:modelValue="refreshTable" 
            selected-class="text-primary font-weight-bold border-primary bg-blue-lighten-5"
          >
            <v-chip 
              v-for="o in orientations" 
              :key="o" 
              :value="o" 
              filter 
              variant="outlined" 
              size="small" 
              class="bg-white text-grey-darken-1"
            >
              {{ o }}
            </v-chip>
          </v-chip-group>
        </div>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">
        <v-data-table
          :headers="headers"
          :items="filteredRoutes"
          class="elevation-2 table-modern"
          item-value="id"
          @click:row="selectRow"
          :items-per-page="-1"
          hide-default-footer
          :row-props="rowProps"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              {{ item.name }}
              <v-tooltip location="right" v-if="item.recent_usages && item.recent_usages.length > 0">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" size="small" class="ml-2 text-grey-darken-1" icon="mdi-information"></v-icon>
                </template>
                <div class="text-caption font-weight-bold mb-1">Dernières utilisations :</div>
                <div v-for="(usage, uIdx) in item.recent_usages" :key="uIdx" class="text-caption">
                  {{ formatLastUsed(usage.date) }} - {{ usage.group }}
                </div>
              </v-tooltip>
            </div>
          </template>
          <template v-slot:item.length="{ item }">
            {{ (item.length / 1000).toFixed(0) }}
          </template>
          <template v-slot:item.difficulty="{ item }">
            {{ item.difficulty === -1 ? '-' : item.difficulty }}
          </template>
          <template v-slot:item.link="{ item }">
            <a v-if="item.link" :href="item.link" target="_blank" @click.stop>
              <img src="/assets/strava.png" height="20" alt="Strava" />
            </a>
          </template>
          <template v-slot:item.last_used_date="{ item }">
            {{ formatLastUsed(item.last_used_date) }}
          </template>
        </v-data-table>
      </v-col>
      
      <v-col cols="12" md="4" style="position: sticky; top: 80px; align-self: start; z-index: 10;">
        <v-card class="mb-4">
          <v-card-text>
            <v-chip v-for="(c, i) in cities" :key="i" class="ma-1">{{ c }}</v-chip>
          </v-card-text>
        </v-card>
        <Map />
        <ElevationChart
          v-if="selectedRouteObj"
          class="mt-4"
          :elevationData="selectedRouteObj.elevation_data"
          :length="selectedRouteObj.length"
        />
      </v-col>
    </v-row>

    <!-- Dialog Ajouter Circuit -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Ajouter un circuit</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="addForm.type"
                  :items="['Route', 'Gravel']"
                  label="Type de circuit"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addForm.name"
                  label="Référence / Nom"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="addForm.link"
                  label="Lien Strava"
                  variant="outlined"
                  placeholder="https://www.strava.com/routes/..."
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="addForm.distance"
                  label="Distance (km)"
                  type="number"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="addForm.elevation"
                  label="Dénivelé (m)"
                  type="number"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="addForm.orientation"
                  :items="orientations"
                  label="Orientation"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="computedDifficulty"
                  label="Difficulté (calculée)"
                  variant="outlined"
                  readonly
                  bg-color="grey-lighten-4"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="addForm.towns"
                  label="Villes traversées (séparées par des virgules)"
                  variant="outlined"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="showAddDialog = false">
            Annuler
          </v-btn>
          <v-btn color="primary" variant="flat" :loading="adding" @click="submitAddRoute">
            Ajouter
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { RoutesService, type RouteBean } from '@/services/routes.service';
import { useMapStore } from '@/stores/mapStore';
import Map from '@/components/Map.vue';
import ElevationChart from '@/components/ElevationChart.vue';
import { calculateDifficulty } from '@/utils/routeUtils';

const mapStore = useMapStore();

const allRoutes = ref<RouteBean[]>([]);
const filteredRoutes = ref<RouteBean[]>([]);
const selectedRouteObj = ref<RouteBean | null>(null);

const nameFilter = ref('');
const distanceRange = ref([0, 200]);
const elevationRange = ref([0, 3000]);
const difficultyRange = ref([0, 15]);

const orientations = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "NS", "EW"];
const selectedOrientations = ref(["N", "NE", "E", "SE", "S", "SW", "W", "NW", "NS", "EW"]);

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Distance (km)', key: 'length', sortable: true },
  { title: 'Dénivelé+ (m)', key: 'elevation', sortable: true },
  { title: 'Difficulté', key: 'difficulty', sortable: true },
  { title: 'Orientation', key: 'orientation', sortable: true },
  { title: 'Dernière utilisation', key: 'last_used_date', sortable: true },
  { title: 'Lien Strava', key: 'link', sortable: false },
];

const cities = ref<string[]>([]);
const selectedRowIndex = ref<number>(0);

onMounted(async () => {
  allRoutes.value = await RoutesService.getRoutes();
  refreshTable();
});

const showAddDialog = ref(false);
const adding = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const addForm = ref({
  type: 'Route',
  name: '',
  link: '',
  distance: 0,
  elevation: 0,
  orientation: 'N',
  towns: ''
});

const computedDifficulty = computed(() => {
  return calculateDifficulty(addForm.value.distance, addForm.value.elevation);
});

watch([() => addForm.value.type, () => addForm.value.distance, () => addForm.value.elevation, () => addForm.value.orientation], () => {
  if (showAddDialog.value) {
    autoGenerateName();
  }
});

function openAddDialog() {
  addForm.value = {
    type: 'Route',
    name: '',
    link: '',
    distance: 0,
    elevation: 0,
    orientation: 'N',
    towns: ''
  };
  autoGenerateName();
  showAddDialog.value = true;
}

function autoGenerateName() {
  const prefix = addForm.value.type === 'Gravel' ? 'CLG ' : 'CL ';
  let maxNum = 0;
  allRoutes.value.forEach(r => {
    if (r.name && r.name.startsWith(prefix)) {
      const match = r.name.substring(prefix.length).match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1] || '0');
        if (num > maxNum && num < 800) maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  const numStr = addForm.value.type === 'Gravel' ? nextNum.toString().padStart(2, '0') : nextNum.toString();
  
  let refName = `${prefix}${numStr}`;
  const ori = addForm.value.orientation !== 'Non défini' ? addForm.value.orientation : '';
  const diff = computedDifficulty.value;
  const dist = addForm.value.distance ? Math.round(addForm.value.distance) : '';
  
  if (ori || diff !== 0 || dist) {
    refName += ` ${ori}${diff} ${dist}`;
  }
  
  addForm.value.name = refName.trim();
}

async function submitAddRoute() {
  adding.value = true;
  try {
    const payload = {
      name: addForm.value.name,
      link: addForm.value.link,
      distance: addForm.value.distance,
      elevation: addForm.value.elevation,
      difficulty: computedDifficulty.value,
      orientation: addForm.value.orientation,
      towns: addForm.value.towns
    };
    await RoutesService.addRoute(payload);
    showAddDialog.value = false;
    allRoutes.value = await RoutesService.getRoutes();
    refreshTable();
  } catch (e) {
    console.error("Failed to add route", e);
  } finally {
    adding.value = false;
  }
}

function formatLastUsed(dateStr?: string) {
  if (!dateStr || dateStr === "0000-00-00") return 'Jamais';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function refreshTable() {
  filteredRoutes.value = allRoutes.value.map(data => ({
    ...data,
    last_used_date: data.last_used_date || "0000-00-00"
  })).filter(data => {
    if (nameFilter.value && data.name) {
      if (!data.name.toLowerCase().includes(nameFilter.value.toLowerCase())) {
        return false;
      }
    }

    let ori = data.orientation;
    if (ori === "-") ori = "Non défini";
    else if (ori === "SN") ori = "NS";
    else if (ori === "WE") ori = "EW";

    let orientationAllowed = true;
    if (ori && orientations.includes(ori as string)) {
        orientationAllowed = selectedOrientations.value.includes(ori as string);
    }

    let elev = data.elevation || 0;
    let dist = (data.length || 0) / 1000.0;
    let diff = data.difficulty !== null && data.difficulty !== undefined ? data.difficulty : -1;

    return elev >= elevationRange.value[0]!
      && elev <= elevationRange.value[1]!
      && dist >= distanceRange.value[0]!
      && dist <= distanceRange.value[1]!
      && orientationAllowed
      && ((diff == -1 && difficultyRange.value[0]! == 0) || (diff >= difficultyRange.value[0]!
        && diff <= difficultyRange.value[1]!));
  });
  
  if (filteredRoutes.value.length > 0 && !selectedRowIndex.value) {
    selectRow(null, { item: filteredRoutes.value[0] });
  }
}

function selectRow(event: any, { item }: any) {
  selectedRowIndex.value = item.id;
  selectedRouteObj.value = item;
  if (!item.towns || item.towns === "") {
    cities.value = ['Points de passage non définis'];
  } else {
    cities.value = Array.from(new Set(item.towns.split(",")));
  }
  mapStore.notifyMapPolyline(item.strava_polyline);
}

function rowProps(data: any) {
  return {
    class: data.item.id === selectedRowIndex.value ? 'selected-row' : ''
  };
}
</script>

<style scoped>
.table-modern {
  border-radius: 8px;
  overflow: hidden;
}
:deep(.selected-row) {
  background-color: rgba(211, 47, 47, 0.1) !important;
  font-weight: 500;
  color: #D32F2F;
}
:deep(.v-data-table-header__content) {
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
:deep(.v-data-table > .v-table__wrapper > table > thead > tr > th) {
  background-color: #f5f5f5 !important;
  color: #212121 !important;
  border-bottom: 2px solid #D32F2F !important;
}
</style>
