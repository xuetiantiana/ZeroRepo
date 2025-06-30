<script lang="ts" setup>
import { ref, computed, watch, defineProps, nextTick, defineExpose } from "vue";

const props = defineProps({
  currNode: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

// 控制docstring展开状态的响应式对象
const expandedDocstrings = ref(new Set());

// 切换docstring展开状态
const toggleDocstring = (key: string) => {
  if (expandedDocstrings.value.has(key)) {
    expandedDocstrings.value.delete(key);
  } else {
    expandedDocstrings.value.add(key);
  }
};

// 检查docstring是否展开
const isDocstringExpanded = (key: string) => {
  return expandedDocstrings.value.has(key);
};
</script>
<template>
  <div class="modal-body" v-if="currNode && currNode.metaData">
    <div class="info-item">
      <span class="info-label">node:</span>
      <span class="info-value">{{ currNode.metaData.node }}</span>
    </div>
    <div class="info-item">
      <span class="info-label">feature_path:</span>
      <span class="info-value">{{ currNode.metaData.feature_path }}</span>
    </div>
    <div
      v-for="(file_path_item, index1) in currNode.metaData.file_paths"
      :key="index1"
      class="info-item"
    >
      <!-- 先显示非extra的项目 -->
      <template v-for="(value, key, index) in file_path_item" :key="index">
        <div class="info-file_pat_" v-if="key !== 'extra'">
          <span class="info-label">{{ key }}:</span>
          <span class="info-value">{{ value }}</span>
        </div>
      </template>

      <!-- extra项排在最后 -->
      <div v-if="file_path_item.extra" style="margin-top: 0.5em">
        <!-- <span class="info-label">extra:</span> -->
        <template
          v-for="(value2, key2, index2) in file_path_item.extra"
          :key="index2"
        >
          <div
            v-if="key2 == 'docstring'"
            class="info-docstring"
            :class="{ expanded: isDocstringExpanded(`${index1}-${key2}`) }"
          >
            <b>{{ key2 }}: </b>
            <span
              class="docstring-content"
              @click="toggleDocstring(`${index1}-${key2}`)"
            >
              {{ value2 }}
            </span>
          </div>
          <p v-else-if="key2 !== 'methods'">
            <b>{{ key2 }}: </b>
            <span>{{ value2 }}</span>
          </p>

          <div v-else-if="key2 == 'methods'" style="margin-top: 0.5em">
            <b style="margin-top: 0.5em">methods: </b>
            <div
              v-for="(method, methodIndex) in value2"
              :key="methodIndex"
              style="margin-bottom: 0.5em"
            >
              <template v-for="(value, key, index) in method" :key="index">
                <div class="info-file_pat_" v-if="key !== 'docstring'">
                  <span class="info-label">{{ key }}:</span>
                  <span class="info-value">{{ value }}</span>
                </div>
                <div
                  v-else-if="key == 'docstring'"
                  class="info-docstring"
                  :class="{
                    expanded: isDocstringExpanded(
                      `${index1}-${methodIndex}-${key}`
                    ),
                  }"
                >
                  <span class="info-label">{{ key }}:</span>
                  <span
                    class="docstring-content"
                    @click="toggleDocstring(`${index1}-${methodIndex}-${key}`)"
                  >
                    {{ value }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped  lang="scss">
/* ==================== 弹窗样式 ==================== */
.node-model-item {
  width: 100%;
  background: white;
  border: 2px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  min-height: 200px;

  transition: opacity 0.3s ease-in-out;
  margin-top: 1em;
  &:nth-child(1) {
    margin-top: 0;
  }

  .show {
    z-index: 1000;
    opacity: 1;
    pointer-events: auto;
  }

  .modal-header {
    background: #f5f5f5;
    padding: 15px;
    border-bottom: 1px solid #ddd;
    border-radius: 6px 6px 0 0;
    position: relative;
  }

  .modal-title {
    margin: 0;
    font-weight: bold;
    color: #333;
  }

  .close-btn {
    position: absolute;
    right: 10px;
    top: 10px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    width: 30px;
    height: 30px;
    border-radius: 15px;
  }

  .close-btn:hover {
    background: #e0e0e0;
    color: #000;
  }

  .modal-body {
    padding: 15px;
    max-height: 200px;
    overflow-y: auto;
  }
}

/* ==================== Modal内容样式 ==================== */
.info-item {
  margin-bottom: 8px;
  overflow-wrap: break-word; /* 新标准 */
  word-wrap: break-word; /* 兼容旧浏览器 */

  .info-label {
    font-weight: bold;
    color: #555;
  }

  .info-value {
    margin-left: 10px;
    color: #333;
  }
}

.info-docstring {
  .docstring-content {
    cursor: pointer;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.3s ease;

    // &:hover {
    //   color: #007bff;
    // }
  }

  &.expanded .docstring-content {
    display: block;
    -webkit-line-clamp: unset;
    overflow: visible;
    &:hover {
      color: #000;
    }
  }
}
</style>
