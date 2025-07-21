<!-- filepath: e:\microsoft_work\ZeroRepo_dev\ZeroRepo\src\components\NetworkVisualization.vue -->
<template>
  <div class="">
    <div class="header">
      <h3>ECharts Graph 图表 (无交叉扇形布局)</h3>

      <div id="viewport">
        <div id="wrapper">
          <div id="echart" style="width: 100%; height: 100%"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";

import { hancelData, getMaxDepth } from "@/util/util";

// 正确引入 ECharts
import * as echarts from "echarts";

let treeRoot = null; // 保存完整树结构
let graphData = { nodes: [], links: [] }; // Graph 数据结构
let scaleNum = 1;

onMounted(() => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minScreenSize = Math.min(width, height);

  scaleNum = Math.max(1666 / minScreenSize, 1);
  console.log("屏幕尺寸：", width, height, 1666 / minScreenSize, scaleNum);

  // 获取 DOM 元素
  const chartDom = document.getElementById("echart");
  if (!chartDom) return;
  const myChart = echarts.init(chartDom);

  // myChart.showLoading();
  fetch("./data/webui.json")
    .then((res) => res.json())
    .then((data) => {
      // 设置根节点之间的连线
      setDataFlowGraph(data.data_flow_graph);

      const convertedData = hancelData(data);
      treeRoot = convertedData; // 保存完整树结构

      // 转换为 Graph 数据格式

      updateVisibleNodes(1); // 只显示根和第二层
      graphData = convertTreeToGraph(treeRoot); // 只显示可见节点和线

      initGraphChart(myChart);
    });

  // 可选：组件卸载时销毁实例
  onUnmounted(() => {
    myChart.dispose();
  });
});

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
          fontSize: 10,
        },
        lineStyle: {
          color: "#000",
          width: 1,
        },
        symbol: ["none", "arrow"], // 线尾显示箭头
        symbolSize: 10, // 箭头大小
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

const createFourHiddenNodes = createFourHiddenNodesFunc(500);

// 定义每一圈的颜色（5层蓝色主色调，突出 #0078D4，层级递进更明显）
const ringColors = [
  "#686759", // root/中心，最深
  "#B04B35", // 红色
  "#E37C05", // 橙色
  "#5F9DBF", // 绿色
  "#568651", // 橄榄绿
  "#B89C80", // 黄色
];

const ringColors2 = [
  "#686759", // root/中心，最深
  "#cfb9b4", // 红色
  "#ebc59a", // 橙色
  "#a4cadf", // 绿色
  "#cdefca", // 橄榄绿
  "#B89C80", // 黄色
];
// const ringColors2 = [
//   "#686759", // root/中心，最深
//   "#b04b354d", // 红色
//   "#e37c055e", // 橙色
//   "#5f9dbf63", // 绿色
//   "#56865169", // 橄榄绿
//   "#B89C80", // 黄色
// ];
const getSymbolSize = (level) => {
  let size;
  if (level == 0) {
    size = 5;
  } else if (level == 1) {
    size = 82 / scaleNum;
  } else if (level <= 4) {
    size = 42 / scaleNum;
  } else {
    size = 5 / scaleNum;
  }
  return size;
};

const getItemStyle = (level) => {
  if (level <= 1) {
    return {
      color: ringColors2[level % ringColors2.length],
      borderColor: ringColors2[level % ringColors2.length],
      borderWidth: 0.5,
    };
  } else {
    return {
      color: ringColors2[level % ringColors2.length],
      borderColor: ringColors2[level % ringColors2.length],
      borderWidth: 0.5,
    };
  }
};

