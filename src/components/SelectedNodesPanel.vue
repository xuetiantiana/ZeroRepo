<script lang="ts" setup>
import { ref, computed, watch, defineProps, nextTick, defineExpose } from "vue";
import nodeDetailComponent from "@/components/nodeDetailComponent.vue";
import { Close, ArrowDown } from "@element-plus/icons-vue";

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

const emit = defineEmits([
  "removeSelectedNode",
  "clearAllSelectedNodes",
  "handleSelectedNodeClick",
  "handleCurrNodePlusClick",
]);

const removeSelectedNode = (idx) => {
  expandedNodeIds.value.delete(idx); // 删除展开状态
  emit("removeSelectedNode", idx);
};

const clearAllSelectedNodes = () => {
  expandedNodeIds.value.clear(); // 清空所有展开状态
  emit("clearAllSelectedNodes");
  searchValue.value = "";
};

const handleSelectedNodeClick = (idx) => {
  emit("handleSelectedNodeClick", idx);
};

const handleCurrNodePlusClick = (node) => {
  emit("handleCurrNodePlusClick", node);
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
const handleNodeSearch = (selectedIndex) => {
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
};

const expandedNodeIds = ref(new Set());
function toggleNodeBody(nodeId) {
  if (expandedNodeIds.value.has(nodeId)) {
    expandedNodeIds.value.delete(nodeId);
  } else {
    expandedNodeIds.value.add(nodeId);
  }
}

defineExpose({
  handleNodeSearch,
});
</script>
<template>
  <div>
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>ZeroRepo</h2>
      </div>
      <div class="sidebar-content">
        <div class="current-node-box" ref="nodeModalRef">
          <div class="select-node-item" style="">
            <div class="node-header">
              <h3 class="node-title" style="margin-right: 12px">
                <span>CurrNode: &nbsp;</span>
                {{
                  currNode &&
                  typeof currNode === "object" &&
                  Object.keys(currNode).length > 0
                    ? currNode.hasAbbr
                      ? currNode.originalName + " (" + currNode.name + ")"
                      : currNode.metaData.node
                    : "None"
                }}
              </h3>
              <div
                class="plus-button"
                v-if="
                  currNode &&
                  typeof currNode === 'object' &&
                  Object.keys(currNode).length > 0
                "
                @click="handleCurrNodePlusClick(currNode)"
              >
                <span class="icon">{{
                  selectedNodeList.some((node) => node.idx === currNode.idx)
                    ? "-"
                    : "+"
                }}</span>
              </div>
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
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
            padding: 1em 0.5em 0 1em;
            margin: 1em 0.5em;
            border-radius: 15px;
            background: rgba(212, 212, 212, 0.1);
          "
        >
          <div style="">
            <h4 style="margin: 0 0 1em; padding-right: 7px; font-size: 18px">
              Added Nodes ({{ selectedNodeList.length }})

              <el-button
                class="clear-all-btn"
                size="small"
                style="float: right"
                @click="clearAllSelectedNodes"
                >Clear All</el-button
              >
            </h4>
            <div style="margin-right: 7px; margin-bottom: 6px">
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
          </div>
          <div class="selected-nodes-box">
            <div ref="selectedNodesScrollContainer" class="selected-nodes-list">
              <div
                v-for="(currNode, index) in selectedNodeList"
                :key="currNode.idx || index"
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
                    @click="handleSelectedNodeClick(currNode.idx)"
                    class="node-title"
                    :style="{ color: currNode.selectedColor }"
                  >
                    {{
                      currNode.hasAbbr
                        ? currNode.originalName + " (" + currNode.name + ")"
                        : currNode.metaData.node
                    }}
                  </h3>
                  <button
                    class="close-btn"
                    @click="removeSelectedNode(currNode.idx)"
                  >
                    <el-icon><Close /></el-icon>
                  </button>
                </div>
                <div
                  class="node-body"
                  :class="{ expanded: expandedNodeIds.has(currNode.idx) }"
                >
                  <button
                    class="dropdown-btn"
                    @click="toggleNodeBody(currNode.idx)"
                    style="position: absolute; right: 2px; top: 0px; z-index: 2"
                  >
                    <!-- {{ expandedNodeIds.has(currNode.idx) ? '收起' : '显示全部' }} -->
                    <el-icon
                      :style="{
                        transform: expandedNodeIds.has(currNode.idx)
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                      }"
                      ><ArrowDown
                    /></el-icon>
                  </button>
                  <nodeDetailComponent
                    v-if="currNode && currNode.metaData"
                    :currNode="currNode"
                  />
                </div>
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
  font-size: 14px;
  height: 100%;
  width: 100%;
  background: #fff;
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
    padding: 14px 30px;
    h2 {
      color: rgba(255, 255, 255, 1);
      font-family: Segoe UI;
      font-weight: 900;
      font-style: Italic;
      font-size: 24px;
      line-height: 32px;
      -webkit-text-stroke: 2px #0f6cbd;
      text-stroke: 2px #0f6cbd;
    }
  }
  .sidebar-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .current-node-box {
      padding: 1em 0.5em 2em;
      margin: 0 0.5em;
      border-bottom: 1px solid rgba(97, 97, 97, 1);
      .select-node-item {
        background: rgba(0, 120, 212, 1);
        color: #fff;
        border-radius: 15px;
        .node-header h3::after {
          opacity: 0;
        }
        .node-header h3 {
          font-size: 18px;
        }
        .node-body {
          min-height: 100px;
          max-height: 150px;
          overflow: auto;
        }
      }
    }
    .selected-nodes-box {
      padding: 1em 0;
      flex: 1;
      overflow: hidden;
      & > div {
        height: 100%;
        padding-right: 0.5em;
        overflow-y: auto;
      }
    }
  }
}

