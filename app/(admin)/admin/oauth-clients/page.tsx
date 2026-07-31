"use client";

import { useState } from "react";

import type {
  AdminCreateOAuthClientRequest,
  AdminOAuthClient,
  AdminUpdateOAuthClientRequest,
} from "@/lib/api/types";
import { useAdminOAuthClients } from "@/hooks/use-admin-oauth-clients";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { OAuthClientList } from "@/components/admin/oauth-client-list";
import { OAuthClientForm } from "@/components/admin/oauth-client-form";
import { OAuthClientSecretDialog } from "@/components/admin/oauth-client-secret-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

export default function AdminOAuthClientsPage() {
  const { data: clients, isLoading, error } = useAdminOAuthClients();
  const { createOAuthClient, updateOAuthClient, isLoading: mutationLoading } = useAdminMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdminOAuthClient | undefined>(undefined);
  const [secretDialog, setSecretDialog] = useState<{ open: boolean; name: string; secret: string }>({
    open: false,
    name: "",
    secret: "",
  });

  const handleSubmit = async (data: AdminCreateOAuthClientRequest | AdminUpdateOAuthClientRequest) => {
    if (editingClient) {
      await updateOAuthClient(editingClient.id, data as AdminUpdateOAuthClientRequest);
      setEditingClient(undefined);
      setFormOpen(false);
    } else {
      const createData = data as AdminCreateOAuthClientRequest;
      const secret = await createOAuthClient(createData);
      setFormOpen(false);
      if (secret) {
        setSecretDialog({ open: true, name: createData.client_name, secret });
      }
    }
  };

  const handleEdit = (client: AdminOAuthClient) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleToggleActive = async (client: AdminOAuthClient) => {
    await updateOAuthClient(client.id, { is_active: !client.is_active });
  };

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingClient(undefined);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-title2">OAuth 客户端管理</h1>
          <p className="mt-1 text-sm text-tertiary">管理内部与第三方 OAuth 客户端</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>注册客户端</Button>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotLoading />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          加载失败，请稍后重试
        </div>
      )}

      {!isLoading && !error && clients && (
        <OAuthClientList
          clients={clients}
          loading={mutationLoading}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
        />
      )}

      <Dialog open={formOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="type-title3">
              {editingClient ? "编辑客户端" : "注册客户端"}
            </DialogTitle>
          </DialogHeader>
          <OAuthClientForm
            mode={editingClient ? "edit" : "create"}
            client={editingClient}
            onSubmit={handleSubmit}
            loading={mutationLoading}
          />
        </DialogContent>
      </Dialog>

      <OAuthClientSecretDialog
        open={secretDialog.open}
        onOpenChange={(open) => setSecretDialog((prev) => ({ ...prev, open }))}
        clientName={secretDialog.name}
        clientSecret={secretDialog.secret}
      />
    </div>
  );
}
