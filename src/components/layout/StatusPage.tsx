import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import styles from './StatusPage.module.css'

type StatusPageProps = {
  title: string
  message: string
  children?: ReactNode
}

export const StatusPage = ({ title, message, children }: StatusPageProps) => (
  <section className={styles.page}>
    <h1 className={styles.title}>{title}</h1>
    <p className={styles.message}>{message}</p>
    <div className={styles.actions}>
      {children}
      <Link to="/" className={styles.action}>
        Back to the shop
      </Link>
    </div>
  </section>
)

export const NotFound = () => (
  <StatusPage title="Page not found" message="That page does not exist, or it has moved." />
)

export const RouteError = ({ reset }: ErrorComponentProps) => (
  <StatusPage title="Something went wrong" message="The page could not be loaded. Try again in a moment.">
    <button type="button" className={styles.action} onClick={reset}>
      Try again
    </button>
  </StatusPage>
)
