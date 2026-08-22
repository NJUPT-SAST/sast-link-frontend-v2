"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import type {
  AdminCreateOAuthClientRequest,
  AdminOAuthClient,
  AdminUpdateOAuthClientRequest,
  Scope,
} from "@/lib/api/types";
import {
  adminOAuthClientSchema,
  type AdminOAuthClientFormValues,
} from "@/lib/validations/admin";
import { formatScope } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  { value: "openid", description: "身份标识（必选）", type: "both" as const },
  { value: "profile", description: "资料（昵称、姓名、签名）", type: "both" as const },
  { value: "email", description: "邮箱地址", type: "both" as const },
  {
    value: "admin:read",
    description: "管理·只读：查看用户目录、客户端、审计（仅 third_party；使用它的用户须为 Link 管理员才生效）",
    type: "third_party" as const,
  },
  {
    value: "admin:write",
    description: "管理·写入：改角色、封禁、管理客户端（仅 third_party；使用它的用户须为 Link 管理员才生效）",
    type: "third_party" as const,
  },
  {
    value: "user:read",
    description: "自助·只读：读取用户自己的完整资料",
    type: "both" as const,
  },
  {
    value: "user:write",
    description: "自助·写入：修改用户自己的资料、身份绑定与密码",
    type: "both" as const,
  },
] as const satisfies ReadonlyArray<{
  value: Scope;
  description: string;
  type: "both" | "third_party";
}>;

const CLIENT_TYPE_OPTIONS = [
  { value: "first_party", label: "first_party" },
  { value: "third_party", label: "third_party" },
] as const;

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

