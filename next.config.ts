/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve static files from /public
  // Allow the logs directory on disk (not exposed to web)
  
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",            value: "DENY" },
          { key: "X-XSS-Protection",           value: "1; mode=block" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",   // Next.js needs inline scripts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // Allow PDF download
      {
        source: "/cv/:path*",
        headers: [
          { key: "Content-Disposition", value: "attachment" },
          { key: "Content-Type",        value: "application/pdf" },
        ],
      },
      {
        source: "/portfolio/:path*",
        headers: [
          { key: "Content-Disposition", value: "attachment" },
          { key: "Content-Type",        value: "application/pdf" },
        ],
      },
    ];
  },
};

export default nextConfig;
