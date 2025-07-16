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

// 正确引入 ECharts
import * as echarts from "echarts";

let treeRoot = null; // 保存完整树结构
let graphData = { nodes: [], links: [] }; // Graph 数据结构

onMounted(() => {
  // 获取 DOM 元素
  const chartDom = document.getElementById("echart");
  if (!chartDom) return;
  const myChart = echarts.init(chartDom);

  // myChart.showLoading();
  fetch("./data/webui.json")
    .then((res) => res.json())
    .then((data) => {
      hancelData(data);
      updateVisibleNodes(); // 初始只显示根和第二层
      initGraphChart(myChart);
    });

  // 可选：组件卸载时销毁实例
  onUnmounted(() => {
    myChart.dispose();
  });
});

const convertToTreeStructure = (
  obj,
  name = "root",
  parentPath = "",
  depth = 0
) => {
  // 构建当前节点的路径
  const currentPath = parentPath ? `${parentPath}/${name}` : name;

  // 如果是数组，说明是叶子节点
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      const level = depth + 1;

      return {
        name: item,
        feature_path: `${currentPath}/${item}`,
        level: level,
        symbolSize: getSymbolSize(level), // 为每个节点单独设置大小
        // 为每个节点单独配置 label
        label: getLabelPosition(level),
        itemStyle: getItemStyle(level), // 为每个节点单独设置样式
        lineStyle: getLineStyle(level), // 为每个节点单独设置边的样式
      };
    });
  }

  // 如果是对象，递归处理每个键值对
  if (typeof obj === "object" && obj !== null) {
    const children = [];
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        // 如果值是数组，创建一个包含子节点的节点
        // 计算父节点大小

        children.push({
          name: key,
          feature_path: `${currentPath}/${key}`,
          level: depth,
          symbolSize: getSymbolSize(depth), // 为父节点设置大小
          // 为父节点配置 label
          label: getLabelPosition(depth),
          itemStyle: getItemStyle(depth), // 为父节点设置样式
          lineStyle: getLineStyle(depth), // 为父节点设置边的样式
          children: value.map((item) => {
            const childLevel = depth + 1;

            return {
              name: item,
              feature_path: `${currentPath}/${key}/${item}`,
              level: childLevel,
              symbolSize: getSymbolSize(childLevel), // 为子节点设置大小
              // 为子节点配置 label
              label: getLabelPosition(childLevel),
              itemStyle: getItemStyle(childLevel), // 为子节点设置样式
              lineStyle: getLineStyle(childLevel), // 为子节点设置边的样式
            };
          }),
        });
      } else if (typeof value === "object") {
        // 如果值是对象，递归处理
        const childResult = convertToTreeStructure(
          value,
          key,
          currentPath,
          depth + 1
        );

        // 如果递归结果是数组，说明是多个子节点
        if (Array.isArray(childResult)) {
          children.push({
            name: key,
            feature_path: `${currentPath}/${key}`,
            level: depth,
            symbolSize: getSymbolSize(depth), // 为节点设置大小
            // 为节点配置 label
            label: getLabelPosition(depth),
            itemStyle: getItemStyle(depth), // 为节点设置样式
            lineStyle: getLineStyle(depth), // 为节点设置边的样式
            children: childResult,
          });
        } else {
          // 如果递归结果是单个对象，直接添加
          children.push({
            name: key,
            feature_path: `${currentPath}/${key}`,
            level: depth,
            symbolSize: getSymbolSize(depth), // 为节点设置大小
            // 为节点配置 label
            label: getLabelPosition(depth),
            itemStyle: getItemStyle(depth), // 为节点设置样式
            lineStyle: getLineStyle(depth), // 为节点设置边的样式
            children: childResult.children || [],
          });
        }
      }
    }
    return children;
  }

  return { name: obj, feature_path: currentPath };
};

