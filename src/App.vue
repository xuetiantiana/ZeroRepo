<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";

import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";

const showForm = ref(false);

const router = useRouter();


</script>

<template>
  <div id="app">
    <!-- <Header class="header-component" style="" /> -->
    <div id="content" style="">
      <div
        style="
          min-height: calc(100% - 40px);
          display: flex;
          flex-direction: column;
          position: relative;
        "
      >
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component
              :is="Component"
              :key="$route.name"
              v-if="$route.meta.keepAlive"
            />
          </keep-alive>
          <component
            :is="Component"
            :key="$route.name"
            v-if="!$route.meta.keepAlive"
          />
        </router-view>
      </div>
      <!-- <Footer class="footer-component" /> -->
    </div>
  </div>
</template>

<style scoped lang="scss">
#app {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  #content {
    // padding-top: 5em;
    // padding-bottom: 40px;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .header-component {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 99;
  }
  .footer-component {
    // position: absolute;
    // bottom:0;
    // left:0;
    // z-index: 10;
  }
}
.ClearKeyBox {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99;
}
.ClearKeyBtn {
  position: absolute;
  top: 1.5em;
  right: 1em;
  z-index: 99;
}
</style>
