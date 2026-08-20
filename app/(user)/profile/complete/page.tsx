"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
import { CheckCircle2 } from "lucide-react";

import { updateUserProfile } from "@/lib/api/user";
import { toApiError } from "@/lib/api/errors";
import { mapProfile } from "@/lib/api/mappers";
import { profileKey } from "@/lib/api/profile";
import type { IncompleteProfileField, UpdateProfileRequest } from "@/lib/api/types";
import { useUserProfileStore } from "@/store/use-user-profile-store";
import { useFetchProfile } from "@/hooks/use-fetch-profile";
import { message } from "@/lib/message";
import { scrollToFirstError } from "@/lib/form";
import {
  profileCompleteSchema,
  type ProfileCompleteFormValues,
} from "@/lib/validations/profile-complete";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  Form,
  FormField,
  FormItem,
} from "@/components/ui/form";

const FIELDS: Record<
  IncompleteProfileField,
  { formKey: keyof ProfileCompleteFormValues; label: string; type?: string }
> = {
  name: { formKey: "name", label: "真实姓名" },
  phone_number: { formKey: "phoneNumber", label: "手机号", type: "tel" },
  qq_number: { formKey: "qqNumber", label: "QQ 号" },
  major: { formKey: "major", label: "专业" },
};

const FIELD_ORDER: (keyof ProfileCompleteFormValues)[] = [
  "name",
  "phoneNumber",
  "qqNumber",
  "major",
];

export default function ProfileCompletePage() {
  const router = useRouter();
  const profile = useUserProfileStore((s) => s.profile);
  const setProfile = useUserProfileStore((s) => s.setProfile);
  const { mutate } = useSWRConfig();
  const { isLoading } = useFetchProfile();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // The user may land here directly after login or via cold-start redirect. As
  // soon as their (possibly legacy) profile is hydrated, only render the fields
  // the backend reports as still missing (name / phone_number / qq_number /
  // major). name may already hold the student_id — it is still required so the
  // user replaces it with a real name.
  const missing = useMemo(
    () =>
      profile.incompleteFields.filter((f) => f in FIELDS) as IncompleteProfileField[],
    [profile.incompleteFields],
  );

  const form = useForm<ProfileCompleteFormValues>({
    resolver: zodResolver(profileCompleteSchema),
    defaultValues: {
      name: profile.name ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      qqNumber: profile.qqNumber ?? "",
      major: profile.major ?? "",
    },
  });

  // Re-seed once profile arrives (profile loads async; id===0 means not yet).
  useEffect(() => {
    if (profile.id === 0) return;
    form.reset({
      name: profile.name ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      qqNumber: profile.qqNumber ?? "",
      major: profile.major ?? "",
    });
  }, [profile, form]);

  const onValid = async (values: ProfileCompleteFormValues) => {
    setSubmitting(true);
    try {
      const request: UpdateProfileRequest = {};
      missing.forEach((field) => {
        const { formKey } = FIELDS[field];
        const value = String(values[formKey] ?? "").trim();
        if (field === "name") request.name = value;
        if (field === "phone_number") request.phone_number = value;
        if (field === "qq_number") request.qq_number = value;
        if (field === "major") request.major = value;
      });
      const response = await updateUserProfile(request);
      setProfile(mapProfile(response.data.data.user));
      const key = profileKey();
      if (key) mutate(key);
      setDone(true);
      message.success("资料已补齐");
    } catch (error) {
      form.setError("root", { message: toApiError(error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = () => {
    scrollToFirstError(form.formState.errors, FIELD_ORDER);
  };

  if (isLoading || (profile.id === 0 && !done)) {
    return (
      <main className="grid min-h-screen place-items-center">
        <DotLoading />
      </main>
    );
  }

  // Nothing left to complete (e.g. re-entering the page after a save, or a
  // healthy account that somehow landed here). Send them home.
  if (done || missing.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-5 px-5 pb-16 pt-20 text-center">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <h1 className="type-title3">资料已完整</h1>
        <p className="text-[15px] leading-[22px] text-muted-foreground">
          你的基本资料已补全，现在可以继续使用了。
        </p>
        <Button onClick={() => router.replace("/home")}>回到首页</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col gap-6 px-5 pb-16 pt-14">
      <header>
        <h1 className="type-title3">完善你的资料</h1>
        <p className="mt-2 text-[15px] leading-[22px] text-muted-foreground">
          你的账号还有几项必填资料待补充，完成后即可正常使用。
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onValid, onInvalid)} noValidate className="flex flex-col gap-4">
          {missing.map((field) => {
            const { formKey, label, type } = FIELDS[field];
            return (
              <FormField
                key={field}
                control={form.control}
                name={formKey}
                render={({ field: inputField, fieldState }) => (
                  <FormItem>
                    <AuthFormField
                      {...inputField}
                      ref={inputField.ref}
                      label={label}
                      type={type}
                      required
                      invalid={fieldState.invalid}
                      error={fieldState.error?.message}
                    />
                  </FormItem>
                )}
              />
            );
          })}

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "保存中…" : "保存并继续"}
          </Button>
        </form>
      </Form>
    </main>
  );
}
