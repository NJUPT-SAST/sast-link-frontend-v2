/**
 * Synthetic bucket key for the folded incomplete-profile slice, plus its label.
 *
 * The key is deliberately not a display string: donut keys otherwise come from
 * the backend role/state enums, and a Chinese literal in that key space would
 * be indistinguishable from an enum value that happens to be unlabelled.
 */
export const INCOMPLETE_BUCKET_KEY = "__incomplete__";
export const INCOMPLETE_BUCKET_LABEL = "未补全";

/**
 * Fold V010-flagged incomplete-profile counts into a single "未补全" slice.
 *
 * The backend /admin/stats reports each live account once in by_role /
 * by_state, plus a second dimension (incomplete_by_role / incomplete_by_state)
 * that groups only the accounts still flagged incomplete under the overview's
 * completion rules (role neither lecturer nor admin; in-school student state).
 * This function subtracts those incomplete counts from their true buckets and
 * appends one "未补全" bucket, so an unfinished account shows exactly once and
 * the donut's total denominator stays unchanged.
 *
 * `incomplete` is optional on purpose: the buckets ship in a separate backend
 * release, so a frontend deployed ahead of it receives no such key. Treat a
 * missing dimension as "nothing to fold" and render the true buckets rather
 * than throwing inside the overview (there is no error boundary above it).
 */
export function foldIncompleteCounts(
  items: [string, number][],
  incomplete?: Record<string, number>,
): [string, number][] {
  const counts = incomplete ?? {};
  const incompleteTotal = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const rest = items
    .map(([key, count]) => [key, count - (counts[key] ?? 0)] as [string, number])
    .filter(([, count]) => count > 0);
  if (incompleteTotal > 0) rest.push([INCOMPLETE_BUCKET_KEY, incompleteTotal]);
  return rest;
}
