/** Inline error text for form-level (root) or standalone errors. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
