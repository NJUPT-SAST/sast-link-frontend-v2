import { useState } from "react";
import { Copy, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthFormField } from "@/components/auth/auth-form-field";

interface OAuthClientSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientSecret: string;
  /** Whether the secret was just created (registration) or rotated. */
  mode?: "create" | "rotate";
}

export function OAuthClientSecretDialog({
  open,
  onOpenChange,
  clientName,
  clientSecret,
  mode = "create",
}: OAuthClientSecretDialogProps) {
  const [copied, setCopied] = useState(false);
  const isRotate = mode === "rotate";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(clientSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="type-title3">
            {isRotate ? "client_secret 已轮换" : "客户端注册成功"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isRotate
              ? `「${clientName}」的新 client_secret 仅显示一次，请立即保存。`
              : `「${clientName}」已创建。client_secret 仅显示一次，请立即保存。`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <AuthFormField
                id="client_secret"
                label="Client Secret"
                value={clientSecret}
                readOnly
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-6 shrink-0"
              onClick={handleCopy}
              aria-label="复制"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            我知道了
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
