export const getParameterByName = (name: string) => {
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); // 构造一个含有目标参数的正则表达式对象
  const r = window.location.search.substr(1).match(reg);  // 匹配目标参数
  if (r != null) return unescape(r[2]); return null; // 返回参数值
}







export const hancelData = (data1, mapData) => {
  // 从JSON数据中提取实际的树形数据
  let idCounter = 0;

  const convertToTreeStructure = (
    obj,
    name = "root",
    parentPath = "",
    depth = 0,
    level1Root
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
          idx: '' + idCounter++,
          level: level,
          level1Root: level1Root,
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
            idx: '' + idCounter++,
            level: depth,
            level1Root: level1Root,
            children: value.map((item) => {
              const childLevel = depth + 1;

              return {
                name: item,
                feature_path: `${currentPath}/${key}/${item}`,
                idx: '' + idCounter++,
                level: childLevel,
                level1Root: level1Root,
              };
            }),
          });
        } else if (typeof value === "object") {
          // 如果值是对象，递归处理
          const childResult = convertToTreeStructure(
            value,
            key,
            currentPath,
            depth + 1,
            level1Root,
          );

          // 如果递归结果是数组，说明是多个子节点
          if (Array.isArray(childResult)) {
            children.push({
              name: key,
              feature_path: `${currentPath}/${key}`,
              idx: '' + idCounter++,
              level: depth,
              level1Root: level1Root,
              children: childResult,
            });
          } else {
            // 如果递归结果是单个对象，直接添加
            children.push({
              name: key,
              feature_path: `${currentPath}/${key}`,
              idx: '' + idCounter++,
              level: depth,
              children: childResult.children || [],
            });
          }
        }
      }
      return children;
    }
    return { name: obj, feature_path: currentPath };
  };

  if (data1 && data1.subtrees && data1.subtrees.length > 0) {
    const allChildren = [];

    // 新增：按指定顺序排序subtrees
    const order = ["Data Engineering", "Algorithms", "Advanced Modeling Techniques", "Workflow",];
    const sortedSubtrees = [...data1.subtrees].sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      // 未命中顺序的放最后，按原顺序
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    // 处理所有的subtrees（已排序）
    sortedSubtrees.forEach((subtree, index) => {
      if (subtree.refactored_subtree) {
        // 使用subtree的name作为根节点名称，如果没有name则使用默认名称
        const rootName = subtree.name || `Subtree_${index + 1}`;

        // 转换数据结构
        const convertedChildren = convertToTreeStructure(
          subtree.refactored_subtree,
          rootName,
          "",
          2, // 从第1层开始
          rootName, // level1Root
        );

        // 创建该组的根节点
        const groupRoot = {
          name: rootName,
          feature_path: `${rootName}`,
          idx: '' + idCounter++,
          level: 1, // 根节点为第1层
          children: convertedChildren,
          level1Root: rootName,
        };

        allChildren.push(groupRoot);
      }
    });

    // 构建最终的根节点
    const convertedData = {
      name: "root",
      feature_path: "root",
      idx: '' + idCounter++,
      level: 0, // 最顶层根节点
      children: allChildren,
      visible: true, // 根节点默认可见
    };
    console.log("!!!!", allChildren);

    // 更新全局data对象
    // Object.assign(data, convertedData);

    console.log("数据转换完成:", convertedData);
    console.log(`处理了 ${allChildren.length} 个subtree组`);

    // 处理name
    processNodeNames(convertedData)
    // 处理map数据
    getNodeModalDetail(convertedData, mapData)
    console.log(convertedData)
    return convertedData;
  }

  console.warn("数据格式不正确，使用默认数据");
  return data1;
};


