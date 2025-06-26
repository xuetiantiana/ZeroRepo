<!-- filepath: e:\microsoft_work\ZeroRepo_dev\ZeroRepo\src\components\NetworkVisualization.vue -->
<template>
  <div class="main-container">
    <!-- 左侧关系展示区域 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>ZeroRepo</h2>
        <el-radio-group v-model="showDataFlowGraph">
          <el-radio-button :value="true">Flow</el-radio-button>
          <el-radio-button :value="false">Detail</el-radio-button>
        </el-radio-group>
      </div>

      <div class="sidebar-content">
        <div v-show="showDataFlowGraph">
          <div ref="relationshipNetworkRef" id="relationshipNetwork"></div>
        </div>
        <div class="panal2" v-show="!showDataFlowGraph">
          <!-- 节点信息弹窗 -->
          <div
            class="current-node-box"
            ref="nodeModalRef"
            :class="{ show: modalVisible }"
          >
            <div
              class="node-model-item"
              style="
                border: 2px solid #2b7ce9;
                box-shadow: 0 8px 24px rgba(43, 124, 233, 0.4);
              "
            >
              <div class="modal-header">
                <h3 class="modal-title">
                  CurrNode:<br />
                  {{
                    currNode && currNode.metaData
                      ? currNode.metaData.node
                      : "节点信息"
                  }}
                </h3>
              </div>
              <div class="modal-body" v-if="currNode && currNode.metaData">
                <div class="info-item">
                  <span class="info-label">node:</span>
                  <span class="info-value">{{ currNode.metaData.node }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">feature_path:</span>
                  <span class="info-value">{{
                    currNode.metaData.feature_path
                  }}</span>
                </div>
                <div
                  v-for="(file_pat_item, index1) in currNode.metaData
                    .file_paths"
                  :key="index1"
                  class="info-item"
                >
                  <div
                    class="info-file_pat_"
                    v-for="(value, key, index) in file_pat_item"
                    :key="index"
                  >
                    <span class="info-label">{{ key }}:</span>
                    <span class="info-value">{{ value }}</span>
                  </div>
                </div>
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
            <div ref="selectedNodesScrollContainer">
              <div
                v-for="(currNode, index) in selectedNodeList"
                :key="index"
                :ref="(el) => setNodeItemRef(el, index)"
                class="node-model-item"
              >
                <div
                  class="modal-header"
                  :style="{
                    'border-left': `4px solid ${currNode.selectedColor}`,
                  }"
                >
                  <h3
                    class="modal-title"
                    :style="{ color: currNode.selectedColor }"
                  >
                    {{ currNode.metaData.node }}
                  </h3>
                  <button
                    class="close-btn"
                    @click="removeNodeFromSelectedList(currNode.id)"
                  >
                    &times;
                  </button>
                </div>
                <div class="modal-body" v-if="currNode && currNode.metaData">
                  <div class="info-item">
                    <span class="info-label">node:</span>
                    <span
                      class="info-value"
                      :style="{ color: currNode.selectedColor }"
                      >{{ currNode.metaData.node }}</span
                    >
                  </div>
                  <div class="info-item">
                    <span class="info-label">feature_path:</span>
                    <span class="info-value">{{
                      currNode.metaData.feature_path
                    }}</span>
                  </div>
                  <div
                    v-for="(file_pat_item, index1) in currNode.metaData
                      .file_paths"
                    :key="index1"
                    class="info-item"
                  >
                    <div
                      class="info-file_pat_"
                      v-for="(value, key, index) in file_pat_item"
                      :key="index"
                    >
                      <span class="info-label">{{ key }}:</span>
                      <span class="info-value">{{ value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主可视化区域 -->
    <div ref="mynetworkRef" id="mynetwork"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";

// 引入vis-network (需要安装: npm install vis-network)
import { Network, DataSet } from "vis-network/standalone/esm/vis-network";

// ...existing styles will be in the style section...
const showDataFlowGraph = ref(true);
const selectedNodeList = ref([]);
const currNode = ref();
const searchValue = ref("");
const ColorList = [
  "#71AD8A",
  "#A27BBB",
  "#7186C9",
  "#ACD291",
  "#E195D0",
  "#ED8B5E",
  "#96C8E0",
  "#F3CF7F",
  "#E38380",
  "#C49361",
  "#71AD8A",
  "#A27BBB",
  "#7186C9",
  "#ACD291",
  "#E195D0",
  "#ED8B5E",
  "#96C8E0",
];

// 添加颜色使用追踪
const usedColorIndices = ref(new Set());
let nextColorIndex = 0;

// 添加最大节点数量限制
const MAX_SELECTED_NODES = 10;

// 响应式数据
const relationshipNetworkRef = ref(null);
const mynetworkRef = ref(null);
const nodeModalRef = ref(null);
const selectedNodesScrollContainer = ref(null);
const nodeItemRefs = ref({});
const modalVisible = ref(false);
const modalTitle = ref("节点信息");
const modalContent = ref("");
const modalPosition = ref({ left: 0, top: 0 });

// 全局变量
let mapData = null;
let nodes,
  edges,
  toggleNodeChildren,
  allNodesData,
  allEdgesData,
  nodeChildren,
  nodeParent,
  expandedNodes;
let currentModalNodeId = null;
let selectedNodeId = null;
let graphData = null;
let mainNetwork = null;
let leftNetwork = null;

// 拖拽相关状态
const dragState = ref({
  isDragging: false,
  startX: 0,
  startY: 0,
  initialLeft: 0,
  initialTop: 0,
});

// 添加悬停状态追踪
let hoveredNodeId = null;
let hideIconTimer = null; // 添加延迟隐藏定时器
let isHoveringIcon = false; // 添加图标悬停状态
let iconClickHandled = false; // 添加图标点击处理标志

// 组件挂载时初始化
onMounted(async () => {
  try {
    // 加载数据
    const [jsonResponse, mapResponse] = await Promise.all([
      fetch("./data/webui.json"),
      fetch("./data/map.json").catch(() => null),
    ]);

    if (!jsonResponse.ok) {
      throw new Error(
        `HTTP error loading webui.json! status: ${jsonResponse.status}`
      );
    }

    const jsonData = await jsonResponse.json();

    if (mapResponse && mapResponse.ok) {
      mapData = await mapResponse.json();
      console.log("Successfully loaded map.json:", mapData);
    }

    // 处理数据
    graphData = processData(jsonData);

    // 等待DOM更新
    await nextTick();

    // 生成左侧关系网络图
    generateRelationshipNetwork(jsonData);

    // 创建主网络
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          levelSeparation: 260,
          nodeSpacing: 60,
          treeSpacing: 100,
          direction: "LR",
          sortMethod: "directed",
          shakeTowards: "roots",
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
        },
      },
      interaction: {
        dragNodes: true,
        zoomView: true,
        dragView: true,
        hover: true,
        tooltipDelay: 200,
      },
      physics: {
        enabled: false,
      },
      nodes: {
        borderWidth: 0, // 移除边框
        borderWidthSelected: 0, // 选中时也不显示边框
        shapeProperties: {
          borderRadius: 6,
        },
        font: {
          size: 12,
          face: "Arial, sans-serif",
          color: "#333333",
        },
        shadow: {
          enabled: true,
          color: "rgba(0,0,0,0.2)", // 增强阴影
          size: 8, // 增大阴影尺寸
          x: 3,
          y: 3,
        },
        widthConstraint: { minimum: 60 },
        heightConstraint: { minimum: 20 },
        margin: 5,
        chosen: {
          node: function (values, id, selected, hovering) {
            values.borderWidth = 0; // 确保不显示边框
            if (hovering) {
              values.shadow = true;
              values.shadowSize = 12; // 悬停时增大阴影
              values.shadowColor = "rgba(0,0,0,0.4)";
            }
            if (selected) {
              values.borderWidth = 2;
              values.borderColor = "#2B7CE9"; // 选中时蓝色边框
              values.shadow = true;
              values.shadowSize = 25; // 选中时更大的阴影
              values.shadowColor = "rgba(43, 124, 233, 0.8)"; // 选中时蓝色阴影
            }
          },
          label: false,
        },
      },
      edges: {
        width: 1,
        color: { color: "#848484", highlight: "#505050", hover: "#505050" },
        arrows: {
          to: { enabled: true, scaleFactor: 0.8, type: "arrow" },
        },
        smooth: {
          enabled: true,
          type: "cubicBezier",
          forceDirection: "vertical",
          roundness: 0.2,
        },
        hoverWidth: 1,
        chosen: true,
      },
    };

    mainNetwork = new Network(mynetworkRef.value, graphData, options);

    // 设置自定义节点渲染
    setupCustomNodeRendering();

    // 添加事件监听器
    mainNetwork.on("click", function (params) {
      // 先检查是否点击了图标
      if (handleIconClickCheck(params.event)) {
        return;
      }

      if (params.event.srcEvent) {
        params.event.srcEvent.stopPropagation();
      }

      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];

        mainNetwork.selectNodes([nodeId]);
        selectedNodeId = nodeId;

        const clickedNode = graphData.allNodesData.find((n) => n.id === nodeId);
        if (clickedNode && clickedNode.isExpandButton) {
          handleExpandButtonClick(clickedNode);
          return;
        }

        if (currentModalNodeId === nodeId) {
          closeModal();
          if (
            graphData.nodeChildren[nodeId] &&
            graphData.nodeChildren[nodeId].length > 0
          ) {
            graphData.toggleNodeChildren(nodeId);
          }
          currentModalNodeId = null;
        } else {
          closeModal();

          const hasChildren =
            graphData.nodeChildren[nodeId] &&
            graphData.nodeChildren[nodeId].length > 0;

          if (hasChildren) {
            graphData.toggleNodeChildren(nodeId);

            setTimeout(() => {
              const nodePosition = mainNetwork.getPositions([nodeId]);
              const canvasPosition = mainNetwork.canvasToDOM(
                nodePosition[nodeId]
              );
              showNodeModal(nodeId, graphData.allNodesData, canvasPosition);
              currentModalNodeId = nodeId;
            }, 200);
          } else {
            setTimeout(() => {
              const nodePosition = mainNetwork.getPositions([nodeId]);
              const canvasPosition = mainNetwork.canvasToDOM(
                nodePosition[nodeId]
              );
              showNodeModal(nodeId, graphData.allNodesData, canvasPosition);
              currentModalNodeId = nodeId;
            }, 50);
          }
        }
      } else {
        closeModal();
        currentModalNodeId = null;
        mainNetwork.unselectAll();
        selectedNodeId = null;
      }
    });

    mainNetwork.on("hoverNode", function (params) {
      const nodeId = params.node;
      hoveredNodeId = nodeId; // 记录悬停的节点ID

      // 清除之前的隐藏定时器
      if (hideIconTimer) {
        clearTimeout(hideIconTimer);
        hideIconTimer = null;
      }

      if (
        graphData.nodeChildren[nodeId] &&
        graphData.nodeChildren[nodeId].length > 0
      ) {
        mynetworkRef.value.style.cursor = "pointer";
      }

      // 重新绘制以显示图标
      mainNetwork.redraw();
    });

    mainNetwork.on("blurNode", function (params) {
      // 延迟隐藏图标，给用户时间移动到图标上
      hideIconTimer = setTimeout(() => {
        if (!isHoveringIcon) {
          hoveredNodeId = null; // 清除悬停状态
          mynetworkRef.value.style.cursor = "default";

          // 重新绘制以隐藏图标
          mainNetwork.redraw();
        }
      }, 200); // 200ms 延迟
    });

    // 添加鼠标移动监听，用于检测图标悬停
    mynetworkRef.value.addEventListener("mousemove", handleMouseMove);
  } catch (error) {
    console.error("Error loading or processing JSON data:", error);
    if (mynetworkRef.value) {
      mynetworkRef.value.innerHTML = `<p style="color: red; text-align: center;">Error loading visualization: ${error.message}. Please check the console for more details and ensure webui.json is in the same directory.</p>`;
    }
  }
});

