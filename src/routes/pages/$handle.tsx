import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '~/components/catalogue/Breadcrumbs'
import { NotFound, RouteError } from '~/components/layout/StatusPage'
import { Prose } from '~/components/ui/Prose'
import { storefrontConfig } from '~/config'
import { catalogueHeaders } from '~/lib/cache'
import { seo, seoUnavailable } from '~/lib/seo'
import { getPage } from '~/shopify/content.functions'
import styles from '~/styles/page.module.css'

const ContentPage = () => {
  const content = Route.useLoaderData()

  return (
    <article className={styles.page}>
      <div className={styles.header}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: content.title }]} />
        <h1 className={styles.title}>{content.title}</h1>
      </div>
      {content.bodyHtml ? <Prose html={content.bodyHtml} /> : <p className={styles.empty}>This page has no content yet.</p>}
    </article>
  )
}

export const Route = createFileRoute('/pages/$handle')({
  loader: ({ params }) => getPage({ data: { handle: params.handle } }),
  head: ({ loaderData, params }) =>
    loaderData
      ? seo({
          title: loaderData.seo.title ?? loaderData.title,
          description: loaderData.seo.description || loaderData.bodySummary || `${loaderData.title} at ${storefrontConfig.shopName}.`,
          path: `/pages/${params.handle}`,
        })
      : seoUnavailable(),
  headers: catalogueHeaders,
  component: ContentPage,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})
