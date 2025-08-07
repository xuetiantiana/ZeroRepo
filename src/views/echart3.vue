<!-- filepath: e:\microsoft_work\ZeroRepo_dev\ZeroRepo\src\components\NetworkVisualization.vue -->
<template>
  <div class="">
    <div style="height: 100vh">
      <div id="viewport" style="display: flex">
        <selected-nodes-panel
          ref="selectedNodesPanelRef"
          style="width: 20%; min-width: 300px; max-width: 600px"
          :selectedNodeList="selectedNodeList"
          :maxSelectedNodes="maxSelectedNodes"
          :currNode="currNode"
          @removeSelectedNode="removeSelectedNode"
          @clearAllSelectedNodes="clearAllSelectedNodes"
          @updateMaxNodes="updateMaxNodes"
          @handleSelectedNodeClick="handleSelectedNodeClick"
          @handleCurrNodePlusClick="handleCurrNodePlusClick"
        ></selected-nodes-panel>
        <div id="wrapper" style="flex: 1; overflow: hidden; height: 100%">
          <div id="echart" style="width: 100%; height: 100%"></div>
          <!-- 独立的加号/减号按钮 -->
          <div
            id="plusButton"
            class="plus-button"
            style="display: none"
            @click="handlePlusClick"
          >
            <span class="icon">+</span>
          </div>

          <div
            class="showAllNodes"
            style="position: absolute; right: 20px; top: 15px; z-index: 1000;"
          >
            <el-button
              style="width: 120px"
              color="rgb(43, 124, 233)"
              type="primary"
              @click="showAllNodes(isShowAllNodes)"
              >{{
                isShowAllNodes ? "Close All Nodes" : "Show All Nodes"
              }}</el-button
            >
          </div>
          <div style="position: absolute; right: 150px; top: 15px; z-index: 1000;">
            <el-button
              class="center-view-btn"
              style="width: 120px"
              color="rgb(43, 124, 233)"
              @click="centerEchart"
            >
              Center View</el-button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

import { hancelData, getMaxDepth } from "@/util/util";
import SelectedNodesPanel from "@/components/SelectedNodesPanel.vue";

// 正确引入 ECharts
import * as echarts from "echarts";

const selectedNodesPanelRef = ref();

let treeRoot = null; // 保存完整树结构
let graphData = { nodes: [], links: [] }; // Graph 数据结构
let scaleNum = 1;
let myChart = null;
let isDraggingOrZooming = false; // 标记是否正在拖拽或缩放
let currentHoverNode = null; // 当前悬停的节点
let plusButton = null; // 加号按钮DOM元素
const selectedNodeList = ref([]);
const maxSelectedNodes = ref(1000000); // 最多可选择的节点数量
const currNode = ref();

let initialTranslateX = 0; //记录初始echart的偏移，当视图拖动时候，根据这个数据判断是否拖拽超过一定范围
let initialTranslateY = 0;

let GolbalFilteredTree = [];

