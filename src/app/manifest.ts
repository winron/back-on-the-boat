import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "回到船上 - Back on the Boat",
    short_name: "回到船上",
    description: "Master HSK 1-6 Chinese characters, grammar, and reading",
    start_url: "/",
    display: "standalone",
    background_color: "#121218",
    theme_color: "#121218",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
