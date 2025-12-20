<template>
  <div class="input-area center">
    <div class="input box cluster">
      <textarea rows="1" name="" id="">llslsl</textarea>
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

  margin-block-start: var(--space-m);
  margin-block-end: var(--space-xl);

  &.center {
    --max-width: 47.5rem;
  }
}

.input {
  &.box {
    --_padding: 8px;
  }
  &.cluster {
    --_wrap: nowrap;
  }
}

.btn {
  --padding: var(--space-xs);
  border-radius: 50%;
}
</style>
