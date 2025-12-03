<script lang="ts" setup>
import { RouterView } from 'vue-router'
import TheSidebar from './components/TheSidebar.vue'

defineOptions({
  name: 'TwoColumnsLayout',
})
</script>

<template>
  <div class="sidebar">
    <TheSidebar />
  </div>
  <div class="content">
    <RouterView />
  </div>
</template>