const hancelData = (data1) => {
  // 从JSON数据中提取实际的树形数据
  if (data1 && data1.subtrees && data1.subtrees.length > 0) {
    const allChildren = [];

    // 处理所有的subtrees
    data1.subtrees.forEach((subtree, index) => {
      if (subtree.refactored_subtree) {
        // 使用subtree的name作为根节点名称，如果没有name则使用默认名称
        const rootName = subtree.name || `Subtree_${index + 1}`;

        // 转换数据结构
        const convertedChildren = convertToTreeStructure(
          subtree.refactored_subtree,
          rootName,
          "",
          2 // 从第1层开始
        );

        // 创建该组的根节点
        const groupRoot = {
          name: rootName,
          feature_path: `${subtree.file_path || rootName}`,
          level: 1, // 根节点为第1层
          symbolSize: getSymbolSize(1), // 组根节点大小
          // 为根节点配置 label
          label: getLabelPosition(1),
          itemStyle: getItemStyle(1), // 为根节点设置样式
          lineStyle: getLineStyle(1), // 为根节点设置边的样式
          children: convertedChildren,
        };

        allChildren.push(groupRoot);
      }
    });

    // 构建最终的根节点
    const convertedData = {
      name: "root",
      feature_path: "root",
      level: 0, // 最顶层根节点
      symbolSize: getSymbolSize(0), // 最终根节点大小
      // 为最终根节点配置 label
      label: getLabelPosition(0),
      itemStyle: getItemStyle(0), // 为根节点设置样式
      lineStyle: getLineStyle(0), // 为根节点设置边的样式
      children: allChildren,
      visible: true, // 根节点默认可见
    };
    console.log("!!!!", allChildren);

    // 更新全局data对象
    // Object.assign(data, convertedData);

    console.log("数据转换完成:", convertedData);
    console.log(`处理了 ${allChildren.length} 个subtree组`);

    // 转换为 Graph 数据格式
    treeRoot = convertedData; // 保存完整树结构
    graphData = convertTreeToGraph(treeRoot); // 初始只显示根和第二层
    console.log("Graph 数据转换完成:", graphData);
    console.log("节点数量:", graphData.nodes.length);
    console.log("连接数量:", graphData.links.length);
    console.log("第一个节点示例:", graphData.nodes[0]);

    return convertedData;
  }

  console.warn("数据格式不正确，使用默认数据");
  return data1;
};

// 定义每一圈的颜色（5层蓝色主色调，突出 #0078D4，层级递进更明显）
const ringColors = [
  "#686759", // root/中心，最深
  "#B04B35", // 红色
  "#E37C05", // 橙色
  "#5F9DBF", // 绿色
  "#568651", // 橄榄绿
  "#B89C80", // 黄色
];
const getSymbolSize = (level) => {
  let size;
  if (level == 0) {
    size = 5;
  } else if (level == 1) {
    size = 50;
  } else if (level <= 4) {
    size = 30;
  } else {
    size = 3;
  }
  return size;
};

const getItemStyle = (level) => {
  if (level <= 1) {
    return {
      color: ringColors[level % ringColors.length],
      borderColor: ringColors[level % ringColors.length],
      borderWidth: 0.5,
    };
  } else {
    return {
      color: ringColors[level % ringColors.length],
      borderColor: ringColors[level % ringColors.length],
      borderWidth: 0.5,
    };
  }
};

const getLineStyle = (level) => {
  return {
    color: ringColors[level % ringColors.length],
    width: 0.5,
  };
};

const getLabelPosition = (level) => {
  let obj = {};
  if (level >= 5 || level == 0) {
    obj = {
      fontSize: level == 5 ? 10 : 10,
      color: level >= 5 ? "#333" : "#333",
      fontWeight: level === 1 ? "bold" : "normal",
    };
  } else {
    obj = {
      position: "inside",
      fontSize: level == 5 ? 10 : 10,
      color: level >= 5 ? "#333" : "#333",
      verticalAlign: "middle",
      align: "center",
      fontWeight: level === 1 ? "bold" : "normal",
      width: 100,
      // rotate: 0,
    };
  }
  return obj;
};

// 根据level设置节点距离圆心的距离
const getRadiusForLevel = (level) => {
  const radiusMap = {
    0: 0, // 根节点在中心
    1: 80, // 第一层距离中心80px
    2: 160, // 第二层距离中心160px
    3: 240, // 第三层距离中心240px
    4: 320, // 第四层距离中心320px
    5: 680, // 第五层距离中心380px
    6: 420, // 第六层及以上距离中心420px
  };

  // 如果level超过6，使用level 6的距离，或者可以继续递增
  return radiusMap[level] || (420 + (level - 6) * 40);
};

