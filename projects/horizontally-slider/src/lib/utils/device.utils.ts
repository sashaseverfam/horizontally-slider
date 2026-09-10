export function isTouchDevice() {
  return (
    !!(
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        ((window as any).DocumentTouch &&
          typeof document !== 'undefined' &&
          document instanceof (window as any).DocumentTouch))
    ) ||
    !!(
      typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints || (navigator as any).msMaxTouchPoints)
    )
  );
}

export function isSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const navigatorUserAgent = navigator.userAgent;
  const result = /safari/i.test(navigatorUserAgent) && !/chrome/i.test(navigatorUserAgent);

  return result;
}
