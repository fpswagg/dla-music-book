import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Myenge ma Bonakristo",
    short_name: "Myenge",
    description: "Cantiques Myenge ma Bonakristo — hors ligne, projection, programmes du culte.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f0e8",
    theme_color: "#2d5a2d",
    lang: "fr",
    categories: ["books", "music", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Cantiques", url: "/songs" },
      { name: "Hors ligne", url: "/offline" },
    ],
  };
}
