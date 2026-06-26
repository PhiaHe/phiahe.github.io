export function advanceSmoothScroll(
  current: number,
  target: number,
  ease: number,
  snapThreshold: number
) {
  const clampedEase = Math.min(Math.max(ease, 0), 1);
  const next = current + (target - current) * clampedEase;
  return Math.abs(target - next) <= snapThreshold ? target : next;
}

export function clampScrollTarget(value: number, max: number) {
  return Math.min(Math.max(value, 0), Math.max(max, 0));
}

export function resolveWheelScrollDelta(
  wheelPixels: number,
  viewportHeight: number,
  currentY: number
) {
  const direction = Math.sign(wheelPixels);
  if (direction === 0) return 0;

  const absPixels = Math.abs(wheelPixels);
  const pixelMultiplier = 1.35;
  const discreteWheelThreshold = 80;
  const sectionStep = viewportHeight * 0.92;
  const heroLaunchStep = viewportHeight * 1.68;
  const heroLaunchZone = viewportHeight * 0.45;
  const heroReturnZone = viewportHeight * 1.85;

  if (absPixels < discreteWheelThreshold) {
    return wheelPixels * pixelMultiplier;
  }

  if (direction > 0 && currentY < heroLaunchZone) {
    return heroLaunchStep;
  }

  if (direction < 0 && currentY <= heroReturnZone) {
    return -currentY;
  }

  return direction * Math.max(absPixels * pixelMultiplier, sectionStep);
}
