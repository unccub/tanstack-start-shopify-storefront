import styles from './SkipLink.module.css'

export const MAIN_ID = 'main'

export const SkipLink = () => (
  <a className={styles.skip} href={`#${MAIN_ID}`}>
    Skip to content
  </a>
)
