import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import viteReact from '@vitejs/plugin-react'

// Netlify sets URL at build time; PUBLIC_SITE_URL overrides it.
const configuredSiteUrl = process.env.PUBLIC_SITE_URL ?? process.env.URL
const siteUrl = configuredSiteUrl ?? 'http://localhost:3000'

export default defineConfig(({ command }) => {
  // The config is read once per build environment; one warning is enough.
  if (command === 'build' && !configuredSiteUrl && !process.env.STOREFRONT_SITE_URL_WARNED) {
    process.env.STOREFRONT_SITE_URL_WARNED = '1'
    console.warn(
      `\n[storefront] PUBLIC_SITE_URL is not set, so canonical URLs, robots.txt and the sitemap will say ${siteUrl}.\n` +
        '[storefront] Set it to the public address before deploying anywhere other than Netlify.\n',
    )
  }
  return {
    envPrefix: ['VITE_', 'PUBLIC_'],
    define: {
      'import.meta.env.PUBLIC_SITE_URL': JSON.stringify(siteUrl),
    },
    resolve: { tsconfigPaths: true },
    css: {
      modules: { localsConvention: 'camelCaseOnly' },
    },
    // All the CSS is a few kilobytes gzipped. As one sheet it can be inlined once, and no route fetches styles later.
    build: { cssCodeSplit: false },
    plugins: [
      // Route CSS is a few kilobytes, so it goes into the HTML and no stylesheet blocks the first paint.
      tanstackStart({ server: { build: { inlineCss: true } } }),
      netlify(),
      viteReact(),
    ],
  }
})
