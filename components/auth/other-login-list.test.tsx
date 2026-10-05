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

  it("launches a click-built entry and prevents the anchor default", async () => {
    const user = userEvent.setup();
    const onLaunch = jest.fn();
    render(
      <OtherLoginList
        list={[
          {
            describe: "GH-Launch",
            icon: <span>GH</span>,
            onLaunch,
          },
        ]}
      />,
    );

    const link = screen.getByTitle("GH-Launch");
    expect(link).toHaveAttribute("href", "#");
    await user.click(link);

    expect(onLaunch).toHaveBeenCalledTimes(1);
  });

  it("keeps the placeholder warning for unavailable items", async () => {
    const user = userEvent.setup();
    const onLaunch = jest.fn();
    render(
      <OtherLoginList
        list={[
          { target: "", describe: "QQ-Nav", icon: <span>QQ</span> },
        ]}
      />,
    );

    await user.click(screen.getByTitle("QQ-Nav"));

    expect(onLaunch).not.toHaveBeenCalled();
  });
});
