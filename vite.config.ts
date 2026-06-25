import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static site for GitHub Pages (user/organization page: phiahe.github.io).
// For a user/org page the base is "/". If this is ever deployed to a project
// page instead, set base to "/<repo-name>/".
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
  },
});
