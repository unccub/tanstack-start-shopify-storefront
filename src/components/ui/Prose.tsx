import styles from './Prose.module.css'

// Only for HTML that the server has already sanitised.
export const Prose = ({ html, className }: { html: string; className?: string }) => (
  <div className={[styles.prose, className ?? ''].filter(Boolean).join(' ')} dangerouslySetInnerHTML={{ __html: html }} />
)
