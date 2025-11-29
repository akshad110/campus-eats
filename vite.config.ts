import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check if SSL certificates exist
  let httpsConfig = undefined;
  try {
    if (fs.existsSync("./localhost-key.pem") && fs.existsSync("./localhost.pem")) {
      httpsConfig = {
        key: fs.readFileSync("./localhost-key.pem"),
        cert: fs.readFileSync("./localhost.pem"),
      };
    }
  } catch (error) {
    // SSL files not found, use HTTP
  }

  return {
    server: {
      host: true,
      port: 8080,
      ...(httpsConfig && { https: httpsConfig }),
      proxy: {
        "/api": {
          target: process.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
    },
  };
});
