jest.mock("./client", () => ({
  apiClient: { get: jest.fn() },
}));

import { apiClient } from "./client";
import { getCard } from "./card";

describe("lib/api/card", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches a public profile card by id", () => {
    getCard(42);
    expect(apiClient.get).toHaveBeenCalledWith("/card/42");
  });
});
