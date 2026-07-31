import type { FieldErrors, FieldValues } from "react-hook-form";

export function scrollToFirstError<T extends FieldValues>(
  errors: FieldErrors<T>,
  fieldOrder: string[],
): void {
  const first = fieldOrder.find((name) => errors[name]);
  if (!first) return;

  const element =
    document.getElementById(first) ||
    document.querySelector(`[name="${first}"]`) ||
    document.querySelector(`[aria-label="${first}"]`);

  if (!(element instanceof HTMLElement)) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.focus({ preventScroll: true });
}