// 监听最大选择数量的变化
watch(maxSelectedNodes, (newValue, oldValue) => {
  console.log(`最大选择数量从 ${oldValue} 变更为 ${newValue}`);

  // 如果当前选择的节点数量超过新的限制，截断列表
  if (selectedNodeList.value.length > newValue) {
    const removedNodes = selectedNodeList.value.slice(newValue);
    selectedNodeList.value = selectedNodeList.value.slice(0, newValue);
    console.log("由于限制变更，移除了以下节点:", removedNodes);
    alert(`由于限制变更，已移除 ${removedNodes.length} 个节点`);
  }
});
let echartWidth = 1000;
let echartHeight = 1000;
onMounted(() => {
  echartWidth = document.getElementById("echart").getBoundingClientRect().width;
  echartHeight = document
    .getElementById("echart")
    .getBoundingClientRect().height;
  const minScreenSize = Math.min(echartWidth, echartHeight);

  scaleNum = Math.max(2500 / minScreenSize, 1);

  // 获取加号按钮DOM元素并设置事件
  plusButton = document.getElementById("plusButton");
  setupPlusButtonEvents();
  console.log(
    "屏幕尺寸：",
    echartWidth,
    echartHeight,
    2500 / minScreenSize,
    scaleNum
  );

  // 获取 DOM 元素
  const chartDom = document.getElementById("echart");
  if (!chartDom) return;
  myChart = echarts.init(chartDom);

  // myChart.showLoading();
  Promise.all([
    fetch("./data/webui.json").then((res) => res.json()),
    fetch("./data/map.json").then((res) => res.json()),
  ])
    .then(([webuiData, mapData]) => {
      // 两个数据都拿到了
      console.log("webui:", webuiData);
      console.log("map:", mapData);

      // 设置根节点之间的连线
      setDataFlowGraph(webuiData.data_flow_graph);

      const convertedData = hancelData(webuiData, mapData);
      treeRoot = convertedData; // 保存完整树结构

      // 转换为 Graph 数据格式

      updateVisibleNodes(1); // 只显示根和第二层
      graphData = convertTreeToGraph(treeRoot); // 只显示可见节点和线

      initGraphChart(myChart);

      // 在这里使用 webuiData 和 chartData
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
  // 可选：组件卸载时销毁实例
  onUnmounted(() => {
    myChart.dispose();
  });
});

const isShowAllNodes = ref(false);
const showAllNodes = (level) => {
  isShowAllNodes.value = !isShowAllNodes.value;
  level = isShowAllNodes.value ? 5 : 1;
  updateVisibleNodes(level);
  graphData = convertTreeToGraph(treeRoot);
  myChart.setOption({
    series: [{ data: graphData.nodes, links: graphData.links }],
  });
  myChart.setOption({
    series: [
      {
        center: [0, 0],
      },
    ],
  });
};
const dataFlowGraph = [];
const setDataFlowGraph = (data_flow_graph) => {
  data_flow_graph.forEach((flow) => {
    const fromId = flow.from;
    const toId = flow.to;
    if (fromId && toId) {
      const edgeData = {
        source: "1_" + fromId,
        target: "1_" + toId,
        type: "rootLink",
        content: flow,
        label: {
          show: true,
          formatter: flow.data_type || flow.label || "",
          color: "#000",
          fontSize: 9,
          position: "middle",
        },
        lineStyle: {
          color: "#000",
          width: 1,
          type: "dashed",
          opacity: 1,
        },
        symbol: ["circle", "arrow"], // 线尾显示箭头
        symbolSize: [4, 8], // 箭头大小
      };
      dataFlowGraph.push(edgeData);
    }
  });
  console.log(dataFlowGraph);
};

function createFourHiddenNodesFunc(distance) {
  const positions = [
    { name: "test1", x: distance, y: distance },
    { name: "test2", x: -distance, y: -distance },
    { name: "test3", x: -distance, y: distance },
    { name: "test4", x: distance, y: -distance },
  ];
  console.log("Dddd");
  return positions.map((cfg) => ({
    ...cfg,
    id: cfg.name,
    itemStyle: { opacity: 0 },
    label: { show: false },
  }));
}

const createFourHiddenNodes = createFourHiddenNodesFunc(680);

// 根据level设置节点距离圆心的距离
const getRadiusForLevel = (level) => {
  const radiusMap = {
    0: 0, // 根节点在中心
    1: 125, // 第一层距离中心80px
    2: 215, // 第二层距离中心160px
    3: 310, // 第三层距离中心240px
    4: 400, // 第四层距离中心320px
    5: 500, // 第五层距离中心380px
  };

  // 如果level超过6，使用level 6的距离，或者可以继续递增
  return radiusMap[level] || 420 + (level - 6) * 40;
};

// 定义每一圈的颜色（5层蓝色主色调，突出 #0078D4，层级递进更明显）
const ringColors = [
  "#686759", // root/中心，最深
  "#0068B8",
  "#62BDE4",
  "#52E0FC",
  "#86DCF8",
  "#BAD7F3",
];

// 定义每个模块node连线的颜色
const lineColors = {
  "Advanced Modeling Techniques": "#FF8364",
  Algorithms: "#5414E9",
  Workflow: "#00C6A2",
  "Data Engineering": "#0368FF",
};

const getSymbolSize = (level) => {
  let size;
  if (level == 0) {
    size = 5;
  } else if (level == 1) {
    size = 100 / scaleNum;
  } else if (level == 2) {
    size = 80 / scaleNum;
  } else if (level == 3) {
    size = 70 / scaleNum;
  } else if (level == 4) {
    size = 38 / scaleNum;
  } else {
    size = 30 / scaleNum;
  }
  return size;
};

const getItemStyle = (level, node) => {
  console.log("!!@@@@", node, currNode.value);
  if (level <= 1) {
    return {
      color: ringColors[level % ringColors.length],
      borderColor: ringColors[level % ringColors.length],
      borderWidth: 0.5,
      opacity: 1,
    };
  } else {
    let shadow = false;
    if (currNode.value && currNode.value.idx == node.idx) {
      shadow = true;
    }
    return {
      color: ringColors[level % ringColors.length],
      borderColor: ringColors[level % ringColors.length],
      borderWidth: 0.5,
      // opacity: 1,
      shadowColor: shadow ? "#0068B8" : "transparent",
      shadowBlur: 20,
    };
  }
};

const getLineStyle = (level, node) => {
  return {
    // color:  level == 1 ? "rgba(0,0,0,.1)" : ringColors[level % ringColors.length],
    color:
      level == 1
        ? "rgba(0,0,0,.1)"
        : lineColors[node.level1Root] || "rgba(0,0,0,.4)",
    width: 1,
  };
};

const getLabelStyle = (
  level,
  angle = 0,
  labelText = "",
  radius = 0,
  pointPosition
) => {
  if (level >= 5) {
    // 让文本始终朝外，旋转角度与节点到圆心的方向一致
    let deg = (angle * 180) / Math.PI;
    // console.log("!!!!", "angle", angle, "deg", deg, "x和y坐标", pointPosition);
    const offite_xy = getExtendedPoint(
      0,
      0,
      pointPosition?.x + 0,
      pointPosition?.y + 0,
      100,
      labelText
    );
    const r = getSymbolSize(5);
    const dd = deg > 90 && deg < 270 ? 180 - deg : -deg;
    return {
      show: true,
      position: [offite_xy.dx + r, offite_xy.dy + r], // 以节点为锚点
      fontSize: 10,
      color: "#333",
      fontWeight: "normal",
      align: "center",
      verticalAlign: "middle",
      rotate: deg > 90 && deg < 270 ? 180 - deg : -deg,
      // color :(deg > 90 && deg < 270) ? 'red' : 'blue',
      // offset: [
      //   // label在圆环上的坐标减去节点坐标，得到偏移
      //   10 / scaleNum/2,
      //   10 / scaleNum/2,
      // ],
    };
  }
  let obj = {};
  if (level == 0) {
    obj = {
      fontSize: 12,
      color: "#333",
      fontWeight: "normal",
    };
  } else {
    obj = {
      position: "inside",
      fontSize: level === 1 ? 12 : 11,
      color: level == 1 ? "#fff" : "#333",
      verticalAlign: "middle",
      align: "center",
      fontWeight: level === 1 ? "bold" : "normal",
      width: 200,
      // rotate: 0,
    };
  }
  return obj;
};

function measureTextWidth(text, fontSize = 10, fontFamily = "Arial") {
  const canvas =
    measureTextWidth._canvas ||
    (measureTextWidth._canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = `${fontSize}px ${fontFamily}`;
  const width = context.measureText(text).width;
  // console.log("width", text, width);
  return width;
}

const getExtendedPoint = (x0, y0, x1, y1, r = 30, labelText) => {
  // 估算label长度（每字符约7px，最小30px）
  // const minOffset = 30;
  const charWidth = 3;
  const labelLen = labelText.length * charWidth;
  // console.log("width2", labelLen);
  r = measureTextWidth(labelText) / 2 + 25;
  // console.log("labelText", labelText.length, r);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);
  const offsetX = Math.cos(angleRad) * r;
  const offsetY = Math.sin(angleRad) * r;
  return {
    dx: offsetX,
    dy: offsetY,
    angleDeg: angleDeg,
  };
};

// 将树形数据转换为 Graph 数据格式
const convertTreeToGraph = (treeData) => {
  // 递归过滤不可见节点
  function filterVisible(node) {
    if (!node || node.visible === false) return null;
    const filtered = { ...node };
    if (filtered.children && Array.isArray(filtered.children)) {
      filtered.children = filtered.children
        .map(filterVisible)
        .filter((child) => !!child);
    }
    return filtered;
  }
  const filteredTree = filterVisible(treeData); // 只处理可见节点
  console.log("开始转换为 Graph 数据格式 treeData", filteredTree);
  GolbalFilteredTree = filteredTree;

  const nodes = [];
  const links = [];
  const nodeMap = new Map(); // 用于快速查找节点

  // 计算子树的叶子节点数量（用于角度权重分配）
  // level越高，权重衰减越多
  function countLeaves(node, currentLevel = 0) {
    // 获取当前level的权重值
    function getLevelWeight(level) {
      // ==================== 策略1: 线性衰减（温和） ====================
      // 公式: Math.max(0.2, 1.0 - level * 0.2)
      // 特点: 每层权重线性递减0.2，衰减平缓均匀
      // 权重分布: Level 0: 1.0 → Level 1: 0.8 → Level 2: 0.6 → Level 3: 0.4 → Level 4+: 0.2
      // 适用场景: 各层级权重差异不大，保持相对平衡的布局
      // return Math.max(0.2, 1.0 - level * 0.2);

      // ==================== 策略2: 指数衰减（激进）- 当前使用 ====================
      // 公式: Math.max(0.1, Math.pow(0.7, level))
      // 特点: 每层权重乘以0.7，深层权重急剧下降，突出浅层结构
      // 权重分布: Level 0: 1.0 → Level 1: 0.7 → Level 2: 0.49 → Level 3: 0.34 → Level 4: 0.24 → Level 5+: 0.1
      // 适用场景: 突出浅层结构，深层节点占用很少空间，适合层次深的数据
      // return Math.max(0.1, Math.pow(0.7, level));

      // ==================== 策略3: 平方根衰减（平缓） ====================
      // 公式: Math.max(0.3, 1.0 / Math.sqrt(level + 1))
      // 特点: 使用平方根倒数，衰减最平缓，深层节点仍保持较好权重
      // 权重分布: Level 0: 1.0 → Level 1: 0.71 → Level 2: 0.58 → Level 3: 0.5 → Level 4: 0.45 → Level 5+: 0.3
      // 适用场景: 保持较好的层级平衡，深层节点仍有合理权重
      // return Math.max(0.3, 1.0 / Math.sqrt(level + 1));

      // ==================== 策略4: 阶梯衰减（分层明显） ====================
      // 公式: level <= 1 ? 1.0 : level <= 3 ? 0.5 : 0.2
      // 特点: 分层明确，同层级权重相同，层级间差异明显
      // 权重分布: Level 0-1: 1.0 → Level 2-3: 0.5 → Level 4+: 0.2
      // 适用场景: 明确区分层级重要性，同层级节点权重一致
      // return level <= 1 ? 1.0 : level <= 3 ? 0.5 : 0.2;

      // Level 0: 1.0 → Level 1: 0.71 → Level 2: 0.58 → Level 3: 0.5 → Level 4: 0.45 → Level 5+: 0.3
      let num = 1;
      if (level <= 1) {
        num = 1;
      } else if (level == 1) {
        num = 0.75;
      } else if (level == 2) {
        num = 0.5;
      } else if (level == 3) {
        num = 0.3;
      } else if (level == 4) {
        num = 0.25;
      } else {
        num = 0.08;
      }
      return num;
    }

    if (!node.children || node.children.length === 0) {
      // 叶子节点直接返回当前level的权重
      return getLevelWeight(currentLevel);
    }

    // 计算子节点的总权重
    const childrenWeight = node.children.reduce(
      (sum, child) => sum + countLeaves(child, currentLevel + 1),
      0
    );

    // 获取当前level的最小权重（确保有子节点的节点权重不低于同level叶子节点）
    const minWeight = getLevelWeight(currentLevel);

    // 返回子节点权重和最小权重的较大值，避免单子节点权重过低问题
    return Math.max(childrenWeight, minWeight);
  }

  // 递归遍历树形数据，使用严格的扇形分割避免连线交叉
  function traverse(
    node,
    parentId = null,
    level = 0,
    sectorStart = 0,
    sectorEnd = 2 * Math.PI
  ) {
    if (!node || !node.name || node.visible === false) return;
    const nodeId =
      level <= 1
        ? level + "_" + (node.feature_path || node.name)
        : level + "_" + (node.feature_path || node.name) + "_" + node.idx;

    // 根据level获取当前节点应该的径向距离
    const currentRadius = getRadiusForLevel(level);

    // 计算当前节点的位置
    let currentAngle;
    let x = 0,
      y = 0;

    if (level === 0) {
      x = 0;
      y = 0;
      currentAngle = 0;
    } else {
      currentAngle = (sectorStart + sectorEnd) / 2;
      x = Math.cos(currentAngle) * currentRadius;
      y = Math.sin(currentAngle) * currentRadius;
    }

    // 传递label文本和半径给
    const graphNode = {
      id: nodeId,
      idx: node.idx,
      name: node.name || "Unknown",
      originalName: node.originalName ? node.originalName : null,
      hasAbbr: node.hasAbbr,
      feature_path: node.feature_path || "",
      level: level,
      metaData: node.metaData,
      x: x,
      y: y,
      angle: currentAngle,
      sectorStart: sectorStart,
      sectorEnd: sectorEnd,
      fixed: true, // 固定位置，保持径向布局
      symbolSize: node.symbolSize || getSymbolSize(level),
      // symbol: "rect",
      label: getLabelStyle(
        level,
        currentAngle,
        node.name || "",
        currentRadius,
        { x: x, y: y }
      ),
      itemStyle: node.itemStyle || getItemStyle(level, node),
      category: level, // 用于分类着色
    };

    if (level != 0) {
      nodes.push(graphNode);
    }

    nodeMap.set(node.name, nodeId);

    // 创建与父节点的连接
    if (parentId && level >= 2) {
      links.push({
        source: parentId,
        target: nodeId,
        lineStyle: node.lineStyle || getLineStyle(level, node),
        // symbol: ["circle", "arrow"], // 线尾显示箭头
        // symbolSize: [4, 8], // 箭头大小
      });
    }

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      // 计算每个子节点的叶子数量（用于角度权重分配）
      // 传入level+1，因为我们计算的是子节点的权重
      const childWeights = node.children.map((child) =>
        countLeaves(child, level + 1)
      );
      const totalWeight = childWeights.reduce((sum, weight) => sum + weight, 0);

      // 计算当前节点可用的扇形角度范围
      let availableSector = sectorEnd - sectorStart;

      // 为根节点的子节点分配整个圆周
      if (level === 0) {
        availableSector = 2 * Math.PI;
      }

      // 为每个子节点分配严格不重叠的扇形区域
      let currentSectorStart = sectorStart;

      node.children.forEach((child, index) => {
        // 根据权重计算子节点的扇形大小
        const childSectorSize =
          (childWeights[index] / totalWeight) * availableSector;
        const childSectorStart = currentSectorStart;
        const childSectorEnd = currentSectorStart + childSectorSize;

        // 不做 % 2π，直接线性分配，保证不重叠
        traverse(child, nodeId, level + 1, childSectorStart, childSectorEnd);

        // 更新下一个子节点的起始角度
        currentSectorStart = childSectorEnd;
      });
    }
  }

  // 开始遍历，根节点使用整个圆周
  traverse(filteredTree, null, 0, 0, 2 * Math.PI);

  console.log("Graph 节点布局完成，节点数量:", nodes.length, nodes, links);

  if (getMaxDepth(filteredTree) <= 2) {
    dataFlowGraph.forEach((item) => {
      item.label.show = true;
    });
  } else {
    dataFlowGraph.forEach((item) => {
      item.label.show = false;
    });
  }
  let linksResult = [...dataFlowGraph, ...links];

  console.log("!!!linksResult", linksResult);
  return { nodes: [...createFourHiddenNodes, ...nodes], links: linksResult };
};

// 新增：只显示根节点和第二层节点
const updateVisibleNodes = (level_show) => {
  function setVisible(node, level) {
    node.visible = level <= level_show; // 只显示0和1层
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => setVisible(child, level + 1));
    }
  }
  if (treeRoot) setVisible(treeRoot, 0);
};

