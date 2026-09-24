"use client";

import { useState } from "react";
import { ShieldQuestion } from "lucide-react";

import { useBadge } from "@/hooks/use-badge";
import {
  type BadgeSize,
  type BadgeTheme,
  badgeUrl,
  disableBadge,
  enableBadge,
} from "@/lib/api/badge";
import { message } from "@/lib/message";
import { toApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SIZES: { value: BadgeSize; label: string }[] = [
  { value: "sm", label: "紧凑" },
  { value: "md", label: "标准" },
  { value: "lg", label: "大图" },
];

const THEMES: { value: BadgeTheme; label: string }[] = [
  { value: "auto", label: "自动" },
  { value: "light", label: "亮色" },
  { value: "dark", label: "暗色" },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Settings section for the personal badge: opt in, preview, copy share
 * snippets, opt out. The share URL is a capability — copying it is the whole
 * point, so nothing here treats it as a secret. */
export function BadgeSection() {
  const { badge, isLoading, mutate } = useBadge();
  const [busy, setBusy] = useState(false);
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [size, setSize] = useState<BadgeSize>("md");
  const [theme, setTheme] = useState<BadgeTheme>("auto");

  const url =
    badge?.enabled && badge.key ? badgeUrl(badge.key, size, theme) : null;
  const absoluteUrl = url ? new URL(url, window.location.origin).toString() : null;

  const handleEnable = async () => {
    setBusy(true);
    try {
      await enableBadge();
      message.success("徽标已开启");
      await mutate();
    } catch (error) {
      message.error(toApiError(error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await disableBadge();
      setConfirmingDisable(false);
      message.success("徽标已关闭，原链接已失效");
      await mutate();
    } catch (error) {
      message.error(toApiError(error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async (text: string | null, label: string) => {
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      message.success(`${label}已复制`);
    } else {
      message.error("复制失败，请手动选择复制");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <DotLoading />
        <span className="type-tech text-tertiary">正在加载徽标状态…</span>
      </div>
    );
  }

  if (badge?.enabled && absoluteUrl) {
    return (
      <>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-tech text-tertiary">尺寸</span>
            {SIZES.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={size === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSize(option.value)}
              >
                {option.label}
              </Button>
            ))}
            <span className="type-tech ml-3 text-tertiary">主题</span>
            {THEMES.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={theme === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* The preview points at the public render endpoint itself — what
              you see is exactly what an embedder gets. */}
          <div className="border border-hairline bg-card p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- live remote SVG preview, not a build asset */}
            <img
              src={absoluteUrl}
              alt="个人徽标预览"
              className="max-w-full"
              data-testid="badge-preview"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={() => handleCopy(`![我的 SAST Link 徽标](${absoluteUrl})`, "Markdown")}
            >
              复制 Markdown
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(`<img src="${absoluteUrl}" alt="SAST Link 徽标" />`, "HTML")}
            >
              复制 HTML
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleCopy(absoluteUrl, "链接")}>
              复制链接
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-destructive"
              onClick={() => setConfirmingDisable(true)}
            >
              关闭徽标
            </Button>
          </div>
        </div>

        <Dialog open={confirmingDisable} onOpenChange={setConfirmingDisable}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>关闭个人徽标？</DialogTitle>
              <DialogDescription>
                关闭后所有已嵌入的链接将立即失效（显示「徽标不存在或已关闭」）。重新开启会生成新链接。
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 rounded-lg border border-hairline bg-card p-3 text-sm text-muted-foreground">
              <ShieldQuestion size={18} className="mt-0.5 shrink-0 text-tertiary" />
              <span>此操作不影响你的资料本身，仅撤回公开的徽标分享。</span>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmingDisable(false)} disabled={busy}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDisable} disabled={busy}>
                {busy ? <DotLoading /> : "确认关闭"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted-foreground">
        生成一枚可嵌入 GitHub README、友链列表的个人卡片徽标。链接即凭证，仅展示你资料中的公开字段。
      </p>
      <Button size="sm" onClick={handleEnable} disabled={busy} className="ml-auto">
        {busy ? <DotLoading /> : "开启徽标"}
      </Button>
    </div>
  );
}
