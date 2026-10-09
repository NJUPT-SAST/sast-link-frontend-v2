import Link from "next/link";

import { toApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";

export function UserLoadError({ error, listHref, onRetry }: {
  error?: unknown;
  listHref: string;
  onRetry: () => void;
}) {
  const status = error ? toApiError(error).status : 404;
  const missing = status === 404 || status === 410;
  const forbidden = status === 403;
  const unauthorized = status === 401;
  const retryable = !missing && !forbidden && !unauthorized;
  const message = missing ? "用户不存在或链接无效"
    : forbidden ? "没有权限查看该用户"
    : unauthorized ? "登录已过期，请重新登录"
    : status === 429 ? "请求过于频繁，请稍后重试"
    : "暂时无法加载用户信息，请重试";

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p role="alert" className="text-tertiary">{message}</p>
      <div className="flex gap-3">
        {retryable && <Button onClick={onRetry}>重试</Button>}
        {unauthorized && <Button asChild><Link href="/login">重新登录</Link></Button>}
        <Button variant="outline" asChild><Link href={listHref}>返回用户列表</Link></Button>
      </div>
    </div>
  );
}