const getLineStyle = (level) => {
  return {
    color:
      level == 1 ? "rgba(0,0,0,.1)" : ringColors[level % ringColors.length],
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
    console.log("!!!!", "angle", angle, "deg", deg, "x和y坐标", pointPosition);
    const offite_xy = getExtendedPoint(
      0,
      0,
      pointPosition?.x,
      pointPosition?.y,
      100,
      labelText
    );
    return {
      show: true,
      position: [offite_xy.dx, offite_xy.dy], // 以节点为锚点
      fontSize: 12,
      color: "#333",
      fontWeight: "normal",
      align: "center",
      verticalAlign: "middle",
      rotate: deg > 90 && deg < 270 ? 180 - deg : -deg,
      // color :(deg > 90 && deg < 270) ? 'red' : 'blue',
      // offset: [
      //   // label在圆环上的坐标减去节点坐标，得到偏移
      //   ddddd.dx,
      //   ddddd.dy
      // ],
      formatter: function (params) {
        var name = params.name || "";
        if (params && params.data && params.data.level >= 5) {
          let newLabel =
            deg > 90 && deg < 270
              ? `{main|${name}    } {sub|}`
              : `{sub|} {main|    ${name}}`;
          return newLabel;
        }
        // 处理长文本换行
        var spaceParts = name.split(" ");
        var lines = [];
        for (var i = 0; i < spaceParts.length; i++) {
          var part = spaceParts[i];
          if (part.indexOf("-") !== -1) {
            var dashParts = part.split("-");
            for (var j = 0; j < dashParts.length; j++) {
              lines.push(dashParts[j]);
              if (j < dashParts.length - 1) lines.push("-");
            }
          } else {
            lines.push(part);
          }
        }
        return lines.join("\n");
      },

      rich: {
        main: {
          fontSize: 10,
          color: "#000",
        },
        sub: {
          fontSize: 10,
          color: "rgba(0, 0, 0, .1)", // ✅ 半透明黑色
          height: -1,
        },
      },
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
      fontSize: 11,
      color: "#333",
      verticalAlign: "middle",
      align: "center",
      fontWeight: level === 1 ? "bold" : "normal",
      width: 200,
      // rotate: 0,
    };
  }
  return obj;
};

