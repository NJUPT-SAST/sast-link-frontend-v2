import { render, screen } from "@testing-library/react";

import HomePage from "./page";

jest.mock("@/components/user/profile-card", () => ({
  ProfileCard: () => <section aria-label="个人名片">名片</section>,
}));

describe("HomePage", () => {
  it("keeps the first viewport free of profile metrics and links to the card", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: "查看个人名片" })).toHaveAttribute("href", "#profile-card");
    expect(screen.getByRole("region", { name: "个人名片" })).toBeInTheDocument();
    expect(screen.queryByText("DB")).not.toBeInTheDocument();
    expect(screen.queryByText("REDIS")).not.toBeInTheDocument();
    expect(screen.queryByText("资料完整度")).not.toBeInTheDocument();
  });
});
