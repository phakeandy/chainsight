<template>
  <div class="input-area center">
    <div class="input box cluster">
      <textarea rows="1" name="" id="" placeholder="请输入内容..." aria-label="输入消息"></textarea>
      <button class="btn primary" type="button">
        <iconify-icon icon="tabler:send-2"></iconify-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  border-radius: var(--border-radius-field);
  border: 1px solid oklch(0 0 0 / 0.2);
  padding-inline-start: var(--space-m);
  padding-inline-end: var(--space-m);

  margin-block-start: var(--space-m);
  margin-block-end: var(--space-xl);

  &.center {
    --max-width: 47.5rem;
  }
}

.input {
  &.box {
    --padding: 8px;
  }
  &.cluster {
    --flex-wrap: nowrap;
  }
}

.btn {
  --padding: var(--space-xs);
  border-radius: 50%;
}
</style>
