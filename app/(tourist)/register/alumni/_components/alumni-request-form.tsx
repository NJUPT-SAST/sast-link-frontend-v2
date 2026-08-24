"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { submitAlumniRequest } from "@/lib/api/alumni";
import { toApiError } from "@/lib/api/errors";
import {
  CODE_ALUMNI_REQUEST_PENDING,
  CODE_ALUMNI_REQUEST_UNAVAILABLE,
  CODE_CAPTCHA_FAILED,
  CODE_EMAIL_ALREADY_REGISTERED,
  CODE_STUDENT_ID_OCCUPIED,
} from "@/lib/api/error-codes";
import { COLLEGES, type SubmitAlumniRequestRequest } from "@/lib/api/types";
import {
  alumniRequestSchema,
  type AlumniRequestFormValues,
} from "@/lib/validations/alumni";
import { scrollToFirstError } from "@/lib/form";
import { SUPPORT_EMAIL } from "@/lib/constants/support";
import {
  useTurnstileScript,
  useTurnstileWidget,
  type TurnstileState,
} from "@/hooks/use-turnstile";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select } from "@/components/ui/select";

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

const FIELD_ORDER = [
  "name",
  "student_id",
  "login_email",
  "personal_email",
  "phone_number",
  "qq_number",
  "college",
  "major",
  "join_year",
  "department_note",
  "note",
];

const studentIdPattern = /^[A-Za-z]\d{8}$/;

function createEmptyValues(): AlumniRequestFormValues {
  return {
    name: "",
    student_id: "",
    login_email: "",
    personal_email: "",
    phone_number: "",
    qq_number: "",
    college: "其他",
    major: "",
    join_year: "",
    department_note: "",
    note: "",
  };
}

/** Copy for the two terminal Turnstile states. Both hide the form: the backend
 *  verifies the token unconditionally, so a form we cannot attach one to would
 *  only collect a submission that is certain to be refused. */
