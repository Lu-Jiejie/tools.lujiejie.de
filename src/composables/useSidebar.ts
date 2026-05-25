import { ref, watchEffect } from 'vue'

const mobileOpen = ref(false)

export function useSidebar() {
  function toggleMobile() {
    mobileOpen.value = !mobileOpen.value
  }

  function closeMobile() {
    mobileOpen.value = false
  }

  watchEffect(() => {
    if (mobileOpen.value) {
      document.body.style.overflow = 'hidden'
    }
    else {
      document.body.style.overflow = ''
    }
  })

  return { mobileOpen, toggleMobile, closeMobile }
}