// 新增：切换某节点的子节点显示/隐藏
const toggleChildrenVisibility = (idx) => {
  function findNode(node, path) {
    if (node.idx === path) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, path);
        if (found) return found;
      }
    }
    return null;
  }
  const node = findNode(treeRoot, idx);
  let wasCollapsed = false;
  if (node && node.children) {
    // 判断是否有隐藏的子节点（即即将展开）
    for (const child of node.children) {
      if (child.visible === false) {
        wasCollapsed = true;
        break;
      }
    }
    node.children.forEach((child) => {
      child.visible = !child.visible;
      // 如果隐藏，则递归隐藏所有后代
      if (!child.visible && child.children) {
        const hideAll = (n) => {
          n.visible = false;
          if (n.children) n.children.forEach(hideAll);
        };
        hideAll(child);
      }
    });
  }
  return wasCollapsed; // 返回是否是展开操作
};

// 新增：使用 Graph 图表的初始化函数
const initGraphChart = (myChart) => {
  // 检查数据是否存在
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    console.error("Graph 数据不存在或为空:", graphData);
    return;
  }

  console.log("初始化 Graph 图表，节点数量:", graphData.nodes.length);

  var option = {
    tooltip: {
      trigger: "item",
      // triggerOn: "none",
      triggerOn: "mousemove",
      extraCssText: "max-width: 400px; white-space: normal;",
      formatter: function (params) {
        // console.log(params);
        if (params.dataType === "node") {
          const nodeData = params.data;
          let content = `<strong>Node: </strong>${
            nodeData.hasAbbr
              ? nodeData.originalName + " (" + nodeData.name + ")"
              : nodeData.name
          } <br/>`;
          if (nodeData.feature_path) {
            content += `<strong>Feature Path: </strong> ${nodeData.feature_path}<br/>`;
          }
          return content;
        }
        // 只显示 rootLink 类型的边的弹窗
        if (
          params.dataType === "edge" &&
          params.data &&
          params.data.type === "rootLink"
        ) {
          let content = `<strong>Flow Graph:</strong><br/>`;
          content += `<strong>From: </strong> ${params.data.content.from}<br/>`;
          content += `<strong>To: </strong> ${params.data.content.to}<br/>`;
          if (params.data.label && params.data.label.formatter) {
            content += `<strong>Data Type: </strong> ${params.data.content.data_type}<br/>`;
          }
          return content;
        }
        // 其它类型的边不显示弹窗
        if (params.dataType === "edge") {
          return "";
        }
        return params.name || "";
      },
    },

    series: [
      {
        type: "graph",
        layout: "none", // 使用固定位置布局
        // roam: true, // 允许缩放和拖动
        roam: "move",
        zoom: scaleNum, // 🌟 默认缩放比例（越小越缩）
        center: [0, 0],
        // scaleLimit: {
        //   min: scaleNum, // 🌟 最小缩放
        //   max: scaleNum, // 🌟 最大缩放
        // },
        data: graphData.nodes,
        links: graphData.links,

        symbol: "circle",
        symbolSize: 30, // 使用默认大小，节点自带的 symbolSize 会覆盖

        label: {
          show: true,
          position: function (params) {
            return params && params.data && params.data.level >= 5
              ? "right"
              : "inside";
          },
          fontSize: function (params) {
            return params && params.data && params.data.level >= 5 ? 10 : 12;
          },
          // overflow: "truncate",
          formatter: function (params) {
            var name = params.name || "";
            if (params && params.data && params.data.level >= 3) {
              return name;
            }
            // 处理长文本换行
            var spaceParts = name.split(" ");
            var lines = [];
            for (var i = 0; i < spaceParts.length; i++) {
              var part = spaceParts[i];
              // if (part.indexOf("-") !== -1) {
              //   var dashParts = part.split("-");
              //   for (var j = 0; j < dashParts.length; j++) {
              //     lines.push(dashParts[j]);
              //     if (j < dashParts.length - 1) lines.push("-");
              //   }
              // } else {
              //   lines.push(part);
              // }

              lines.push(part);
            }
            return lines.join("\n");
          },
        },

        lineStyle: {
          color: "source", // 使用源节点颜色
          curveness: 0,
          width: 1,
        },

        // emphasis: {
        //   // focus: "adjacency",
        //   itemStyle: {
        //     color: '#ff0000'
        //   },
        //   label: {
        //     show: true,
        //     fontWeight: 'bold'
        //   }
        // },

        animationDurationUpdate: 750,
        animationEasingUpdate: "quinticInOut",
        // labelLayout: {
        //   hideOverlap: false,
        // },
        // blur:{
        //   itemStyle:{
        //     opacity:.5
        //   }
        // }
      },
    ],
  };

  myChart.setOption(option);

  // 添加鼠标悬停事件 - 显示加号
  myChart.on("mouseover", function (params) {
    // 如果正在拖拽或缩放，不处理mouseover事件
    // if (isDraggingOrZooming) {
    //   return;
    // }

    if (
      params.componentType === "series" &&
      params.dataType === "node" &&
      params.data.level > 1
    ) {
      // console.log('鼠标进入了节点（或节点label）:', params.name);

      const currentNodeIdx = params.data.idx;

      // 清除任何待执行的隐藏操作
      clearTimeout(hideTimeout);

      // 如果是同一个节点（包括从节点到标签的移动），不需要重新显示加号
      if (lastHoverNodeIdx === currentNodeIdx) {
        return;
      }

      // 更新最后hover的节点路径
      lastHoverNodeIdx = currentNodeIdx;

      showPlusButton(params.data);
    }
  });

  // 添加鼠标离开事件 - 延迟隐藏加号
  myChart.on("mouseout", function (params) {
    if (
      params.componentType === "series" &&
      params.dataType === "node" &&
      params.data.level > 1
    ) {
      // console.log('鼠标移出了节点:', params.name);

      const currentNodeIdx = params.data.idx;

      // 只有当前hover的节点才处理mouseout事件
      if (lastHoverNodeIdx !== currentNodeIdx) {
        return;
      }

      // 清除之前的超时
      clearTimeout(hideTimeout);
      // 延迟隐藏，给用户时间移动到加号上
      hideTimeout = setTimeout(() => {
        // 再次检查是否还在同一个节点上（防止快速移动导致的问题）
        if (lastHoverNodeIdx === currentNodeIdx && !isMouseOverPlusButton()) {
          hidePlusButton();
          lastHoverNodeIdx = null; // 重置路径
        }
      }, 200); // 适中的延迟时间
    }
  });

  // let timer2 = null;
  // // 监听拖拽开始事件 - 隐藏加号

  // let lastTransform = myChart
  //   .getModel()
  //   .getSeriesByIndex(0)
  //   .coordinateSystem.getRoamTransform();

  // 获取初始偏移量
  setTimeout(() => {
    const seriesModel = myChart.getModel().getSeriesByIndex(0);
    const transform = seriesModel.coordinateSystem.getRoamTransform();
    [, , , , initialTranslateX, initialTranslateY] = transform;

    console.log("初始偏移量:", { initialTranslateX, initialTranslateY });
  }, 100);

  myChart.on("graphRoam", function () {
    // 设置拖拽/缩放状态
    isDraggingOrZooming = true;

    // 拖拽或缩放时隐藏加号
    hidePlusButton();

    // 延迟重置状态，确保拖拽/缩放操作完成
    setTimeout(() => {
      isDraggingOrZooming = false;
      console.log("拖拽/缩放结束");
    }, 300); // 300ms延迟，可以根据需要调整

    // 计算偏移是否到边界，如果是居中视图
    calculateOffsetAndResetGraphPosition();

    // // 缩放的时候重新设置setoption（避免加号图标定位错误）
    // const seriesModel = myChart.getModel().getSeriesByIndex(0);
    // const transform = seriesModel.coordinateSystem.getRoamTransform();
    // let isZoom = false;
    // let isPan = false;
    // // 检查仿射矩阵格式（通常是 [a, b, c, d, tx, ty]）
    // if (Array.isArray(transform) && transform.length === 6) {
    //   const [a, b, c, d, tx, ty] = transform;
    //   const [la, lb, lc, ld, ltx, lty] = lastTransform;

    //   isZoom = a !== la || d !== ld; // a/d 是 scaleX / scaleY
    //   isPan = tx !== ltx || ty !== lty; // tx/ty 是平移
    // } else if (
    //   transform &&
    //   transform.zoom !== undefined &&
    //   transform.position
    // ) {
    //   isZoom = transform.zoom !== lastTransform.zoom;
    //   isPan =
    //     transform.position[0] !== lastTransform.position[0] ||
    //     transform.position[1] !== lastTransform.position[1];
    // }
    // lastTransform = transform;
    // if (isZoom) {
    //   if (timer2) {
    //     clearTimeout(timer2);
    //     timer2 = null;
    //   }

    //   timer2 = setTimeout(() => {
    //     // 重新设置图表选项, fix bug：加号位置错误
    //     console.log("///// 重新设置图表选项");
    //     myChart.setOption({
    //       series: [
    //         {
    //           data: graphData.nodes,
    //           links: graphData.links,
    //         },
    //       ],
    //     });
    //   }, 300);
    // }
  });

  // 监听鼠标按下事件 - 准备拖拽时隐藏加号
  myChart.on("mousedown", function () {
    console.log("mousedown");
    // 设置拖拽状态（预备状态）
    isDraggingOrZooming = true;

    // 鼠标按下时隐藏加号，准备可能的拖拽操作
    hidePlusButton();
  });

  // 监听鼠标抬起事件 - 重置拖拽状态
  myChart.on("mouseup", function () {
    console.log("mouseup");
    // 延迟重置状态，确保操作完成
    setTimeout(() => {
      isDraggingOrZooming = false;
      console.log("鼠标操作结束");
    }, 100);
  });

  // 节点点击事件
  myChart.on("click", function (params) {
    // 节点点击事件
    if (params.dataType === "node") {
      console.log("params.data", params.data);
      if (params.data.level > 1) {
        currNode.value = params.data;
      } else {
        currNode.value = null;
      }

      const idx = params.data.idx;
      toggleChildrenVisibility(idx);
      graphData = convertTreeToGraph(treeRoot);
      myChart.setOption({
        series: [{ data: graphData.nodes, links: graphData.links }],
      });
      centerViewToNode(params.data);
    }
  });
};

