declare module 'toastify-js' {
  interface ToastifyOptions {
    text?: string
    node?: Element
    duration?: number
    selector?: string | Element | ShadowRoot
    destination?: string
    newWindow?: boolean
    close?: boolean
    gravity?: 'top' | 'bottom'
    position?: 'left' | 'center' | 'right'
    backgroundColor?: string
    avatar?: string
    className?: string
    stopOnFocus?: boolean
    callback?: () => void
    onClick?: () => void
    offset?: {
      x?: number | string
      y?: number | string
    }
    escapeMarkup?: boolean
    style?: Record<string, string>
    ariaLive?: string
    oldestFirst?: boolean
  }

  class Toastify {
    constructor(options: ToastifyOptions)
    showToast(): this
    hideToast(): this
  }

  export default Toastify
}