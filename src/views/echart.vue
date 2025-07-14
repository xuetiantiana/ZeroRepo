<!-- filepath: e:\microsoft_work\ZeroRepo_dev\ZeroRepo\src\components\NetworkVisualization.vue -->
<template>
  <div class="">
    <div class="header">
      <h3>echart</h3>
      <div id="main" style="width: 100vw; height: 100vh"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// 正确引入 ECharts
import * as echarts from 'echarts';

// 注册需要的组件
// echarts.use([TreeChart, GraphChart, TooltipComponent, CanvasRenderer]);

const ROOT_PATH = "https://echarts.apache.org/examples";



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
function processData(data) {
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
        const currentId = idCounter++ + "";
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
            name: nodeLabel,
            originalLabel: nodeLabel,
            title: `${currentPath}`,
            path: currentPath,
            shape: nodeShape,
            color: nodeColor,
            font: { size: 14, bold: true },
            level: level,
            widthConstraint: { minimum: 101, maximum: 101 },
            
            isArrayContainer: true,
            rootId: rootId,
            rootLabel: rootLabel,
            category: rootLabel,
          };
          localAllNodesData.push(containerNodeData);

          if (parentId) {
            let edgeData = {
              source: parentId,
              target: currentId,
             
            };
            localAllEdgesData.push(edgeData);
          }

          // 为数组元素创建叶子节点
          obj[key].forEach((item, index) => {
            const itemId = idCounter++ + "";
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
              name: itemLabel,
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
              
              heightConstraint: { minimum: 20 },
              widthConstraint: { minimum: 101, maximum: 101 },
              rootId: rootId,
              rootLabel: rootLabel,
              category: rootLabel,
            };
            localAllNodesData.push(itemNodeData);

            let itemEdgeData = {
              source: currentId,
              target: itemId,
            
            };
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
            name: nodeLabel,
            title: `${currentPath}`,
            path: currentPath,
            shape: nodeShape,
            color: nodeColor,
            font: { size: 14, bold: true },
            level: level,
            widthConstraint: { minimum: 101, maximum: 101 },
            
            rootId: rootId,
            rootLabel: rootLabel,
            category: rootLabel,
          };

          if (Object.keys(obj[key]).length > 0) {
            nodeData.originalLabel = nodeLabel;
          }

          localAllNodesData.push(nodeData);
          if (parentId) {
            let edgeData = {
              source: parentId,
              target: currentId,
            
            };
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
      const subtreeRootId = idCounter++ + "";
      const subtreeLabel = subtree.name || "Unnamed Subtree";
      let mainNodeColor = {
        border: "#6495ED",
        background: "#E6E6FA",
        highlight: { border: "#4149E1", background: "#D8BFD8" },
      };

      let nodeData = {
        id: subtreeRootId,
        label: subtreeLabel,
        name: subtreeLabel,
        symbolSize: 80,
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
        category: subtreeLabel,
        // 添加图标相关配置
        showIcon: true,
        iconType: "root",
        // x: 200, y: 200, fixed: true,
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

  // ==================== 处理数据流图 根节点之间的连线====================
  if (data.data_flow_graph && Array.isArray(data.data_flow_graph)) {
    console.log("？？？", nodeNameToId);
    data.data_flow_graph.forEach((flow) => {
      const fromId = nodeNameToId[flow.from];
      const toId = nodeNameToId[flow.to];
      if (fromId && toId) {
        

        let edgeData = {
          source: fromId,
          target: toId,
          type: "rootLink",
          label: {
            show: true,  // 只有 rootLink 类型的边显示标签
            formatter: flow.data_type || flow.label || ''
          },
          name: flow.data_id || '',  // 添加 name 字段用于 tooltip
          data_id: flow.data_id || '',
          transformation: flow.transformation || '',
          lineStyle: {
            color: 'red',    // 根节点连线颜色
            width: 3,            // 根节点连线更粗
            opacity: 0.9,
            type: 'dashed'       // 虚线样式区分
          },
          emphasis: {
            lineStyle: {
              color: '#c0392b',
              width: 6,          // 悬停时更粗
              opacity: 1,
              shadowColor: '#c0392b',
              shadowBlur: 15
            }
          }
        };

        localAllEdgesData.push(edgeData);
      } else {
        console.warn(
          "Could not create edge for flow:",
          flow,
          "due to missing node IDs."
        );
      }
    });
  }

  console.log(
    "数据处理完成",
    localAllNodesData,
    localAllEdgesData,
    localNodeChildren,
    localNodeParent,
    nodeNameToId
  );

  // 初始化显示数据：只显示根节点和根节点之间的连线
  initializeDisplayData();
}

// 初始化显示数据：只显示根节点
function initializeDisplayData() {
  currentDisplayNodes = [];
  currentDisplayEdges = [];

  // 添加所有根节点（level === 0 的节点）
  localAllNodesData.forEach(node => {
    if (node.level === 0) {
      currentDisplayNodes.push({
        ...node,
        // 添加展开/收缩指示器
        label: {
          show: true,
          formatter: function(params) {
            const hasChildren = localNodeChildren[params.data.id] && localNodeChildren[params.data.id].length > 0;
            const isExpanded = expandedNodes.has(params.data.id);
            const indicator = hasChildren ? (isExpanded ? '▼' : '▶') : '';
            return `${indicator} ${params.data.name}`;
          }
        }
      });
    }
  });

  // 添加根节点之间的连线（type === 'rootLink'）
  localAllEdgesData.forEach(edge => {
    if (edge.type === 'rootLink') {
      currentDisplayEdges.push(edge);
    }
  });
}

// 切换节点的展开/收缩状态
function toggleNodeExpansion(nodeId) {
  const hasChildren = localNodeChildren[nodeId] && localNodeChildren[nodeId].length > 0;
  if (!hasChildren) return;

  if (expandedNodes.has(nodeId)) {
    // 收缩节点：移除该节点的所有子节点和相关边
    collapseNode(nodeId);
    expandedNodes.delete(nodeId);
  } else {
    // 展开节点：添加该节点的直接子节点和相关边
    expandNode(nodeId);
    expandedNodes.add(nodeId);
  }

  // 更新图表显示
  updateChart();
}

// 展开节点：添加直接子节点
function expandNode(nodeId) {
  const children = localNodeChildren[nodeId] || [];

  children.forEach(childId => {
    // 添加子节点（如果还没有显示）
    const childNode = localAllNodesData.find(node => node.id === childId);
    if (childNode && !currentDisplayNodes.find(node => node.id === childId)) {
      currentDisplayNodes.push({
        ...childNode,
        label: {
          show: true,
          formatter: function(params) {
            const hasChildren = localNodeChildren[params.data.id] && localNodeChildren[params.data.id].length > 0;
            const isExpanded = expandedNodes.has(params.data.id);
            const indicator = hasChildren ? (isExpanded ? '▼' : '▶') : '';
            return `${indicator} ${params.data.name}`;
          }
        }
      });
    }

    // 添加父子连线
    const edge = localAllEdgesData.find(edge =>
      edge.source === nodeId && edge.target === childId
    );
    if (edge && !currentDisplayEdges.find(e => e.source === nodeId && e.target === childId)) {
      currentDisplayEdges.push(edge);
    }
  });
}

// 收缩节点：递归移除所有子节点
function collapseNode(nodeId) {
  const children = localNodeChildren[nodeId] || [];

  children.forEach(childId => {
    // 如果子节点也是展开的，先递归收缩它
    if (expandedNodes.has(childId)) {
      collapseNode(childId);
      expandedNodes.delete(childId);
    }

    // 移除子节点
    currentDisplayNodes = currentDisplayNodes.filter(node => node.id !== childId);

    // 移除相关的边
    currentDisplayEdges = currentDisplayEdges.filter(edge =>
      !(edge.source === nodeId && edge.target === childId) &&
      !(edge.source === childId || edge.target === childId)
    );
  });
}

// 更新图表显示
function updateChart() {
  if (!myChartInstance) return;

  const option = myChartInstance.getOption();
  option.series[0].data = currentDisplayNodes;
  option.series[0].edges = currentDisplayEdges;

  myChartInstance.setOption(option, true);
}



onMounted(() => {
  // 获取 DOM 元素
  const chartDom = document.getElementById("main");
  if (!chartDom) return;
  const myChart = echarts.init(chartDom);

  // myChart.showLoading();
  fetch("./data/webui.json")
    .then((res) => res.json())
    .then((data) => {
      processData(data);
      initEchart(myChart);
    });

  // 可选：组件卸载时销毁实例
  onUnmounted(() => {
    myChart.dispose();
  });
});

const rootList = [
  {
    "name": 'Algorithms',
  },
  {
    "name": 'Workflow',
  },
  {
    "name": 'Data Engineering',
  },
  {
    "name": 'Advanced Modeling Techniques',
  }
]
const initEchart = (myChart) => {
  // 保存图表实例
  myChartInstance = myChart;
  const option = {
    // tooltip: {},
    tooltip: {
    trigger: 'item',
    formatter: function (params) {
      if (params.dataType === 'edge') {
        if (params.data.type === 'rootLink') {
          return `🔗 数据流连接<br/>` +
                 `从：${params.data.source}<br/>` +
                 `到：${params.data.target}<br/>` +
                 `数据类型：${params.data.label || '无'}<br/>` +
                 `数据ID：${params.data.data_id || '无'}<br/>` +
                 `转换说明：${params.data.transformation ? params.data.transformation.substring(0, 50) + '...' : '无'}`;
        } else {
          return `🔗 从 ${params.data.source} 到 ${params.data.target}<br/>名称：${params.data.name || '无'}`;
        }
      } else if (params.dataType === 'node') {
        return `节点：${params.data.name}<br/>path：${params.data.path || '无'}<br/>id：${params.data.id}`;
      }
    }
  },
    legend: [
      {
        // selectedMode: 'single',
        data: rootList.map(function (a) {
          return a.name;
        })
      }
    ],
    series: [
      {
        type: "graph",
        roam: true, // 允许缩放和拖动画布
        layout: "force", // 使用力导向布局
        animation: false,
        symbolSize: 50, // 节点大小
        animation: false,
        data: localAllNodesData,
        force: {
          initLayout: 'circular', // 初始布局方式。circular 表示节点初始呈环形布局，然后再通过力导向布局调整位置。可选：none（默认随机）或 circular
          gravity: 0.5, // 全局向心力（中心吸引力）。默认值为 0.1，值越大，节点越靠近中心。你注释掉的 gravity: 0 表示不受中心吸引，节点容易往外扩散。通常设置为 0.1 ~ 1 可使图形更紧凑。
          repulsion: 500, // 节点之间的斥力。默认值为 50，值越大，节点越分散。
          edgeLength: 150, // 边的长度。默认值为 30，值越大，边越长。
          layoutAnimation: true,
        },
        // 连线样式配置
        lineStyle: {
          color: '#999',     // 默认连线颜色
          width: 1,          // 默认连线宽度
          opacity: 0.5,      // 默认透明度
          curveness: 0.1     // 连线弯曲度
        },
        edgeSymbol: ['none', 'arrow'], // 起点无符号，终点是箭头
        edgeSymbolSize: [4, 8], // 箭头大小
        edges: localAllEdgesData,
        // 边标签配置
        edgeLabel: {
          show: false,  // 默认不显示
          position: 'middle',
          fontSize: 10,
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 3,
          padding: [2, 4],
          formatter: function(params) {
            // 如果边数据中有 label.formatter，使用它
            if (params.data.label && params.data.label.formatter) {
              return params.data.label.formatter;
            }
            return '';
          }
        },
        categories: rootList,
        label: {
          show: true,          // ✅ 默认显示
          position: 'inside',   // ⬅️ 可选：label 位置（如 top/bottom/left/right/inside）
          fontSize: 10,
          color: '#333',
          formatter: function(params) {
            // 如果节点数据中有自定义的 label.formatter，使用它
            if (params.data.label && params.data.label.formatter) {
              return params.data.label.formatter(params);
            }
            // 否则显示节点名称
            return params.data.name || params.data.label;
          }
        },

        emphasis: {
          focus: 'adjacency', // ✅ 高亮相邻边和节点
          // ✅ 悬停时连线样式
          lineStyle: {
            color: '#999', // 红色高亮
            // width: 8,         // 加粗到8px
            opacity: 1,
            shadowColor: '#ff4757',
            shadowBlur: 10
          },
          // ✅ 悬停时节点样式
          itemStyle: {
            borderColor: '#ff4757',
            borderWidth: 3,
            shadowColor: '#ff4757',
            shadowBlur: 10
          },
          // ✅ 悬停时标签样式
          label: {
            color: '#ff4757',
            fontWeight: 'bold',
            fontSize: 12
          },
          // ✅ 悬停时边标签样式
          edgeLabel: {
            show: true,  // 悬停时显示（但只有设置了 label.show 的边才会显示）
            color: 'red',
            // fontWeight: 'bold',
            fontSize: 12,
            backgroundColor: 'rgba(255, 71, 87, 0.1)',
            padding: [3, 6]
          },
          // ✅ 显式关闭其他项淡出（关键）
          blurScope: 'none'
        },
        // 非高亮状态下的样式（保持原样，不变暗）
        blur: {
          lineStyle: {
            opacity: 0.2 // 非相邻连线变淡
          },
          itemStyle: {
            opacity: 1 // 非相邻节点变淡
          },
          label: {
            opacity: 1 // 非相邻标签变淡
          }
        },
        
      },
    ],
  };
  console.log("setsss",currentDisplayEdges,currentDisplayNodes)
  myChart.setOption(option);

  // 添加节点点击事件
  myChart.on('click', function (params) {
    if (params.dataType === 'node') {
      toggleNodeExpansion(params.data.id);
    }
  });
};
</script>

<style scoped lang="scss">
</style>