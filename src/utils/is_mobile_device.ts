

export function is_mobile_device()
{
  if (typeof navigator === "undefined") return false
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent)
}
