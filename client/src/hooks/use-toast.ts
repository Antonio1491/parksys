// Temporary simplified toast hook to fix React preamble error
import { useState } from "react"

export function useToast() {
  return {
    toast: ({ title, description, variant }: any) => {
      console.log('Toast:', { title, description, variant })
    },
    toasts: [],
    dismiss: () => {}
  }
}

export { useToast as toast }