const INKVOKER_PROJECT_ROUTE = "#/projects/inkvoker";

export function isProjectDetailRoute(route: string) {
  return route === INKVOKER_PROJECT_ROUTE;
}

export function shouldUseCustomWheelScroll(route: string, reducedMotion: boolean) {
  return !reducedMotion && !isProjectDetailRoute(route);
}
