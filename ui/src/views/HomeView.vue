<script setup lang="ts">
import InputArea from '@/components/views/home/InputArea.vue'
defineOptions({
  name: 'HomePage',
})
</script>

<template>
  <div class="wrapper">
    <section class="content"></section>
    <section class="input">
      <InputArea />
    </section>
  </div>
</template>

<style scoped>
.wrapper {
  height: 100%;

  display: grid;
  grid-template:
    'content' 1fr
    'input' auto
    / 1fr;

  & .content {
    grid-area: content;
  }

  & .input {
    grid-area: input;
  }
}
</style>