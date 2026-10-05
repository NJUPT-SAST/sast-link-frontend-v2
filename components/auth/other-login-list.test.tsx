import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { message } from "@/lib/message";

import { OtherLoginList } from "./other-login-list";

jest.mock("@/lib/message", () => ({
  message: {
    warning: jest.fn(),
  },
}));

describe("OtherLoginList", () => {
  const list = [
    {
      target: "/oauth/github",
      describe: "Github",
      icon: <span>GH</span>,
    },
    {
      target: "",
      describe: "QQ",
      icon: <span>QQ</span>,
    },
  ];

  it("renders login entries and keeps available links navigable", async () => {
    const user = userEvent.setup();
    render(<OtherLoginList list={list} />);

    const githubLink = screen.getByTitle("Github");
    expect(githubLink).toHaveAttribute("href", "/oauth/github");
    githubLink.addEventListener("click", (event) => event.preventDefault());

    await user.click(githubLink);
    expect(message.warning).not.toHaveBeenCalled();
  });

  it("warns when an unavailable login item is clicked", async () => {
    const user = userEvent.setup();
    render(<OtherLoginList list={list} />);

    const qqLink = screen.getByTitle("QQ");
    expect(qqLink).not.toHaveAttribute("href");

    await user.click(qqLink);
    expect(message.warning).toHaveBeenCalledWith("暂未开放");
  });

  it("fires onNavigate when a navigable item is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();
    render(
      <OtherLoginList
        list={[
          {
            target: "/oauth/github",
            describe: "GH-Nav",
            icon: <span>GH</span>,
            onNavigate,
          },
        ]}
      />,
    );

    const link = screen.getByTitle("GH-Nav");
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("never fires onNavigate for unavailable items", async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();
    render(
      <OtherLoginList
        list={[
          { target: "", describe: "QQ-Nav", icon: <span>QQ</span>, onNavigate },
        ]}
      />,
    );

    await user.click(screen.getByTitle("QQ-Nav"));

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
