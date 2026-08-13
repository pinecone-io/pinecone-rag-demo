/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so a parent-directory lockfile can't hijack it.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
