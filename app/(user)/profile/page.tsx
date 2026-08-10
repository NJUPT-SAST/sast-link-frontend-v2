"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";

import { useUserProfileStore } from "@/store/use-user-profile-store";
import { avatarFallbackChar, DEFAULT_AVATAR, ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { cn } from "@/lib/utils";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarCropperDialog } from "@/components/user/avatar-cropper-dialog";
import { IdentityList } from "@/components/user/identity-list";

const DEPARTMENT_LABELS: Record<string, string> = {
  software: "软件研发部",
  media: "多媒体部",
  electronics: "电子部",
  office: "办公室",
  publicity: "科宣部",
  outreach: "外联部",
};

function Field({
  label,
  value,
  empty = "未填写",
}: {
  label: string;
  value?: string | null;
  empty?: string;
}) {
  return (
    <div data-cursor-target className="grid grid-cols-[88px_minmax(0,1fr)] gap-5 border-b border-hairline py-4 first:border-t">
      <div className="type-tech text-tertiary">{label}</div>
      <div className={cn("truncate text-sm leading-6", !value && "text-muted-foreground")}>
        {value || empty}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const profile = useUserProfileStore((state) => state.profile);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const handleAvatarUploaded = useAvatarUpload();

  return (
    <main className="stagger-rise mx-auto flex w-full max-w-[760px] flex-col gap-14 px-5 pb-20 pt-14 sm:px-8">
      <section aria-label="基本资料" className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => setAvatarOpen(true)}
          aria-label="更换头像"
          className="group relative shrink-0 rounded-full transition-transform hover:scale-[1.02] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Avatar className="size-20 border border-foreground">
            <AvatarImage src={profile.avatar ?? DEFAULT_AVATAR} alt={profile.nickname} />
            <AvatarFallback className="text-2xl">{avatarFallbackChar(profile)}</AvatarFallback>
          </Avatar>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 group-focus-visible:bg-black/40 group-focus-visible:opacity-100">
            <Camera size={20} className="text-foreground" />
          </span>
        </button>
        <div className="min-w-0">
          <h1 className="type-title2 truncate">{profile.nickname || profile.name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {ROLE_LABELS[profile.role] || profile.role} · {STATE_LABELS[profile.state] || profile.state}
          </div>
        </div>
        <Link
          href="/profile/edit"
          className="ml-auto shrink-0 type-tech text-tertiary transition-colors hover:text-foreground"
        >
          编辑
        </Link>
      </section>

      <section aria-label="个人信息">
        <h2 className="type-tech mb-3 text-tertiary">个人信息</h2>
        <Field label="真实姓名" value={profile.name} />
        <Field label="别名" value={profile.nickname} />
        <Field label="学号" value={profile.studentId} />
        <Field label="学院" value={profile.college} />
        <Field label="专业" value={profile.major} />
        <Field label="签名" value={profile.intro} empty={profile.intro ? "" : "你还没留下签名哦～"} />
        <Field
          label="部门"
          value={profile.department ? DEPARTMENT_LABELS[profile.department] ?? profile.department : null}
        />
      </section>

      <section aria-label="联系方式">
        <h2 className="type-tech mb-3 text-tertiary">联系方式</h2>
        <Field label="注册邮箱" value={profile.loginEmail} />
        <Field label="手机号" value={profile.phoneNumber} />
        <Field label="QQ" value={profile.qqNumber} />
        <Field label="博客" value={profile.blogUrl} />
        <Field label="GitHub 链接" value={profile.githubUrl} />
      </section>

      <section aria-label="已关联账号">
        <h2 className="type-tech mb-3 text-tertiary">已关联账号</h2>
        <div className="border-t border-hairline">
          <IdentityList />
        </div>
      </section>

      <AvatarCropperDialog
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
        avatarUrl={profile.avatar}
        fallbackChar={avatarFallbackChar(profile)}
        onUploaded={handleAvatarUploaded}
      />
    </main>
  );
}
