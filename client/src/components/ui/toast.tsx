// Simplified toast to fix React preamble error
export const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const ToastViewport = () => null
export const Toast = () => null
export const ToastTitle = () => null
export const ToastDescription = () => null
export const ToastClose = () => null
export const ToastAction = () => null

export type ToastProps = {}
export type ToastActionElement = React.ReactElement