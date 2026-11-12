import { useState } from 'react'

// Local state for a control that follows a URL value: instant on input, and realigned when the URL changes.
export const useSyncedState = <T,>(source: T, signature: string = JSON.stringify(source)) => {
  const [value, setValue] = useState(source)
  const [seen, setSeen] = useState(signature)
  if (seen !== signature) {
    setSeen(signature)
    setValue(source)
  }
  return [value, setValue] as const
}
