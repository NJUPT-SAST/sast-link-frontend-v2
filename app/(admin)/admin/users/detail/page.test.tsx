import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";

import AdminUserDetailPage from "./page";

// The page reads the user id from the URL; jsdom keeps a real location/history,
// so no navigation mock is needed beyond the router itself.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

// canManageUsers reads the role off the profile store; admin unlocks the actions.
jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: { profile: { role: string } }) => unknown) =>
    selector({ profile: { role: "admin" } }),
}));

// MSW handlers authorize on the access-<id>- token shape.
jest.mock("@/lib/token", () => ({
  ...jest.requireActual("@/lib/token"),
  getSession: () => ({ accessToken: "access-2-0" }),
}));

import { mockUsers } from "@/mocks/data/users";
import type { MockUser } from "@/mocks/data/users";
import { DEFAULT_AVATAR } from "@/lib/constants/profile";

// Radix Avatar.Image preloads via `new window.Image()` and only renders the
// <img> once that preload reports success; a jsdom Image never loads, so the
// <img> would never appear. Stub the preloader with a controllable result.
let imageLoads = true;
class StubImage {
  complete = true;
  get naturalWidth() {
    return imageLoads ? 100 : 0;
  }
  naturalHeight = 100;
  crossOrigin: string | null = null;
  referrerPolicy = "";
  addEventListener() {}
  removeEventListener() {}
  set src(_value: string) {}
}
const RealImage = window.Image;

beforeAll(() => {
  window.Image = StubImage as unknown as typeof Image;
});
afterAll(() => {
  window.Image = RealImage;
});

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AdminUserDetailPage />
    </SWRConfig>,
  );
}

describe("AdminUserDetailPage avatar", () => {
  beforeEach(() => {
    imageLoads = true;
    window.history.replaceState(null, "", "/admin/users/detail?id=1");
  });

  it("shows the user's avatar next to the name and email", async () => {
    renderPage();

    const img = await screen.findByAltText("Alice 的头像");
    expect(img).toHaveAttribute("src", DEFAULT_AVATAR);
    // The heading is the page title; the nickname also appears in the detail card.
    expect(screen.getByRole("heading", { level: 1, name: "Alice" })).toBeInTheDocument();
    // A successfully preloaded image replaces the fallback.
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("falls back to the default avatar for a profile without one", async () => {
    // A profile that never set an avatar: no avatar, no nickname.
    const noAvatarUser: MockUser = {
      id: 9000,
      loginEmail: "noavatar@njupt.edu.cn",
      password: "Password123",
      refreshToken: "refresh-noavatar",
      profile: {
        id: 9000,
        name: "无头像用户",
        login_email: "noavatar@njupt.edu.cn",
        role: "member",
        state: "on_sast",
        email_type: "njupt_email",
        phone_number: "13800139000",
        qq_number: "100000",
        student_id: "B24049990",
        college: "计算机学院、软件学院、网络空间安全学院",
        major: "",
        profile: {
          nickname: null,
          department: null,
          intro: null,
          email: null,
          avatar: null,
          blog_url: null,
          github_url: null,
        },
        identities: [],
        profile_needs_completion: false,
        incomplete_fields: [],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    };
    mockUsers.push(noAvatarUser);
    try {
      window.history.replaceState(null, "", "/admin/users/detail?id=9000");
      renderPage();

      // The null avatar falls back to the shipped default asset.
      const img = await screen.findByAltText("无头像用户 的头像");
      expect(img).toHaveAttribute("src", DEFAULT_AVATAR);
    } finally {
      mockUsers.pop();
    }
  });

  it("shows the initial fallback when the avatar cannot load", async () => {
    imageLoads = false;
    renderPage();

    // The preload reports an error, so Radix renders only the fallback span.
    const fallback = await screen.findByText("A");
    expect(fallback).toBeInTheDocument();
    expect(screen.queryByAltText("Alice 的头像")).not.toBeInTheDocument();
  });
});