// 绘制节点图标 - 只有悬停时才绘制
function drawNodeIcons(ctx) {
  // 如果没有悬停的节点，则不绘制任何图标
  if (!hoveredNodeId) return;

  const nodePositions = mainNetwork.getPositions();
  const scale = mainNetwork.getScale();

  // 只为悬停的节点绘制图标
  const node = graphData.allNodesData.find((n) => n.id == hoveredNodeId);
  if (!node || node.hidden || !nodePositions[hoveredNodeId]) return;

  // 根节点不显示图标
  if (node.level === 0) return;
  if (node.isExpandButton) return;

  const pos = nodePositions[hoveredNodeId];

  // 获取节点的实际边界框
  const nodeBoundingBox = mainNetwork.getBoundingBox(hoveredNodeId);
  const actualNodeWidth = Math.abs(
    nodeBoundingBox.right - nodeBoundingBox.left
  );
  const actualNodeHeight = Math.abs(
    nodeBoundingBox.bottom - nodeBoundingBox.top
  );

  console.log("实际节点尺寸:", {
    actualNodeWidth,
    actualNodeHeight,
    boundingBox: nodeBoundingBox,
  });

  // 计算图标位置（节点右上角）
  const iconX = pos.x + actualNodeWidth / 2 - 10; // 右上角X位置，向内偏移10像素
  const iconY = pos.y - actualNodeHeight / 2 + 5; // 右上角Y位置，基于实际节点高度计算
  // 图标半径根据缩放调整，保持合适的视觉大小
  const iconRadius = Math.max(6, Math.min(12, 8 * scale)); // 半径在6-12px之间

  console.log("绘制图标位置:", {
    nodePos: pos,
    actualNodeWidth,
    actualNodeHeight,
    iconX,
    iconY,
    iconRadius,
  });

  // 保存当前画布状态
  ctx.save();

  // 绘制图标背景圆形
  ctx.fillStyle = getIconBackgroundColor(node);
  ctx.strokeStyle = getIconBorderColor(node);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(iconX, iconY, iconRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // 绘制图标内容（文字或符号）
  ctx.fillStyle = getIconTextColor(node);
  // 修复字体大小逻辑，使图标文字大小保持相对一致或随缩放正确变化
  const fontSize = Math.max(10, Math.min(16, 12 * scale)); // 字体大小在10-16px之间，根据缩放调整
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const iconText = getNodeIconText(node);
  ctx.fillText(iconText, iconX, iconY);

  // 恢复画布状态
  ctx.restore();

  // 存储图标位置信息用于点击检测
  if (!node.iconInfo) {
    node.iconInfo = {};
  }
  node.iconInfo.position = { x: iconX, y: iconY, radius: iconRadius };
}

// 通用图标点击检测函数
function checkIconClick(clientX, clientY) {
  // 如果没有悬停的节点，则不处理图标点击
  if (!hoveredNodeId) return false;

  // 根节点不处理图标点击
  const hoveredNode = graphData.allNodesData.find((n) => n.id == hoveredNodeId);
  if (!hoveredNode || hoveredNode.level === 0) return false;

  const rect = mynetworkRef.value.getBoundingClientRect();
  const canvasPos = {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };

  // 转换为网络坐标
  const networkPos = mainNetwork.DOMtoCanvas(canvasPos);

  // 检查是否点击了悬停节点的图标
  if (hoveredNode && hoveredNode.iconInfo?.position && !hoveredNode.hidden) {
    const iconPos = hoveredNode.iconInfo.position;
    const distance = Math.sqrt(
      Math.pow(networkPos.x - iconPos.x, 2) +
        Math.pow(networkPos.y - iconPos.y, 2)
    );

    if (distance <= iconPos.radius + 5) {
      // 增加点击容错范围
      return { isIconClick: true, node: hoveredNode };
    }
  }

  return { isIconClick: false };
}

// 处理画布点击事件 - 简化版
function handleCanvasClick(event) {
  // 如果图标点击已经被处理，则不再处理
  if (iconClickHandled) {
    iconClickHandled = false; // 重置标志
    return;
  }

  const result = checkIconClick(event.clientX, event.clientY);
  if (result.isIconClick) {
    handleNodeIconClick(result.node, event);
    event.stopPropagation();
    event.preventDefault();
  }
}

// 检查图标点击（用于主网络点击事件中） - 简化版
function handleIconClickCheck(clickEvent) {
  if (!clickEvent.srcEvent) return false;

  const result = checkIconClick(
    clickEvent.srcEvent.clientX,
    clickEvent.srcEvent.clientY
  );
  if (result.isIconClick) {
    handleNodeIconClick(result.node, clickEvent.srcEvent);
    iconClickHandled = true; // 设置标志，防止重复处理
    return true;
  }

  return false;
}

// 添加鼠标移动事件处理
function handleMouseMove(event) {
  if (!hoveredNodeId) {
    isHoveringIcon = false;
    return;
  }

  const rect = mynetworkRef.value.getBoundingClientRect();
  const canvasPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  // 转换为网络坐标
  const networkPos = mainNetwork.DOMtoCanvas(canvasPos);

  // 检查是否悬停在图标上
  const hoveredNode = graphData.allNodesData.find((n) => n.id == hoveredNodeId);

  // 根节点不处理图标悬停
  if (!hoveredNode || hoveredNode.level === 0) {
    isHoveringIcon = false;
    return;
  }

  if (hoveredNode && hoveredNode.iconInfo?.position) {
    const iconPos = hoveredNode.iconInfo.position;
    const distance = Math.sqrt(
      Math.pow(networkPos.x - iconPos.x, 2) +
        Math.pow(networkPos.y - iconPos.y, 2)
    );

    const wasHoveringIcon = isHoveringIcon;
    isHoveringIcon = distance <= iconPos.radius + 5; // 增加一点容错范围

    // 如果开始悬停图标，清除隐藏定时器
    if (isHoveringIcon && hideIconTimer) {
      clearTimeout(hideIconTimer);
      hideIconTimer = null;
    }

    // 如果不再悬停图标且之前在悬停，启动延迟隐藏
    if (!isHoveringIcon && wasHoveringIcon) {
      hideIconTimer = setTimeout(() => {
        if (!isHoveringIcon) {
          hoveredNodeId = null;
          mynetworkRef.value.style.cursor = "default";
          mainNetwork.redraw();
        }
      }, 200);
    }

    // 新增：检查是否在节点区域内（修复从图标移回节点的问题）
    if (!isHoveringIcon) {
      // 检查是否在节点范围内
      const nodeWidth = hoveredNode.widthConstraint?.minimum || 60;
      const nodeHeight = hoveredNode.heightConstraint?.minimum || 20;
      const nodePos = mainNetwork.getPositions([hoveredNodeId])[hoveredNodeId];

      if (nodePos) {
        const isInNodeArea =
          Math.abs(networkPos.x - nodePos.x) <= nodeWidth / 2 + 5 &&
          Math.abs(networkPos.y - nodePos.y) <= nodeHeight / 2 + 5;

        // 如果鼠标在节点区域内，清除隐藏定时器，确保图标继续显示
        if (isInNodeArea && hideIconTimer) {
          clearTimeout(hideIconTimer);
          hideIconTimer = null;
        }
      }
    }

    // 设置光标样式
    if (isHoveringIcon) {
      mynetworkRef.value.style.cursor = "pointer";
    } else if (
      hoveredNodeId &&
      graphData.nodeChildren[hoveredNodeId] &&
      graphData.nodeChildren[hoveredNodeId].length > 0
    ) {
      mynetworkRef.value.style.cursor = "pointer";
    } else {
      mynetworkRef.value.style.cursor = "default";
    }
  } else {
    isHoveringIcon = false;
  }
}

// 设置自定义节点渲染
function setupCustomNodeRendering() {
  // 监听网络渲染完成事件，在节点右侧绘制图标
  mainNetwork.on("afterDrawing", function (ctx) {
    drawNodeIcons(ctx);
  });

  // 监听画布点击事件，用于图标点击检测
  mynetworkRef.value.addEventListener("click", handleCanvasClick);
}

// 获取节点图标文字
function getNodeIconText(node) {
  // 🏠 📋 📂 📄
  if (node.level === 0) {
    return "🏠"; // 根节点
  } else if (node.isExpandButton) {
    return "+"; // 展开按钮
  } else {
    // 检查节点是否已经在选中列表中
    const isSelected = selectedNodeList.value.some(
      (selectedNode) => selectedNode.id === node.id
    );

    if (isSelected) {
      return "-"; // 已选中的节点显示减号
    } else {
      return "+"; // 未选中的节点显示加号
    }
  }
}

// 获取图标背景色
function getIconBackgroundColor(node) {
  if (node.level === 0) {
    return "#E3F2FD"; // 蓝色系 - 根节点
  } else if (node.isExpandButton) {
    return "#FFF3E0"; // 橙色系 - 展开按钮
  } else {
    // 检查节点是否已经在选中列表中
    const isSelected = selectedNodeList.value.some(
      (selectedNode) => selectedNode.id === node.id
    );

    if (isSelected) {
      return "#FFEBEE"; // 红色系 - 已选中节点（显示减号）
    } else {
      return "#E8F5E8"; // 绿色系 - 未选中节点（显示加号）
    }
  }
}

// 获取图标边框色
function getIconBorderColor(node) {
  if (node.level === 0) {
    return "#2196F3";
  } else if (node.isExpandButton) {
    return "#FF9800";
  } else {
    // 检查节点是否已经在选中列表中
    const isSelected = selectedNodeList.value.some(
      (selectedNode) => selectedNode.id === node.id
    );

    if (isSelected) {
      return "#F44336"; // 红色 - 已选中节点（显示减号）
    } else {
      return "#4CAF50"; // 绿色 - 未选中节点（显示加号）
    }
  }
}

// 获取图标文字颜色
function getIconTextColor(node) {
  return "#333333";
}

// 处理节点图标点击事件
function handleNodeIconClick(node, event) {
  console.log("节点图标被点击:", node.label);

  // 根据节点类型执行不同操作
  if (node.level === 0) {
    // 根节点图标点击 - 展示信息或特殊操作
  } else if (node.isExpandButton) {
    // 展开按钮图标点击
  } else {
    // 检查节点是否已经在选中列表中
    const isSelected = selectedNodeList.value.some(
      (selectedNode) => selectedNode.id === node.id
    );

    if (isSelected) {
      // 如果已选中，则从列表中移除
      removeNodeFromSelectedList(node.id);
    } else {
      // 如果未选中，则添加到选中列表
      addListWithColor(node.id, graphData.allNodesData);
    }
  }

  // 阻止事件冒泡
  event.stopPropagation();
  event.preventDefault();
}

// 获取下一个可用颜色
function getNextAvailableColor() {
  // 如果所有颜色都用完了，重置颜色索引
  if (usedColorIndices.value.size >= ColorList.length) {
    usedColorIndices.value.clear();
    nextColorIndex = 0;
  }

  // 找到下一个未使用的颜色
  while (usedColorIndices.value.has(nextColorIndex)) {
    nextColorIndex = (nextColorIndex + 1) % ColorList.length;
  }

  const colorIndex = nextColorIndex;
  usedColorIndices.value.add(colorIndex);
  nextColorIndex = (nextColorIndex + 1) % ColorList.length;

  return {
    color: ColorList[colorIndex],
    index: colorIndex,
  };
}

// 释放颜色索引
function releaseColorIndex(colorIndex) {
  if (colorIndex !== undefined && colorIndex !== null) {
    usedColorIndices.value.delete(colorIndex);
  }
}

// 带颜色标记的添加到列表函数
function addListWithColor(nodeId, allNodesData) {
  // 检查是否超过最大节点数量
  if (selectedNodeList.value.length >= MAX_SELECTED_NODES) {
    ElMessage({
      message: `最多只能选择 ${MAX_SELECTED_NODES} 个节点`,
      type: "warning",
      duration: 3000,
    });
    return;
  }

  const node = getNodeModalDetail(nodeId, allNodesData);
  if (node) {
    // 检查是否已经存在该节点
    const exists = selectedNodeList.value.some(
      (existingNode) =>
        existingNode.id === node.id && existingNode.path === node.path
    );

    if (!exists) {
      // 获取下一个可用颜色
      const colorInfo = getNextAvailableColor();

      // 为节点添加颜色信息
      node.selectedColor = colorInfo.color;
      node.colorIndex = colorInfo.index;

      // 更新节点在网络中的颜色
      updateNodeColorInNetwork(nodeId, colorInfo.color);

      selectedNodeList.value.unshift(node);
      showDataFlowGraph.value = false; // 切换到详细视图

      // 滚动到列表顶部显示新添加的节点
      nextTick(() => {
        if (selectedNodesScrollContainer.value) {
          selectedNodesScrollContainer.value.scrollTop = 0;
        }
      });

      console.log(
        "节点已添加到列表:",
        node.metaData?.node || node.label,
        "颜色:",
        colorInfo.color
      );
    } else {
      ElMessage({
        message: "节点已存在，未重复添加",
        type: "info",
        duration: 2000,
      });
      console.log("节点已存在，未重复添加:", node.metaData?.node || node.label);
    }
  }
}

// 从selectedNodeList中移除指定节点
function removeNodeFromSelectedList(nodeId) {
  const nodeIndex = selectedNodeList.value.findIndex(
    (selectedNode) => selectedNode.id === nodeId
  );

  if (nodeIndex !== -1) {
    const nodeToRemove = selectedNodeList.value[nodeIndex];

    // 恢复节点原始颜色
    if (nodeToRemove.id) {
      restoreNodeOriginalColor(nodeToRemove.id);
    }

    // 释放颜色索引
    if (nodeToRemove.colorIndex !== undefined) {
      releaseColorIndex(nodeToRemove.colorIndex);
    }

    // 从选中列表中移除节点
    selectedNodeList.value.splice(nodeIndex, 1);

    console.log(
      "节点因隐藏而从列表中移除:",
      nodeToRemove.metaData?.node || nodeToRemove.label
    );
  }
}

// 更新网络中节点的颜色
function updateNodeColorInNetwork(nodeId, color) {
  try {
    // 先保存原始颜色信息（如果还没有保存的话）
    const nodeIndex = graphData.allNodesData.findIndex((n) => n.id === nodeId);
    if (nodeIndex !== -1) {
      const node = graphData.allNodesData[nodeIndex];
      // 如果节点还没有保存原始颜色，则保存当前颜色作为原始颜色
      if (!node.originalColor && node.color) {
        node.originalColor = JSON.parse(JSON.stringify(node.color)); // 深拷贝原始颜色
      }

      // 直接更新allNodesData中的颜色
      node.color = {
        background: color,
        border: color,
        highlight: {
          background: color,
          border: color,
        },
      };
    }

    const nodeUpdate = {
      id: nodeId,
      color: {
        background: color,
        border: color,
        highlight: {
          background: color,
          border: color,
        },
      },
    };

    // 更新网络中的节点
    nodes.update(nodeUpdate);

    console.log("节点颜色已更新:", nodeId, "新颜色:", color);
  } catch (error) {
    console.error("更新节点颜色失败:", error);
  }
}

// 恢复节点原始颜色
function restoreNodeOriginalColor(nodeId) {
  try {
    // 从allNodesData中找到原始节点信息
    const originalNode = graphData.allNodesData.find((n) => n.id === nodeId);
    if (originalNode) {
      // 恢复到原始颜色
      if (originalNode.originalColor) {
        originalNode.color = originalNode.originalColor;
      }

      const nodeUpdate = {
        id: nodeId,
        color: originalNode.color,
      };

      // 更新网络中的节点颜色为原始颜色
      nodes.update(nodeUpdate);
    }
  } catch (error) {
    console.error("恢复节点原始颜色失败:", error);
  }
}

// 显示节点信息
function showNodeInfo(node) {
  const nodePosition = mainNetwork.getPositions([node.id]);
  const canvasPosition = mainNetwork.canvasToDOM(nodePosition[node.id]);
  showNodeModal(node.id, graphData.allNodesData, canvasPosition);
  currentModalNodeId = node.id;
}

// 主数据处理函数
function processData(data) {
  // 初始化变量
  let localNodes = [];
  let localEdges = [];
  let idCounter = 1;
  const nodeNameToId = {};
  let localAllNodesData = [];
  let localAllEdgesData = [];
  let localNodeChildren = {};
  let localNodeParent = {};
  let localExpandedNodes = new Set();

  // 递归添加节点和边
  function addNodesAndEdges(
    obj,
    parentId,
    level = 0,
    parentKey = "",
    parentPath = "",
    rootId = null,
    rootLabel = ""
  ) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentId = idCounter++;
        let nodeLabel = key;
        nodeNameToId[nodeLabel] = currentId;

        const currentPath = parentPath ? `${parentPath}/${key}` : key;

        // 记录父子关系
        if (parentId) {
          if (!localNodeChildren[parentId]) {
            localNodeChildren[parentId] = [];
          }
          localNodeChildren[parentId].push(currentId);
          localNodeParent[currentId] = parentId;
        }

        let nodeTitle = currentPath;
        let nodeShape = "box";
        let nodeColor = {
          border: "#B0C4DE",
          background: "#F0F8FF",
          highlight: { border: "#4682B4", background: "#ADD8E6" },
        };

        // 处理数组类型
        if (Array.isArray(obj[key])) {
          nodeColor = {
            border: "#D3D3D3",
            background: "#F5F5F5",
            highlight: { border: "#A9A9A9", background: "#E0E0E0" },
          };

          let containerNodeData = {
            id: currentId,
            label: nodeLabel,
            originalLabel: nodeLabel,
            title: `${currentPath}`,
            path: currentPath,
            shape: nodeShape,
            color: nodeColor,
            font: { size: 14, bold: true },
            level: level,
            widthConstraint: { minimum: 101, maximum: 101 },
            hidden: true,
            isArrayContainer: true,
            rootId: rootId,
            rootLabel: rootLabel,
          };
          localAllNodesData.push(containerNodeData);

          if (parentId) {
            let edgeData = { from: parentId, to: currentId, hidden: true };
            localAllEdgesData.push(edgeData);
          }

          // 为数组元素创建叶子节点
          obj[key].forEach((item, index) => {
            const itemId = idCounter++;
            const itemLabel =
              typeof item === "string" ? item : `Item ${index + 1}`;
            const itemPath = `${currentPath}/${itemLabel}`;

            if (!localNodeChildren[currentId]) {
              localNodeChildren[currentId] = [];
            }
            localNodeChildren[currentId].push(itemId);
            localNodeParent[itemId] = currentId;

            let itemNodeData = {
              id: itemId,
              label: itemLabel,
              title: `${itemPath}`,
              path: itemPath,
              shape: "box",
              color: {
                border: "#FFD700",
                background: "#FFFACD",
                highlight: { border: "#DAA520", background: "#FFFFE0" },
              },
              font: { size: 14, bold: true },
              level: level + 1,
              hidden: true,
              heightConstraint: { minimum: 20 },
              widthConstraint: { minimum: 101, maximum: 101 },
              rootId: rootId,
              rootLabel: rootLabel,
            };
            localAllNodesData.push(itemNodeData);

            let itemEdgeData = { from: currentId, to: itemId, hidden: true };
            localAllEdgesData.push(itemEdgeData);
          });
        }
        // 处理对象类型
        else if (typeof obj[key] === "object" && obj[key] !== null) {
          nodeColor = {
            border: "#D3D3D3",
            background: "#F5F5F5",
            highlight: { border: "#A9A9A9", background: "#E0E0E0" },
          };

          let nodeData = {
            id: currentId,
            label: nodeLabel,
            title: `${currentPath}`,
            path: currentPath,
            shape: nodeShape,
            color: nodeColor,
            font: { size: 14, bold: true },
            level: level,
            widthConstraint: { minimum: 101, maximum: 101 },
            hidden: true,
            rootId: rootId,
            rootLabel: rootLabel,
          };

          if (Object.keys(obj[key]).length > 0) {
            nodeData.originalLabel = nodeLabel;
          }

          localAllNodesData.push(nodeData);
          if (parentId) {
            let edgeData = { from: parentId, to: currentId, hidden: true };
            localAllEdgesData.push(edgeData);
          }
          addNodesAndEdges(
            obj[key],
            currentId,
            level + 1,
            nodeLabel,
            currentPath,
            rootId,
            rootLabel
          );
        }
      }
    }
  }

  // 处理子树数据
  if (data.subtrees && Array.isArray(data.subtrees)) {
    data.subtrees.forEach((subtree, index) => {
      const subtreeRootId = idCounter++;
      const subtreeLabel = subtree.name || "Unnamed Subtree";
      let mainNodeColor = {
        border: "#6495ED",
        background: "#E6E6FA",
        highlight: { border: "#4149E1", background: "#D8BFD8" },
      };

      let nodeData = {
        id: subtreeRootId,
        label: subtreeLabel,
        originalLabel: subtreeLabel,
        title: `${subtreeLabel}`,
        file_path: subtree.file_path || "N/A",
        shape: "box",
        color: mainNodeColor,
        font: { size: 16, bold: true, color: "#000" },
        margin: 10,
        widthConstraint: { minimum: 150, maximum: 150 },
        heightConstraint: { minimum: 20, maximum: 20 },
        level: 0,
        hidden: false,
        sortOrder: index,
        rootId: subtreeRootId,
        rootLabel: subtreeLabel,
        // 添加图标相关配置
        showIcon: true,
        iconType: "root",
      };
      localAllNodesData.push(nodeData);
      nodeNameToId[subtreeLabel] = subtreeRootId;

      if (subtree.refactored_subtree) {
        addNodesAndEdges(
          subtree.refactored_subtree,
          subtreeRootId,
          1,
          subtreeLabel,
          subtreeLabel,
          subtreeRootId,
          subtreeLabel
        );
      }
    });
  }

  // 初始化可见节点和边
  const visibleNodes = localAllNodesData.filter((node) => !node.hidden);
  const visibleEdges = localAllEdgesData.filter((edge) => !edge.hidden);

  // 展开/收起功能实现
  function localToggleNodeChildren(nodeId) {
    const children = localNodeChildren[nodeId];
    if (!children) return;

    const isExpanded = localExpandedNodes.has(nodeId);

    if (isExpanded) {
      localExpandedNodes.delete(nodeId);
      hideNodeAndDescendants(nodeId);
    } else {
      localExpandedNodes.add(nodeId);
      showDirectChildren(nodeId);
    }

    updateNetworkDisplay();
  }

  function hideNodeAndDescendants(nodeId) {
    const children = localNodeChildren[nodeId];
    if (!children) return;

    const expandButtonsToRemove = [];

    children.forEach((childId) => {
      const nodeIndex = localAllNodesData.findIndex((n) => n.id === childId);
      if (nodeIndex !== -1) {
        const childNode = localAllNodesData[nodeIndex];

        if (childNode.isExpandButton) {
          expandButtonsToRemove.push({
            nodeId: childId,
            parentId: childNode.parentId,
          });
        } else {
          localAllNodesData[nodeIndex].hidden = true;

          // 当节点被隐藏时，从selectedNodeList中移除该节点
          removeNodeFromSelectedList(childId);
        }
      }

      localAllEdgesData.forEach((edge) => {
        if (edge.from === nodeId && edge.to === childId) {
          edge.hidden = true;
        }
      });

      if (localExpandedNodes.has(childId)) {
        localExpandedNodes.delete(childId);
      }

      const childNode = localAllNodesData.find((n) => n.id === childId);
      if (!childNode || !childNode.isExpandButton) {
        hideNodeAndDescendants(childId);
      }
    });

    // 移除扩展按钮
    expandButtonsToRemove.forEach((buttonInfo) => {
      const buttonIndex = localAllNodesData.findIndex(
        (n) => n.id === buttonInfo.nodeId
      );
      if (buttonIndex !== -1) {
        localAllNodesData.splice(buttonIndex, 1);
      }

      const edgeIndex = localAllEdgesData.findIndex(
        (edge) => edge.to === buttonInfo.nodeId
      );
      if (edgeIndex !== -1) {
        localAllEdgesData.splice(edgeIndex, 1);
      }

      if (localNodeChildren[buttonInfo.parentId]) {
        const childIndex = localNodeChildren[buttonInfo.parentId].indexOf(
          buttonInfo.nodeId
        );
        if (childIndex !== -1) {
          localNodeChildren[buttonInfo.parentId].splice(childIndex, 1);
        }
      }

      delete localNodeParent[buttonInfo.nodeId];
    });
  }

  function showDirectChildren(nodeId) {
    const children = localNodeChildren[nodeId];
    if (!children) return;

    const parentNode = localAllNodesData.find((n) => n.id === nodeId);

    if (parentNode && parentNode.isArrayContainer && children.length > 3) {
      const maxVisible = 3;
      const visibleChildren = children.slice(0, maxVisible);
      const hiddenCount = children.length - maxVisible;

      visibleChildren.forEach((childId) => {
        const nodeIndex = localAllNodesData.findIndex((n) => n.id === childId);
        if (nodeIndex !== -1) {
          localAllNodesData[nodeIndex].hidden = false;
        }

        localAllEdgesData.forEach((edge) => {
          if (edge.from === nodeId && edge.to === childId) {
            edge.hidden = false;
          }
        });
      });

      const expandButtonId = idCounter++;
      const expandButtonNode = {
        id: expandButtonId,
        label: `+${hiddenCount} 更多...`,
        title: `点击显示剩余 ${hiddenCount} 个项目`,
        shape: "box",
        color: {
          border: "#FFD700",
          background: "#FFFACD",
          highlight: { border: "#DAA520", background: "#FFFFE0" },
        },
        font: { size: 14, bold: true },
        level: parentNode.level + 1,
        hidden: false,
        widthConstraint: { minimum: 101, maximum: 101 },
        heightConstraint: { minimum: 20 },
        isExpandButton: true,
        parentId: nodeId,
        hiddenChildren: children.slice(maxVisible),
      };

      localAllNodesData.push(expandButtonNode);

      if (!localNodeChildren[nodeId]) {
        localNodeChildren[nodeId] = [];
      }
      localNodeChildren[nodeId].push(expandButtonId);
      localNodeParent[expandButtonId] = nodeId;

      const expandButtonEdge = {
        from: nodeId,
        to: expandButtonId,
        hidden: false,
        color: { color: "#848484" },
        dashes: true,
      };
      localAllEdgesData.push(expandButtonEdge);
    } else {
      children.forEach((childId) => {
        const nodeIndex = localAllNodesData.findIndex((n) => n.id === childId);
        if (nodeIndex !== -1) {
          localAllNodesData[nodeIndex].hidden = false;
        }

        localAllEdgesData.forEach((edge) => {
          if (edge.from === nodeId && edge.to === childId) {
            edge.hidden = false;
          }
        });
      });
    }
  }

  function updateNetworkDisplay() {
    // 应用选中节点的颜色到localAllNodesData
    localAllNodesData.forEach((node) => {
      // 检查该节点是否在selectedNodeList中
      const selectedNode = selectedNodeList.value.find(
        (selected) => selected.id === node.id
      );

      if (selectedNode && selectedNode.selectedColor) {
        // 如果节点已被选中，应用选中的颜色
        node.color = {
          background: selectedNode.selectedColor,
          border: selectedNode.selectedColor,
          highlight: {
            background: selectedNode.selectedColor,
            border: selectedNode.selectedColor,
          },
        };
      } else if (node.originalColor) {
        // 如果节点未被选中但有原始颜色，恢复原始颜色
        node.color = node.originalColor;
      }
    });

    const visibleNodes = localAllNodesData.filter((node) => !node.hidden);
    const visibleEdges = localAllEdgesData.filter((edge) => !edge.hidden);

    localNodes.update(visibleNodes);
    localEdges.update(visibleEdges);

    const currentNodeIds = new Set(localNodes.getIds());
    const newNodes = visibleNodes.filter(
      (node) => !currentNodeIds.has(node.id)
    );
    if (newNodes.length > 0) {
      localNodes.add(newNodes);
    }

    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    const nodesToRemove = localNodes
      .getIds()
      .filter((id) => !visibleNodeIds.has(id));
    if (nodesToRemove.length > 0) {
      localNodes.remove(nodesToRemove);
    }

    const currentEdgeIds = new Set(localEdges.getIds());
    const newEdges = visibleEdges.filter(
      (edge) => !currentEdgeIds.has(edge.id || `${edge.from}-${edge.to}`)
    );
    if (newEdges.length > 0) {
      localEdges.add(newEdges);
    }

    const visibleEdgeIds = new Set(
      visibleEdges.map((edge) => edge.id || `${edge.from}-${edge.to}`)
    );
    const edgesToRemove = localEdges.getIds().filter((id) => {
      const edge = localEdges.get(id);
      return (
        !visibleEdgeIds.has(id) &&
        !visibleEdgeIds.has(`${edge.from}-${edge.to}`)
      );
    });
    if (edgesToRemove.length > 0) {
      localEdges.remove(edgesToRemove);
    }
  }

  // 创建DataSet实例
  localNodes = new DataSet(visibleNodes);
  localEdges = new DataSet(visibleEdges);

  // 赋值给全局变量
  nodes = localNodes;
  edges = localEdges;
  toggleNodeChildren = localToggleNodeChildren;
  allNodesData = localAllNodesData;
  allEdgesData = localAllEdgesData;
  nodeChildren = localNodeChildren;
  nodeParent = localNodeParent;
  expandedNodes = localExpandedNodes;

  return {
    nodes: localNodes,
    edges: localEdges,
    toggleNodeChildren: localToggleNodeChildren,
    allNodesData: localAllNodesData,
    allEdgesData: localAllEdgesData,
    nodeChildren: localNodeChildren,
    nodeParent: localNodeParent,
    expandedNodes: localExpandedNodes,
  };
}

