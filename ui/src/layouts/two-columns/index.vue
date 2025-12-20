<script lang="ts" setup>
import { useSidebarStore } from '@/stores/sidebar'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { RouterView } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'

defineOptions({
  name: 'TwoColumnsLayout',
})

const sidebarStore = useSidebarStore()

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.isSmaller('md') //	md: 48rem (768px)

sidebarStore.setOpen(!isMobile) // 设置默认状态：移动端关闭，PC端打开
</script>

<template>
  <div class="wrapper with-sidebar min-h-dvh" :data-state="sidebarStore.isOpen ? 'open' : 'closed'">
    <aside>
      <AppSidebar />
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

  @media (min-width: 48rem) {
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
