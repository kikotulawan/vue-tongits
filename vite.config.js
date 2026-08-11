import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Tongits Game",
				short_name: "Tongits",
				description:
					'Experience the thrill of the Philippines\' favorite card game! Form melds, outsmart your opponents, and call "Tong-its" to win.',
				theme_color: "#ffffff",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				scope: "/",
				icons: [
					{
						src: "/tongits-icon-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/tongits-icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
		}),
	],
});
