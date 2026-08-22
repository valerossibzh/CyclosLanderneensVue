<template>
  <v-card v-if="weather" variant="outlined" class="mb-4 pa-2 bg-light-blue-lighten-5 rounded-lg d-flex flex-column align-center justify-center text-center">
    <div class="d-flex align-center mb-2">
      <v-icon :icon="getWeatherIcon(weather.picture)" size="36" :color="getWeatherColor(weather.picture)" class="mr-2"></v-icon>
      <div class="text-h6 font-weight-bold">{{ weather.temp }} °C</div>
    </div>
    
    <div class="w-100">
      <div class="d-flex align-center justify-center mb-1">
        <v-icon size="small" color="blue-grey" class="mr-1">mdi-weather-windy</v-icon>
        <span class="text-caption font-weight-bold">{{ weather.windSpeed }} km/h</span>
      </div>
      <div v-if="weather.windGust" class="d-flex align-center justify-center text-error mb-1">
        <v-icon size="small" class="mr-1">mdi-weather-windy-variant</v-icon>
        <span class="text-caption font-weight-bold">Rafales: {{ weather.windGust }} km/h</span>
      </div>
      <div class="text-caption font-weight-medium text-blue-grey mt-1">
        Vent : {{ weather.windDir }}
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  weather: any;
}>();

function getWeatherIcon(picture: string) {
  const map: Record<string, string> = {
    'clearday': 'mdi-weather-sunny',
    'partlycloudyday': 'mdi-weather-partly-cloudy',
    'cloudy': 'mdi-weather-cloudy',
    'fog': 'mdi-weather-fog',
    'rain': 'mdi-weather-pouring',
    'snow': 'mdi-weather-snowy',
  };
  return map[picture] || 'mdi-weather-cloudy';
}

function getWeatherColor(picture: string) {
  const map: Record<string, string> = {
    'clearday': 'amber-darken-2',
    'partlycloudyday': 'orange',
    'cloudy': 'grey-darken-1',
    'fog': 'blue-grey-lighten-1',
    'rain': 'blue-darken-2',
    'snow': 'cyan-lighten-2',
  };
  return map[picture] || 'grey';
}
</script>
