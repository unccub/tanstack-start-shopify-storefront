import { useCartAnnouncement, useCartMessages } from './store'
import styles from './Cart.module.css'

// Always in the page, so changes are announced when messages arrive.
export const CartMessages = () => {
  const messages = useCartMessages()
  const announcement = useCartAnnouncement()

  return (
    <>
      <div role="status" className={messages.length > 0 ? styles.messages : undefined}>
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
      <p role="status" className="visually-hidden">
        {announcement}
      </p>
    </>
  )
}
