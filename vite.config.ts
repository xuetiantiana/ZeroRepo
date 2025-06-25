import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import styleImport, { VantResolve } from 'vite-plugin-style-import';
import legacy from "@vitejs/plugin-legacy"
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

const pathResolve = (pathStr: string) => {
  return path.resolve(__dirname, pathStr)
}


// https://vitejs.dev/config/
export default defineConfig({
  base: "./", //等同于  assetsPublicPath :'./'
  plugins: [
    vue(),
    createSvgIconsPlugin({
      iconDirs: [pathResolve('./src/assets/svgs')],
      symbolId: 'icon-[dir]-[name]',
    }),
    legacy({
      targets: ["ie>=11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
    styleImport({
      resolves: [VantResolve()],
      libs: [
        {
          libraryName: 'vant',
          esModule: true,
          resolveStyle: name => `../es/${name}/style`
        }
      ]

    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      "/api": { // “/api” 以及前置字符串会被替换为真正域名
        target: "http://ec2-13-60-104-138.eu-north-1.compute.amazonaws.com:8000", // 请求域名
        secure: false, // 请求是否为https
        changeOrigin: true, // 是否跨域
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
})
