"use client";

import Link from "next/link";

import { ALUMNI_REVIEW_WINDOW, SUPPORT_EMAIL } from "@/lib/constants/support";
import { AuthShell } from "@/components/auth/auth-shell";

export default function AlumniRequestSuccessPage() {
  return (
    <AuthShell>
      <main className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-2.5">
          <h1 className="type-title1">申请已提交</h1>
          <p className="text-[15px] leading-7 text-muted-foreground">
            我们会在{ALUMNI_REVIEW_WINDOW}内人工核验，结果将发到你填写的常用邮箱。
          </p>
        </header>

        <div className="flex flex-col gap-3 border border-hairline bg-card p-5 text-[15px] leading-7">
          <p className="type-headline">请注意</p>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
            <li>审核结果邮件可能落入垃圾邮件，请一并查看；</li>
            <li>通过后需按邮件里的链接自行设置密码，我们不会发送密码；</li>
            <li>请不要重复提交——同一学号只能有一份待审申请。</li>
          </ul>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          有疑问可发信到{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-link hover:underline">
            {SUPPORT_EMAIL}
          </a>
          。
        </p>

        <Link
          href="/login"
          className="text-center text-sm text-link hover:underline"
        >
          返回登录
        </Link>
      </main>
    </AuthShell>
  );
}
