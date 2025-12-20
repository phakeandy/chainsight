<script lang="ts" setup></script>
<template>
  <div class="sidebar">
    <section>
      <nav></nav>
    </section>
    <section class="bottom">
      <div class="stack box">
        <button class="box with-icon">
          <iconify-icon icon="tabler:login" class="icon"></iconify-icon>
          <span> 登陆</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sidebar {
  border-right: var(--border-sidebar);
  height: 100%;
  display: grid;
  grid-template:
    'main' 1fr
    'bottom' auto
    / 1fr;

  & .bottom {
    grid-area: bottom;
  }
  & .main {
    grid-area: main;
  }
}

.bottom {
  border-top: var(--border-sidebar);
}
</style>