/* ==================== 弹窗样式 ==================== */
.select-node-item {
  width: 100%;
  background: white;
  border-top: 3px solid rgba(16, 110, 190, 1);
  transition: opacity 0.3s ease-in-out;
  margin-top: 0.5em;
  padding-bottom: 1em;
  &:nth-child(1) {
    margin-top: 0;
  }

  .show {
    z-index: 1000;
    opacity: 1;
    pointer-events: auto;
  }

  .node-header {
    position: relative;
    padding: 15px;
    border-radius: 6px 6px 0 0;
    position: relative;
    h3 {
      cursor: pointer;
      position: relative;
      &::after {
        content: " ";
        display: inline-block;
        width: 3px;
        height: 1.6em;
        position: absolute;
        left: -10px;
        top: -2px;
        background: rgba(70, 54, 104, 1);
      }
    }
  }

  .node-title {
    margin: 0;
    font-weight: bold;
    font-size: 16px;
    padding-right: 1em;
  }

  .close-btn {
    position: absolute;
    right: -2px;
    top: 14px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    width: 28px;
    height: 28px;
    border-radius: 15px;
  }

  .close-btn:hover {
    // background: #e0e0e0;
    // color: #000;
    opacity: 0.8;
  }

  .node-body {
    padding: 0px 15px 0;
    overflow: hidden;
    // max-height: 200px;
    // min-height: 100px;
    // overflow-y: auto;
  }
}

.clear-all-btn {
  background: #fff;
  color: rgb(43, 124, 233);
  border: 1px solid rgb(43, 124, 233);
  height: 30px;
  font-size: 14px;
  border-radius: 8px;
  &:hover {
    opacity: 0.8;
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

:deep(.el-select) {
  --el-fill-color-blank: rgba(230, 230, 230, 1);
  --el-border-radius-base: 12px;
  --el-input-text-color: rgba(66, 66, 66, 1);
  .el-select__wrapper {
    height: 36px;
    border: none;
    outline: none;
    box-shadow: none;
  }
}

/* 加号按钮样式 */
.plus-button {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 25px;
  right: 0px;
  // background-color: #409eff;
  border: 2px solid #fff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  user-select: none;
  transform: translate(-50%, -50%);
  span {
    line-height: 1;
    transform: translateY(-1px);
  }
}

.plus-button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* 加号按钮hover效果 */
.plus-button:hover[style*="background-color: rgb(64, 158, 255)"] {
  background-color: #66b1ff !important;
}

/* 减号按钮hover效果 */
.plus-button:hover[style*="background-color: rgb(245, 108, 108)"] {
  background-color: #f78989 !important;
}

/* 禁用状态按钮hover效果 */
.plus-button:hover[style*="background-color: rgb(144, 147, 153)"] {
  background-color: #a6a9ad !important;
}

.node-body {
  min-height: 100px;
  max-height: 120px;
  overflow-y: hidden;
  position: relative;
  transition: max-height 0.3s;
}
.node-body.expanded {
  max-height: none;
  overflow-y: visible;
}
.dropdown-btn {
  background: #eee;
  border: none;
  border-radius: 4px;
  padding: 2px 5px;
  cursor: pointer;
  font-size: 12px;
}
</style>
