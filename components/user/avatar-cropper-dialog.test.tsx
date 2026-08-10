import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AvatarCropperDialog } from "./avatar-cropper-dialog";

// Toggles whether the mocked editor's canvas supports webp export. Needs the
// `mock` prefix for Jest to allow referencing it inside the jest.mock factory.
let mockWebpSupported = true;

jest.mock("react-avatar-editor", () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual("react");
  const FakeEditor = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({
      getImageScaledToCanvas: () => ({
        toBlob: (cb: (b: Blob | null) => void, type?: string) => {
          if (type === "image/webp" && !mockWebpSupported) {
            cb(null);
            return;
          }
          cb(
            new Blob(["x"], {
              type: type === "image/webp" ? "image/webp" : "image/png",
            }),
          );
        },
      }),
    }));
    return <div data-testid="avatar-editor" />;
  });
  return { __esModule: true, default: FakeEditor };
});

jest.mock("@/lib/api/user", () => ({
  uploadAvatar: jest.fn(),
}));

jest.mock("@/lib/api/errors", () => ({
  toApiError: (e: { message?: string }) => ({
    message: e?.message ?? "上传失败",
  }),
}));

jest.mock("@/lib/message", () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

import { uploadAvatar } from "@/lib/api/user";
import { message } from "@/lib/message";

const mockUploadAvatar = uploadAvatar as jest.Mock;
const mockMessageSuccess = message.success as jest.Mock;

function pickFile(file: File) {
  const input = screen.getByTestId("avatar-file-input");
  fireEvent.change(input, { target: { files: [file] } });
}

function pngFile(name: string, size: number) {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type: "image/png" });
}

describe("AvatarCropperDialog", () => {
  beforeEach(() => {
    mockWebpSupported = true;
    mockUploadAvatar.mockReset();
    mockMessageSuccess.mockReset();
  });

  it("shows current avatar and pick entry in idle mode", () => {
    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "更换头像" })).toBeInTheDocument();
    expect(
      screen.getByText("选择或拖入一张图片，裁剪后作为头像"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择图片" })).toBeInTheDocument();
    expect(screen.getByText("也可以直接拖一张图片到这里")).toBeInTheDocument();
  });

  it("opens a full-size preview of the original avatar when clicked", async () => {
    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl="https://cdn.sast.fun/original.png"
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "查看原头像" }));

    expect(
      await screen.findByRole("heading", { name: "当前头像" }),
    ).toBeInTheDocument();
  });

  it("enters crop mode when a valid image is picked", () => {
    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    pickFile(pngFile("me.png", 100));

    expect(screen.getByRole("heading", { name: "裁剪头像" })).toBeInTheDocument();
    expect(screen.getByTestId("avatar-editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认提交" })).toBeInTheDocument();
  });

  it("enters crop mode when an image is dropped in", () => {
    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    const zone = screen.getByText("也可以直接拖一张图片到这里").closest("div");
    expect(zone).not.toBeNull();
    fireEvent.drop(zone!, { dataTransfer: { files: [pngFile("d.png", 100)] } });

    expect(screen.getByRole("heading", { name: "裁剪头像" })).toBeInTheDocument();
  });

  it("rejects a non-image file with a friendly message", () => {
    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    pickFile(new File(["<html>"], "x.html", { type: "text/html" }));

    expect(screen.getByText("请选择图片文件")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "裁剪头像" })).toBeNull();
  });

  it("rejects a file over the 5MB cap", () => {
    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    pickFile(pngFile("big.png", 5 * 1024 * 1024 + 1));

    expect(screen.getByText("图片不能超过 5MB")).toBeInTheDocument();
  });

  it("uploads the cropped blob and reports success", async () => {
    const onUploaded = jest.fn();
    const onOpenChange = jest.fn();
    mockUploadAvatar.mockResolvedValueOnce({
      data: { data: { avatar_url: "https://cdn.sast.fun/a.png" } },
    });

    render(
      <AvatarCropperDialog
        open
        onOpenChange={onOpenChange}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={onUploaded}
      />,
    );

    pickFile(pngFile("me.png", 100));
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledTimes(1);
      expect(onUploaded).toHaveBeenCalledWith("https://cdn.sast.fun/a.png");
      expect(mockMessageSuccess).toHaveBeenCalledWith("头像已更新");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("prefers webp when the browser exports it", async () => {
    mockUploadAvatar.mockResolvedValueOnce({
      data: { data: { avatar_url: "https://cdn.sast.fun/a.webp" } },
    });

    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    pickFile(pngFile("me.png", 100));
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledTimes(1);
      const blob = mockUploadAvatar.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("image/webp");
    });
  });

  it("falls back to png when webp export is unavailable", async () => {
    mockWebpSupported = false;
    mockUploadAvatar.mockResolvedValueOnce({
      data: { data: { avatar_url: "https://cdn.sast.fun/a.png" } },
    });

    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    pickFile(pngFile("me.png", 100));
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledTimes(1);
      const blob = mockUploadAvatar.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("image/png");
    });
  });

  it("surfaces a backend rejection inside the dialog", async () => {
    mockUploadAvatar.mockRejectedValueOnce(new Error("头像未通过内容审核"));

    render(
      <AvatarCropperDialog
        open
        onOpenChange={jest.fn()}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    pickFile(pngFile("me.png", 100));
    fireEvent.click(screen.getByRole("button", { name: "确认提交" }));

    expect(
      await screen.findByText("头像未通过内容审核"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "裁剪头像" })).toBeInTheDocument();
  });

  it("closes via the cancel button in idle mode", () => {
    const onOpenChange = jest.fn();
    render(
      <AvatarCropperDialog
        open
        onOpenChange={onOpenChange}
        avatarUrl={null}
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
