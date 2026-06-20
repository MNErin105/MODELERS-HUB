import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js 16 prefers the new URL object syntax for remotePatterns.
    // Array<URL | RemotePattern> — both forms are accepted per the type definition.
    remotePatterns: [
      // Placeholder avatars used in search typeahead
      new URL("https://picsum.photos/**"),
      // Supabase Storage — avatars bucket and post-images bucket
      // Using /** to cover both /storage/v1/object/public/* paths
      new URL("https://vfqrskzieolsqjampqih.supabase.co/**"),
    ],
    qualities: [75],
    // NAT64 environments (IPv6-only networks with DNS64) cause Next.js's SSRF
    // protection to misidentify Supabase CDN IPs (64:ff9b::/96 prefix) as
    // private. The dev script uses --dns-result-order=ipv4first to fix this,
    // but dangerouslyAllowLocalIP covers NAT64 deployment environments too.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
