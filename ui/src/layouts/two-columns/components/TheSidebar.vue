<script lang="ts" setup></script>
<template>
  <div class="sidebar">
    <section>
      <nav class="stack box">
        <button class="btn primary">
          <span class="with-icon">
            <iconify-icon icon="tabler:message-circle-plus" class="icon"></iconify-icon>
            <span>新对话</span>
          </span>
        </button>
      </nav>
    </section>
    <section class="bottom">
      <nav class="stack box">
        <button class="btn">
          <span class="with-icon">
            <iconify-icon icon="tabler:login" class="icon"></iconify-icon>
            <span>登陆</span>
          </span>
        </button>
      </nav>
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
