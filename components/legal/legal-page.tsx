"use client";

import { useRouter } from "next/navigation";

/** Shared chrome for the privacy policy and terms of service pages: scope
 *  header, a summary of contents (GB/T 35273-2020 Appendix D recommends leading
 *  with one), numbered sections, and a back link. Keeping the layout in one
 *  place means the two documents cannot drift apart visually. */
export function LegalPage({
  eyebrow,
  title,
  effectiveDate,
  updatedDate,
  operator,
  contactEmail,
  intro,
  summary,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  updatedDate: string;
  operator: string;
  contactEmail: string;
  intro: React.ReactNode;
  summary: string[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();

  // These documents are opened mid-flow — from the register consent tick and
  // from the OAuth consent screen. A fixed link to /login would abandon a
  // half-finished registration, so step back to wherever the reader came from
  // and only fall back to /login when there is no history to return to (a
  // document opened in a new tab, or linked directly).
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/login");
  };

  return (
    <main className="stagger-rise mx-auto flex w-full max-w-[760px] flex-col px-5 pb-24 pt-14 sm:px-10">
      <header className="flex flex-col gap-3 border-b border-hairline pb-8">
        <p className="type-tech text-tertiary">{eyebrow}</p>
        <h1 className="type-title1">{title}</h1>
        <dl className="flex flex-col gap-1 text-sm text-tertiary">
          <div className="flex gap-2">
            <dt>生效日期</dt>
            <dd>{effectiveDate}</dd>
          </div>
          <div className="flex gap-2">
            <dt>最近更新日期</dt>
            <dd>{updatedDate}</dd>
          </div>
          <div className="flex gap-2">
            <dt>发布主体</dt>
            <dd>{operator}</dd>
          </div>
          <div className="flex gap-2">
            <dt>联系邮箱</dt>
            <dd>{contactEmail}</dd>
          </div>
        </dl>
      </header>

      <div className="flex flex-col gap-12 pt-10">
        <div className="flex flex-col gap-3 text-[15px] leading-7">{intro}</div>

        <section aria-labelledby="summary-heading" className="border border-hairline p-5 sm:p-6">
          <h2 id="summary-heading" className="type-tech mb-3 text-tertiary">
            本文件将帮助您了解以下内容
          </h2>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-7">
            {summary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        {children}
      </div>

      <footer className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline pt-6 text-sm">
        {footer}
        <button type="button" onClick={goBack} className="text-link hover:underline">
          ← 返回
        </button>
      </footer>
    </main>
  );
}

/** A numbered section. Body copy goes in <p>, enumerations in <LegalList>. */
export function LegalSection({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="flex flex-col gap-3">
      <h2 id={`${id}-heading`} className="type-title3">
        <span className="type-tech mr-2 align-middle text-tertiary">{index}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-7">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5">{children}</ul>;
}

/** Sub-clause heading, e.g. 「（一）账号注册与登录」. */
export function LegalSubheading({ children }: { children: React.ReactNode }) {
  return <h3 className="type-headline mt-2">{children}</h3>;
}

/** Marks personal sensitive information. GB/T 35273-2020 clause 5.5 a) 2)
 *  requires sensitive information to be clearly marked or highlighted; the
 *  underline is the convention Chinese privacy policies use, and the label
 *  keeps that meaning available to screen readers. */
export function LegalSensitive({ children }: { children: React.ReactNode }) {
  return (
    <span className="underline decoration-dotted underline-offset-4">
      {children}
      <span className="sr-only">（个人敏感信息）</span>
    </span>
  );
}
