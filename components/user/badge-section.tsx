"use client";

import { useState } from "react";
import { ShieldQuestion } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBadge } from "@/hooks/use-badge";
import { useUserProfileStore } from "@/store/use-user-profile-store";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SIZES: { value: BadgeSize; label: string; available: boolean }[] = [
  { value: "sm", label: "紧凑", available: true },
  // 标准与大图是后续迭代的预留档位：展示但不可选，让用户知道还有更多
  // 尺寸在路上。
  { value: "md", label: "标准", available: false },
  { value: "lg", label: "大图", available: false },
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

/** One flush-together option group: the segments share borders and only the
 * ends are rounded, so the row reads as one control rather than a row of
 * separate buttons. An unavailable option renders disabled — visible but
 * not selectable. */
function OptionGroup<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; available?: boolean }[];
  disabled?: boolean;
  onChange?: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="type-tech shrink-0 text-tertiary">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex overflow-hidden rounded-md border border-hairline"
      >
        {options.map((option, index) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled || option.available === false}
              aria-pressed={active}
              title={option.available === false ? "后续开放" : undefined}
              onClick={() => onChange?.(option.value)}
              className={cn(
                "px-3.5 py-1.5 text-sm transition-colors",
                index > 0 && "border-l border-hairline",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
                (disabled || option.available === false) &&
                  "cursor-not-allowed opacity-60",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Settings section for the personal badge: an opt-in switch on the left with
 * the size/theme selectors and the share-link copy below it, the live preview
 * on the right. The share URL is a capability — copying it is the whole point,
 * so nothing here treats it as a secret. */
export function BadgeSection() {
  const { badge, isLoading, mutate } = useBadge();
  const profile = useUserProfileStore((state) => state.profile);
  const [busy, setBusy] = useState(false);
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [size] = useState<BadgeSize>("sm");
  const [theme, setTheme] = useState<BadgeTheme>("auto");

  const enabled = badge?.enabled ?? false;
  const url = enabled && badge?.key ? badgeUrl(badge.key, size, theme) : null;
  const absoluteUrl = url ? new URL(url, window.location.origin).toString() : null;

  // The preview and the rendered SVG both link to the member's own page:
  // blog first, GitHub as the fallback, no link when neither exists.
  const clickTarget = profile.blogUrl || profile.githubUrl || null;

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      // Turning off breaks every embedded link; that deserves a confirmation
      // rather than a one-click flip.
      setConfirmingDisable(true);
      return;
    }
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

  const handleCopy = async () => {
    if (!absoluteUrl) return;
    const ok = await copyText(absoluteUrl);
    if (ok) {
      message.success("链接已复制");
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

  return (
    <>
      <div className="flex flex-col gap-6 pt-4 sm:flex-row sm:gap-8">
        {/* Left: the sharing switch above the preview controls. While the
            badge is off, the controls stay visible but inert — the shape of
            the section stays stable instead of collapsing. */}
        <div className="flex w-full shrink-0 flex-col gap-5 sm:w-fit">
          <div className="flex items-center gap-3">
            <Switch
              size="lg"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={busy}
              aria-label="分享个人徽标"
            />
            <span className="text-sm text-muted-foreground">
              {enabled ? "已开启，链接分享中" : "已关闭"}
            </span>
          </div>

          <div className={enabled ? "flex flex-col gap-4" : "flex flex-col gap-4 opacity-50"}>
            <OptionGroup
              label="尺寸"
              value={size}
              options={SIZES}
              disabled={!enabled}
            />
            <OptionGroup
              label="主题"
              value={theme}
              options={THEMES}
              disabled={!enabled}
              onChange={setTheme}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!enabled}
              onClick={handleCopy}
              className="w-full"
            >
              复制链接
            </Button>
          </div>
        </div>

        {/* Right: the preview, borderless — what you see is exactly what an
            embedder gets. It links to the member's own page when one exists. */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          {absoluteUrl ? (
            clickTarget ? (
              <a href={clickTarget} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- live remote SVG preview, not a build asset */}
                <img
                  src={absoluteUrl}
                  alt="个人徽标预览"
                  className="max-w-full"
                  data-testid="badge-preview"
                />
              </a>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- live remote SVG preview, not a build asset */
              <img
                src={absoluteUrl}
                alt="个人徽标预览"
                className="max-w-full"
                data-testid="badge-preview"
              />
            )
          ) : (
            <span className="text-sm text-tertiary">开启后这里会显示你的徽标预览</span>
          )}
        </div>
      </div>

      <Dialog open={confirmingDisable} onOpenChange={setConfirmingDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>关闭个人徽标？</DialogTitle>
            <DialogDescription>
              关闭后所有已嵌入的链接将立即失效（显示「徽标不存在或已关闭」）。重新开启后，原链接会恢复可用。
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