// 显示节点弹窗
function getNodeModalDetail(nodeId, allNodesData) {
  let NodeModalDetail = null;
  const node = allNodesData.find((n) => n.id === nodeId);
  if (!node) return;
  // 处理 map.json 内容
  if (mapData) {
    const nodeLabel = node.originalLabel || node.label;
    const rootNodeLabel = node.rootLabel || nodeLabel;
    const isRootNode = node.level === 0;

    if (!isRootNode) {
      const searchData = mapData.metadata || mapData;
      if (searchData[rootNodeLabel]) {
        const rootData = searchData[rootNodeLabel];

        if (Array.isArray(rootData)) {
          let matchedItem = rootData.find((item) => {
            if (typeof item === "object" && item !== null) {
              const nodeMatch = item.node === nodeLabel;
              const pathMatch = `${item.feature_path}` === node.title;
              return nodeMatch && pathMatch;
            }
            return false;
          });

          if (matchedItem) {
            console.log(node, NodeModalDetail);
            NodeModalDetail = node;
            NodeModalDetail.metaData = matchedItem;
          }
        } else if (typeof rootData === "object") {
        } else if (typeof rootData === "string") {
        }
      }
    }
  }
  return NodeModalDetail;
}

// 显示节点弹窗
function showNodeModal(nodeId, allNodesData, nodePosition) {
  let nodeDetasil = getNodeModalDetail(nodeId, allNodesData);
  if (!nodeDetasil) {
    console.warn("Node details not found for ID:", nodeId);
    return;
  }
  currNode.value = nodeDetasil;
  modalVisible.value = true;
}

