import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

// Solo se indexa la portada de la app.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/$", disallow: "/" },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
