import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const _isOpen = ref(true)
  const isOpen = readonly(_isOpen)

  function toggle() {
    _isOpen.value = !_isOpen.value
  }

  function setOpen(value: boolean) {
    _isOpen.value = value
  }

  function $reset() {
    _isOpen.value = true
  }

  return {
    isOpen,
    toggle,
    setOpen,
    $reset,
  }
})