// 关闭弹窗
function closeModal() {
  modalVisible.value = false;
  currentModalNodeId = null;
}

// 生成左侧关系网络图
function generateRelationshipNetwork(data) {
  if (!data.subtrees || !data.data_flow_graph) {
    console.warn("Missing subtrees or data_flow_graph data");
    return;
  }

  const nodes = [];
  const edges = [];

  const customOrder = [
    "Workflow",
    "Data Engineering",
    "Algorithms",
    "Advanced Modeling Techniques",
  ];

  const nodeNames = data.subtrees.map((s) => s.name);
  const orderedNodeNames = [];

  customOrder.forEach((customName) => {
    if (nodeNames.includes(customName)) {
      orderedNodeNames.push(customName);
    }
  });

  nodeNames.forEach((nodeName) => {
    if (!customOrder.includes(nodeName)) {
      orderedNodeNames.push(nodeName);
    }
  });

  const nodePositions = calculateCirclePositions(orderedNodeNames.length, 220);

  orderedNodeNames.forEach((nodeName, index) => {
    const subtree = data.subtrees.find((s) => s.name === nodeName);
    if (subtree) {
      nodes.push({
        id: nodeName,
        label: nodeName,
        x: nodePositions[index].x,
        y: nodePositions[index].y,
        color: {
          border: "#6495ED",
          background: "#E6E6FA",
          highlight: { border: "#4149E1", background: "#D8BFD8" },
        },
        font: { size: 14, color: "#000", bold: true },
        shape: "box",
        widthConstraint: { minimum: 130, maximum: 130 },
        heightConstraint: { minimum: 40, maximum: 60 },
        fixed: true,
      });
    }
  });

  data.data_flow_graph.forEach((flow) => {
    edges.push({
      from: flow.from,
      to: flow.to,
      arrows: "to",
      label: flow.data_type,
      font: {
        align: "middle",
        size: 10,
        color: "#000",
        strokeWidth: 2,
        strokeColor: "#ffffff",
        background: "#ffffff",
      },
      color: { color: "#5A97F2" },
    });
  });

  const container = relationshipNetworkRef.value;
  const networkData = { nodes: new DataSet(nodes), edges: new DataSet(edges) };

  const options = {
    layout: {
      randomSeed: 2,
    },
    edges: {
      arrows: {
        to: { enabled: true, scaleFactor: 0.6 },
      },
    },
    physics: {
      enabled: true,
      stabilization: { iterations: 100 },
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.1,
        springLength: 150,
        springConstant: 0.04,
        damping: 0.09,
        avoidOverlap: 0.5,
      },
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
    },
    nodes: {
      font: { size: 14 },
    },
  };

  leftNetwork = new Network(container, networkData, options);

  // 添加左侧节点点击事件
  leftNetwork.on("click", function (params) {
    if (params.nodes.length > 0) {
      const clickedNodeName = params.nodes[0];

      if (graphData && mainNetwork) {
        const rightNode = graphData.allNodesData.find(
          (node) => node.label === clickedNodeName && node.level === 0
        );

        if (rightNode) {
          mainNetwork.unselectAll();
          mainNetwork.selectNodes([rightNode.id]);
          selectedNodeId = rightNode.id;

          const nodePosition = mainNetwork.getPositions([rightNode.id]);
          const canvasPosition = mainNetwork.canvasToDOM(
            nodePosition[rightNode.id]
          );

          closeModal();

          const hasChildren =
            nodeChildren[rightNode.id] && nodeChildren[rightNode.id].length > 0;

          if (hasChildren) {
            toggleNodeChildren(rightNode.id);

            setTimeout(() => {
              showNodeModal(
                rightNode.id,
                graphData.allNodesData,
                canvasPosition
              );
              currentModalNodeId = rightNode.id;
            }, 200);
          } else {
            setTimeout(() => {
              showNodeModal(
                rightNode.id,
                graphData.allNodesData,
                canvasPosition
              );
              currentModalNodeId = rightNode.id;
            }, 50);
          }
        }
      }
    }
  });

  // 悬停事件处理
  leftNetwork.on("hoverNode", function (params) {
    const hoveredNodeId = params.node;
    const connectedEdges = leftNetwork.getConnectedEdges(hoveredNodeId);
    const allEdges = networkData.edges.getIds();

    container.style.cursor = "pointer";

    const hoveredNode = networkData.nodes.get(hoveredNodeId);
    const updatedNode = {
      ...hoveredNode,
      color: {
        border: "#4149E1",
        background: "#D8BFD8",
        highlight: { border: "#4149E1", background: "#D8BFD8" },
      },
    };
    networkData.nodes.update(updatedNode);

    const updatedEdges = allEdges.map((edgeId) => {
      const edge = networkData.edges.get(edgeId);
      const isConnected = connectedEdges.includes(edgeId);

      return {
        ...edge,
        color: {
          color: isConnected ? "#1A5FB4" : "#5A97F2",
          highlight: "#1A5FB4",
          hover: "#1A5FB4",
        },
        font: {
          align: "middle",
          size: 10,
          color: isConnected ? "#000" : "transparent",
          strokeWidth: 2,
          strokeColor: isConnected ? "#ffffff" : "transparent",
          background: isConnected ? "#ffffff" : "transparent",
          bold: isConnected,
        },
        width: 1,
      };
    });

    networkData.edges.update(updatedEdges);
  });

  leftNetwork.on("blurNode", function (params) {
    const allEdges = networkData.edges.getIds();

    container.style.cursor = "default";

    const blurredNode = networkData.nodes.get(params.node);
    const restoredNode = {
      ...blurredNode,
      color: {
        border: "#6495ED",
        background: "#E6E6FA",
        highlight: { border: "#4149E1", background: "#D8BFD8" },
      },
    };
    networkData.nodes.update(restoredNode);

    const restoredEdges = allEdges.map((edgeId) => {
      const edge = networkData.edges.get(edgeId);
      return {
        ...edge,
        color: {
          color: "#5A97F2",
          highlight: "#1A5FB4",
          hover: "#1A5FB4",
        },
        font: {
          align: "middle",
          size: 10,
          color: "#000",
          strokeWidth: 2,
          strokeColor: "#ffffff",
          background: "#ffffff",
          bold: false,
        },
        width: 1,
      };
    });

    networkData.edges.update(restoredEdges);
  });
}
// 计算环形位置
function calculateCirclePositions(nodeCount, radius) {
  const positions = [];
  const angleStep = (2 * Math.PI) / nodeCount;
  const startAngle = -Math.PI;

  for (let i = 0; i < nodeCount; i++) {
    const angle = startAngle + i * angleStep;
    positions.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  return positions;
}

// 处理扩展按钮点击
function handleExpandButtonClick(expandButtonNode) {
  const parentId = expandButtonNode.parentId;
  const hiddenChildren = expandButtonNode.hiddenChildren;

  hiddenChildren.forEach((childId) => {
    const nodeIndex = allNodesData.findIndex((n) => n.id === childId);
    if (nodeIndex !== -1) {
      allNodesData[nodeIndex].hidden = false;
    }

    allEdgesData.forEach((edge) => {
      if (edge.from === parentId && edge.to === childId) {
        edge.hidden = false;
      }
    });
  });

  const buttonIndex = allNodesData.findIndex(
    (n) => n.id === expandButtonNode.id
  );
  if (buttonIndex !== -1) {
    allNodesData.splice(buttonIndex, 1);
  }

  const edgeIndex = allEdgesData.findIndex(
    (edge) => edge.to === expandButtonNode.id
  );
  if (edgeIndex !== -1) {
    allEdgesData.splice(edgeIndex, 1);
  }

  if (nodeChildren[parentId]) {
    const childIndex = nodeChildren[parentId].indexOf(expandButtonNode.id);
    if (childIndex !== -1) {
      nodeChildren[parentId].splice(childIndex, 1);
    }
  }

  nodes.remove(expandButtonNode.id);
  const edgeToRemove = edges
    .get()
    .find((edge) => edge.to === expandButtonNode.id);
  if (edgeToRemove) {
    edges.remove(edgeToRemove.id);
  }

  const visibleNodes = allNodesData.filter((node) => !node.hidden);
  const visibleEdges = allEdgesData.filter((edge) => !edge.hidden);

  nodes.update(visibleNodes);
  edges.update(visibleEdges);
}

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

<style scoped lang="scss">
/* ==================== 基础样式 ==================== */
.main-container {
  display: flex;
  width: 100%;
  height: 100vh;
  padding: 0;
  font-size: 14px;
}

/* ==================== 左侧边栏样式 ==================== */
.sidebar {
  max-width: 600px;
  width: 35%;
  background: #f8f9fa;
  border-right: 2px solid #dee2e6;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
  position: relative;
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
    .panal2 {
      height: 100%;
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
}

#relationshipNetwork {
  width: 100%;
  height: calc(100vh - 80px);
  padding-top: 20px;
  box-sizing: border-box;
}

/* ==================== 主网络容器和图标样式 ==================== */
#mynetwork {
  flex: 1;
  height: 100vh;
  border: 1px solid lightgray;

  /* 确保画布可以正确处理点击事件 */
  canvas {
    outline: none;
    cursor: default;
  }

  /* 悬停时显示指针光标（通过JS控制） */
  &.icon-hover {
    cursor: pointer !important;
  }
}

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

/* ==================== Map.json 内容样式 ==================== */
:deep(.map-content) {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

:deep(.map-content-title) {
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

:deep(.map-content-body) {
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-family: "Consolas", "Monaco", monospace;
}

/* ==================== 图标相关样式提示 ==================== */
.node-icon-info {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}
</style>