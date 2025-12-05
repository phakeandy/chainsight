<script lang="ts" setup>
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import TheSidebar from './components/TheSidebar.vue'

defineOptions({
  name: 'TwoColumnsLayout',
})
const isSidebarOpen = ref(true)

// function toggleSidebar() {
//   isSidebarOpen.value = !isSidebarOpen.value
// }
</script>

<template>
  <div class="with-sidebar" :data-state="isSidebarOpen ? 'open' : 'closed'">
    <aside>
      <TheSidebar />
    </aside>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.with-sidebar {
  display: grid;
  grid-template-columns: 300px 1fr;

  & > aside {
  }
}

aside {
  width: 100%;
  height: 100%;
  background-color: var(--color-surface-200);
  background-color: pink;
}

main {
  height: 100%;
  background-color: var(--color-surface-200);
  background-color: cyan;
}
</style>
