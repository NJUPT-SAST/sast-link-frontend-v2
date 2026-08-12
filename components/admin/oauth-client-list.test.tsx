import { fireEvent, render, screen } from "@testing-library/react";

import type { AdminOAuthClient } from "@/lib/api/types";
import { OAuthClientList } from "./oauth-client-list";

const thirdPartyClient: AdminOAuthClient = {
  id: 1,
  client_id: "abc123",
  client_name: "Evento",
  client_type: "third_party",
  redirect_uris: ["https://evento.example.com/callback"],
  grant_types: ["authorization_code"],
  scopes: ["openid", "profile"],
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const internalClient: AdminOAuthClient = {
  id: 2,
  client_id: "sast-link-web",
  client_name: "SAST Link Web",
  client_type: "first_party",
  redirect_uris: ["https://link.sast.fun/oauth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  scopes: ["openid", "profile", "email"],
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function noop() {}

function renderList(clients: AdminOAuthClient[], onDelete: (client: AdminOAuthClient) => void = noop) {
  return render(
    <OAuthClientList
      clients={clients}
      onEdit={noop}
      onToggleActive={noop}
      onDelete={onDelete}
    />,
  );
}

describe("OAuthClientList deletion", () => {
  it("renders an enabled delete button for a deletable client", () => {
    renderList([thirdPartyClient]);
    const deleteButton = screen.getByRole("button", { name: "删除" });
    expect(deleteButton).toBeEnabled();
  });

  it("disables delete for the built-in client", () => {
    renderList([internalClient]);
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
  });

  it("invokes onDelete with the target client", () => {
    const onDelete = jest.fn();
    renderList([thirdPartyClient], onDelete);
    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    expect(onDelete).toHaveBeenCalledWith(thirdPartyClient);
  });
});
