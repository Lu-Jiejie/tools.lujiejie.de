import { ref } from 'vue'

const mobileOpen = ref(false)

export function useSidebar() {
  function toggleMobile() {
    mobileOpen.value = !mobileOpen.value
  }

  function closeMobile() {
    mobileOpen.value = false
  }

  return { mobileOpen, toggleMobile, closeMobile }
}
