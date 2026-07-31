"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import type {
  AdminCreateOAuthClientRequest,
  AdminOAuthClient,
  AdminUpdateOAuthClientRequest,
} from "@/lib/api/types";
import {
  adminOAuthClientSchema,
  type AdminOAuthClientFormValues,
} from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { AuthFormField } from "@/components/auth/auth-form-field";

const GRANT_TYPE_OPTIONS = [
  { value: "authorization_code", label: "授权码模式" },
  { value: "refresh_token", label: "刷新令牌" },
] as const;

const SCOPE_OPTIONS = [
  { value: "openid", label: "OpenID" },
  { value: "profile", label: "资料" },
  { value: "email", label: "邮箱" },
] as const;

const CLIENT_TYPE_OPTIONS = [
  { value: "first_party", label: "内部应用" },
  { value: "third_party", label: "第三方应用" },
] as const;

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

interface OAuthClientFormProps {
  mode: "create" | "edit";
  client?: AdminOAuthClient;
  onSubmit: (data: AdminCreateOAuthClientRequest | AdminUpdateOAuthClientRequest) => Promise<void>;
  loading?: boolean;
}

function toCreateRequest(values: AdminOAuthClientFormValues): AdminCreateOAuthClientRequest {
  return {
    client_name: values.client_name,
    client_type: values.client_type,
    redirect_uris: values.redirect_uris,
    grant_types: values.grant_types,
    scopes: values.scopes,
  };
}

function toUpdateRequest(values: AdminOAuthClientFormValues): AdminUpdateOAuthClientRequest {
  const request: AdminUpdateOAuthClientRequest = {};
  if (values.client_name !== undefined) request.client_name = values.client_name;
  if (values.redirect_uris !== undefined) request.redirect_uris = values.redirect_uris;
  if (values.is_active !== undefined) request.is_active = values.is_active;
  return request;
}

export function OAuthClientForm({ mode, client, onSubmit, loading = false }: OAuthClientFormProps) {
  const isCreate = mode === "create";

  const form = useForm<AdminOAuthClientFormValues>({
    resolver: zodResolver(adminOAuthClientSchema),
    defaultValues: {
      client_name: client?.client_name ?? "",
      client_type: client?.client_type ?? "third_party",
      redirect_uris: client?.redirect_uris.length ? client.redirect_uris : [""],
      grant_types: client?.grant_types ?? ["authorization_code"],
      scopes: client?.scopes ?? ["openid"],
      is_active: client?.is_active ?? true,
    },
  });

  const redirectUris = useWatch({
    control: form.control,
    name: "redirect_uris",
  });

  const addRedirectUri = () => {
    form.setValue("redirect_uris", [...redirectUris, ""], { shouldValidate: true });
  };

  const removeRedirectUri = (index: number) => {
    form.setValue(
      "redirect_uris",
      redirectUris.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  };

  useEffect(() => {
    if (client) {
      form.reset(
        {
          client_name: client.client_name,
          client_type: client.client_type,
          redirect_uris: client.redirect_uris,
          grant_types: client.grant_types,
          scopes: client.scopes,
          is_active: client.is_active,
        },
        { keepDirtyValues: true },
      );
    }
  }, [client, form]);

  const handleValid = async (values: AdminOAuthClientFormValues) => {
    if (isCreate) {
      await onSubmit(toCreateRequest(values));
    } else {
      await onSubmit(toUpdateRequest(values));
    }
  };

  const submit = form.handleSubmit(handleValid);

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex max-w-[640px] flex-col gap-6">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="应用名称"
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            </FormItem>
          )}
        />

        {isCreate && (
          <FormField
            control={form.control}
            name="client_type"
            render={({ field }) => (
              <FormItem>
                <label htmlFor="client_type" className="mb-2 block text-[13px] text-muted-foreground">
                  客户端类型
                </label>
                <select id="client_type" {...field} className={selectClass}>
                  {CLIENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="min-h-4 text-xs">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}

        <div>
          <label className="mb-2 block text-[13px] text-muted-foreground">回调地址</label>
          <div className="flex flex-col gap-2">
            {redirectUris.map((_, index) => (
              <div key={index} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`redirect_uris.${index}`}
                  render={({ field: inputField, fieldState }) => (
                    <FormItem className="flex-1">
                      <AuthFormField
                        {...inputField}
                        ref={inputField.ref}
                        label=""
                        placeholder="https://app.example.com/callback"
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                      />
                    </FormItem>
                  )}
                />
                {redirectUris.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeRedirectUri(index)}
                    aria-label="删除回调地址"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addRedirectUri}
            className="mt-2"
            disabled={redirectUris.length >= 10}
          >
            <Plus className="mr-1 size-4" />
            添加回调地址
          </Button>
          <div className="min-h-4 text-xs">
            <FormMessage />
          </div>
        </div>

        {isCreate && (
          <>
            <div>
              <label className="mb-2 block text-[13px] text-muted-foreground">授权类型</label>
              <div className="flex flex-wrap gap-4">
                {GRANT_TYPE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      value={opt.value}
                      {...form.register("grant_types")}
                      className="size-4 rounded border-input"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div className="min-h-4 text-xs">
                <FormMessage />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[13px] text-muted-foreground">权限范围</label>
              <div className="flex flex-wrap gap-4">
                {SCOPE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      value={opt.value}
                      {...form.register("scopes")}
                      className="size-4 rounded border-input"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div className="min-h-4 text-xs">
                <FormMessage />
              </div>
            </div>
          </>
        )}

        {!isCreate && (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <label htmlFor="is_active" className="text-sm">
                  启用该客户端
                </label>
              </FormItem>
            )}
          />
        )}

        <FormError message={form.formState.errors.root?.message} />

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <DotLoading /> : isCreate ? "注册" : "保存修改"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
