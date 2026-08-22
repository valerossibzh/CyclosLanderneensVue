<template>
  <v-container fluid class="pa-0">
    <!-- Header -->
    <v-toolbar color="primary" dark prominent density="compact">
      <v-avatar size="32" class="mr-3 ml-2">
        <img src="/assets/logo.png" alt="Logo" style="width: 32px; height: 32px;" />
      </v-avatar>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">
        Cyclotouristes Landernéens
      </v-toolbar-title>
    </v-toolbar>

    <!-- Tabs -->
    <v-tabs v-model="tab" bg-color="white" color="primary" grow>
      <v-tab value="sorties">Sorties</v-tab>
      <v-tab value="agenda">Agenda</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-4 px-2">
      <!-- SORTIES TAB -->
      <v-window-item value="sorties">
        <!-- Date Navigator -->
        <div class="d-flex align-center justify-space-between mb-4">
          <v-btn icon="mdi-chevron-left" variant="tonal" color="primary" @click="selectPreviousWorkout" :disabled="selectedIdx <= 0"></v-btn>
          
          <v-select
            v-if="selectedWorkoutDate"
            v-model="selectedWorkoutDate"
            :items="workoutsDatesFormatted"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
            class="mx-2 flex-grow-1 select-date"
            @update:modelValue="onWorkoutChange"
          ></v-select>

          <v-btn icon="mdi-chevron-right" variant="tonal" color="primary" @click="selectNextWorkout" :disabled="selectedIdx >= workoutsDates.length - 1"></v-btn>
        </div>

        <!-- Workout Info -->
        <div v-if="selectedWorkoutData" class="mb-4">
          <!-- Groups Selector -->
          <v-chip-group v-model="selectedGrpIndex" selected-class="bg-primary text-white" mandatory column class="d-flex justify-center flex-wrap mb-2" @update:modelValue="onGroupChanged">
            <v-chip v-for="(g, i) in groups" :key="i" :value="i" filter>
              {{ g.nom || g.nomCourt || 'Groupe' }}
            </v-chip>
          </v-chip-group>

          <div class="text-body-1 mb-1">
            Heure de départ: {{ selectedWorkoutData.hour_str?.replace(':', 'h') || 'N/A' }}
          </div>
          <div v-if="selectedWorkoutData['Observations']" class="text-body-2 text-error mb-2">
            Observations: {{ selectedWorkoutData["Observations"] }}
          </div>
        </div>

        <!-- Selected Group Details -->
        <div v-if="selectedGrpData">
          <v-card variant="outlined" class="mb-4 pa-2 d-flex flex-wrap align-center justify-space-around bg-grey-lighten-4 rounded-lg">
            <div class="d-flex align-center">
              <v-icon color="blue-grey-darken-1" class="mr-1">mdi-map-marker-distance</v-icon>
              <b>{{ selectedGrpData["Distance"] }} km</b>
            </div>
            <div class="d-flex align-center">
              <v-icon color="brown-darken-1" class="mr-1">mdi-trending-up</v-icon>
              <b>{{ selectedGrpData["D+"] }} m</b>
            </div>
            <div class="d-flex align-center" v-if="selectedGrpData['Difficulté']">
              <v-icon color="orange-darken-2" class="mr-1">mdi-speedometer</v-icon>
              <b>{{ selectedGrpData["Difficulté"] }}</b>
            </div>
            <div v-if="selectedGrpData['Lien']" class="d-flex align-center">
              <v-btn :href="selectedGrpData['Lien']" target="_blank" icon variant="text" density="compact" color="deep-orange">
                <v-icon>mdi-open-in-new</v-icon>
              </v-btn>
            </div>
          </v-card>

          <!-- Cities and Weather -->
          <v-row class="mb-4 align-center">
            <v-col cols="6" class="d-flex flex-column align-center text-center">
              <div v-if="selectedGrpData.cities && selectedGrpData.cities.length">
                <div v-for="(city, idx) in selectedGrpData.cities" :key="idx" class="text-body-1 text-grey-darken-2">
                  {{ city }}
                </div>
              </div>
            </v-col>
            <v-col cols="6" class="d-flex flex-column align-center justify-center">
              <WeatherWidget v-if="weather" :weather="weather" style="max-width: 170px; width: 100%; border: 1px solid #3f51b5; border-radius: 12px; background: rgba(255,255,255,0.6) !important;" class="elevation-4" />
            </v-col>
          </v-row>

          <v-row>
            <!-- Elevation -->
            <v-col cols="12" class="pt-0" v-if="selectedGrpData.elevation">
              <ElevationChart :elevationData="selectedGrpData.elevation" :length="Number(selectedGrpData['Distance'] || 0) * 1000" />
            </v-col>
            
            <!-- Map -->
            <v-col cols="12" class="pt-0">
              <v-card class="elevation-2 rounded-lg" style="height: 350px; overflow: hidden;">
                <MapComponent :polylineStr="selectedGrpData.polyline" />
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-window-item>

      <!-- AGENDA TAB -->
      <v-window-item value="agenda">
        <div v-if="calendar.length === 0" class="text-center pa-4 text-grey">
          Chargement de l'agenda...
        </div>
        <div v-else class="pa-2">
          <CalendarRow v-for="(item, idx) in calendar" :key="idx" :row="item" />
        </div>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RoutesService } from '@/services/routes.service';
