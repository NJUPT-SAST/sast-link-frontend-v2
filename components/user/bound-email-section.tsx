"use client";

import { useState } from "react";

import { useIdentities } from "@/hooks/use-identities";
import { message } from "@/lib/message";
import { toApiError } from "@/lib/api/errors";
import { unbindIdentity, bindEmail, verifyBindEmail } from "@/lib/api/user";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";

const MAX_OTHER_EMAILS = 2;

type OtherEmailIdentity = { id: number; email: string };

type Mode =
  | { kind: "list" }
  | { kind: "add-email" }
  | { kind: "verify-code"; email: string; bindTicket: string }
  | { kind: "unbind"; identity: OtherEmailIdentity };

export function BoundEmailSection() {
  const { identities, mutate } = useIdentities();

  const others: OtherEmailIdentity[] = identities
    .filter((i) => i.provider === "other_mail")
    .map((i) => ({ id: i.id, email: i.provider_id }));

  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setMode({ kind: "list" });
    setEmail("");
    setCode("");
    setPassword("");
    setError("");
  };

  const handleAddEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("请输入有效的邮箱地址");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await bindEmail(trimmed);
      message.info("验证码已发送");
      setMode({ kind: "verify-code", email: trimmed, bindTicket: res.data.data.bind_ticket });
    } catch (error) {
      setError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const s = mode as { kind: "verify-code"; email: string; bindTicket: string };
    if (!/^\d{6}$/.test(code.trim())) {
      setError("请输入 6 位验证码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyBindEmail(s.bindTicket, code.trim());
      message.success("邮箱绑定成功");
      mutate();
      reset();
    } catch (error) {
      setError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async () => {
    const s = mode as { kind: "unbind"; identity: OtherEmailIdentity };
    if (!password) {
      setError("请输入当前密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await unbindIdentity(s.identity.id, password);
      message.success("已解绑");
      mutate();
      reset();
    } catch (error) {
      setError(toApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-hairline">
      {others.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">你还没有绑定其他邮箱哦</p>
      ) : (
        <ul>
          {others.map((o) => (
            <li key={o.id} className="border-b border-hairline">
              <div className="flex min-h-[44px] items-center justify-between py-3 text-sm">
                <span className="truncate">{o.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPassword("");
                    setError("");
                    setMode({ kind: "unbind", identity: o });
                  }}
                  className="ml-3 shrink-0 text-xs text-tertiary transition-colors hover:text-destructive"
                >
                  解绑
                </button>
              </div>
              {mode.kind === "unbind" && mode.identity.id === o.id && (
                <div className="flex flex-col gap-3 border-t border-hairline pb-4 pt-4 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <AuthFormField
                      label="当前密码"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={error}
                    />
                  </div>
                  <div className="flex shrink-0 gap-2 sm:pt-7">
                    <Button variant="outline" size="sm" onClick={reset}>
                      取消
                    </Button>
                    <Button size="sm" onClick={handleUnbind} disabled={loading}>
                      {loading ? <DotLoading /> : "确认解绑"}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {mode.kind === "add-email" ? (
        <div className="flex flex-col gap-3 border-b border-hairline py-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <AuthFormField
              label="邮箱地址"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
          </div>
          <div className="flex shrink-0 gap-2 sm:pt-7">
            <Button variant="outline" size="sm" onClick={reset}>
              取消
            </Button>
            <Button size="sm" onClick={handleAddEmail} disabled={loading}>
              {loading ? <DotLoading /> : "发送验证码"}
            </Button>
          </div>
        </div>
      ) : mode.kind === "verify-code" ? (
        <div className="flex flex-col gap-3 border-b border-hairline py-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <p className="mb-2 text-[13px] text-muted-foreground">验证码已发送至 {mode.email}</p>
            <AuthFormField
              label="验证码"
              placeholder="6 位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={error}
            />
          </div>
          <div className="flex shrink-0 gap-2 sm:pt-7">
            <Button variant="outline" size="sm" onClick={reset}>
              取消
            </Button>
            <Button size="sm" onClick={handleVerify} disabled={loading}>
              {loading ? <DotLoading /> : "确认绑定"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-3">
          {others.length < MAX_OTHER_EMAILS && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("");
                setError("");
                setMode({ kind: "add-email" });
              }}
            >
              添加邮箱
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
