import type { UserState } from "@/lib/api/types";

import { computeGradeDistribution, gradeBucketOfLoginEmail } from "./stats-grade";

describe("gradeBucketOfLoginEmail", () => {
  it("takes digits 2-3 of a student mailbox as the grade", () => {
    expect(gradeBucketOfLoginEmail("B24040101@njupt.edu.cn")).toBe("24级");
    expect(gradeBucketOfLoginEmail("x21123456@njupt.edu.cn")).toBe("21级");
  });

  it("accepts either case in the leading letter", () => {
    expect(gradeBucketOfLoginEmail("b22040101@njupt.edu.cn")).toBe("22级");
  });

  it("folds non-student mailboxes into 其他", () => {
    // Not the student-id shape.
    expect(gradeBucketOfLoginEmail("zhang.san@njupt.edu.cn")).toBe("其他");
    expect(gradeBucketOfLoginEmail("B2404010@njupt.edu.cn")).toBe("其他"); // 7 digits
    expect(gradeBucketOfLoginEmail("B240401012@njupt.edu.cn")).toBe("其他"); // 9 digits
    // Student-id shape but not the school domain.
    expect(gradeBucketOfLoginEmail("B24040101@sast.fun")).toBe("其他");
    // other_mail login addresses.
    expect(gradeBucketOfLoginEmail("someone@example.com")).toBe("其他");
  });
});

describe("computeGradeDistribution", () => {
  const user = (login_email: string, state: UserState = "on_sast") => ({ login_email, state });

  it("counts each grade bucket and the 其他 bucket", () => {
    const items = computeGradeDistribution([
      user("B24040101@njupt.edu.cn"),
      user("x21123456@njupt.edu.cn"),
      user("b24040102@njupt.edu.cn"),
      user("zhang.san@sast.fun"),
    ]);
    expect(new Map(items)).toEqual(
      new Map([
        ["24级", 2],
        ["21级", 1],
        ["其他", 1],
      ]),
    );
  });

  it("skips deleted accounts, matching the backend's live-only aggregates", () => {
    const items = computeGradeDistribution([
      user("B24040101@njupt.edu.cn"),
      user("B23040101@njupt.edu.cn", "is_deleted"),
    ]);
    expect(items).toEqual([["24级", 1]]);
  });
});
