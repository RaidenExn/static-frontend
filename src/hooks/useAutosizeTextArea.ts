import { useEffect } from 'react'

export function useAutosizeTextArea(textAreaRef: HTMLTextAreaElement | null, value: string) {
  useEffect(() => {
    if (textAreaRef) {
      // Reset height to let scrollHeight recalculate properly when content shrinks
      textAreaRef.style.height = 'auto'
      const scrollHeight = textAreaRef.scrollHeight
      // Set the height to match scrollHeight
      textAreaRef.style.height = `${scrollHeight + 4}px`
    }
  }, [textAreaRef, value])
}
