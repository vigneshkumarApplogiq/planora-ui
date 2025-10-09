import { useState } from 'react'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    // Simple console-based toast for now
    // You can integrate with a proper toast library like sonner or react-hot-toast
    if (variant === 'destructive') {
      console.error(`${title}: ${description}`)
    } else {
      console.log(`${title}: ${description}`)
    }
  }

  return { toast }
}