import MapComponent from '@/components/Map.vue';
import ElevationChart from '@/components/ElevationChart.vue';
import CalendarRow from '@/components/CalendarRow.vue';
import WeatherWidget from '@/components/WeatherWidget.vue';
import type { CalendarBean } from '@/components/CalendarRow.vue';

const tab = ref('sorties');

// Workouts Data
const workouts = ref<Record<number, any>>({});
const workoutsDates = ref<number[]>([]);
const selectedIdx = ref(-1);
const selectedWorkoutDate = ref<number | null>(null);
const selectedWorkoutData = ref<any>(null);

// Weather
const weather = ref<any>(null);

// Group Data
const groups = ref<any[]>([]);
const selectedGrpIndex = ref<number>(0);
const selectedGrpData = ref<any>(null);
const lastSelectedGroups = ref<string[]>([]);

// Calendar Data
const calendar = ref<CalendarBean[]>([]);

const workoutsDatesFormatted = computed(() => {
  return workoutsDates.value.map(ts => {
    return {
      value: ts,
      label: new Date(ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    };
  });
});

onMounted(async () => {
  // Load preferences
  const storedSelect = localStorage.getItem('SELECT');
  if (storedSelect) {
    try { lastSelectedGroups.value = JSON.parse(storedSelect); } catch(e) {}
  }

  // Load Data
  await loadWorkoutsData();
  await loadCalendarData();
});

async function loadWorkoutsData() {
  const localHash = localStorage.getItem('HASH') || '0';
  try {
    const needUpdate = await RoutesService.getLanderneauHash(localHash);
    if (needUpdate) {
      const data = await RoutesService.getLanderneauData();
      const rawWorkouts = data.workouts;
      const hash = data.hash;
      
      const parsedWorkouts: Record<number, any> = {};
      const dates: number[] = [];

      for (const monthKey in rawWorkouts) {
        const daysMap = rawWorkouts[monthKey];
        for (const dateKey in daysMap) {
          // dateKey is usually like "Dim 2 août 2026", we need a timestamp.
          // In the old angular app, the key was the timestamp, but in this backend it's a string!
          // We need to parse this string to a Date object, or maybe we can parse it from `dateKey`.
          // Let's use a simple parsing or rely on the fact that dateKey is sortable? No, it's not.
          // We'll parse the date string (e.g. "Dim 2 août 2026")
          const ts = parseFrenchDate(dateKey);
          if (ts > 0) {
            parsedWorkouts[ts] = daysMap[dateKey];
            dates.push(ts);
          }
        }
      }

      workouts.value = parsedWorkouts;
      localStorage.setItem('DATA', JSON.stringify(parsedWorkouts));
      localStorage.setItem('HASH', hash);
    } else {
      const storedData = localStorage.getItem('DATA');
      if (storedData) workouts.value = JSON.parse(storedData);
    }
  } catch (e) {
    console.error("Error loading workouts data", e);
    const storedData = localStorage.getItem('DATA');
    if (storedData) workouts.value = JSON.parse(storedData);
  }

  prepareWorkoutsData();
}

function parseFrenchDate(dateStr: string): number {
  // Example: "Dim 2 août 2026" or "Dimanche 2 août 2026"
  const months: Record<string, number> = {
    'janv.': 0, 'janvier': 0, 'févr.': 1, 'février': 1, 'mars': 2, 'avr.': 3, 'avril': 3,
    'mai': 4, 'juin': 5, 'juil.': 6, 'juillet': 6, 'août': 7, 'sept.': 8, 'septembre': 8,
    'oct.': 9, 'octobre': 9, 'nov.': 10, 'novembre': 10, 'déc.': 11, 'décembre': 11
  };
  const parts = dateStr.replace(',', '').split(/\s+/);
  // Find the day number
  const dayNumMatch = parts.find(p => /^\d+$/.test(p));
  const yearMatch = parts.find(p => /^\d{4}$/.test(p));
  const monthMatch = parts.find(p => months[p.toLowerCase()] !== undefined);
  const m = monthMatch ? months[monthMatch.toLowerCase()] : undefined;
  
  if (dayNumMatch && yearMatch && m !== undefined) {
    return new Date(parseInt(yearMatch), m, parseInt(dayNumMatch)).getTime();
  }
  return 0; // fallback
}

function prepareWorkoutsData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  workoutsDates.value = Object.keys(workouts.value)
    .map(Number)
    .filter(ts => ts >= todayTs) // Keep only today and future
    .sort((a, b) => a - b);

  if (workoutsDates.value.length > 0) {
    selectedIdx.value = 0;
    updateSelectedDate();
  }
}

