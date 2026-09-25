jest.mock("./client", () => ({
  apiClient: {
    delete: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { apiClient } from "./client";
import { badgeUrl, disableBadge, enableBadge, getBadgeStatus } from "./badge";

describe("lib/api/badge", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads, enables and disables through the documented routes", () => {
    getBadgeStatus();
    enableBadge();
    disableBadge();

    expect(apiClient.get).toHaveBeenCalledWith("/user/badge");
    expect(apiClient.post).toHaveBeenCalledWith("/user/badge");
    expect(apiClient.delete).toHaveBeenCalledWith("/user/badge");
  });

  it("builds the public embed url from size, theme and target", () => {
    const url = badgeUrl("abc", "lg", "dark", "github");
    expect(url).toContain("/badge/abc.svg");
    expect(url).toContain("size=lg");
    expect(url).toContain("theme=dark");
    expect(url).toContain("target=github");
  });

  it("defaults to the shipped sm size, auto theme and blog target", () => {
    const url = badgeUrl("abc");
    expect(url).toContain("/badge/abc.svg");
    expect(url).toContain("size=sm");
    expect(url).toContain("theme=auto");
    expect(url).toContain("target=blog");
  });
});