// 遍历树形数据，根据name的字符长度处理（太长使用简写）
function processNodeNames(treeData) {
  // 遍历树形数据并处理每个节点的 name
  function traverse(node) {
    if (!node || !node.name) return;

    // 如果节点的 level 小于等于 2，不处理
    if (node.level > 2 && node.level != 5) {
      // 根据空格拆分 name

      const replaced = node.name.replace(/\b(And|and)\b/g, "&");
      const nameParts = replaced.split(" ");
      let processedName;


      // 判断是否所有单词的长度都不超过 13
      let oneWordMaxLength = node.level == 3 ? 10 : 8
      const allShortEnough = nameParts.length < 3 && nameParts.every((part) => part.length <= oneWordMaxLength);
      let hasAbbr = true
      if (allShortEnough) {
        // 如果所有单词长度都不超过 13，直接拼接字符串
        processedName = nameParts.join("\n");
        hasAbbr = false
      } else {
        // 处理单词中包含 `-` 或 `&` 的情况
        const processWord = (word: string, len: number) => {
          if (word.includes("-")) {
            // 按 `-` 拆分单词并使用 `-` 连接
            const subParts = word.split("-");
            return subParts
              .map((subPart, index) => (index === 0 ? subPart.slice(0, len) : subPart.slice(0, len)))
              .join("-");
          } else if (word.includes("&")) {
            // 按 `&` 拆分单词并使用 `&` 连接
            const subParts = word.split("&");
            return subParts
              .map((subPart, index) => (index === 0 ? subPart.slice(0, len) : subPart.slice(0, len)))
              .join("&");
          }
          return word.slice(0, len); // 默认取前 `len` 个字母
        };

        if (nameParts.length <= 2) {
          let oneWordLength = node.level == 3 ? 4 : 3
          // 如果长度小于等于 2，使用每个单词的前 3 个字母缩写
          processedName = nameParts.map((part) => processWord(part, oneWordLength)).join("\n");
        } else {
          // 如果长度大于 2，使用每个单词的首字母
          processedName = nameParts.map((part) => processWord(part, 1)).join("");
        }
      }


      // 更新节点的 name
      node.originalName = node.name;
      node.name = processedName;
      node.hasAbbr = hasAbbr
    }



    // 递归处理子节点
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }

  // 开始遍历树形数据
  traverse(treeData);
}

// 遍历树形数据并为每个节点匹配mapData中的详细信息
export const getNodeModalDetail = (treeData, mapData) => {
  if (!treeData || !mapData) {
    console.warn('treeData 或 mapData 为空');
    return;
  }

  // 递归遍历树形数据的函数
  const traverseTree = (node) => {
    if (!node) return;

    // 处理当前节点
    processNode(node, mapData);

    // 递归处理子节点
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => traverseTree(child));
    }
  };

  // 处理单个节点的函数
  const processNode = (node, mapData) => {
    if (!node.feature_path) {
      console.warn('节点缺少 feature_path:', node);
      return;
    }

    // 获取mapData中的搜索数据
    const searchData = mapData.metadata || mapData;

    // 根据节点的level1Root或其他标识找到对应的根数据
    const rootKey = node.level1Root || getRootKeyFromPath(node.feature_path);

    if (searchData[rootKey]) {
      const rootData = searchData[rootKey];

      if (Array.isArray(rootData)) {
        // 在数组中查找匹配的项
        const matchedItem = rootData.find((item) => {
          if (typeof item === "object" && item !== null) {
            // 通过feature_path匹配
            const pathMatch = item.feature_path === node.feature_path;

            return pathMatch;
          }
          return false;
        });

        if (matchedItem) {
          // 将匹配的数据添加到节点上
          node.metaData = matchedItem;
          // console.log(`为节点 ${node.name} 找到匹配数据:`, matchedItem);
        } else {
          console.log(`未找到节点 ${node.name} 的匹配数据, feature_path: ${node.feature_path}`);
        }
      } else if (typeof rootData === "object") {
        // 如果rootData是对象，直接通过feature_path查找
        if (rootData[node.feature_path]) {
          node.metaData = rootData[node.feature_path];
          // console.log(`为节点 ${node.name} 找到对象数据:`, rootData[node.feature_path]);
        }
      }
    } else {
      console.log(`未找到根键 ${rootKey} 在mapData中`);
    }
  };

  // 从feature_path中提取根键的辅助函数
  const getRootKeyFromPath = (featurePath) => {
    if (!featurePath) return '';
    const parts = featurePath.split('/');
    // 返回第一个非空部分作为根键
    return parts.find(part => part && part !== 'root') || '';
  };

  // 开始遍历
  if (Array.isArray(treeData)) {
    // 如果treeData是数组，遍历每个根节点
    treeData.forEach(rootNode => traverseTree(rootNode));
  } else {
    // 如果treeData是单个对象，直接遍历
    traverseTree(treeData);
  }

  console.log('节点数据匹配完成');
  return treeData;
};


export function getMaxDepth(node) {
  if (!node.children || node.children.length === 0) {
    return 1; // 当前节点就是叶子
  }

  // 递归计算所有子节点的最大深度
  const childDepths = node.children.map(child => getMaxDepth(child));
  return 1 + Math.max(...childDepths);
}




