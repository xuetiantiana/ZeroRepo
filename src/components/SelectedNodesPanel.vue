<script lang="ts" setup>
import { ref, computed, watch, defineProps, nextTick, defineExpose } from "vue";
import nodeDetailComponent from "@/components/nodeDetailComponent.vue";

const props = defineProps({
  selectedNodeList: {
    type: Array,
    required: true,
    default: [],
  },
  currNode: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  maxSelectedNodes: {
    type: Number,
    required: true,
    default: 0,
  },
});

const emit = defineEmits(["removeSelectedNode"]);

const removeSelectedNode = (featurePath) => {
  console.log(props.selectedNodeList);
  emit("removeSelectedNode", featurePath);
};

const searchValue = ref("");
const selectedNodesScrollContainer = ref(null);
const nodeItemRefs = ref({});
// 设置节点项的 ref
function setNodeItemRef(el, index) {
  if (el) {
    nodeItemRefs.value[index] = el;
  }
}

// 处理节点搜索
function handleNodeSearch(selectedIndex) {
  if (selectedIndex !== null && selectedIndex !== undefined) {
    nextTick(() => {
      const targetElement = nodeItemRefs.value[selectedIndex];
      if (targetElement && selectedNodesScrollContainer.value) {
        // 直接使用 scrollIntoView，更可靠的滚动方法
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });

        // 备用方法：手动计算偏移量
        // const containerElement = selectedNodesScrollContainer.value;
        // const targetOffsetTop = targetElement.offsetTop;
        // containerElement.scrollTo({
        //   top: targetOffsetTop,
        //   behavior: 'smooth'
        // });
      }
    });
  }
}
</script>
<template>
  <div>
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>ZeroRepo</h2>
      </div>

      <div class="sidebar-content">
        <div class="current-node-box" ref="nodeModalRef">
          <div
            class="select-node-item"
            style="
              border: 2px solid #2b7ce9;
              box-shadow: 0 8px 24px rgba(43, 124, 233, 0.4);
            "
          >
            <div class="node-header">
              <h3 class="node-title">
                <span style="color: #2b7ce9">CurrNode: &nbsp;</span>
                {{
                  currNode && currNode.metaData
                    ? currNode.metaData.node
                    : "节点信息"
                }}
              </h3>
            </div>
            <div class="node-body">
              <nodeDetailComponent
                v-if="currNode && currNode.metaData"
                :currNode="currNode"
              >
              </nodeDetailComponent>
            </div>
          </div>
        </div>

        <div
          style="
            padding: 1em 1em 0;
            border-top: 1px solid #aaa;
            margin-top: 1em;
          "
        >
          <h4 style="margin: 0 0 1em">
            已选择的节点 ({{ selectedNodeList.length }} /
            {{ maxSelectedNodes }})
          </h4>
          <el-select
            v-model="searchValue"
            filterable
            placeholder="Type to search yours added nodes below..."
            clearable
            style="width: 100%"
            @change="handleNodeSearch"
          >
            <el-option
              v-for="(item, index) in selectedNodeList"
              :key="item.id"
              :label="item.metaData?.node || item.label"
              :value="index"
            />
          </el-select>
        </div>
        <div class="selected-nodes-box">
          <div ref="selectedNodesScrollContainer" class="selected-nodes-list">
            <div
              v-for="(currNode, index) in selectedNodeList"
              :key="index"
              :ref="(el) => setNodeItemRef(el, index)"
              class="select-node-item"
            >
              <div
                class="node-header"
                :style="{
                  'border-left': `4px solid ${currNode.selectedColor}`,
                }"
              >
                <h3
                  class="node-title"
                  :style="{ color: currNode.selectedColor }"
                >
                  {{ currNode.metaData.node }}
                </h3>
                <button
                  class="close-btn"
                  @click="removeSelectedNode(currNode.feature_path)"
                >
                  &times;
                </button>
              </div>
              <div class="node-body">
                <nodeDetailComponent
                  v-if="currNode && currNode.metaData"
                  :currNode="currNode"
                >
                </nodeDetailComponent>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped  lang="scss">
/* ==================== 左侧边栏样式 ==================== */
.sidebar {
  
  height: 100%;
  width: 100%;
  background: #f8f9fa;
  border-right: 2px solid #dee2e6;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .sidebar-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0.5em 1em;
    border-bottom: 4px solid #dee2e6;
  }
  .sidebar-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .current-node-box {
      min-height: 200px;
      padding: 1em;
    }
    .selected-nodes-box {
      padding: 1em 0;
      flex: 1;
      overflow: hidden;
      & > div {
        padding: 0 1em;
        height: 100%;
        overflow-y: auto;
      }
    }
  }
}

/* ==================== 弹窗样式 ==================== */
.select-node-item {
  width: 100%;
  background: white;
  border: 2px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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

  .node-header {
    background: #f5f5f5;
    padding: 15px;
    border-bottom: 1px solid #ddd;
    border-radius: 6px 6px 0 0;
    position: relative;
  }

  .node-title {
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

  .node-body {
    padding: 15px;
    max-height: 200px;
    min-height: 150px;
    overflow-y: auto;
  }
}

:deep(.el-radio-group) {
  border-radius: 20px;
  padding: 3px 4px;
  background: #ccc;
  gap: 5px;
  --el-font-size-base: 18px;
  .el-radio-button__inner {
    border: 0 !important;
    border-radius: 20px !important;
    color: #fff;
    background: transparent;
  }
  .is-active {
    .el-radio-button__inner {
      background: #000 !important;
      color: #fff !important;
      // box-shadow:-1px 0 0 0 #000,#fff)
      box-shadow: inset 0 0 0 1px #000 !important  ;
    }
  }
}
</style>
