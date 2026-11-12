/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_STORE_DOMAIN?: string
  readonly PUBLIC_NOINDEX?: string
  readonly PUBLIC_SITE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
