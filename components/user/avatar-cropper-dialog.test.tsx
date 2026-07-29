import { render, screen } from "@testing-library/react";

import { AvatarCropperDialog } from "./avatar-cropper-dialog";

jest.mock("@/lib/api/user", () => ({
  uploadAvatar: jest.fn(),
}));

jest.mock("react-avatar-editor", () => {
  return function MockAvatarEditor() {
    return <div data-testid="avatar-editor" />;
  };
});

jest.mock("use-file-picker", () => ({
  useFilePicker: () => ({
    openFilePicker: jest.fn(),
  }),
}));

jest.mock("@/lib/message", () => ({
  message: { success: jest.fn(), error: jest.fn() },
}));

describe("AvatarCropperDialog", () => {
  it("renders current avatar and change button", () => {
    render(
      <AvatarCropperDialog
        avatarUrl="https://example.com/avatar.png"
        fallbackChar="A"
        onUploaded={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /更换头像/ })).toBeInTheDocument();
  });

  it("renders fallback character", () => {
    render(
      <AvatarCropperDialog
        avatarUrl={null}
        fallbackChar="U"
        onUploaded={jest.fn()}
      />,
    );

    expect(screen.getByText("U")).toBeInTheDocument();
  });
});
