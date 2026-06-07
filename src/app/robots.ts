import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep transactional pages out of the index.
      disallow: ["/checkout", "/download", "/auth"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
