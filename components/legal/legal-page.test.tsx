import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PrivacyPolicyPage from "@/app/(tourist)/privacy/page";

const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: jest.fn() }),
}));

jest.mock(
  "next/link",
  () =>
    function Link({ children, href }: { children: React.ReactNode; href: string }) {
      return <a href={href}>{children}</a>;
    },
);

describe("legal page back link", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
  });

  it("steps back so a half-finished registration is not abandoned", async () => {
    // A reader who arrived from the register form has history to return to.
    window.history.pushState({}, "", "/register");
    window.history.pushState({}, "", "/privacy");

    render(<PrivacyPolicyPage />);
    await userEvent.click(screen.getByRole("button", { name: /返回/ }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
