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
  rotateOAuthClientSecret: (id: number) => Promise<string | null>;
}

export function useAdminMutations(): UseAdminMutationsResult {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);

  const updateUser = useCallback(
    async (id: number, data: AdminUpdateUserRequest, options?: { listParams?: Parameters<typeof buildAdminUsersKey>[0] }) => {
      setIsLoading(true);
      try {
        await updateAdminUser(id, data);
        message.success("用户信息更新成功");
        await mutate(buildAdminUserKey(id));
        await mutate(buildAdminUsersKey(options?.listParams));
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutate],
  );

  const deleteUser = useCallback(
    async (id: number, listParams?: Parameters<typeof buildAdminUsersKey>[0]) => {
      setIsLoading(true);
      try {
        await deleteAdminUser(id);
        message.success("用户已注销");
        await mutate(buildAdminUserKey(id));
        await mutate(buildAdminUsersKey(listParams));
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutate],
  );

  const restoreUser = useCallback(
    async (id: number, listParams?: Parameters<typeof buildAdminUsersKey>[0]) => {
      setIsLoading(true);
      try {
        await restoreAdminUser(id);
        message.success("用户已恢复");
        await mutate(buildAdminUserKey(id));
        await mutate(buildAdminUsersKey(listParams));
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutate],
  );

  const createOAuthClient = useCallback(
    async (data: AdminCreateOAuthClientRequest) => {
      setIsLoading(true);
      try {
        const response = await createAdminOAuthClient(data);
        message.success("OAuth 客户端注册成功");
        await mutate(ADMIN_OAUTH_CLIENTS_KEY);
        return response.data.data.client_secret ?? null;
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutate],
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
        await mutate(ADMIN_OAUTH_CLIENTS_KEY);
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutate],
  );

  const rotateOAuthClientSecret = useCallback(
    async (id: number): Promise<string | null> => {
      setIsLoading(true);
      try {
        const response = await rotateAdminOAuthClientSecret(id);
        message.success("client_secret 已轮换");
        await mutate(ADMIN_OAUTH_CLIENTS_KEY);
        return response.data.data.client_secret ?? null;
      } catch (error) {
        message.error(toApiError(error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutate],
  );

  return {
    isLoading,
    updateUser,
    deleteUser,
    restoreUser,
    createOAuthClient,
    updateOAuthClient,
    rotateOAuthClientSecret,
  };
}
