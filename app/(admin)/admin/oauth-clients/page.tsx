"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";

import type {
  AdminCreateOAuthClientRequest,
  AdminOAuthClient,
  AdminUpdateOAuthClientRequest,
} from "@/lib/api/types";
import {
  useAdminOAuthClients,
  ADMIN_OAUTH_CLIENTS_KEY,
} from "@/hooks/use-admin-oauth-clients";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { OAuthClientList } from "@/components/admin/oauth-client-list";
import { OAuthClientForm } from "@/components/admin/oauth-client-form";
import { OAuthClientSecretDialog } from "@/components/admin/oauth-client-secret-dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminErrorState } from "@/components/admin/error-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

export default function AdminOAuthClientsPage() {
  const { mutate } = useSWRConfig();
  const { data: clients, isLoading, error } = useAdminOAuthClients();
  const { createOAuthClient, updateOAuthClient, isLoading: mutationLoading } = useAdminMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdminOAuthClient | undefined>(undefined);
  const [toggleConfirm, setToggleConfirm] = useState<AdminOAuthClient | null>(null);
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

  const handleToggleActive = (client: AdminOAuthClient) => {
    setToggleConfirm(client);
  };

  const handleToggleConfirm = async () => {
    if (!toggleConfirm) return;
    const nextActive = !toggleConfirm.is_active;
    setToggleConfirm(null);
    await updateOAuthClient(toggleConfirm.id, { is_active: nextActive });
  };

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      // Let the dialog finish its close animation before the form's `client`
      // prop drops to undefined, or the reset re-render makes the window flash.
      window.setTimeout(() => setEditingClient(undefined), 250);
    }
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

      {error && <AdminErrorState onRetry={() => mutate(ADMIN_OAUTH_CLIENTS_KEY)} />}

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
            key={editingClient?.id ?? "create"}
            mode={editingClient ? "edit" : "create"}
            client={editingClient}
            onSubmit={handleSubmit}
            loading={mutationLoading}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toggleConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setToggleConfirm(null);
        }}
        title={toggleConfirm?.is_active ? "确认停用客户端" : "确认启用客户端"}
        description={
          toggleConfirm
            ? toggleConfirm.is_active
              ? `确定要停用「${toggleConfirm.client_name}」吗？停用后相关应用的登录授权将立即失效。`
              : `确定要启用「${toggleConfirm.client_name}」吗？启用后相关应用可恢复登录授权。`
            : ""
        }
        confirmLabel={toggleConfirm?.is_active ? "停用" : "启用"}
        confirmVariant={toggleConfirm?.is_active ? "destructive" : "default"}
        loading={mutationLoading}
        onConfirm={handleToggleConfirm}
      />

      <OAuthClientSecretDialog
        open={secretDialog.open}
        onOpenChange={(open) => setSecretDialog((prev) => ({ ...prev, open }))}
        clientName={secretDialog.name}
        clientSecret={secretDialog.secret}
      />
    </div>
  );
}
