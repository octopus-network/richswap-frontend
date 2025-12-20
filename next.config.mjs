import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ord-mirror.magiceden.dev",
        port: "",
        pathname: "/content/**",
      },
    ],
  },
  transpilePackages: ["geist"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add Buffer polyfill for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer/"),
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