// 添加点击 selectedNodeList 项的逻辑
const focusOrExpandNode = (idx) => {
  // 检查节点是否在当前可见的 ECharts 图表中
  console.log(graphData.nodes);
  const node = graphData.nodes.find((n) => n.idx === idx);
  console.log("!!!", idx, node);
  if (node) {
    const index = graphData.nodes.findIndex((n) => n.idx === idx);
    graphData.nodes[index].emphasis = {
      itemStyle: {
        color: "rgb(43, 124, 233)",
      },
      label: {
        fontWeight: "bold",
        color: "#000",
      },
    };
    // 如果节点存在，聚焦到该节点
    myChart.setOption({
      series: [
        {
          center: [node.x, node.y],
          data: graphData.nodes,
        },
      ],
    });

    // centerViewToNode(node)

    myChart.dispatchAction({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: index,
    });
    // 2 秒后取消高亮
    setTimeout(() => {
      myChart.dispatchAction({
        type: "downplay",
        seriesIndex: 0,
        dataIndex: index,
      });
      // 删除 emphasis 属性
      delete graphData.nodes[index].emphasis;

      // 再次 setOption，恢复默认状态
      myChart.setOption({
        series: [
          {
            data: graphData.nodes,
          },
        ],
      });
    }, 2000);

    console.log(`聚焦到节点: ${idx}`);
  } else {
    // 如果节点不存在，逐层展开并查找
    console.log(`节点 ${idx} 不在当前视图中，开始逐层展开`);
    expandAndFocusNode(idx);
  }
};

