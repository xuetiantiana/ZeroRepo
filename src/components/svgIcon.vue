<template>
  <svg aria-hidden="true" class="svg-icon" :style="{ color: color }">
    <use :xlink:href="symbolId" rel="external nofollow" />
  </svg>
</template>

<script>
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "SvgIcon",
  props: {
    // 使用的svg图标名称，也就是svg文件名
    name: {
      type: String,
      required: true,
    },
    prefix: {
      type: String,
      default: "icon",
    },
    color: {
      type: String,
    },
  },
  setup(props) {
    const symbolId = computed(() => `#${props.prefix}-${props.name}`);
    return { symbolId };
  },
});
</script>
<style scope>
.svg-icon {
  width: 1.6em;
  height: 1.6em;
  fill: currentColor;
}
</style>
