// vite.config.ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite"; // 1. Import the nitro plugin

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // 2. Nest the Nitro plugin inside the 'vite' option
  vite: {
    plugins: [
      nitro({
        preset: "vercel", // 3. This preset is crucial
      }),
    ],
  },
});