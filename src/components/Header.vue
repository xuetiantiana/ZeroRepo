<script setup lang="ts">
import { ref, reactive, inject } from "vue";

</script>

<template>
  <div class="header">
    <div class="navs main-container" style="padding:0 1em">
      <div class="logo-container">
        <router-link to="/" aria-label="Metaphor">
          <img src="/src/assets/logo.svg" alt="" />
        </router-link>
        <router-link to="/">
          <span>Metaphor</span>
        </router-link>
      </div>
      <div class="nav" :class="$route.name == 'home' ? 'on' : ''">
        <!-- <router-link to="/workspace">WorkSpace</router-link> -->
        <router-link to="/WorkSpace">WorkSpace</router-link>
      </div>
      <div class="nav" :class="$route.name == 'gallery' ? 'on' : ''">
        <router-link to="/gallery">Gallery</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped style="scss" lang="scss">
.header {
  background: #f9f9f9;
  .navs {
    height: 5em;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 3em;
    .logo-container {
      font-size: 1.25em;
      display: flex;
      align-items: center;
      padding-right: 1em;
      img {
        width: 1.8em;
        display: block;
      }
      span {
        font-weight: 500;
        padding-left: 0.5em;
      }
      a {
        color: #000;
      }
    }
    .nav {
      font-size: 1.25em;
      position: relative;
      font-weight: 500;

      a {
        color: var(--text-color);
        opacity: .6;
        padding: .2em .2em;
        line-height: 1.6;
        display: inline-block;
        cursor: pointer;
        // border-radius: 2em;
        border-bottom: 2px solid transparent;
      }
      &.on {
        a {
          opacity: 1 !important;
          border-color: rgba(0, 0, 0, 1);
          // background: #000;
        }
      }
      &:hover {
        a {
          opacity: .6;;
        }
      }
    }
  }
}
</style>
