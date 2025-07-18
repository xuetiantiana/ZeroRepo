<!-- filepath: e:\microsoft_work\ZeroRepo_dev\ZeroRepo\src\components\NetworkVisualization.vue -->
<template>
  <div class="">
    <div class="header">
      <h3>ECharts Graph 图表 (无交叉扇形布局)</h3>
      <span style="font-size: 12px;">Workflow</span>

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
import { id } from "element-plus/es/locales.mjs";

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
      setRootGraph(data.data_flow_graph)
      hancelData(data);
      updateVisibleNodes(); // 只显示根和第二层
      graphData = convertTreeToGraph(treeRoot); // 只显示可见节点和线
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
        id: idCounter++,
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
          id: idCounter++,
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
              id: idCounter++,
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
            id: idCounter++,
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
            id: idCounter++,
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
let idCounter = 0;
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
          feature_path: `${rootName}`,
          id: idCounter++,
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
    console.log("ffffffff",idCounter)
    const convertedData = {
      name: "root",
      feature_path: "root",
      id: idCounter++,
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
    size = 62;
  } else if (level <= 4) {
    size = 62;
  } else {
    size = 10;
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
    color: ringColors[level % ringColors.length],
    width: 1,
  };
};

const ttt = (x0,y0,x1,y1)=>{
  const r = 30;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);
  const offsetX = Math.cos(angleRad) * r;
  const offsetY = Math.sin(angleRad) * r;
  return{
    dx:-offsetX,
    dy:-offsetY,
    angleDeg: angleDeg,
  }
}

const getExtendedPoint = (x1, y1, x2, y2, r) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // 单位方向向量
  const ux = dx / length;
  const uy = dy / length;

  // 延长后的新坐标
  const x3 = x2 + ux * r;
  const y3 = y2 + uy * r;

  // dx, dy 是从 x2 到 x3 的偏移
  const offsetDx = x3 - x2;
  const offsetDy = y3 - y2;

  return {
    x: x3,
    y: y3,
    dx: offsetDx,
    dy: offsetDy
  };
}

