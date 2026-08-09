"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSWRConfig } from "swr";

import { updateUserProfile } from "@/lib/api/user";
import { toApiError } from "@/lib/api/errors";
import { mapProfile } from "@/lib/api/mappers";
import { COLLEGES, type UpdateProfileRequest } from "@/lib/api/types";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { message } from "@/lib/message";
import {
  profileEditSchema,
  type ProfileEditFormValues,
} from "@/lib/validations/profile";
import { scrollToFirstError } from "@/lib/form";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { BackButton } from "@/components/navigation/back-button";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

const FIELD_ORDER = [
  "nickname",
  "name",
  "intro",
  "college",
  "major",
  "phoneNumber",
  "qqNumber",
  "blogUrl",
  "githubUrl",
];

function toUpdateRequest(values: ProfileEditFormValues): UpdateProfileRequest {
  return {
    nickname: values.nickname,
    name: values.name,
    intro: values.intro,
    phone_number: values.phoneNumber,
    qq_number: values.qqNumber,
    // leave college untouched when the user hasn't chosen one
    ...(values.college ? { college: values.college } : {}),
    major: values.major,
    // student_id is set during registration — not editable;
    // department is managed by admin / recruitment — not editable
    blog_url: values.blogUrl,
    github_url: values.githubUrl,
  };
}

export default function EditPage() {
  const profile = useUserProfileStore((s) => s.profile);
  const setProfile = useUserProfileStore((s) => s.setProfile);
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
      college: profile.college ?? "",
      major: profile.major ?? "",
      department: profile.department ?? "",
      blogUrl: profile.blogUrl ?? "",
      githubUrl: profile.githubUrl ?? "",
    },
  });

  // profile loads async after mount - reseed the form once it arrives so a
  // direct visit/refresh to /profile/edit isn't stuck on empty defaults.
  // keepDirtyValues prevents a background SWR revalidation from overwriting
  // edits the user is currently making.
  useEffect(() => {
    if (profile.id === 0) return;
    form.reset(
      {
        nickname: profile.nickname,
        name: profile.name,
        intro: profile.intro ?? "",
        phoneNumber: profile.phoneNumber ?? "",
        qqNumber: profile.qqNumber ?? "",
        college: profile.college ?? "",
        major: profile.major ?? "",
        department: profile.department ?? "",
        blogUrl: profile.blogUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
      },
      { keepDirtyValues: true },
    );
  }, [profile, form]);

  const onValid = async (values: ProfileEditFormValues) => {
    setLoading(true);
    try {
      const response = await updateUserProfile(toUpdateRequest(values));
      setProfile(mapProfile(response.data.data.user));
      mutate("user-profile");
      message.success("修改成功");
      router.push("/profile");
    } catch (error) {
      form.setError("root", { message: toApiError(error).message });
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = () => {
    scrollToFirstError(form.formState.errors, FIELD_ORDER);
  };

  const submit = form.handleSubmit(onValid, onInvalid);

  const textFields = [
    { name: "nickname" as const, label: "别名" },
    { name: "name" as const, label: "真实姓名" },
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
    <main className="pt-transition mx-auto flex w-full max-w-[760px] flex-col gap-14 px-5 pb-20 pt-14 sm:px-8">
      <BackButton />

      <Form {...form}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-14">
          {/* Basic info */}
          <section aria-label="基本资料">
            <h2 className="type-tech mb-3 text-tertiary">基本资料</h2>
            <div className="flex flex-col gap-4">
              {textFields.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                      />
                    </FormItem>
                  )}
                />
              ))}

              {/* Signature — multi-line */}
              <FormField
                control={form.control}
                name="intro"
                render={({ field }) => (
                  <FormItem>
                    <label
                      htmlFor="intro"
                      className="mb-2 block text-[13px] text-muted-foreground"
                    >
                      签名
                    </label>
                    <textarea
                      id="intro"
                      {...field}
                      rows={4}
                      placeholder="泥真的没有想说的咩.."
                      className="min-h-[120px] w-full resize-none rounded-lg border bg-card px-3.5 py-3 text-[15px] transition-colors placeholder:text-tertiary focus-visible:outline-none invalid:border-destructive valid:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                    />
                    <div className="min-h-4 text-xs [&_p]:text-destructive">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Academic */}
          <section aria-label="学籍信息">
            <h2 className="type-tech mb-3 text-tertiary">学籍信息</h2>
            <div className="flex flex-col gap-4">
              {/* College first, then major */}
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
                    <Select id="college" {...field} className={selectClass}>
                      <option value="">未选择</option>
                      {COLLEGES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <div className="min-h-4 text-xs [&_p]:text-destructive">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {academicFields.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                      />
                    </FormItem>
                  )}
                />
              ))}

              {/* Department is read-only — managed by admin / recruitment */}
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-[13px] text-muted-foreground">部门</span>
                <span className="text-foreground">
                  {profile.department
                    ? DEPARTMENT_LABELS[profile.department] ?? profile.department
                    : "未分配"}
                </span>
              </div>
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
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                        type={type}
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                      />
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
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label={label}
                        type={type}
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                      />
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
