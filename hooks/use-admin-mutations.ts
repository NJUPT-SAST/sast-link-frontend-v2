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
        return response.data.data.client.client_secret ?? null;
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
        await updateAdminOAuthClient(id, data);
        message.success("客户端信息更新成功");
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

  return {
    isLoading,
    updateUser,
    deleteUser,
    restoreUser,
    createOAuthClient,
    updateOAuthClient,
  };
}
