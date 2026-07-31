import { apiClient } from "./client";
import type { CardData } from "./types";

/**
 * Fetch a user's public profile card by id.
 *
 * NOTE: the backend returns this as a **bare JSON object** (cardDTO), not
 * wrapped in the `{ code, message, data }` envelope. Only error responses use
 * the envelope, so callers read `response.data` directly and rely on
 * `toApiError` for failures. See backend internal/web/sessionhandler/card.go.
 */
export function getCard(id: number) {
  return apiClient.get<CardData>(`/card/${id}`);
}