interface OAuthClientFormProps {
  mode: "create" | "edit";
  client?: AdminOAuthClient;
  onSubmit: (data: AdminCreateOAuthClientRequest | AdminUpdateOAuthClientRequest) => Promise<void>;
  loading?: boolean;
  /** Renders the secret-rotation strip inside the form for a confidential
   *  third-party client being edited. */
  onRotateSecret?: (client: AdminOAuthClient) => void;
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

function toUpdateRequest(
  client: AdminOAuthClient,
  values: AdminOAuthClientFormValues,
): AdminUpdateOAuthClientRequest {
  // Partial update: only fields that actually changed are submitted. The backend
  // refuses to touch redirect_uris on a capability-scoped client, and refuses to
  // grant a capability scope in the same request as a redirect_uris rewrite, so
  // an always-submit-everything request would fail on exactly the flows this form
  // exists for. client_type is immutable and never appears here.
  const request: AdminUpdateOAuthClientRequest = {};
  if (values.client_name !== client.client_name) request.client_name = values.client_name;
  if (values.redirect_uris.join("\u0000") !== client.redirect_uris.join("\u0000")) {
    request.redirect_uris = values.redirect_uris;
  }
  if (values.is_active !== client.is_active) request.is_active = values.is_active;
  if (values.grant_types.join("\u0000") !== client.grant_types.join("\u0000")) {
    request.grant_types = values.grant_types;
  }
  if (values.scopes.join("\u0000") !== client.scopes.join("\u0000")) {
    request.scopes = values.scopes;
  }
  return request;
}

export function OAuthClientForm({ mode, client, onSubmit, loading = false, onRotateSecret }: OAuthClientFormProps) {
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

  const selectedScopes = useWatch({ control: form.control, name: "scopes" }) ?? [];
  const clientType = useWatch({ control: form.control, name: "client_type" });
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [scopeDraft, setScopeDraft] = useState<Scope[]>([]);

  const openScopeDialog = () => {
    // openid is mandatory and cannot be unchecked; make sure the draft always holds it.
    // A first_party client can never hold admin:* (they cannot be ticked in the
    // dialog either), so keep such stale scopes out of the draft.
    const base = clientType === "first_party"
      ? selectedScopes.filter((s) => !s.startsWith("admin:"))
      : selectedScopes;
    const seeded: Scope[] = base.includes("openid") ? [...base] : ["openid", ...base];
    setScopeDraft(seeded);
    setScopeDialogOpen(true);
  };

  const toggleScopeDraft = (value: Scope) => {
    setScopeDraft((draft) =>
      draft.includes(value) ? draft.filter((s) => s !== value) : [...draft, value],
    );
  };

  const confirmScopes = () => {
    form.setValue("scopes", scopeDraft, { shouldValidate: true });
    setScopeDialogOpen(false);
  };

  const renderScopeRow = (opt: (typeof SCOPE_OPTIONS)[number]) => (
    <label
      key={opt.value}
      className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm hover:bg-muted/50"
    >
      <input
        type="checkbox"
        checked={scopeDraft.includes(opt.value)}
        onChange={() => toggleScopeDraft(opt.value)}
        disabled={opt.value === "openid"}
        className="mt-0.5 size-4 rounded border-input disabled:opacity-60"
      />
      <span>
        <span className="block font-medium">{opt.value}</span>
        <span className="block text-xs text-muted-foreground">{opt.description}</span>
      </span>
    </label>
  );

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
    } else if (client) {
      await onSubmit(toUpdateRequest(client, values));
    }
  };

  const submit = form.handleSubmit(handleValid);

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex max-w-[640px] flex-col gap-4">
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

        <FormField
          control={form.control}
          name="client_type"
          render={({ field }) => (
            <FormItem>
              <label htmlFor="client_type" className="mb-2 block text-[13px] text-muted-foreground">
                客户端类型
              </label>
              {/* client_type is immutable after registration (it decides the
                  credential model and admin-scope grantability), so the field is
                  fixed in edit mode. */}
              <Select
                id="client_type"
                {...field}
                disabled={!isCreate}
                className={selectClass}
                onChange={(event) => {
                  const next = event.target.value;
                  field.onChange(event);
                  // admin:* is only grantable to third_party clients. Dropping it
                  // the moment the type flips to first_party prevents a deadlock
                  // where the checkbox vanishes from the dialog and the schema
                  // rejects with an invisible error.
                  if (next === "first_party") {
                    const current = form.getValues("scopes");
                    const filtered = current.filter((s) => !s.startsWith("admin:"));
                    if (filtered.length !== current.length) {
                      form.setValue("scopes", filtered, { shouldValidate: true });
                    }
                  }
                }}
              >
                {CLIENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {!isCreate && (
                <p className="mt-1 text-xs text-tertiary">
                  客户端类型注册后不可修改（决定凭证模型与可授予的管理权限）
                </p>
              )}
              <div className="min-h-4 text-xs">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div>
          <label className="mb-2 block text-[13px] text-muted-foreground">回调地址</label>
          <div className="flex flex-col gap-2">
            {redirectUris.map((_, index) => (
              <div key={index} className="flex items-start gap-2">
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
                    className="size-12 shrink-0"
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
          {selectedScopes.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedScopes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2 py-1 text-xs text-tertiary"
                >
                  {formatScope(s)}
                </span>
              ))}
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={openScopeDialog}>
            选择权限范围
          </Button>
          {form.formState.errors.scopes?.message && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.scopes.message}
            </p>
          )}
          <div className="min-h-4 text-xs">
            <FormMessage />
          </div>
        </div>

        <Dialog open={scopeDialogOpen} onOpenChange={setScopeDialogOpen}>
          <DialogContent className="border-border/60 bg-card/95 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>选择权限范围</DialogTitle>
              <DialogDescription>
                勾选该客户端可请求的 scope。管理 scope（admin:*）仅 third_party 可持有，且使用它的用户须为 Link 管理员才生效；自助 scope（user:*）任何客户端都可用，仅操作用户自己的记录。
              </DialogDescription>
            </DialogHeader>
            <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
              {SCOPE_OPTIONS.filter((opt) => opt.type === "both" || opt.type === clientType)
                .filter((opt) => !opt.value.startsWith("admin:"))
                .map(renderScopeRow)}
              {clientType === "third_party" && (
                <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="mb-2 text-xs font-medium text-destructive">
                    管理权限 — 仅 third_party 可持有；使用它的用户须为 Link 管理员才生效，授予需谨慎
                  </p>
                  {SCOPE_OPTIONS.filter((opt) => opt.type === "third_party").map(renderScopeRow)}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScopeDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={confirmScopes}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Secret rotation is its own strip inside the form, not a row under the
            save button: it is a destructive credential action, so it gets a
            bordered card of its own above the submit row. Confidential
            third-party clients only. */}
        {!isCreate &&
          client?.client_type === "third_party" &&
          client.client_id !== "sast-link-web" &&
          onRotateSecret && (
            <div className="rounded-lg border border-hairline p-3">
              <div className="mb-1 text-[13px] font-medium">客户端密钥</div>
              <p className="mb-2 text-xs text-tertiary">
                client_secret 仅存 hash，无法查看；泄露后通过轮换重新签发。轮换后旧密钥立即失效，存量用户会话不受影响。
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRotateSecret(client)}
                disabled={loading}
              >
                轮换密钥
              </Button>
            </div>
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