const getExtendedPoint = (x0, y0, x1, y1, r = 30, labelText) => {
  // 估算label长度（每字符约7px，最小30px）
  // const minOffset = 30;
  const charWidth = 2.5;
  const labelLen = labelText.length * charWidth;
  r = labelLen;
  console.log("labelText", labelText.length, r);
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

// 根据level设置节点距离圆心的距离
const getRadiusForLevel = (level) => {
  const radiusMap = {
    0: 0, // 根节点在中心
    1: 130, // 第一层距离中心80px
    2: 200, // 第二层距离中心160px
    3: 320, // 第三层距离中心240px
    4: 440, // 第四层距离中心320px
    5: 500, // 第五层距离中心380px
  };

  // 如果level超过6，使用level 6的距离，或者可以继续递增
  return radiusMap[level] || 420 + (level - 6) * 40;
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
      return Math.max(0.2, 1.0 - level * 0.2);

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
    const nodeId = level + "_" + (node.feature_path || node.name);

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
      name: node.name || "Unknown",
      feature_path: node.feature_path || "",
      level: level,
      x: x,
      y: y,
      angle: currentAngle,
      sectorStart: sectorStart,
      sectorEnd: sectorEnd,
      fixed: true, // 固定位置，保持径向布局
      symbolSize: node.symbolSize || getSymbolSize(level),
      label: getLabelStyle(
        level,
        currentAngle,
        node.name || "",
        currentRadius,
        { x: x, y: y }
      ),
      itemStyle: node.itemStyle || getItemStyle(level),
      category: level, // 用于分类着色
    };

    nodes.push(graphNode);
    nodeMap.set(node.name, nodeId);

    // 创建与父节点的连接
    if (parentId) {
      links.push({
        source: parentId,
        target: nodeId,
        lineStyle: node.lineStyle || getLineStyle(level),
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
      item.label.color = "#000";
    });
  } else {
    dataFlowGraph.forEach((item) => {
      item.label.color = "transparent";
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
const toggleChildrenVisibility = (featurePath) => {
  function findNode(node, path) {
    if (node.feature_path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, path);
        if (found) return found;
      }
    }
    return null;
  }
  const node = findNode(treeRoot, featurePath);
  if (node && node.children) {
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
        console.log(params);
        if (params.dataType === "node") {
          const nodeData = params.data;
          let content = `<strong>节点名称11:</strong> ${nodeData.name}<br/>`;
          if (nodeData.feature_path) {
            content += `<strong>路径:</strong> ${nodeData.feature_path}<br/>`;
          }
          content += `<strong>层级:</strong> ${nodeData.level}`;
          return content;
        }
        // 只显示 rootLink 类型的边的弹窗
        if (
          params.dataType === "edge" &&
          params.data &&
          params.data.type === "rootLink"
        ) {
          let content = `<strong>数据流:</strong><br/>`;
          content += `<strong>from:</strong> ${params.data.content.from}<br/>`;
          content += `<strong>to:</strong> ${params.data.content.to}<br/>`;
          if (params.data.label && params.data.label.formatter) {
            content += `<strong>data_type:</strong> ${params.data.content.data_type}<br/>`;
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
        roam: true, // 允许缩放和拖动
        zoom: scaleNum, // 🌟 默认缩放比例（越小越缩）
        center: [0, 0],
        scaleLimit: {
          min: 1, // 🌟 最小缩放
          max: scaleNum * 5, // 🌟 最大缩放
        },
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
            if (params && params.data && params.data.level >= 5) {
              return name + " - 111111" + name;
            }
            // 处理长文本换行
            var spaceParts = name.split(" ");
            var lines = [];
            for (var i = 0; i < spaceParts.length; i++) {
              var part = spaceParts[i];
              if (part.indexOf("-") !== -1) {
                var dashParts = part.split("-");
                for (var j = 0; j < dashParts.length; j++) {
                  lines.push(dashParts[j]);
                  if (j < dashParts.length - 1) lines.push("-");
                }
              } else {
                lines.push(part);
              }
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
        //   focus: "adjacency",
        //   lineStyle: {
        //     width: 3,
        //   },
        // },

        animationDurationUpdate: 750,
        animationEasingUpdate: "quinticInOut",
        // labelLayout: {
        //   hideOverlap: true,
        // },
      },
    ],
  };

  myChart.setOption(option);

  // 添加节点点击事件
  myChart.on("click", function (params) {
    if (params.dataType === "node") {
      const featurePath = params.data.feature_path;
      toggleChildrenVisibility(featurePath); // 展开/收缩
      graphData = convertTreeToGraph(treeRoot); // 重新生成可见节点
      myChart.setOption({
        series: [{ data: graphData.nodes, links: graphData.links }],
      });
    }
  });

  // myChart.on("mousemove", function (params) {
  //   if(togggon) {
  //     return;
  //   }
  //   console.log("mousemove", params);
  //   if (params.dataType === "node") {
  //     const offsetX = params.event.offsetX;
  //     const offsetY = params.event.offsetY;
  //     // 只适用于 graph + layout: 'none'
  //     const [logicX, logicY] = myChart.convertFromPixel({ seriesIndex: 0 }, [
  //       offsetX,
  //       offsetY,
  //     ]);
  //     // console.log(
  //     //   "鼠标对应的 graph 坐标：",
  //     //   logicX,
  //     //   logicY,
  //     //   params.data.id,
  //     //   matchedIndex,
  //     //   nodes.length
  //     // );
  //     myChart.getOption().series[0].emphasis.disabled = true;
  //     if (params.dataType === "node" && params.data.level >= 5) {
  //       myChart.getOption().series[0].emphasis.disabled = true; // 禁用所有 emphasis 效果

  //       console.log(logicX, params.data.x, logicY, params.data.y);
  //       if (
  //         Math.abs(logicX) + 5 < Math.abs(params.data.x) ||
  //         Math.abs(logicY) + 5 < Math.abs(params.data.y)
  //       ) {
  //         // console.log("隐藏");
  //         myChart.dispatchAction({ type: "hideTip" });
  //       } else {
  //         // console.log("显示");
  //         myChart.dispatchAction({
  //           type: "showTip",
  //           seriesIndex: params.seriesIndex,
  //           dataIndex: params.dataIndex,
  //         });
  //       }
  //     } else {
  //       // console.log("显示222");
  //       myChart.dispatchAction({
  //         type: "showTip",
  //         seriesIndex: params.seriesIndex,
  //         dataIndex: params.dataIndex,
  //       });
  //     }
  //   } else if (params.dataType == "edge") {
  //     console.log("dataType: 'edge'", params.dataIndex);
  //     myChart.dispatchAction({
  //       type: "showTip",
  //       seriesIndex: params.seriesIndex,
  //       dataIndex: params.dataIndex,
  //       dataType: "edge",
  //     });
  //   } else {
  //     myChart.dispatchAction({ type: "hideTip" });
  //   }
  // });
  // myChart.getZr().on("mouseout", function () {
  //   if(togggon) {
  //     return;
  //   }
  //   myChart.dispatchAction({ type: "hideTip" });
  // });
};
</script>

<style scoped lang="scss">
.header {
  h3 {
    margin: 10px 0;
    text-align: center;
  }
}

#viewport {
  width: 100vw;
  height: calc(100vh - 120px);
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
</style>