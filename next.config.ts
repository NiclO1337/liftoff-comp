import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    // Lets any .module.scss write `@use "mixins" as *;`.
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