// 将树形数据转换为 Graph 数据格式
const convertTreeToGraph = (treeData) => {
  const nodes = [];
  const links = [];
  const nodeMap = new Map(); // 用于快速查找节点

  // 计算子树的叶子节点数量（用于角度权重分配）
  function countLeaves(node) {
    if (!node.children || node.children.length === 0) {
      return 1; // 叶子节点计为1
    }

    return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
  }

  // 递归遍历树形数据，使用严格的扇形分割避免连线交叉
  function traverse(
    node,
    parentId = null,
    level = 0,
    sectorStart = 0,
    sectorEnd = 2 * Math.PI
  ) {
    // 只处理 visible 节点
    if (!node || !node.name || node.visible === false) return;

    const nodeId = node.name + "_" + level + "_" + Math.random().toString(36).substring(2, 11);

    // 根据level获取当前节点应该的径向距离
    const currentRadius = getRadiusForLevel(level);

    // 计算当前节点的位置
    let currentAngle;
    let x = 0,
      y = 0;

    if (level === 0) {
      // 根节点在中心
      x = 0;
      y = 0;
      currentAngle = 0;
    } else {
      // 当前节点位于分配扇形的中心角度
      currentAngle = (sectorStart + sectorEnd) / 2;
      x = Math.cos(currentAngle) * currentRadius;
      y = Math.sin(currentAngle) * currentRadius;
    }

    // 创建节点
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
      label: node.label || getLabelPosition(level),
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
      // 计算每个子节点的叶子数量（权重）
      const childWeights = node.children.map((child) => countLeaves(child));
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
        const childSectorSize = (childWeights[index] / totalWeight) * availableSector;
        const childSectorStart = currentSectorStart;
        const childSectorEnd = currentSectorStart + childSectorSize;

        // 确保角度在有效范围内
        const normalizedStart = childSectorStart % (2 * Math.PI);
        const normalizedEnd = childSectorEnd % (2 * Math.PI);

        // 递归处理子节点，传递严格的扇形边界（不再传递radius参数）
        traverse(child, nodeId, level + 1, normalizedStart, normalizedEnd);

        // 更新下一个子节点的起始角度
        currentSectorStart = childSectorEnd;
      });
    }
  }

  // 开始遍历，根节点使用整个圆周
  traverse(treeData, null, 0, 0, 2 * Math.PI);

  console.log("Graph 节点布局完成，节点数量:", nodes.length);
  console.log(
    "扇形分配示例:",
    nodes
      .slice(0, 5)
      .map((n) => ({
        name: n.name,
        level: n.level,
        angle: ((n.angle * 180) / Math.PI).toFixed(1) + "°",
        sector: `${((n.sectorStart * 180) / Math.PI).toFixed(1)}°-${
          ((n.sectorEnd * 180) / Math.PI).toFixed(1)
        }°`,
      }))
  );

  return { nodes, links };
};

// 新增：只显示根节点和第二层节点
const updateVisibleNodes = () => {
  function setVisible(node, level) {
    node.visible = level <= 1; // 只显示0和1层
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => setVisible(child, level + 1));
    }
  }
  if (treeRoot) setVisible(treeRoot, 0);
};

// 新增：切换某节点的子节点显示/隐藏
const toggleChildrenVisibility = (nodeName) => {
  function findNode(node, name) {
    if (node.name === name) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, name);
        if (found) return found;
      }
    }
    return null;
  }
  const node = findNode(treeRoot, nodeName);
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

  // 创建分类数据（用于不同层级的着色）
  const categories = [];
  for (let i = 0; i <= 6; i++) {
    categories.push({
      name: `Level ${i}`,
      itemStyle: getItemStyle(i),
    });
  }

  var option = {
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      formatter: function (params) {
        if (params.dataType === "node") {
          const nodeData = params.data;
          let content = `<strong>节点名称:</strong> ${nodeData.name}<br/>`;
          if (nodeData.feature_path) {
            content += `<strong>路径:</strong> ${nodeData.feature_path}<br/>`;
          }
          content += `<strong>层级:</strong> ${nodeData.level}`;
          return content;
        }
        return params.name || "";
      },
    },
    // 移除图例，保持界面简洁
    // legend: {
    //   data: categories.map(cat => cat.name),
    //   orient: 'vertical',
    //   left: 'left',
    //   top: 'top'
    // },
    series: [
      {
        type: "graph",
        layout: "none", // 使用固定位置布局
        roam: true, // 允许缩放和拖动
        zoom: 1, // 🌟 默认缩放比例（越小越缩）
        scaleLimit: {
          min: 0.3, // 🌟 最小缩放
          max: 2.5, // 🌟 最大缩放
        },
        data: graphData.nodes,
        links: graphData.links,
        categories: categories,

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
          formatter: function (params) {
            var name = params.name || "";
            if (params && params.data && params.data.level >= 5) {
              return name;
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

        emphasis: {
          focus: "adjacency",
          lineStyle: {
            width: 3,
          },
        },

        animationDurationUpdate: 750,
        animationEasingUpdate: "quinticInOut",
      },
    ],
  };

  myChart.setOption(option);

  // 添加节点点击事件
  myChart.on("click", function (params) {
    if (params.dataType === "node") {
      const nodeName = params.data.name;
      toggleChildrenVisibility(nodeName); // 展开/收缩
      graphData = convertTreeToGraph(treeRoot); // 重新生成可见节点
      myChart.setOption({
        series: [{ data: graphData.nodes, links: graphData.links }],
      });
    }
  });
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

#echart {
  width: 100%;
  height: 100%;
}
</style>