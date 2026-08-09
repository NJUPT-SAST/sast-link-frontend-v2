import { toast } from "sonner";

/**
 * Toast message API — drop-in replacement for the Redux-based message system.
 * Same surface: message.success/error/warning/info(text, delay?)
 */
export const message = {
  success: (text: string, delay?: number) => {
    toast.success(text, { duration: delay ?? 3000 });
  },
  error: (text: string, delay?: number) => {
    toast.error(text, { duration: delay ?? 3000 });
  },
  warning: (text: string, delay?: number) => {
    toast.warning(text, { duration: delay ?? 3000 });
  },
  info: (text: string, delay?: number) => {
    toast.info(text, { duration: delay ?? 3000 });
  },
  loading: (text: string, delay?: number) => {
    toast.loading(text, { duration: delay ?? Infinity });
  },
};
