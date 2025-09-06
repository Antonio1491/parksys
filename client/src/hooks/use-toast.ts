import { SimpleToast } from "@/components/ui/simple-toast";

export function useToast() {
  return {
    toast: ({ title, description, variant }: any) => {
      if (variant === 'destructive') {
        SimpleToast.error(`${title}: ${description}`);
      } else {
        SimpleToast.success(`${title}: ${description}`);
      }
    },
    toasts: [],
    dismiss: () => {}
  };
}

export { useToast as toast };