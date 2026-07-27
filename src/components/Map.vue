<template>
  <div ref="mapContainer" style="height: 100%; min-height: 250px; width: 100%;">
    <l-map ref="map" v-model:zoom="zoom" :center="center" :bounds="bounds" :use-global-leaflet="false">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>
      <l-polyline v-if="polyline" :lat-lngs="polyline" color="red"></l-polyline>
    </l-map>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { LMap, LTileLayer, LPolyline } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '@/stores/mapStore';
import { storeToRefs } from 'pinia';
import { RoutesService } from '@/services/routes.service';

const props = defineProps<{ polylineStr?: string }>();

const zoom = ref(10);
const center = ref<[number, number]>([48.45, -4.25]); // default around Landerneau
const bounds = ref<[[number, number], [number, number]] | null>(null);

const map = ref<typeof LMap | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const mapStore = useMapStore();
const { currentPolyline } = storeToRefs(mapStore);
const polyline = ref<[number, number][]>([]);

function updatePolyline(newVal: string | undefined | null) {
  if (newVal) {
    const decoded = RoutesService.decode(newVal);
    polyline.value = decoded;
    if (decoded.length > 0) {
      const lats = decoded.map(p => p[0]);
      const lons = decoded.map(p => p[1]);
      bounds.value = [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)]
      ];
      if (map.value && map.value.leafletObject) {
          map.value.leafletObject.fitBounds(bounds.value);
      }
    }
  } else {
    polyline.value = [];
    bounds.value = null;
  }
}

watch(() => props.polylineStr, (newVal) => {
  if (newVal !== undefined) updatePolyline(newVal);
});

watch(currentPolyline, (newVal) => {
  if (props.polylineStr === undefined) updatePolyline(newVal);
});

onMounted(() => {
  if (props.polylineStr !== undefined) updatePolyline(props.polylineStr);
  else updatePolyline(currentPolyline.value);

  resizeObserver = new ResizeObserver(() => {
    if (map.value && map.value.leafletObject) {
      map.value.leafletObject.invalidateSize();
      if (bounds.value) {
        setTimeout(() => {
            if (map.value && map.value.leafletObject && bounds.value) {
                map.value.leafletObject.fitBounds(bounds.value);
            }
        }, 50);
      }
    }
  });
  if (mapContainer.value) {
    resizeObserver.observe(mapContainer.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>
