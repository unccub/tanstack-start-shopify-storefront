import { SearchIcon } from '~/components/ui/Icons'
import { SearchCombobox } from './SearchCombobox'
import styles from './HeaderSearch.module.css'

// Narrow screens get a link to the search page, which has the same combobox at full width.
export const HeaderSearch = () => (
  <>
    <a className={styles.link} href="/search" aria-label="Search">
      <SearchIcon />
    </a>
    <SearchCombobox label="Quick search" className={styles.combobox} />
  </>
)
