<template>
  <v-card class="mb-4 elevation-2">
    <v-card-text>
      <div v-if="!elevationData" class="text-center text-body-2 text-grey-darken-1 py-4">
        Pas de données altimétriques pour ce circuit.
      </div>
      <v-chart v-else class="chart" :option="chartOption" autoresize />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useTheme } from 'vuetify';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from 'vue-echarts';
import { provide } from 'vue';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer
]);

const props = defineProps<{
  elevationData?: string | null;
  length?: number;
}>();

const theme = useTheme();

const chartOption = computed(() => {
  if (!props.elevationData) return {};
  
  let points: number[][] = [];
  try {
    points = JSON.parse(props.elevationData);
  } catch (e) {
    console.error("Invalid elevation data", e);
    return {};
  }
  
  const totalKm = (props.length || 0) / 1000;
  const xData: string[] = [];
  const yData: number[] = [];
  
  const numPoints = points.length;
  for (let i = 0; i < numPoints; i++) {
    const point = points[i];
    const alt = point ? point[2] : 0;
    const dist = (i / Math.max(1, numPoints - 1)) * totalKm;
    xData.push(dist.toFixed(1) + ' km');
    yData.push(Math.round(alt || 0));
  }

  const primaryColor = theme.current.value.colors.primary;

  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b} : {c} m'
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLabel: {
        showMaxLabel: true,
        formatter: (value: string) => {
            // Try to simplify labels so it's not crowded
            return value;
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} m'
      },
      min: 'dataMin'
    },
    series: [
      {
        name: 'Dénivelé',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: primaryColor
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: primaryColor
            },
            {
              offset: 1,
              color: 'rgba(211, 47, 47, 0.1)'
            }
          ])
        },
        data: yData
      }
    ]
  };
});
</script>

<style scoped>
.chart {
  height: 200px;
  width: 100%;
}
</style>
