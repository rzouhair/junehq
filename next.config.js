const withPlugins = require("next-compose-plugins");
const withOptimizedImages = require("next-optimized-images");

const nextConfig = {
  env: {
    NEXT_PUBLIC_STRAPI_API_URL: process.env.NEXT_PUBLIC_STRAPI_API_URL,
    NEXT_PUBLIC_MARKETING_HOST: process.env.NEXT_PUBLIC_MARKETING_HOST,
    NEXT_PUBLIC_APP_HOST: process.env.NEXT_PUBLIC_APP_HOST,
    NEXT_SANITY_PROJECT_ID: process.env.NEXT_SANITY_PROJECT_ID,
    NEXT_SANITY_DATASET: process.env.NEXT_SANITY_DATASET,
  },
  async redirects() {
    return [];
  },
  images: {
    loader: "imgix",
    path: `${process.env.NEXT_PUBLIC_MARKETING_HOST}/`,
  },
};

const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.mjs
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    providerImportSource: "@mdx-js/react",
  },
});

const config = withPlugins(
  [
    [
      withOptimizedImages({
        // optimisation disabled by default, to enable check https://github.com/cyrilwanner/next-optimized-images
        optimizedImages: false
      })
    ],
    [
      withMDX({
        // Append the default value with md extensions
        pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
      }),
    ],
  ],
  nextConfig
);

module.exports = config;