// 修改 expandAndFocusNode 函数，确保在 treeRoot 中查找节点并展开其祖先节点及兄弟节点
const expandAndFocusNode = (idx) => {
  let found = false;

  const findNodeAndExpandBranch = (node, targetIdx) => {
    if (!node) return false;

    // 如果找到目标节点
    if (node.idx === targetIdx) {
      node.visible = true;
      return true;
    }

    // 遍历子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (findNodeAndExpandBranch(child, targetIdx)) {
          // 如果子节点中找到目标节点，设置当前节点及其所有子节点为可见
          node.visible = true;
          node.children.forEach((sibling) => {
            sibling.visible = true; // 展开兄弟节点
          });
          return true;
        }
      }
    }

    return false;
  };

  const expandLayer = () => {
    if (found) return;

    // 在 treeRoot 中查找目标节点并展开其祖先节点及兄弟节点
    found = findNodeAndExpandBranch(treeRoot, idx);

    if (found) {
      // 如果找到目标节点，更新图表数据并聚焦
      graphData = convertTreeToGraph(treeRoot); // 更新图表数据
      myChart.setOption({
        series: [
          {
            data: graphData.nodes,
            links: graphData.links,
          },
        ],
      });
      focusOrExpandNode(idx); // 聚焦到目标节点
    } else {
      // 如果还未找到，继续展开
      // setTimeout(expandLayer, 500); // 延迟展开，避免阻塞
    }
  };

  expandLayer();
};

