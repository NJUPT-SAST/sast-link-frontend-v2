import { render, screen } from "@testing-library/react";

import RegisterStep3 from "./register-step-3";

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn() }) }));

describe("RegisterStep3", () => {
  it("renders all OpenAPI-required registration fields", () => {
    render(<RegisterStep3 loginEmail="new@njupt.edu.cn" ticket="reg-ticket" onBack={jest.fn()} />);
    for (const label of ["真实姓名", "学号", "学院", "专业", "手机号", "设置密码", "确认密码"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});