async function loadCalendarData() {
  try {
    const data = await RoutesService.getCalendar();
    calendar.value = data;
  } catch (e) {
    console.error("Error loading calendar data", e);
  }
}

function selectNextWorkout() {
  if (selectedIdx.value < workoutsDates.value.length - 1) {
    selectedIdx.value++;
    updateSelectedDate();
  }
}

function selectPreviousWorkout() {
  if (selectedIdx.value > 0) {
    selectedIdx.value--;
    updateSelectedDate();
  }
}

function onWorkoutChange(val: any) {
  if (val === undefined || val === null) return;
  const idx = workoutsDates.value.indexOf(Number(val));
  if (idx >= 0) {
    selectedIdx.value = idx;
    updateSelectedDate();
  }
}

function updateSelectedDate() {
  selectedGrpData.value = null;
  selectedWorkoutDate.value = workoutsDates.value[selectedIdx.value] || null;
  selectedWorkoutData.value = selectedWorkoutDate.value ? workouts.value[selectedWorkoutDate.value] : null;

  if (!selectedWorkoutData.value || !selectedWorkoutData.value.groups) return;

  groups.value = selectedWorkoutData.value.groups;
  
  // Try to find a group that was previously selected
  let foundIdx = 0;
  let found = false;
  for (const savedGrp of lastSelectedGroups.value) {
    const idx = groups.value.findIndex(g => (g.nom || g.nomCourt) === savedGrp);
    if (idx >= 0) {
      foundIdx = idx;
      found = true;
      break;
    }
  }

  selectedGrpIndex.value = foundIdx;
  onGroupChanged(foundIdx);
  
  fetchWeather();
}

async function fetchWeather() {
  weather.value = null;
  if (!selectedWorkoutDate.value) return;

  const departureTimeStr = selectedWorkoutData.value.hour_str;
  let targetTime = selectedWorkoutDate.value; 
  if (departureTimeStr) {
    const match = departureTimeStr.match(/(\d+)[h:](\d*)/);
    if (match) {
        const h = parseInt(match[1]);
        const m = match[2] ? parseInt(match[2]) : 0;
        targetTime += (h * 3600 + m * 60) * 1000;
    }
  }

  try {
    const data = await RoutesService.getWeather(targetTime);
    if (data && data.found) {
        weather.value = data;
    }
  } catch (e) {
    console.error("Failed to fetch weather", e);
  }
}

function onGroupChanged(idx: number) {
  if (groups.value && groups.value[idx]) {
    selectedGrpData.value = groups.value[idx];
    
    // Save to history
    const gName = selectedGrpData.value.nom || selectedGrpData.value.nomCourt;
    if (gName) {
      lastSelectedGroups.value.unshift(gName);
      if (lastSelectedGroups.value.length > 5) lastSelectedGroups.value.pop();
      localStorage.setItem('SELECT', JSON.stringify(lastSelectedGroups.value));
    }
  }
}
</script>

<style scoped>
.select-date :deep(.v-field__input) {
  text-align: center;
  font-weight: bold;
}
</style>
