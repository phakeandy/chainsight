<script lang="ts" setup>
import { RouterView } from 'vue-router'

defineOptions({
  name: 'TwoColumnsLayout',
})
</script>

<template>
  <div class="sidebar">
    <RouterView></RouterView>
  </div>
  <div class="content">
    <RouterView></RouterView>
  </div>
</template>
