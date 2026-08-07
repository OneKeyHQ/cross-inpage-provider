// 600ms is a hard performance floor. Lower delays repeatedly run every
// adapter selector during mutation-heavy page updates and can cause visible
// jank. Developers and AI agents must diagnose observer lifecycle, pending
// mutations, selector, or layout timing bugs instead of masking them by
// increasing callback frequency. Callers may only opt into a larger delay.
export const MINIMUM_HACK_BUTTON_THROTTLE_DELAY_MS = 600;

export function normalizeHackButtonThrottleDelay(throttleDelay: number): number {
  return Number.isFinite(throttleDelay)
    ? Math.max(MINIMUM_HACK_BUTTON_THROTTLE_DELAY_MS, throttleDelay)
    : MINIMUM_HACK_BUTTON_THROTTLE_DELAY_MS;
}
