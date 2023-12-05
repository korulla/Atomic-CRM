import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import react from '@vitejs/plugin-react';
import visualizer from 'rollup-plugin-visualizer';

// Function to generate aliases for local packages
function generateAliases() {
  const packagesDir = path.resolve(__dirname, '../../');
  const packages = fs.readdirSync(packagesDir);

  return packages.reduce((acc, dirName) => {
    const packageJsonPath = path.resolve(packagesDir, dirName, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);  // Note: Keeping 'require' for JSON files is fine.
      acc[packageJson.name] = path.resolve(packagesDir, dirName, 'src');
    }

    return acc;
  }, {});
}

// Generate aliases outside the config for better organization
const aliases = generateAliases();

// Vite configuration
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: process.env.NODE_ENV !== 'CI',
      filename: './dist/stats.html',
    }),
  ],
  define: {
    'process.env': process.env,
  },
  server: {
    port: 8000,
    open: true,
  },
  base: './',
  esbuild: {
    keepNames: true,
  },
  build: {
    sourcemap: true,
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      // Allow profiling in production
      { find: 'react-dom', replacement: 'react-dom/profiling' },
      { find: 'scheduler/tracing', replacement: 'scheduler/tracing-profiling' },
      // Manually follow the symlinks for local packages to allow deep HMR
      ...Object.keys(aliases).map(packageName => ({
        find: packageName,
        replacement: aliases[packageName],
      })),
    ],
  },
});