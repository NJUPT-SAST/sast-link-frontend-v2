"use client";

import { useCallback, useState } from "react";
import { useSWRConfig } from "swr";

import type {
  AdminCreateOAuthClientRequest,
  AdminUpdateOAuthClientRequest,
  AdminUpdateUserRequest,
} from "@/lib/api/types";
import {
  createAdminOAuthClient,
  deleteAdminOAuthClient,
  deleteAdminUser,
  restoreAdminUser,
  rotateAdminOAuthClientSecret,
  updateAdminOAuthClient,
  updateAdminUser,
} from "@/lib/api/admin";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import {
  ADMIN_OAUTH_CLIENTS_KEY,
} from "@/hooks/use-admin-oauth-clients";
import { buildAdminUserKey, buildAdminUsersKey } from "@/hooks/use-admin-users";

interface UseAdminMutationsResult {
  isLoading: boolean;
  updateUser: (id: number, data: AdminUpdateUserRequest, params?: { listParams?: Parameters<typeof buildAdminUsersKey>[0] }) => Promise<void>;
  deleteUser: (id: number, listParams?: Parameters<typeof buildAdminUsersKey>[0]) => Promise<void>;
  restoreUser: (id: number, listParams?: Parameters<typeof buildAdminUsersKey>[0]) => Promise<void>;
  createOAuthClient: (data: AdminCreateOAuthClientRequest) => Promise<string | null>;
  updateOAuthClient: (id: number, data: AdminUpdateOAuthClientRequest) => Promise<void>;
  deleteOAuthClient: (id: number) => Promise<void>;
  rotateOAuthClientSecret: (id: number) => Promise<string | null>;
}

export function useAdminMutations(): UseAdminMutationsResult {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);

  // Revalidation is best-effort after a successful write: a background refresh
  // failure (network blip, transient 5xx) must not turn a real success into an
  // error toast, a stuck form, or a duplicate submit. The stale list stays until
  // the next revalidate.
  const revalidate = useCallback(
    (key: string) => mutate(key).catch(() => {}),
    [mutate],
  );

  const updateUser = useCallback(
    async (id: number, data: AdminUpdateUserRequest, options?: { listParams?: Parameters<typeof buildAdminUsersKey>[0] }) => {
      setIsLoading(true);
      try {
        await updateAdminUser(id, data);
        message.success("用户信息更新成功");
        await revalidate(buildAdminUserKey(id));
        await revalidate(buildAdminUsersKey(options?.listParams));
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [revalidate],
  );

  const deleteUser = useCallback(
    async (id: number, listParams?: Parameters<typeof buildAdminUsersKey>[0]) => {
      setIsLoading(true);
      try {
        await deleteAdminUser(id);
        message.success("用户已注销");
        await revalidate(buildAdminUserKey(id));
        await revalidate(buildAdminUsersKey(listParams));
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [revalidate],
  );

  const restoreUser = useCallback(
    async (id: number, listParams?: Parameters<typeof buildAdminUsersKey>[0]) => {
      setIsLoading(true);
      try {
        await restoreAdminUser(id);
        message.success("用户已恢复");
        await revalidate(buildAdminUserKey(id));
        await revalidate(buildAdminUsersKey(listParams));
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [revalidate],
  );

  const createOAuthClient = useCallback(
    async (data: AdminCreateOAuthClientRequest) => {
      setIsLoading(true);
      try {
        const response = await createAdminOAuthClient(data);
        const secret = response.data.data.client_secret ?? null;
        await revalidate(ADMIN_OAUTH_CLIENTS_KEY);
        // A confidential client's secret is shown exactly once. If the backend
        // omitted it, treat registration as failed rather than congratulating
        // the admin for a credential they will never see.
        if (data.client_type === "third_party" && !secret) {
          throw new Error("客户端已创建，但未返回 client_secret，请重新注册或联系管理员");
        }
        message.success("OAuth 客户端注册成功");
        return secret;
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [revalidate],
  );

  const updateOAuthClient = useCallback(
    async (id: number, data: AdminUpdateOAuthClientRequest) => {
      setIsLoading(true);
      try {
        const response = await updateAdminOAuthClient(id, data);
        // The backend says so when a deactivation revoked every token; surface it
        // rather than always claiming a plain "updated". `||` (not `??`) so an
        // empty-string message falls back instead of showing a blank toast.
        message.success(response.data.data.message || "客户端信息更新成功");
        await revalidate(ADMIN_OAUTH_CLIENTS_KEY);
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [revalidate],
  );

  const deleteOAuthClient = useCallback(
    async (id: number) => {
      setIsLoading(true);
      try {
        const response = await deleteAdminOAuthClient(id);
        // The backend says so when a deletion revoked every token; surface it
        // rather than always claiming a plain "deleted". `||` (not `??`) so an
        // empty-string message falls back instead of showing a blank toast.
        message.success(response.data.data.message || "客户端已删除");
        await revalidate(ADMIN_OAUTH_CLIENTS_KEY);
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [revalidate],
  );

  const rotateOAuthClientSecret = useCallback(
    async (id: number): Promise<string | null> => {
      setIsLoading(true);
      try {
        const response = await rotateAdminOAuthClientSecret(id);
        const secret = response.data.data.client_secret ?? null;
        await revalidate(ADMIN_OAUTH_CLIENTS_KEY);
        // Rotation runs only on confidential clients; a missing secret means the
        // old one is already invalid and the new one never reached the admin.
        if (!secret) {
          throw new Error("client_secret 轮换未返回新密钥，请重试轮换");
        }
        message.success("client_secret 已轮换");
        return secret;
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [revalidate],
  );

  return {
    isLoading,
    updateUser,
    deleteUser,
    restoreUser,
    createOAuthClient,
    updateOAuthClient,
    deleteOAuthClient,
    rotateOAuthClientSecret,
  };
}