const getLabelPosition = (level, angle = 0, labelText = "", radius = 0,sssss) => {
  if (level >= 5) {
    // 让文本始终朝外，旋转角度与节点到圆心的方向一致
    let deg = angle * 180 / Math.PI;
    console.log("!!!!","angle",angle,"deg",deg,"x和y坐标",sssss);
    const ddddd = ttt(0,0,sssss?.x,sssss?.y);
    console.log("!!!!",ddddd);
    // if (deg > 90 && deg < 270) {
    //   deg = deg + 180;
    // }            },
    // 估算label长度（每字符约7px，最小30px）
    const minOffset = 30;
    const charWidth = 7;
    const labelLen = Math.max(minOffset, labelText.length * charWidth);

    // 让label在圆环外一段距离（节点半径+节点大小/2+label长度/2+padding）
    const padding = 24; // 适当加大padding
    const nodeSize = 15;
    // 关键：label的圆环半径 = 节点半径 + 节点大小/2 + padding
    const labelCircleRadius = radius + nodeSize / 2 + padding;
    const offsetR = (labelCircleRadius - radius) + labelLen / 2;   
    console.log(angle)

    
    const off_r = 100;

    let offite_xy = getExtendedPoint(0,0,sssss?.x,sssss?.y,off_r);
    console.log(offite_xy)
      
      let _rotate = (deg > 90 && deg < 270) ? 180-deg:-deg;
      
      let rad = (deg) * (Math.PI / 180)
      let office = [
        // label在圆环上的坐标减去节点坐标，得到偏移
        off_r * Math.cos(rad),
        off_r * Math.sin(rad)
      ]
      console.log("!!!!",office, "旋转后的角度",_rotate);
    return {
      show: true,
      position: 'inside', // 以节点为锚点
      fontSize: 12,
      color: "#333",
      fontWeight: "normal",
      align: "center",
      verticalAlign: "middle",
      rotate: (deg > 90 && deg < 270) ? 180-deg:-deg,
      // color :(deg > 90 && deg < 270) ? 'red' : 'blue',
      // offset: [

      //   offsetR * Math.cos(angle2),

      //   offsetR * Math.sin(angle2)

      // ],
      // rotate: ddddd.angleDeg,
      
      // offset: [
      //   // label在圆环上的坐标减去节点坐标，得到偏移
      //   ddddd.dx,
      //   ddddd.dy
      // ],
      //: (deg > 90 && deg < 270) ? 180-deg:-deg,
      formatter: function (params) {
            var name = params.name || "";
            if (params && params.data && params.data.level >= 5) {
              let ssss = (deg > 90 && deg < 270) ? `{main|${name}} {sub|${name}}` :  `{sub|${name}} {main|${name}}`;
              console.log("￥￥￥!!!!",ssss);
              return ssss;
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
      fontSize: 12,
      color: '#000',
    },
    sub: {
      fontSize: 12,
      color: 'rgba(0, 0, 0, .1)', // ✅ 半透明黑色
      height: -1
    }
  }
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
      fontSize: 12,
      color: "#333",
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
    1: 100, // 第一层距离中心80px
    2: 200, // 第二层距离中心160px
    3: 300, // 第三层距离中心240px
    4: 400, // 第四层距离中心320px
    5: 500, // 第五层距离中心380px
  };

  // 如果level超过6，使用level 6的距离，或者可以继续递增
  return radiusMap[level] || (420 + (level - 6) * 40);
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
        .filter(child => !!child);
    }
    return filtered;
  }
  const filteredTree = filterVisible(treeData); // 只处理可见节点
  console.log("开始转换为 Graph 数据格式 treeData", filteredTree);

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
    if (!node || !node.name || node.visible === false) return;
    const nodeId = (node.feature_path || node.name) + "_" + level;

    // 根据level获取当前节点应该的径向距离
    const currentRadius = getRadiusForLevel(level);

    // 计算当前节点的位置
    let currentAngle;
    let x = 0, y = 0;

    if (level === 0) {
      x = 0;
      y = 0;
      currentAngle = 0;
    } else {
      currentAngle = (sectorStart + sectorEnd) / 2;
      x = Math.cos(currentAngle) * currentRadius;
      y = Math.sin(currentAngle) * currentRadius;
    }

    // 传递label文本和半径给getLabelPosition
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
      label: getLabelPosition(level, currentAngle, node.name || "", currentRadius,{x:x,y:y}),
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

        // 不做 % 2π，直接线性分配，保证不重叠
        traverse(child, nodeId, level + 1, childSectorStart, childSectorEnd);

        // 更新下一个子节点的起始角度
        currentSectorStart = childSectorEnd;
      });
    }
  }

  // 开始遍历，根节点使用整个圆周
  traverse(filteredTree, null, 0, 0, 2 * Math.PI);

  console.log("Graph 节点布局完成，节点数量:", nodes.length,nodes, links);
  console.log(links,dataFlowGraph)
  let result = [...links, ...dataFlowGraph];
  nodes.push({
    x:500,
    y:500,
    name:"test1",
    id:"test1",
  })
  nodes.push({
    x:-500,
    y:-500,
    name:"test2",
    id:"test2",
  })
  nodes.push({
    x:-500,
    y:500,
    name:"test3",
    id:"test3",
  })
  nodes.push({
    x:500,
    y:-500,
    name:"test4",
    id:"test4",
  })
  console.log("!!!result",result)
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

  return { "nodes":nodes, "links":result };
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
      triggerOn: "none",
      formatter: function (params) {
        console.log(params)
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
        if (params.dataType === "edge" && params.data && params.data.type === "rootLink") {
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
        center: [0, 0],
        scaleLimit: {
          min: 1.2, // 🌟 最小缩放
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
          // overflow: "truncate",
          formatter: function (params) {
            var name = params.name || "";
            if (params && params.data && params.data.level >= 5) {
              return name+" - 111111"+name;
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

  
    myChart.on('mousemove', function (params) {
      // console.log("mousemove",params)
      const nodes = myChart.getOption().series[0].data;
       const offsetX = params.event.offsetX;
  const offsetY = params.event.offsetY;
      // 只适用于 graph + layout: 'none'
      const [logicX, logicY] = myChart.convertFromPixel({ seriesIndex: 0 }, [offsetX, offsetY]);
      let matchedIndex = null;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // 只匹配名字相同的节点
        if (node.id === params.data.id) {
          matchedIndex = i;
        }
      }
      console.log('鼠标对应的 graph 坐标：', logicX, logicY,params.data.id,matchedIndex,nodes.length);
      if (matchedIndex == null){
        return
      }
      myChart.getOption().series[0].emphasis.disabled = true;
      if (params.dataType === 'node' && params.data.level >= 5) {
         myChart.getOption().series[0].emphasis.disabled = true; // 禁用所有 emphasis 效果

          let found = false;
          console.log((logicX) ,(params.data.x) , (logicY) , (params.data.y))
          if(Math.sqrt(logicX) <Math.sqrt(params.data.x) || Math.sqrt(logicY) < Math.sqrt(params.data.y)){
            console.log("隐藏")
            myChart.dispatchAction({ type: 'hideTip' });

          }else{
            console.log("显示")
            myChart.dispatchAction({
              type: 'showTip',
              seriesIndex: 0,
              dataIndex: matchedIndex
            });
          }


        // console.log('鼠标在节点上，主标题：', mainTitle);
        //   if(logicX >Math.sqrt(params.data.x) && logicY > params.data.y){
        //     console.log('鼠标在节点上，副标题：', subTitle);
        //   }
        // 无法判断是主标题区域还是副标题区域
      }
      else{
        myChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: matchedIndex
      });
      }
    });
    myChart.getZr().on('mouseout', function () {
  myChart.dispatchAction({ type: 'hideTip' });
});
  };


const dataFlowGraph = []
const setRootGraph = (data_flow_graph)=>{
  data_flow_graph.forEach((flow) => {
    const fromId = flow.from;
    const toId = flow.to;
    if (fromId && toId) {
      const edgeData = {
        source: fromId+"_1",
        target: toId+"_1",
        type: "rootLink",
        content: flow,
        label: {
          show: true,
          formatter: flow.data_type || flow.label || '',
          color: "#000"
        },
        lineStyle: {
          color: "#000",
          width: 1,
        },
        symbol: ['none', 'arrow'], // 线尾显示箭头
        symbolSize: 10, // 箭头大小
      }
      dataFlowGraph.push(edgeData)
    }
  })
  console.log(dataFlowGraph)

}
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