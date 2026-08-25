"use client";

import Link from "next/link";

import { ALUMNI_REVIEW_WINDOW, SUPPORT_EMAIL } from "@/lib/constants/support";
import { AuthShell } from "@/components/auth/auth-shell";
import AlumniRequestForm from "./_components/alumni-request-form";

export default function AlumniRegisterPage() {
  return (
    <AuthShell wide>
      <main className="flex w-full flex-col gap-8">
        <header className="flex flex-col gap-2.5">
          <p className="type-tech text-tertiary">SAST LINK</p>
          <h1 className="type-title1">毕业校友建号申请</h1>
          <p className="text-[15px] leading-7 text-muted-foreground">
            学生邮箱停用后无法自助注册。填写下面的表单提交申请，管理员人工核验后为你开通账号，
            结果会发到你填写的常用邮箱。
          </p>
        </header>

        <section
          aria-labelledby="who-heading"
          className="flex flex-col gap-3 border border-hairline p-5 sm:p-6"
        >
          <h2 id="who-heading" className="type-tech text-tertiary">
            适用情况
          </h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-7">
            <li>你曾是 SAST 成员，且已经毕业；</li>
            <li>你的 @njupt.edu.cn 学生邮箱已停用，收不到注册验证码。</li>
          </ul>
          <p className="text-sm leading-6 text-muted-foreground">
            如果学生邮箱仍可收信，请直接
            <Link href="/register" className="text-link hover:underline">
              自助注册
            </Link>
            ，无需走这条通道。如果你以前用常用邮箱登录过，可以先试试
            <Link href="/reset" className="text-link hover:underline">
              找回密码
            </Link>
            ——账号可能已经存在。
          </p>
        </section>

        <section
          aria-labelledby="flow-heading"
          className="flex flex-col gap-3 border border-hairline p-5 sm:p-6"
        >
          <h2 id="flow-heading" className="type-tech text-tertiary">
            接下来会发生什么
          </h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-7">
            <li>你提交申请，我们会在 {ALUMNI_REVIEW_WINDOW}内人工核验；</li>
            <li>通过后你会收到一封邮件，按邮件里的链接自行设置密码；</li>
            <li>之后用你的常用邮箱和新密码登录。</li>
          </ol>
          <p className="text-sm leading-6 text-muted-foreground">
            我们不会通过邮件发送密码。若超过 {ALUMNI_REVIEW_WINDOW}未收到回复，
            可发信到{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-link hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            询问。
          </p>
        </section>

        <AlumniRequestForm />

        <p className="text-center text-sm text-muted-foreground">
          已有账号？
          <Link href="/login" className="text-link hover:underline">
            登录
          </Link>
        </p>
      </main>
    </AuthShell>
  );
}