function UnavailableNotice({ state }: { state: Exclude<TurnstileState, "loading" | "ready"> }) {
  return (
    <div className="flex flex-col gap-3 border border-hairline bg-card p-5 text-[15px] leading-7">
      <p className="type-headline">申请通道暂不可用</p>
      <p className="text-muted-foreground">
        {state === "disabled"
          ? "本站当前未启用在线申请。"
          : "人机验证组件加载失败，可能是网络环境限制。"}
        你仍可以直接发邮件联系管理员，我们会人工协助你开通账号。
      </p>
      <p className="text-muted-foreground">
        请用你常用的邮箱发信到{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-link hover:underline">
          {SUPPORT_EMAIL}
        </a>
        ，并写明<strong className="font-semibold">姓名、学号、原学号邮箱、常用邮箱、
        手机号、QQ 号、学院、专业、入会年份</strong>。
      </p>
    </div>
  );
}

export default function AlumniRequestForm() {
  const router = useRouter();
  const scriptState = useTurnstileScript();
  // A widget-reported error is separate from a script load failure: the script
  // may load fine and still fail to solve a challenge.
  const [widgetFailed, setWidgetFailed] = useState(false);
  // Set when the server says the channel itself is down (50301). Distinct from a
  // widget failure: the challenge may be perfectly solvable client-side while the
  // backend has no secret to verify it against.
  const [channelDown, setChannelDown] = useState(false);
  const onUnavailable = useCallback(() => setWidgetFailed(true), []);
  const state: TurnstileState =
    channelDown || widgetFailed ? "unavailable" : scriptState;
  const { containerRef, token, reset: resetCaptcha } = useTurnstileWidget({
    state,
    onUnavailable,
  });

  const form = useForm<AlumniRequestFormValues>({
    resolver: zodResolver(alumniRequestSchema),
    defaultValues: createEmptyValues(),
  });
  const [loading, setLoading] = useState(false);

  // The school mailbox is the account identifier, and for NJUPT accounts it is
  // conventionally the student id — offer it so the applicant does not have to
  // recall the format, but only when the id itself is well formed.
  const autofillLoginEmail = () => {
    const studentId = form.getValues("student_id").trim();
    if (!studentIdPattern.test(studentId)) return;
    if (form.getValues("login_email").trim()) return;
    form.setValue("login_email", `${studentId.toLowerCase()}@njupt.edu.cn`, {
      shouldValidate: false,
    });
  };

  const handleValid = async (values: AlumniRequestFormValues) => {
    if (!token) {
      form.setError("root", { message: "请先完成人机验证" });
      return;
    }
    setLoading(true);
    const payload: SubmitAlumniRequestRequest = {
      name: values.name,
      student_id: values.student_id,
      login_email: values.login_email,
      personal_email: values.personal_email,
      phone_number: values.phone_number,
      qq_number: values.qq_number,
      college: values.college,
      major: values.major,
      join_year: values.join_year,
      captcha_token: token,
    };
    if (values.department_note) payload.department_note = values.department_note;
    if (values.note) payload.note = values.note;

    try {
      await submitAlumniRequest(payload);
      router.replace("/register/alumni/success");
    } catch (error) {
      const apiError = toApiError(error);
      // The token is single-use; any rejected submit must not retry with the spent
      // one or the next attempt fails verification for an unrelated reason.
      resetCaptcha();

      switch (apiError.code) {
        // The check ran and did not pass — a fresh token is on its way, so this is
        // worth retrying. Contrast with 50301 below.
        case CODE_CAPTCHA_FAILED:
          form.setError("root", { message: "人机验证未通过，请重新验证后提交" });
          break;
        // The check could not be performed at all. Retrying the challenge is
        // pointless, so drop to the same unavailable view the hook renders.
        case CODE_ALUMNI_REQUEST_UNAVAILABLE:
          setChannelDown(true);
          break;
        case CODE_ALUMNI_REQUEST_PENDING:
          form.setError("student_id", {
            message: "该学号已有待审核的申请，请等待处理，无需重复提交",
          });
          break;
        case CODE_STUDENT_ID_OCCUPIED:
          form.setError("student_id", {
            message: "该学号已有账号，请直接登录或找回密码",
          });
          break;
        // The backend uses one code for both addresses, so the message cannot name
        // which collided. Attach it to the personal mailbox as the likelier of the
        // two while saying to check both.
        case CODE_EMAIL_ALREADY_REGISTERED:
          form.setError("personal_email", {
            message: "邮箱已被占用，请检查学号邮箱与常用邮箱；若你已有账号，请直接找回密码",
          });
          break;
        default:
          form.setError("root", { message: apiError.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(handleValid, () =>
      scrollToFirstError(form.formState.errors, FIELD_ORDER),
    )(event);
  };

  if (state === "disabled" || state === "unavailable") {
    return <UnavailableNotice state={state} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <p className="type-tech text-xs text-tertiary">
          带 <span className="text-destructive">*</span> 项为必填
        </p>

        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="真实姓名"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="student_id"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                onBlur={() => {
                  field.onBlur();
                  autofillLoginEmail();
                }}
                label="学号"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="login_email"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="原学号邮箱"
                type="email"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
                description="仅支持 @njupt.edu.cn。它只作为账号标识，无需还能收信。"
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personal_email"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="常用邮箱"
                type="email"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
                description="审核结果会发到这里，日后也用它登录和设置密码，请填写长期可用的邮箱。"
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="手机号"
                type="tel"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qq_number"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="QQ 号"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="college"
          render={({ field }) => (
            <FormItem>
              <label htmlFor="college" className="mb-2 block text-[13px] text-muted-foreground">
                学院
                <span className="ml-0.5 text-destructive">*</span>
              </label>
              <Select id="college" {...field} className={selectClass}>
                {COLLEGES.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </Select>
              <div className="min-h-4 text-xs">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="major"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="专业"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="join_year"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="入会年份"
                inputMode="numeric"
                maxLength={4}
                placeholder="2020"
                required
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
                description="仅用于人工核验社团成员身份，不会写入你的账号资料。"
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department_note"
          render={({ field, fieldState }) => (
            <FormItem>
              <AuthFormField
                {...field}
                ref={field.ref}
                label="所属部门（可选）"
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
                description="如软件研发部、多媒体部等，便于管理员核对。"
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <FormItem>
              <label htmlFor="note" className="mb-2 block text-[13px] text-muted-foreground">
                补充说明（可选）
              </label>
              <textarea
                {...field}
                id="note"
                rows={3}
                className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                placeholder="可写明可证明身份的信息，如当年负责的项目、可联系的社团成员等。"
              />
              <div className="min-h-4 text-xs">
                <FormError message={fieldState.error?.message} />
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted-foreground">人机验证</span>
          <div ref={containerRef} />
          {state === "loading" && (
            <span className="text-xs text-tertiary">正在加载验证组件…</span>
          )}
        </div>

        <FormError message={form.formState.errors.root?.message} />

        <Button type="submit" disabled={loading || !token} className="mt-2 w-full">
          {loading ? <DotLoading /> : "提交申请"}
        </Button>
      </form>
    </Form>
  );
}
