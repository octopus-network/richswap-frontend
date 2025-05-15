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
};

export default withNextIntl(nextConfig);
