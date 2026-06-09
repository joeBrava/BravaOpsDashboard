import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vitest 4 multi-project ("projects") config.
//
// - "node":  the existing lib unit tests. Plain Node environment, relative
//            imports only (no @/ alias) — unchanged from the original config so
//            all 151 lib tests keep passing.
// - "jsdom": React component / page smoke tests. Needs the React plugin for the
//            JSX transform, a jsdom DOM, jest-dom matchers, and a project-local
//            @/ alias resolver (absent at the root) so component tests can use
//            the same "@/..." imports the components themselves use.
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["lib/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: {
          alias: {
            "@": rootDir.replace(/\/$/, ""),
          },
        },
        test: {
          name: "jsdom",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"],
          include: ["components/**/*.test.tsx", "app/**/*.test.tsx"],
        },
      },
    ],
  },
});