// 监听 selectedNodeList 点击事件
const handleSelectedNodeClick = (idx) => {
  console.log("22", idx);
  focusOrExpandNode(idx);
};

const calculateOffsetAndResetGraphPosition = () => {
  let depth = getMaxDepth(GolbalFilteredTree);
  console.log("depth", depth);

  const seriesModel = myChart.getModel().getSeriesByIndex(0);
  const transform = seriesModel.coordinateSystem.getRoamTransform();

  // 获取当前平移量
  const [, , , , translateX, translateY] = transform;

  // 判断是否超出范围
  // const maxOffset = 1400;
  const echartContentWidth = (1500 / 5) * (depth - 1);
  const maxOffsetW = Math.min(
    (echartContentWidth - echartWidth) / 2 + echartWidth,
    echartContentWidth
  );
  const maxOffsetH = Math.min(
    (echartContentWidth - echartHeight) / 2 + echartHeight,
    echartContentWidth
  );

  let adjustedTranslateX = translateX;
  let adjustedTranslateY = translateY;
  console.log(echartWidth, echartHeight);

  if (Math.abs(translateX - initialTranslateX) > maxOffsetW) {
    adjustedTranslateX =
      translateX > initialTranslateX
        ? initialTranslateX + maxOffsetW
        : initialTranslateX - maxOffsetW;
  }

  if (Math.abs(translateY - initialTranslateY) > maxOffsetH) {
    adjustedTranslateY =
      translateY > initialTranslateY
        ? initialTranslateY + maxOffsetH
        : initialTranslateY - maxOffsetH;
  }
  console.log("&&", translateX, translateY);
  console.log(
    "x移动了多少",
    Math.abs(translateX - initialTranslateX),
    "最多可拖拽",
    maxOffsetW
  );
  console.log(
    "y移动了多少",
    Math.abs(translateY - initialTranslateY),
    "最多可拖拽",
    maxOffsetH
  );

  // 如果需要调整，则强制回退到合法范围
  if (adjustedTranslateX !== translateX || adjustedTranslateY !== translateY) {
    centerEchart();
    console.log(
      "aaa",
      adjustedTranslateX - translateX,
      adjustedTranslateY - translateY
    );
    // myChart.dispatchAction({
    //   type: "graphRoam",
    //   zoom: 2,
    //   dx: adjustedTranslateX - translateX,
    //   dy: adjustedTranslateY - translateY,
    // });
  }
};

