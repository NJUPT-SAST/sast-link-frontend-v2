import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { AdminOAuthClient } from "@/lib/api/types";
import { OAuthClientForm } from "./oauth-client-form";

const client: AdminOAuthClient = {
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

describe("OAuthClientForm edit-mode partial updates", () => {
  // The backend rejects a request that mixes redirect_uris rewrites with
  // capability scopes, so only genuinely changed fields may be sent.
  it("submits only the changed field when the name changes", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<OAuthClientForm mode="edit" client={client} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("应用名称"), {
      target: { value: "Evento 2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ client_name: "Evento 2" });
  });

  it("submits only redirect_uris when only that field changes", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<OAuthClientForm mode="edit" client={client} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("https://app.example.com/callback"), {
      target: { value: "https://evento.example.com/new-callback" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      redirect_uris: ["https://evento.example.com/new-callback"],
    });
  });

  it("submits nothing when the form is untouched", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<OAuthClientForm mode="edit" client={client} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({});
  });
});
