import { useUserListStore } from "./use-user-list-store";

const alice = {
  userId: 1,
  loginEmail: "alice@example.com",
  name: "Alice",
  avatar: null,
  session: {
    accessToken: "access-1",
    refreshToken: "refresh-1",
    expiresAt: 1000,
  },
};

const bob = {
  userId: 2,
  loginEmail: "bob@example.com",
  name: "Bob",
  avatar: "/bob.png",
  session: {
    accessToken: "access-2",
    refreshToken: "refresh-2",
    expiresAt: 2000,
  },
};

describe("useUserListStore", () => {
  beforeEach(() => useUserListStore.setState({ accounts: [] }));

  it("adds accounts and replaces duplicates by userId", () => {
    useUserListStore.getState().addAccount(alice);
    useUserListStore.getState().addAccount({ ...alice, name: "Alicia" });
    useUserListStore.getState().addAccount(bob);

    expect(useUserListStore.getState().accounts).toEqual([
      { ...alice, name: "Alicia" },
      bob,
    ]);
  });

  it("updates the matching account by userId", () => {
    useUserListStore.setState({ accounts: [alice, bob] });
    useUserListStore.getState().updateAccount({
      userId: 2,
      name: "Bobby",
      avatar: "/new-bob.png",
    });

    expect(useUserListStore.getState().accounts[1]).toEqual({
      ...bob,
      name: "Bobby",
      avatar: "/new-bob.png",
    });
  });

  it("removes accounts by index or login email", () => {
    useUserListStore.setState({ accounts: [alice, bob] });
    useUserListStore.getState().removeAccount(0);
    expect(useUserListStore.getState().accounts).toEqual([bob]);

    useUserListStore.setState({ accounts: [alice, bob] });
    useUserListStore.getState().removeAccount("bob@example.com");
    expect(useUserListStore.getState().accounts).toEqual([alice]);
  });
});