const centerEchart = () => {
  myChart.setOption({
    series: [
      {
        center: [0, 0],
        data: graphData.nodes,
      },
    ],
  });
  setTimeout(() => {
    myChart.setOption({
      series: [
        {
          data: graphData.nodes,
        },
      ],
    });
  }, 150);
};

// 新增：自动居中视图到点击节点
function centerViewToNode(node) {
  if (!myChart || !node) return;
  // 获取当前节点的像素坐标
  console.log("@@@", node);
  const pixel = myChart.convertToPixel({ seriesIndex: 0 }, [node.x, node.y]);
  const chartDom = myChart.getDom();
  const chartWidth = chartDom.offsetWidth;
  const chartHeight = chartDom.offsetHeight;

  // 判断节点是否在边缘（距离边界小于阈值）
  const zoom = myChart.getModel().getSeriesByIndex(0).option.zoom;
  const edgeThreshold = 80 * zoom; // px
  const [px, py] = pixel;
  let needMove = false;
  if (
    px < edgeThreshold ||
    px > chartWidth - edgeThreshold ||
    py < edgeThreshold ||
    py > chartHeight - edgeThreshold
  ) {
    needMove = true;
  }

  if (needMove) {
    console.log("needMove");
    // 计算需要偏移的中心
    // 目标中心为节点的逻辑坐标
    // myChart.setOption({
    //   series: [{
    //     center: [
    //       node.x,
    //       node.y,
    //     ]
    //   }]
    // });

    const { x, y } = node;
    const distance = Math.sqrt(x * x + y * y);
    if (distance === 0) return; // 原点不移动
    // 计算目标点（圆心方向偏移100距离）
    const targetDistance = Math.max(0, distance - 200 / zoom);
    const ratio = targetDistance / distance;
    const targetX = x * ratio;
    const targetY = y * ratio;
    // 设置画布中心为目标点，实现偏移
    myChart.setOption({
      series: [
        {
          center: [targetX, targetY],
          // center: [node.x, node.y],
        },
      ],
    });

    // myChart.dispatchAction({
    //   type: 'graphRoam',
    //   dx: 100, // x方向平移100像素
    //   dy: 100   // y方向平移50像素
    // });
  }
}

// 加号逻辑
const handleCurrNodePlusClick = (currNode) => {
  const isSelected = selectedNodeList.value.some(
    (node) => node.idx === currNode.idx
  );
  if (isSelected) {
    selectedNodeList.value = selectedNodeList.value.filter(
      (node) => node.idx !== currNode.idx
    );
  } else {
    selectedNodeList.value.unshift(currNode);
    selectedNodesPanelRef.value.handleNodeSearch(0);
  }
};

// 处理加号/减号按钮点击
const handlePlusClick = () => {
  if (currentHoverNode && currentHoverNode.level <= 1) {
    return;
  }
  if (currentHoverNode) {
    const idx = currentHoverNode.idx;

    // 检查节点是否已经在选择列表中
    const isSelected = selectedNodeList.value.some((node) => node.idx === idx);

    if (isSelected) {
      // 如果已选择，从列表中移除
      console.log("点击减号，移除节点:", currentHoverNode);
      selectedNodeList.value = selectedNodeList.value.filter(
        (node) => node.idx !== idx
      );
    } else {
      // 检查是否超过最大选择数量
      if (selectedNodeList.value.length >= maxSelectedNodes.value) {
        alert(`最多只能选择 ${maxSelectedNodes.value} 个节点！`);
        return;
      }

      // 如果未选择且未超过限制，添加到列表中
      console.log("点击加号，添加节点:", currentHoverNode);
      selectedNodeList.value.unshift(currentHoverNode);
      selectedNodesPanelRef.value.handleNodeSearch(0);
      console.log("!!!!", selectedNodeList);
    }

    console.log("当前选择的节点列表:", selectedNodeList.value);

    // 更新按钮状态
    showPlusButton(currentHoverNode);
  }
};

