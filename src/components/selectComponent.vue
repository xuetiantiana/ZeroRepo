<template>
  <div>
    <div class="selectComponent">
      <div>
        <span>主题：</span>
        <!-- <el-input
          v-model="subjectValue"
          style="width: 240px"
          placeholder="Please input"
        /> -->
        <el-select
      v-model="subjectValue"
      placeholder="Select subject"
      style="width: 240px"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
      </div>
      <div>
        <span class="demonstration">日期范围: </span>
        <el-date-picker
          v-model="value2"
          type="daterange"
          unlink-panels
          range-separator="To"
          start-placeholder="Start date"
          end-placeholder="End date"
          :shortcuts="shortcuts"
        />
      </div>
      <div>
        <span>相关性：</span>
        <el-input
          v-model="input2"
          style="width: 240px"
          placeholder="Please input"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
const subjectValue = ref("");
const input2 = ref("");

const value2 = ref("");

const options = [
    { label: "HCI", value: "HCI" },
    { label: "Data", value: "Data" },
]
const shortcuts = [
  {
    text: "Last week",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: "Last month",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
  {
    text: "Last 3 months",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    },
  },
];
</script>

<style scoped lang="scss">
.selectComponent {
  margin: 2em 0;
  display: flex;
  gap: 1em 2em;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
  & > div > span {
    margin-right: 10px;
  }
}
</style>
