<script lang="ts" setup>
import { RouterView } from 'vue-router'
import TheSidebar from './components/TheSidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'

defineOptions({
  name: 'TwoColumnsLayout',
})

const sidebarStore = useSidebarStore()
</script>

<template>
  <div class="wrapper with-sidebar min-h-dvh" :data-state="sidebarStore.isOpen ? 'open' : 'closed'">
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
  --_sidebar-width: 300px;

  display: grid;
  grid-template-columns: 0 1fr;

  @media (min-width: 768px) {
    grid-template-columns: var(--_sidebar-width) 1fr;
  }

  &[data-state='open'] {
    grid-template-columns: var(--_sidebar-width) 1fr;
  }
}

.wrapper {
  transition: grid-template-columns 0.3s ease;
  position: relative;
}

aside {
  background-color: var(--color-surface-200);
}

main {
  background-color: var(--color-surface-200);
}
</style>