// 显示加号/减号按钮
const showPlusButton = (nodeData) => {
  if (!plusButton || isDraggingOrZooming) return;

  try {
    // 检查节点是否已经在选择列表中
    const isSelected = selectedNodeList.value.some(
      (node) => node.idx === nodeData.idx
    );

    // 将节点的逻辑坐标转换为像素坐标
    const pixelPoint = myChart.convertToPixel("series", [
      nodeData.x,
      nodeData.y,
    ]);
    const nodeSize = nodeData.symbolSize || 30;
    console.log(pixelPoint);

    // 计算按钮位置（节点右上角）
    // const offsetX = nodeSize / 2 + nodeSize/3;
    // const offsetY = -nodeSize / 2 - nodeSize/3;

    const seriesModel = myChart.getModel().getSeriesByIndex(0);
    const transform = seriesModel.coordinateSystem.getRoamTransform();
    let zoom = 1;
    if (Array.isArray(transform) && transform.length === 6) {
      // 如果是仿射矩阵格式 [a, b, c, d, tx, ty]
      zoom = transform[0]; // a 是 scaleX，通常等于 scaleY
    } else if (transform && typeof transform.zoom === "number") {
      zoom = transform.zoom;
    }
    const offsetX = (nodeSize / 2) * zoom * Math.sin(Math.PI / 4);
    const offsetY = (-nodeSize / 2) * zoom * Math.sin(Math.PI / 4);

    plusButton.style.left = pixelPoint[0] + offsetX + "px";
    plusButton.style.top = pixelPoint[1] + offsetY + "px";
    plusButton.style.display = "flex";

    // 根据选择状态显示不同的图标和样式
    if (isSelected) {
      plusButton.getElementsByClassName("icon")[0].textContent = "−"; // 减号
      plusButton.style.backgroundColor = "#f56c6c"; // 红色背景
      plusButton.title = "点击取消选择";
    } else {
      // 检查是否已达到最大选择数量
      if (selectedNodeList.value.length >= maxSelectedNodes.value) {
        plusButton.getElementsByClassName("icon")[0].textContent = "+"; // 仍然显示加号
        plusButton.style.backgroundColor = "#909399"; // 灰色背景表示不可选择
        plusButton.title = `已达到最大选择数量 (${selectedNodeList.value.length}/${maxSelectedNodes.value})`;
      } else {
        plusButton.getElementsByClassName("icon")[0].textContent = "+"; // 加号
        plusButton.style.backgroundColor = "#409eff"; // 蓝色背景
        plusButton.title = `点击选择节点 (${selectedNodeList.value.length}/${maxSelectedNodes.value})`;
      }
    }

    currentHoverNode = nodeData;
  } catch (error) {
    console.error("显示按钮失败:", error);
  }
};

// 隐藏加号按钮
const hidePlusButton = () => {
  clearTimeout(hideTimeout); // 清除任何待执行的隐藏操作
  if (plusButton) {
    plusButton.style.display = "none";
  }
  currentHoverNode = null;
  lastHoverNodeIdx = null; // 重置路径
};

// 检查鼠标是否在加号按钮上
const isMouseOverPlusButton = () => {
  if (!plusButton) return false;
  return plusButton.matches(":hover");
};

// 检查节点是否已选择
const isNodeSelected = (nodeData) => {
  return selectedNodeList.value.some((node) => node.idx === nodeData.idx);
};

// 从选择列表中移除节点
const removeSelectedNode = (idx) => {
  selectedNodeList.value = selectedNodeList.value.filter(
    (node) => node.idx !== idx
  );
  console.log("移除节点:", idx);
  console.log("当前选择的节点列表:", selectedNodeList.value);
};

const clearAllSelectedNodes = () => {
  selectedNodeList.value = [];
};

// 更新最大选择节点数量（从组件传来的事件）
const updateMaxNodes = (newMaxNodes) => {
  maxSelectedNodes.value = newMaxNodes;
  console.log("从组件更新最大选择节点数量为:", newMaxNodes);
};

// 为加号按钮添加鼠标事件
const setupPlusButtonEvents = () => {
  if (!plusButton) return;

  // 鼠标进入加号按钮
  plusButton.addEventListener("mouseenter", () => {
    console.log("鼠标进入加号按钮");
    // 鼠标在加号上时，保持显示状态
    clearTimeout(hideTimeout);
  });

  // 鼠标离开加号按钮
  plusButton.addEventListener("mouseleave", () => {
    console.log("鼠标离开加号按钮");
    // 立即隐藏加号
    hidePlusButton();
  });
};

// 用于管理隐藏延迟的变量
let hideTimeout = null;
let lastHoverNodeIdx = null; // 记录最后hover的节点路径
</script>

<style scoped lang="scss">
.header {
  h3 {
    margin: 10px 0;
    text-align: center;
  }
}

/* 控制面板样式 */
.control-panel {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 0 20px 10px 20px;
  border: 1px solid #e9ecef;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-item label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.max-nodes-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.max-nodes-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.selection-status {
  font-size: 14px;
  color: #666;
}

.status-full {
  color: #f56c6c;
  font-weight: 500;
}

#viewport {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

#wrapper {
  width: 100%;
  height: 100%;
}
// #wrapper {
//   width: 200%;
//   height: 200%;
//   transform-origin: top left;
//   position: absolute;
//   left: 50%;
//   top: 50%;
//   /* ✅ 向左上反向平移缩放后图像一半的尺寸 */
//   transform: translate(-25%, -25%) scale(0.5);
// }

#echart {
  width: 100%;
  height: 100%;
}

/* 加号按钮样式 */
.plus-button {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
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

#wrapper {
  position: relative;
}
.center-view-btn {
  background: #fff;
  color: rgb(43, 124, 233);
  border: 1px solid rgb(43, 124, 233);
  &:hover {
    opacity: 0.8;
  }
}
</style>