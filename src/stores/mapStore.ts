import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMapStore = defineStore('map', () => {
  const currentPolyline = ref<any>(null);

  function notifyMapPolyline(data: any) {
    currentPolyline.value = data;
  }

  return { currentPolyline, notifyMapPolyline };
});
