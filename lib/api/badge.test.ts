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

  it("builds the public embed url from size and theme", () => {
    const url = badgeUrl("abc", "lg", "dark");
    expect(url).toContain("/badge/abc.svg");
    expect(url).toContain("size=lg");
    expect(url).toContain("theme=dark");
  });

  it("defaults to md/auto and keeps the svg suffix", () => {
    const url = badgeUrl("abc");
    expect(url).toContain("/badge/abc.svg");
    expect(url).toContain("size=md");
    expect(url).toContain("theme=auto");
  });
});
