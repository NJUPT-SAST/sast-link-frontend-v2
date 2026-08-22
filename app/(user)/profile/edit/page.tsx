"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
import { ArrowLeft, Camera } from "lucide-react";

import { updateUserProfile } from "@/lib/api/user";
import { toApiError } from "@/lib/api/errors";
import { mapProfile } from "@/lib/api/mappers";
import { profileKey } from "@/lib/api/profile";
import { COLLEGES, type UpdateProfileRequest } from "@/lib/api/types";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { avatarFallbackChar, DEFAULT_AVATAR } from "@/lib/constants/profile";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { message } from "@/lib/message";
import {
  profileEditSchema,
  type ProfileEditFormValues,
} from "@/lib/validations/profile";
import { scrollToFirstError } from "@/lib/form";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DotLoading } from "@/components/ui/dot-loading";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarCropperDialog } from "@/components/user/avatar-cropper-dialog";
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

/**
 * Warns the user before they lose unsaved edits:
 * - `beforeunload` prompts on refresh / close / external navigation.
 * - the returned `guard` lets in-page exits (e.g. the back button) confirm first.
 * The guard must only see a dirty flag while edits are actually pending — callers
 * reset the form (clearing dirty) right before navigating after a successful save.
 */
function useDirtyGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (action: () => void) => {
    if (isDirty && !window.confirm("有未保存的修改，确定要离开吗？")) {
      return;
    }
    action();
  };
}

/**
 * Strips an explicit http(s) scheme for display under the fixed "https://"
 * prefix, so an existing "https://github.com/alice" shows as "github.com/alice"
 * instead of duplicating the scheme.
 */
const stripUrlScheme = (value: string) => value.replace(/^https?:\/\//i, "");

/**
 * Re-attaches a scheme before submit: keeps an explicit http(s):// the user
 * typed or pasted, otherwise defaults to https:// to match the visible prefix.
 * Empty stays empty so a cleared field clears the backend value.
 */
const withHttpsScheme = (value: string) =>
  value === "" || /^https?:\/\//i.test(value) ? value : `https://${value}`;

function toUpdateRequest(values: ProfileEditFormValues): UpdateProfileRequest {
  return {
    nickname: values.nickname,
    name: values.name,
    // Signature is single-line by design; mobile keyboards/pasted text can
    // slip \n in, which the backend rejects as a control character.
    intro: values.intro.replace(/[\r\n]+/g, ""),
    phone_number: values.phoneNumber,
    qq_number: values.qqNumber,
    // leave college untouched when the user hasn't chosen one
    ...(values.college ? { college: values.college } : {}),
    major: values.major,
    // student_id is set during registration — not editable;
    // department is managed by admin / recruitment — not editable
    // the https:// prefix is a UI affordance, not part of the stored value
    blog_url: withHttpsScheme(values.blogUrl),
    github_url: withHttpsScheme(values.githubUrl),
  };
}

export default function EditPage() {
  const profile = useUserProfileStore((s) => s.profile);
  const setProfile = useUserProfileStore((s) => s.setProfile);
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const handleAvatarUploaded = useAvatarUpload();

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
      blogUrl: stripUrlScheme(profile.blogUrl ?? ""),
      githubUrl: stripUrlScheme(profile.githubUrl ?? ""),
    },
  });
  const guard = useDirtyGuard(form.formState.isDirty);

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
        blogUrl: stripUrlScheme(profile.blogUrl ?? ""),
        githubUrl: stripUrlScheme(profile.githubUrl ?? ""),
      },
      { keepDirtyValues: true },
    );
  }, [profile, form]);

  const onValid = async (values: ProfileEditFormValues) => {
    setLoading(true);
    try {
      const response = await updateUserProfile(toUpdateRequest(values));
      setProfile(mapProfile(response.data.data.user));
      const key = profileKey();
      if (key) mutate(key);
      // Reset the form (clears dirty) so the guard doesn't block the navigation
      // that follows — a successful save is an intended leave.
      form.reset(values);
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
    { name: "nickname" as const, label: "别名", required: true },
    { name: "name" as const, label: "真实姓名", required: true },
  ];

  const academicFields = [
    { name: "major" as const, label: "专业", required: true },
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
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() =>
          guard(() => {
            // Direct visits (no history) have nowhere to go back to — fall back
            // to a sensible page instead of leaving the site.
            if (window.history.length > 1) router.back();
            else router.replace("/profile");
          })
        }
      >
        <ArrowLeft size={16} />
        返回
      </Button>

      <section aria-label="头像" className="flex flex-col items-start gap-4">
        <button
          type="button"
          onClick={() => setAvatarOpen(true)}
          aria-label="更换头像"
          className="group relative rounded-full transition-transform hover:scale-[1.02] active:scale-[.98]"
        >
          <Avatar className="size-24 border border-foreground">
            <AvatarImage src={profile.avatar ?? DEFAULT_AVATAR} alt={profile.nickname} />
            <AvatarFallback className="text-3xl">{avatarFallbackChar(profile)}</AvatarFallback>
          </Avatar>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <Camera size={24} className="text-foreground" />
          </span>
        </button>
        <p className="text-xs text-tertiary">点击头像更换</p>
      </section>

      <Form {...form}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-14">
          {/* Basic info */}
          <section aria-label="基本资料">
            <h2 className="type-tech mb-3 text-tertiary">基本资料</h2>
            <div className="flex flex-col gap-4">
              {textFields.map(({ name, label, required }) => (
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
                        required={required}
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                      />
                    </FormItem>
                  )}
                />
              ))}

              {/* Signature — single-line by product design (a multi-line textarea
                  let mobile keyboards/pasted text slip \n into the value, which the
                  backend rejects as a control character with a generic 参数错误) */}
              <FormField
                control={form.control}
                name="intro"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <AuthFormField
                      {...field}
                      ref={field.ref}
                      label="签名"
                      placeholder="泥真的没有想说的咩.."
                      invalid={fieldState.invalid}
                      error={fieldState.error?.message}
                    />
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

              {academicFields.map(({ name, label, required }) => (
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
                        required={required}
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
                        required
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
                        prefix="https://"
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
