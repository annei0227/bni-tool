import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs 在 server actions 使用，避免被 bundle 進 client
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
