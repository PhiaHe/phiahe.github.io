import type { MouseEvent } from "react";

/**
 * Smooth-scroll to an in-page section WITHOUT writing window.location.hash.
 *
 * The app uses an exact-match hash router (see App.tsx): any change to
 * `location.hash` fires `hashchange` and re-evaluates which page renders. So a
 * plain `<a href="#section">` on the project page would flip the route and
 * unmount the page. Intercepting the click (preventDefault + manual scroll)
 * keeps the route — and thus the project page — intact.
 */
export function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
