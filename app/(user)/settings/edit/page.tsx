"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSWRConfig } from "swr";

import { updateUserProfile } from "@/lib/api/user";
import { toApiError } from "@/lib/api/errors";
import { COLLEGES, type Department, type UpdateProfileRequest } from "@/lib/api/types";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { avatarFallbackChar } from "@/lib/constants/profile";
import { message } from "@/lib/message";
import {
  profileEditSchema,
  type ProfileEditFormValues,
} from "@/lib/validations/profile";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { AvatarCropperDialog } from "@/components/user/avatar-cropper-dialog";
import { BackButton } from "@/components/navigation/back-button";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const DEPARTMENT_OPTIONS = [
  { value: "", label: "未选择" },
  { value: "软件研发部", label: "软件研发部" },
  { value: "多媒体部", label: "多媒体部" },
  { value: "电子部", label: "电子部" },
  { value: "办公室部", label: "办公室部" },
  { value: "科宣部", label: "科宣部" },
  { value: "外联部", label: "外联部" },
] as const;

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

function toUpdateRequest(values: ProfileEditFormValues): UpdateProfileRequest {
  const department = (values.department || undefined) as Department | undefined;
  return {
    nickname: values.nickname,
    name: values.name,
    intro: values.intro || undefined,
    phone_number: values.phoneNumber || undefined,
    qq_number: values.qqNumber || undefined,
    college: values.college,
    major: values.major,
    // student_id is set during registration — not editable
    department,
    // other emails managed via identities — not editable here
    blog_url: values.blogUrl || undefined,
    github_url: values.githubUrl || undefined,
  };
}

export default function EditPage() {
  const profile = useUserProfileStore((s) => s.profile);
  const updateProfile = useUserProfileStore((s) => s.updateProfile);
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      nickname: profile.nickname,
      name: profile.name,
      intro: profile.intro ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      qqNumber: profile.qqNumber ?? "",
      college: profile.college ?? "其他",
      major: profile.major ?? "",
      department: profile.department ?? "",
      blogUrl: profile.blogUrl ?? "",
      githubUrl: profile.githubUrl ?? "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await updateUserProfile(toUpdateRequest(values));
      const dept = (values.department || null) as Department | null;
      updateProfile({
        nickname: values.nickname,
        name: values.name,
        intro: values.intro || null,
        phoneNumber: values.phoneNumber || null,
        qqNumber: values.qqNumber || null,
        college: values.college,
        major: values.major,
        // studentId is set during registration — not editable
        department: dept,
        // other emails managed via identities — not editable here
        blogUrl: values.blogUrl || null,
        githubUrl: values.githubUrl || null,
      });
      mutate("user-profile");
      message.success("修改成功");
      router.back();
    } catch (error) {
      form.setError("root", { message: toApiError(error).message });
    } finally {
      setLoading(false);
    }
  });

  const textFields = [
    { name: "nickname" as const, label: "昵称" },
    { name: "name" as const, label: "真实姓名" },
    { name: "intro" as const, label: "签名" },
  ];

  const academicFields = [
    { name: "major" as const, label: "专业" },
  ];

  const contactFields = [
    { name: "phoneNumber" as const, label: "手机号", type: "tel" as const },
    { name: "qqNumber" as const, label: "QQ 号" },
  ];

  const socialFields = [
    { name: "blogUrl" as const, label: "博客", type: "url" as const },
    { name: "githubUrl" as const, label: "GitHub", type: "url" as const },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-14 px-5 pb-20 pt-14 sm:px-8">
      <BackButton />

      {/* Avatar */}
      <section aria-label="头像">
        <h2 className="type-tech mb-3 text-tertiary">头像</h2>
        <AvatarCropperDialog
          avatarUrl={profile.avatar}
          fallbackChar={avatarFallbackChar(profile)}
          onUploaded={(url) => updateProfile({ avatar: url })}
        />
      </section>

      <Form {...form}>
        <form onSubmit={submit} className="flex flex-col gap-14">
          {/* Basic info */}
          <section aria-label="基本资料">
            <h2 className="type-tech mb-3 text-tertiary">基本资料</h2>
            <div className="flex flex-col gap-4">
              {textFields.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                      />
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </section>

          {/* Academic */}
          <section aria-label="学籍信息">
            <h2 className="type-tech mb-3 text-tertiary">学籍信息</h2>
            <div className="flex flex-col gap-4">
              {academicFields.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                      />
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              ))}

              {/* College select */}
              <FormField
                control={form.control}
                name="college"
                render={({ field }) => (
                  <FormItem>
                    <label
                      htmlFor="college"
                      className="mb-2 block text-[13px] text-muted-foreground"
                    >
                      学院
                    </label>
                    <select id="college" {...field} className={selectClass}>
                      {COLLEGES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="min-h-4 text-xs [&_p]:text-destructive">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Department select — SAST members only */}
              {profile.state !== "njupter" && (
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <label
                        htmlFor="department"
                        className="mb-2 block text-[13px] text-muted-foreground"
                      >
                        部门
                      </label>
                      <select
                        id="department"
                        {...field}
                        className={selectClass}
                      >
                        {DEPARTMENT_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </section>

          {/* Contact */}
          <section aria-label="联系方式">
            <h2 className="type-tech mb-3 text-tertiary">联系方式</h2>
            <div className="flex flex-col gap-4">
              {contactFields.map(({ name, label, type }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                        type={type}
                      />
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </section>

          {/* Social */}
          <section aria-label="社交链接">
            <h2 className="type-tech mb-3 text-tertiary">社交链接</h2>
            <div className="flex flex-col gap-4">
              {socialFields.map(({ name, label, type }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                        type={type}
                      />
                      <div className="min-h-4 text-xs [&_p]:text-destructive">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </section>

          <FormError message={form.formState.errors.root?.message} />

          <div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <DotLoading /> : "保存修改"}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
