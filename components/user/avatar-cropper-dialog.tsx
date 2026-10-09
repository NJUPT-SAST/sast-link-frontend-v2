"use client";

import { useEffect, useRef, useState, type DragEvent, type WheelEvent } from "react";
import AvatarEditor from "react-avatar-editor";
import { Camera, ZoomIn, ZoomOut } from "lucide-react";

import { uploadAvatar } from "@/lib/api/user";
import { accountKey } from "@/lib/api/profile";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import { DEFAULT_AVATAR, MAX_AVATAR_SOURCE_BYTES } from "@/lib/constants/profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { DotLoading } from "@/components/ui/dot-loading";

const SCALE_MIN = 1;
const SCALE_MAX = 5;
const SCALE_STEP = 0.01;
const WHEEL_STEP = 0.1;

function clampScale(v: number) {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, v));
}

interface AvatarCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarUrl: string | null;
  fallbackChar: string;
  onUploaded: (url: string) => void;
}

/** Validate a picked image and enter crop mode, or surface a user-facing error. */
function acceptFile(
  file: File,
  onAccept: (f: File) => void,
  onError: (msg: string) => void,
) {
  if (!file.type.startsWith("image/")) {
    onError("请选择图片文件");
    return;
  }
  if (file.size > MAX_AVATAR_SOURCE_BYTES) {
    onError("图片不能超过 5MB");
    return;
  }
  onAccept(file);
}

export function AvatarCropperDialog(props: AvatarCropperDialogProps) {
  const sessionKey = accountKey("avatar-upload");
  return props.open ? <AvatarCropSession key={sessionKey} {...props} sessionKey={sessionKey} /> : null;
}

function AvatarCropSession({
  open,
  onOpenChange,
  avatarUrl,
  fallbackChar,
  onUploaded,
  sessionKey,
}: AvatarCropperDialogProps & { sessionKey: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<React.ComponentRef<typeof AvatarEditor> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(SCALE_MIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const submitting = useRef(false);
  const mounted = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const current = () => mounted.current && sessionKey === accountKey("avatar-upload");

  const close = () => {
    setFile(null);
    setScale(SCALE_MIN);
    setLoading(false);
    setError("");
    setPreviewOpen(false);
    onOpenChange(false);
  };

  const onAccept = (f: File) => {
    if (submitting.current) return;
    setError("");
    setFile(f);
    setScale(SCALE_MIN);
    setPosition({ x: 0.5, y: 0.5 });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) acceptFile(f, onAccept, setError);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f, onAccept, setError);
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!file || submitting.current) return;
    e.preventDefault();
    setScale((s) => clampScale(s + (e.deltaY < 0 ? 1 : -1) * WHEEL_STEP));
  };

  const uploadBlob = (blob: Blob | null) => {
    if (!current()) return;
    if (!blob) {
      submitting.current = false;
      setLoading(false);
      setError("图片处理失败，请重试");
      return;
    }
    uploadAvatar(blob)
      .then((res) => {
        if (!current()) return;
        message.success("头像已更新");
        onUploaded(res.data.data.avatar_url);
        close();
      })
      .catch((err) => { if (current()) setError(toApiError(err).message); })
      .finally(() => { submitting.current = false; if (current()) setLoading(false); });
  };

  const handleUpload = () => {
    if (!cropperRef.current || submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const canvas = cropperRef.current.getImageScaledToCanvas();
      // WebP 最小且支持透明。不支持的浏览器（部分 Safari）要么返回 null，要么
      // 悄悄回退成 PNG，靠 blob.type 判定并回退 PNG。
      canvas.toBlob((blob) => {
        if (blob && blob.type === "image/webp") {
          uploadBlob(blob);
        } else {
          canvas.toBlob(uploadBlob, "image/png");
        }
      }, "image/webp", 0.9);
    } catch {
      submitting.current = false;
      setLoading(false);
      setError("图片处理失败，请重新选择图片");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !submitting.current) close();
      }}
    >
      <DialogContent className="border-border/60 bg-card/95 sm:max-w-md" showCloseButton={!loading}
        onOpenAutoFocus={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }}
        onCloseAutoFocus={(event) => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); }}
        onEscapeKeyDown={(event) => { if (loading) event.preventDefault(); }}
        onInteractOutside={(event) => { if (loading) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>{file ? "裁剪头像" : "更换头像"}</DialogTitle>
          <DialogDescription>
            {file ? "拖动和缩放以调整头像，也可聚焦裁剪区后用方向键移动，Home 键居中。" : "选择或拖入一张图片"}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          data-testid="avatar-file-input"
          onChange={handleFileChange}
        />

        {file ? (
          <div className="flex flex-col items-center gap-4">
            <div onWheel={handleWheel} role="group" tabIndex={loading ? -1 : 0} aria-label="头像裁剪位置"
              onKeyDown={(event) => {
                if (loading) return;
                const moves: Record<string, [number, number]> = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] };
                if (event.key === "Home") { event.preventDefault(); setPosition({ x: 0.5, y: 0.5 }); }
                else if (moves[event.key]) {
                  event.preventDefault();
                  const [x, y] = moves[event.key];
                  setPosition((p) => ({ x: Math.max(0, Math.min(1, p.x + x)), y: Math.max(0, Math.min(1, p.y + y)) }));
                }
              }}
              className={`flex justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${loading ? "pointer-events-none" : ""}`}>
              <AvatarEditor
                ref={cropperRef}
                image={file}
                width={200}
                height={200}
                // border=0 so the round crop area sits flush against the panel
                // edge — a border would leave a visible ring around the circle
                // and leak out-of-crop pixels into the uploaded square.
                border={0}
                scale={scale}
                position={position}
                onPositionChange={setPosition}
                rotate={0}
                borderRadius={100}
              />
            </div>
            <div className="flex w-full items-center gap-3 px-4">
              <ZoomOut size={16} className="shrink-0 text-muted-foreground" />
              <Slider
                aria-label="头像缩放"
                disabled={loading}
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={SCALE_STEP}
                value={[scale]}
                onValueChange={([v]) =>
                  v !== undefined && setScale(clampScale(v))
                }
              />
              <ZoomIn size={16} className="shrink-0 text-muted-foreground" />
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-hairline px-6 py-8"
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label="查看原头像"
              title="查看原头像"
              className="cursor-pointer rounded-full transition-transform hover:-translate-y-px active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="size-20 border border-foreground">
                <AvatarImage src={avatarUrl ?? DEFAULT_AVATAR} alt="avatar" />
                <AvatarFallback className="text-2xl">
                  {fallbackChar}
                </AvatarFallback>
              </Avatar>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="transition-transform hover:-translate-y-px active:scale-[.98]"
            >
              <Camera size={16} />
              选择图片
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-center text-xs text-destructive">{error}</p>
        )}
        {loading && <p role="status" className="text-center text-xs text-muted-foreground">正在上传头像，请稍候…</p>}

        <DialogFooter>
          {file ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setError("");
                }}
                disabled={loading}
              >
                重新选择
              </Button>
              <Button onClick={handleUpload} disabled={loading}>
                {loading ? <DotLoading /> : "确认提交"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={close}>
              取消
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* 原头像大图预览：点击当前头像打开，方便替换前确认原样 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>当前头像</DialogTitle>
            <DialogDescription className="sr-only">
              查看当前头像大图
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Avatar className="size-40 border border-foreground shadow-lg">
              <AvatarImage src={avatarUrl ?? DEFAULT_AVATAR} alt="当前头像" />
              <AvatarFallback className="text-6xl">{fallbackChar}</AvatarFallback>
            </Avatar>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
