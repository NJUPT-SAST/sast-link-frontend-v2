"use client";

import { useState, useRef, useCallback, type WheelEvent } from "react";
import AvatarEditor from "react-avatar-editor";
import { useFilePicker } from "use-file-picker";
import { Camera, ZoomIn, ZoomOut } from "lucide-react";

import { uploadAvatar } from "@/lib/api/user";
import { message } from "@/lib/message";
import { DEFAULT_AVATAR, MAX_AVATAR_BYTES } from "@/lib/constants/profile";
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
  avatarUrl: string | null;
  fallbackChar: string;
  onUploaded: (url: string) => void;
}

export function AvatarCropperDialog({
  avatarUrl,
  fallbackChar,
  onUploaded,
}: AvatarCropperDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState(SCALE_MIN);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cropperRef = useRef<any>(null);

  const { openFilePicker } = useFilePicker({
    accept: "image/*",
    onFilesSuccessfullySelected: ({ plainFiles }: { plainFiles: File[] }) => {
      const f = plainFiles[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        message.warning("请选择图片文件");
        return;
      }
      if (f.size > MAX_AVATAR_BYTES) {
        message.warning("图片不能超过 5MB");
        return;
      }
      setFile(f);
      setScale(SCALE_MIN);
    },
  });

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      if (!file) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      setScale((s) => clampScale(s + dir * WHEEL_STEP));
    },
    [file],
  );

  const handleUpload = () => {
    if (!cropperRef.current) return;
    setLoading(true);
    const canvas = cropperRef.current.getImageScaledToCanvas();
    canvas.toBlob((blob: Blob | null) => {
      if (!blob) {
        setLoading(false);
        return;
      }
      uploadAvatar(blob)
        .then((res) => {
          message.success("头像已更新");
          onUploaded(res.data.data.avatar_url);
          setFile(null);
        })
        .catch(() => message.error("上传失败"))
        .finally(() => setLoading(false));
    });
  };

  return (
    <>
      <div className="flex items-center gap-6">
        <Avatar className="size-20 border border-foreground">
          <AvatarImage src={avatarUrl ?? DEFAULT_AVATAR} alt="avatar" />
          <AvatarFallback className="text-2xl">{fallbackChar}</AvatarFallback>
        </Avatar>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openFilePicker()}
          className="transition-transform hover:-translate-y-px active:scale-[.98]"
        >
          <Camera size={16} />
          更换头像
        </Button>
      </div>

      <Dialog
        open={!!file}
        onOpenChange={(open) => {
          if (!open) setFile(null);
        }}
      >
        <DialogContent className="border-border/60 bg-card/95 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>裁剪头像</DialogTitle>
            <DialogDescription>拖动和缩放以调整头像</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {file && (
              <div onWheel={handleWheel}>
                <AvatarEditor
                  ref={cropperRef}
                  image={file}
                  width={200}
                  height={200}
                  border={40}
                  color={[0, 0, 0, 0.5]}
                  scale={scale}
                  rotate={0}
                  borderRadius={100}
                />
              </div>
            )}
            <div className="flex w-full items-center gap-3 px-4">
              <ZoomOut
                size={16}
                className="shrink-0 text-muted-foreground"
              />
              <Slider
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={SCALE_STEP}
                value={[scale]}
                onValueChange={([v]) =>
                  v !== undefined && setScale(clampScale(v))
                }
              />
              <ZoomIn
                size={16}
                className="shrink-0 text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFile(null)}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? <DotLoading /> : "确认提交"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
