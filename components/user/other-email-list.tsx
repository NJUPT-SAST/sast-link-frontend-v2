"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { useIdentities } from "@/hooks/use-identities";
import { message } from "@/lib/message";
import { unbindIdentity, bindEmail, verifyBindEmail } from "@/lib/api/user";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MAX_OTHER_EMAILS = 3;

type OtherEmailIdentity = { id: number; email: string };

type Step =
  | { kind: "closed" }
  | { kind: "manage" }
  | { kind: "add-email" }
  | { kind: "verify-code"; email: string; bindTicket: string }
  | { kind: "unbind"; identity: OtherEmailIdentity };

export function OtherEmailList() {
  const { identities, mutate } = useIdentities();

  const others: OtherEmailIdentity[] = identities
    .filter((i) => i.provider === "other_mail")
    .map((i) => ({ id: i.id, email: i.provider_id }));

  const [step, setStep] = useState<Step>({ kind: "closed" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setStep({ kind: "closed" });
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
      setStep({ kind: "verify-code", email: trimmed, bindTicket: res.data.data.bind_ticket });
    } catch {
      setError("发送验证码失败");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const s = step as { kind: "verify-code"; email: string; bindTicket: string };
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
      close();
    } catch {
      setError("验证失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = async (id: number) => {
    if (!password) {
      setError("请输入当前密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await unbindIdentity(id, password);
      message.success("已解绑");
      mutate();
      close();
    } catch {
      setError("密码错误或解绑失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="type-tech text-tertiary">已绑定邮箱</span>
        <button
          type="button"
          aria-label="管理已绑定邮箱"
          onClick={() => setStep({ kind: "manage" })}
          className="grid size-6 place-items-center rounded text-tertiary transition-colors hover:text-foreground"
        >
          <Pencil size={14} />
        </button>
      </div>
      <div className="min-h-[28px] py-0.5 text-sm leading-6">
        {others.length === 0 ? (
          <span className="text-muted-foreground">你还没有绑定其他邮箱哦</span>
        ) : (
          <ul className="space-y-0.5">
            {others.map((o) => (
              <li key={o.id}>{o.email}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Management dialog */}
      <Dialog open={step.kind !== "closed"} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-md">
          {step.kind === "manage" ? (
            <>
              <DialogHeader>
                <DialogTitle>已绑定邮箱</DialogTitle>
                <DialogDescription>
                  最多绑定 {MAX_OTHER_EMAILS} 个其他邮箱
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                {others.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无绑定邮箱</p>
                ) : (
                  <ul className="space-y-2">
                    {others.map((o) => (
                      <li key={o.id} className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2 text-sm">
                        <span className="truncate">{o.email}</span>
                        <button
                          type="button"
                          onClick={() => setStep({ kind: "unbind", identity: o })}
                          className="ml-3 shrink-0 text-xs text-tertiary transition-colors hover:text-destructive"
                        >
                          解绑
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {others.length < MAX_OTHER_EMAILS && (
                  <Button variant="outline" size="sm" onClick={() => setStep({ kind: "add-email" })} className="mt-1">
                    添加邮箱
                  </Button>
                )}
              </div>
            </>
          ) : step.kind === "add-email" ? (
            <>
              <DialogHeader>
                <DialogTitle>添加邮箱</DialogTitle>
                <DialogDescription>
                  当前已绑定 {others.length}/{MAX_OTHER_EMAILS} 个
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <AuthFormField
                  label="邮箱地址"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setStep({ kind: "manage" }); setError(""); }}>
                  返回
                </Button>
                <Button onClick={handleAddEmail} disabled={loading}>
                  {loading ? <DotLoading /> : "发送验证码"}
                </Button>
              </DialogFooter>
            </>
          ) : step.kind === "verify-code" ? (
            <>
              <DialogHeader>
                <DialogTitle>验证邮箱</DialogTitle>
                <DialogDescription>
                  验证码已发送至 {(step as { email: string }).email}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <AuthFormField
                  label="验证码"
                  placeholder="6 位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  error={error}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={close}>取消</Button>
                <Button onClick={handleVerify} disabled={loading}>
                  {loading ? <DotLoading /> : "确认绑定"}
                </Button>
              </DialogFooter>
            </>
          ) : step.kind === "unbind" ? (
            <>
              <DialogHeader>
                <DialogTitle>解绑邮箱</DialogTitle>
                <DialogDescription>
                  确认解绑 {(step as { identity: OtherEmailIdentity }).identity.email}？
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <AuthFormField
                  label="当前密码"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setStep({ kind: "manage" }); setError(""); }}>
                  返回
                </Button>
                <Button onClick={() => handleUnbind((step as { identity: OtherEmailIdentity }).identity.id)} disabled={loading}>
                  {loading ? <DotLoading /> : "确认解绑"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
