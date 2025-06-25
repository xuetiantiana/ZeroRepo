
export const getParameterByName = (name: string) => {
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); // 构造一个含有目标参数的正则表达式对象
  const r = window.location.search.substr(1).match(reg);  // 匹配目标参数
  if (r != null) return unescape(r[2]); return null; // 返回参数值
}

export const hancelData = (data: any) => {
  // 循环便利每个属性
  let arr = [];
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      // 只遍历对象自身的属性
      arr.push(data[key]);
    }
  }
  console.log("$$", arr);
  return arr;
};

export const pushGallery = (obj, target, user, environment) => {
  // 从 localStorage 获取 JSON 字符串
  const storedArrayString = localStorage.getItem("allGallery");
  // 将 JSON 字符串解析为数组
  const myArrayGallery = storedArrayString ? JSON.parse(storedArrayString) : [];
  if (
    myArrayGallery.length > 0 &&
    myArrayGallery[0].target == target &&
    myArrayGallery[0].user == user &&
    myArrayGallery[0].environment == environment
  ) {
  } else {
    myArrayGallery.unshift({
      target: target,
      user: user,
      environment: environment,
      list: [],
    });
  }
  const myArray = myArrayGallery[0].list;
  myArray.unshift(obj);
  localStorage.setItem("allGallery", JSON.stringify(myArrayGallery));
};


export const getCurrentDateTime = () => {
  var now = new Date();
  var year = now.getFullYear(); // 获取完整的年份
  var month = now.getMonth() + 1; // 获取当前月份，需要加1因为月份是从0开始的
  var day = now.getDate(); // 获取当前日
  var hours = now.getHours(); // 获取当前小时数
  var minutes = now.getMinutes(); // 获取当前分钟数
  var seconds = now.getSeconds(); // 获取当前秒数

  // 补零函数
  function addZero(i) {
    return (i < 10 ? "0" : "") + i;
  }

  // 格式化输出
  return year + "-" + addZero(month) + "-" + addZero(day) + " " +
    addZero(hours) + ":" + addZero(minutes) + ":" + addZero(seconds);
}

export const downloadImageFromURL = async (url, filenameWithoutExt = 'download') => {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) throw new Error('图片请求失败')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    // 自动提取后缀（如 .jpg, .png），默认 .jpg
    let ext = '.jpg'
    const matchedExt = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i)
    if (matchedExt) ext = matchedExt[0].split('?')[0] // 去掉 URL 参数

    const fullName = filenameWithoutExt + ext

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fullName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('下载失败:', error)
  }
}



