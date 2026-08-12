"use client";

import { useRef, useState } from "react";
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
  const { createOAuthClient, updateOAuthClient, deleteOAuthClient, rotateOAuthClientSecret, isLoading: mutationLoading } = useAdminMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdminOAuthClient | undefined>(undefined);
  const [toggleConfirm, setToggleConfirm] = useState<AdminOAuthClient | null>(null);
  const [rotateConfirm, setRotateConfirm] = useState<AdminOAuthClient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminOAuthClient | null>(null);
  // The confirm dialogs clear their target before awaiting, so a double confirm
  // in the same frame would fire twice (a second rotate returns a second, now
  // invalid secret). Ref guard makes repeat confirms no-ops.
  const mutatingRef = useRef(false);
  const [secretDialog, setSecretDialog] = useState<{
    open: boolean;
    name: string;
    secret: string;
    mode: "create" | "rotate";
  }>({
    open: false,
    name: "",
    secret: "",
    mode: "create",
  });

  const handleSubmit = async (data: AdminCreateOAuthClientRequest | AdminUpdateOAuthClientRequest) => {
    if (editingClient) {
      const updateData = data as AdminUpdateOAuthClientRequest;
      if (Object.keys(updateData).length === 0) {
        // Nothing actually changed — the backend rejects an empty payload with a
        // 400, so just close instead of showing a confusing error.
        setEditingClient(undefined);
        setFormOpen(false);
        return;
      }
      await updateOAuthClient(editingClient.id, updateData);
      setEditingClient(undefined);
      setFormOpen(false);
    } else {
      const createData = data as AdminCreateOAuthClientRequest;
      const secret = await createOAuthClient(createData);
      setFormOpen(false);
      if (secret) {
        setSecretDialog({ open: true, name: createData.client_name, secret, mode: "create" });
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
    if (!toggleConfirm || mutatingRef.current) return;
    mutatingRef.current = true;
    const nextActive = !toggleConfirm.is_active;
    setToggleConfirm(null);
    try {
      await updateOAuthClient(toggleConfirm.id, { is_active: nextActive });
    } finally {
      mutatingRef.current = false;
    }
  };

  const handleRotateSecret = (client: AdminOAuthClient) => {
    setRotateConfirm(client);
  };

  const handleRotateConfirm = async () => {
    if (!rotateConfirm || mutatingRef.current) return;
    mutatingRef.current = true;
    const { id, client_name: name } = rotateConfirm;
    setRotateConfirm(null);
    try {
      const secret = await rotateOAuthClientSecret(id);
      if (secret) {
        setSecretDialog({ open: true, name, secret, mode: "rotate" });
      }
    } finally {
      mutatingRef.current = false;
    }
  };

  const handleDelete = (client: AdminOAuthClient) => {
    setDeleteConfirm(client);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || mutatingRef.current) return;
    mutatingRef.current = true;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await deleteOAuthClient(id);
    } finally {
      mutatingRef.current = false;
    }
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
          onDelete={handleDelete}
        />
      )}

      <Dialog open={formOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
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
            onRotateSecret={handleRotateSecret}
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

      <ConfirmDialog
        open={rotateConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setRotateConfirm(null);
        }}
        title="确认轮换 client_secret"
        description={
          rotateConfirm
            ? `确定要为「${rotateConfirm.client_name}」生成新 client_secret 吗？旧 secret 立即失效，相关应用需用新 secret 认证；存量用户会话不受影响。`
            : ""
        }
        confirmLabel="轮换"
        confirmVariant="destructive"
        loading={mutationLoading}
        onConfirm={handleRotateConfirm}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        title="确认删除客户端"
        description={
          deleteConfirm
            ? `确定要删除「${deleteConfirm.client_name}」吗？该操作不可恢复，客户端已签发的全部 Token 将立即失效，相关应用的登录授权全部断开。`
            : ""
        }
        confirmLabel="删除"
        confirmVariant="destructive"
        loading={mutationLoading}
        onConfirm={handleDeleteConfirm}
      />

      <OAuthClientSecretDialog
        open={secretDialog.open}
        onOpenChange={(open) => setSecretDialog((prev) => ({ ...prev, open }))}
        clientName={secretDialog.name}
        clientSecret={secretDialog.secret}
        mode={secretDialog.mode}
      />
    </div>
  );
}
