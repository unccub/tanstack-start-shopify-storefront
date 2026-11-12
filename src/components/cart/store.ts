import { useSyncExternalStore } from 'react'

type State = { open: boolean; messages: ReadonlyArray<string>; announcement: string }

const NO_MESSAGES: ReadonlyArray<string> = []

let state: State = { open: false, messages: NO_MESSAGES, announcement: '' }
let opener: HTMLElement | null = null
const listeners = new Set<() => void>()

const update = (next: Partial<State>) => {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Pass the element that opened the drawer so focus can go back to it on close.
export const openCartDrawer = (from?: HTMLElement | null) => {
  opener = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
  update({ open: true })
}

export const closeCartDrawer = () => {
  if (state.open) update({ open: false })
}

export const takeCartDrawerOpener = () => {
  const element = opener
  opener = null
  return element?.isConnected ? element : null
}

export const setCartMessages = (messages: ReadonlyArray<string>) => {
  if (messages.length === 0 && state.messages.length === 0) return
  update({ messages: messages.length > 0 ? messages : NO_MESSAGES })
}

export const useCartDrawerOpen = () =>
  useSyncExternalStore(
    subscribe,
    () => state.open,
    () => false,
  )

export const useCartMessages = () =>
  useSyncExternalStore(
    subscribe,
    () => state.messages,
    () => NO_MESSAGES,
  )

// Spoken only, for changes a sighted shopper can already see.
export const announceCart = (announcement: string) => {
  if (announcement !== state.announcement) update({ announcement })
}

export const useCartAnnouncement = () =>
  useSyncExternalStore(
    subscribe,
    () => state.announcement,
    () => '',
  )
