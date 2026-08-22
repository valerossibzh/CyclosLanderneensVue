<template>
  <div class="d-flex mb-4">
    <div class="day-month-container mr-4">
      <div class="vertical-center">
        <div class="day-num">{{ row.dayNum }}</div>
        <div class="month">{{ row.month }}</div>
      </div>
    </div>
    <div class="desc-container d-flex flex-column justify-center">
      <div class="row-date">{{ row.date }}</div>
      <div class="row-title text-primary">{{ row.title }}</div>
      <div class="row-info text-medium-emphasis">{{ row.info }}</div>
    </div>
  </div>
  <v-divider class="mb-4"></v-divider>
</template>

<script setup lang="ts">
export interface CalendarBean {
  dayNum: string;
  month: string;
  date: string;
  title: string;
  info: string;
}

const props = defineProps<{
  row: CalendarBean;
}>();
</script>

<style scoped>
.day-num {
  color: #e63946;
  font-size: large;
  font-weight: bold;
}

.month {
  color: black;
  font-weight: bold;
}

.day-month-container {
  text-align: center;
  border: 2px solid #03a9f4;
  border-radius: 8px;
  position: relative;
  height: 70px;
  width: 75px;
  min-width: 75px;
}

.vertical-center {
  margin: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
}

.desc-container {
  text-align: left;
}

.row-date {
  font-weight: bold;
  font-size: medium;
}

.row-title {
  font-size: medium;
  font-weight: 500;
}

.row-info {
  font-size: small;
}
</style>
