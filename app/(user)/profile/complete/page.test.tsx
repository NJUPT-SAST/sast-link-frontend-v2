import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ProfileCompletePage from "./page";

const profile = {
  id: 1,
  nickname: "",
  name: "B24040525", // legacy debris: name equals student_id
  loginEmail: "b24040525@njupt.edu.cn",
  email: "b24040525@njupt.edu.cn",
  phoneNumber: null,
  qqNumber: null,
  studentId: "B24040525",
  college: "计算机学院、软件学院、网络空间安全学院",
  major: null,
  role: "member" as const,
  state: "njupter" as const,
  emailType: "njupt_email" as const,
  createdAt: "2026-05-28T12:00:00Z",
  department: null,
  avatar: null,
  intro: null,
  blogUrl: null,
  githubUrl: null,
  identities: [],
  profileNeedsCompletion: true,
  incompleteFields: ["name", "phone_number", "qq_number", "major"],
};

const mockSetProfile = jest.fn();
const mockMutate = jest.fn();
const mockRouterReplace = jest.fn();
const mockUpdateUserProfile = jest.fn();
const mockMapProfile = jest.fn((data: unknown) => data);
const mockProfileKey = jest.fn(() => "profile");

jest.mock("@/store/use-user-profile-store", () => ({
  useUserProfileStore: (selector: (state: unknown) => unknown) =>
    selector({
      profile,
      setProfile: mockSetProfile,
    }),
}));

jest.mock("swr", () => ({
  useSWRConfig: () => ({ mutate: mockMutate }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}));

jest.mock("@/hooks/use-fetch-profile", () => ({
  useFetchProfile: () => ({ isLoading: false }),
}));

jest.mock("@/lib/api/user", () => ({
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

jest.mock("@/lib/api/mappers", () => ({
  mapProfile: (data: unknown) => mockMapProfile(data),
}));

jest.mock("@/lib/api/profile", () => ({
  profileKey: () => mockProfileKey(),
}));

jest.mock("@/lib/message", () => ({
  message: { success: jest.fn() },
}));

jest.mock("@/lib/api/errors", () => ({
  toApiError: (e: unknown) =>
    ({ message: String((e as Error).message) }) as never,
}));

describe("ProfileCompletePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders only the incomplete fields", async () => {
    render(<ProfileCompletePage />);
    expect(screen.getByLabelText(/真实姓名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();
    expect(screen.getByLabelText(/QQ 号/)).toBeInTheDocument();
    expect(screen.getByLabelText(/专业/)).toBeInTheDocument();
  });

  it("submits only the missing fields and lands home on success", async () => {
    mockUpdateUserProfile.mockResolvedValue({
      data: { data: { user: { ...profile, name: "张三" } } },
    });
    render(<ProfileCompletePage />);

    fireEvent.change(screen.getByLabelText(/真实姓名/), { target: { value: "张三" } });
    fireEvent.change(screen.getByLabelText(/手机号/), { target: { value: "13800138000" } });
    fireEvent.change(screen.getByLabelText(/QQ 号/), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText(/专业/), { target: { value: "软件工程" } });
    fireEvent.click(screen.getByText("保存并继续"));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        name: "张三",
        phone_number: "13800138000",
        qq_number: "12345",
        major: "软件工程",
      });
    });
    expect(screen.getByText("资料已完整")).toBeInTheDocument();
  });
});
