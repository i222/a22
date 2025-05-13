import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import path from "path";

export default defineConfig({
	// Plugins configuration for Vue
	plugins: [vue()],

	build: {
		sourcemap: true,
		outDir: "./dist", //path.resolve(__dirname, "dist"), // Output directory for production build
		emptyOutDir: true, // Clean output directory before building
		chunkSizeWarningLimit: 1500, 
		rollupOptions: {
			output: {
				manualChunks: {
					vue: ['vue'],
					vendor: ['lodash-es'],
					naiveui: ['naive-ui'],
				},
			},
	},
},
	base: "./", // Relative paths for assets in the final build
});