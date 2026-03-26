import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "回到船上 - Back on the Boat",
    short_name: "回到船上",
    description: "Master HSK 1-6 Chinese characters, grammar, and reading",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121218",
    theme_color: "#121218",
    icons: [
      {
        src: "/icons/sailboat.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
