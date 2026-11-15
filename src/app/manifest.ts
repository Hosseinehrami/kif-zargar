import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "کیف زرگر | مدیریت هوشمند دارایی طلا",
    short_name: "کیف زرگر",
    description: "پلتفرم مدیریت دارایی، خرید و فروش و معاملات طلا",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#17191c",
    theme_color: "#c4a875",
    lang: "fa",
    dir: "rtl",
    categories: ["finance", "business"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}