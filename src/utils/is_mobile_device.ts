

export function is_mobile_device()
{
  if (typeof navigator === "undefined") return false
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent)
}

export function is_small_screen()
{
  if (typeof window === "undefined") return false
  return window.innerWidth <= 768
}
