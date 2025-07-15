<!-- filepath: e:\microsoft_work\ZeroRepo_dev\ZeroRepo\src\components\NetworkVisualization.vue -->
<template>
  <div class="">
    <div class="header">
      <h3>echart</h3>
      <div id="viewport">
        <div id="wrapper">
          <div id="echart" style="width: 100%; height: 100%"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// 正确引入 ECharts
import * as echarts from "echarts";

// 初始化变量
let localNodes = [];
let localEdges = [];
let idCounter = 1;
const nodeNameToId = {};
let localAllNodesData = [];
let localAllEdgesData = [];
let localNodeChildren = {};
let localNodeParent = {};
// 新增：用于控制节点展开状态和当前显示的数据
let expandedNodes = new Set(); // 记录已展开的节点ID
let currentDisplayNodes = []; // 当前显示的节点
let currentDisplayEdges = []; // 当前显示的边
let myChartInstance = null; // 保存图表实例
let treeData = null;
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
      initEchart(myChart);
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
    };
    console.log("!!!!", allChildren);

    // 更新全局data对象
    // Object.assign(data, convertedData);

    console.log("数据转换完成:", convertedData);
    console.log(`处理了 ${allChildren.length} 个subtree组`);
    treeData = convertedData;
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
      width : 100
      // rotate: 0,
    };
  }
  return obj;
};

const initEchart = (myChart) => {
  // 保存图表实例
  myChartInstance = myChart;
  var option = {
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
    },
    series: [
      {
        type: "tree",
        roam: true, // 允许缩放和拖动画布
        data: [treeData],
        top: "0%",
        bottom: "0%",
        layout: "radial",
        // symbol: "emptyCircle",
        symbol: "circle",
        // symbol: 'circle',          // 圆形节点
        // 使用节点自带的 symbolSize 配置
        symbolSize: 30, // 默认大小，会被节点自带的配置覆盖

        initialTreeDepth: 1,
        animationDurationUpdate: 750,
        emphasis: {
          focus: "descendant",
        },

        // 使用节点自带的 label 配置
        label: {
          show: true,
          // verticalAlign: "middle",
          // align: "center",
          // width: 100,
          overflow: "break", // 超出自动换行
          formatter: function (params) {
            console.log(params,params.level)
            var name = params.name || "";
            if(params.data.level >= 5){
              return  name
            }
            // 先按空格分割
            var spaceParts = name.split(" ");
            var lines = [];
            for (var i = 0; i < spaceParts.length; i++) {
              var part = spaceParts[i];
              // 如果有'-'，再按'-'分割，每个子词单独一行
              if (part.indexOf("-") !== -1) {
                var dashParts = part.split("-");
                for (var j = 0; j < dashParts.length; j++) {
                  lines.push(dashParts[j]);
                  if (j < dashParts.length - 1) lines.push("-"); // 保留'-'单独一行
                }
              } else {
                lines.push(part);
              }
            }
            return lines.join("\n");
          },
        },
        tooltip: {
          trigger: "item",
          triggerOn: "mousemove",
          formatter: function (params) {
            // 获取节点数据
            const nodeData = params.data;
            let content = "";

            if (nodeData && nodeData.name) {
              content += `<strong>节点名称:</strong> ${nodeData.name}<br/>`;

              // 显示 feature_path 信息
              if (nodeData.feature_path) {
                content += `<strong>路径:</strong> ${nodeData.feature_path}`;
              }
            }

            return content || params.name || "";
          },
        },
        lineStyle: {
          curveness: 0,
        },
        labelLayout: {
          hideOverlap: true,
        },
      },
    ],
  };

  myChart.setOption(option);

  // // 添加节点点击事件
  // myChart.on("click", function (params) {
  //   if (params.dataType === "node") {
  //     toggleNodeExpansion(params.data.id);
  //   }
  // });
};
</script>

<style scoped lang="scss">
#viewport {
  width: 100vw;
  height: calc(100vh - 40px);
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