const INKVOKER_PROJECT_ROUTE = "#/projects/inkvoker";
const ARAM_MAYHEM_TOOL_ROUTE = "#/tools/aram-mayhem";

export function isProjectDetailRoute(route: string) {
  return route === INKVOKER_PROJECT_ROUTE || route === ARAM_MAYHEM_TOOL_ROUTE;
}

export function shouldUseCustomWheelScroll(route: string, reducedMotion: boolean) {
  return !reducedMotion && !isProjectDetailRoute(route);
}
