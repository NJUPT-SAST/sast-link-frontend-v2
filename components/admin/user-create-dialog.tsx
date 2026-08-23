"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, Copy } from "lucide-react";

import type { AdminCreateUserData, AdminCreateUserRequest } from "@/lib/api/types";
import { COLLEGES } from "@/lib/api/types";
import {
  adminCreateUserSchema,
  type AdminCreateUserFormValues,
} from "@/lib/validations/admin";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { scrollToFirstError } from "@/lib/form";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

// Reuse the shared label tables (single source of truth); create never offers
// is_deleted — a fresh account is not a deletion.
const ROLE_OPTIONS = Object.entries(ROLE_LABELS);
const STATE_OPTIONS = Object.entries(STATE_LABELS).filter(
  ([value]) => value !== "is_deleted",
);

const FIELD_ORDER = [
  "name",
  "student_id",
  "college",
  "major",
  "login_email",
  "personal_email",
  "phone_number",
  "qq_number",
  "role",
  "state",
];

function createEmptyValues(): AdminCreateUserFormValues {
  return {
    name: "",
    student_id: "",
    college: "其他",
    major: "",
    login_email: "",
    phone_number: "",
    qq_number: "",
    personal_email: "",
    role: "member",
    state: "retired_sast",
  };
}

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Parent performs the mutation (owns `createAdminUser`) and returns the
   *  created account so the dialog can present the one-time password. */
  onCreate: (data: AdminCreateUserRequest) => Promise<AdminCreateUserData>;
}

export function UserCreateDialog({ open, onOpenChange, onCreate }: UserCreateDialogProps) {
  const form = useForm<AdminCreateUserFormValues>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: createEmptyValues(),
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdminCreateUserData | null>(null);
  const [copied, setCopied] = useState(false);
  // Bumped on every close so an in-flight create that settles after the dialog
  // was closed discards its result/error instead of leaking into the next open.
  const submitIdRef = useRef(0);

  const reset = () => {
    submitIdRef.current += 1;
    form.reset(createEmptyValues());
    setResult(null);
    setLoading(false);
  };

  const toRequest = (values: AdminCreateUserFormValues): AdminCreateUserRequest => {
    const request: AdminCreateUserRequest = {
      name: values.name,
      student_id: values.student_id,
      college: values.college,
      login_email: values.login_email,
      phone_number: values.phone_number,
      qq_number: values.qq_number,
      role: values.role,
      state: values.state,
    };
    if (values.major) request.major = values.major;
    if (values.personal_email) request.personal_email = values.personal_email;
    return request;
  };

  const handleValid = async (values: AdminCreateUserFormValues) => {
    const submitId = submitIdRef.current;
    setLoading(true);
    try {
      const created = await onCreate(toRequest(values));
      if (submitId !== submitIdRef.current) return; // closed mid-flight — discard
      setResult(created);
      form.clearErrors("root");
    } catch (error) {
      if (submitId !== submitIdRef.current) return;
      // Server-side failures (duplicate login_email / student_id / bound
      // personal email) render in the form's root instead of a toast, matching
      // the edit form.
      form.setError("root", { message: toApiError(error).message });
    } finally {
      if (submitId === submitIdRef.current) setLoading(false);
    }
  };

  const handleInvalid = () => {
    scrollToFirstError(form.formState.errors, FIELD_ORDER);
  };

  // handleSubmit must be invoked at submit time, not render time: handleValid
  // reads the submitIdRef guard, and the React Compiler flags ref reads that
  // could run during render.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(handleValid, handleInvalid)(event);
  };

  const handleCopy = async () => {
    if (!result) return;
    // clipboard.writeText rejects on non-secure origins and denied permissions;
    // the password is shown once, so a silent failure means the admin leaves
    // believing they captured it. Surface it instead.
    try {
      await navigator.clipboard.writeText(result.initial_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error("复制失败，请手动选择复制");
    }
  };

  // Every close path here (我知道了 / X / overlay) flows through onOpenChange, so
  // resetting there — not in an open-prop effect — is the single reset point,
  // matching how the last submit's fields/result must not leak into the next open.
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="type-title3">创建成功</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {result.login_email} 的账号已创建。初始密码仅此一次显示，
                关闭后无法再次查看。
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <AuthFormField
                    id="initial_password"
                    label="初始密码"
                    value={result.initial_password}
                    readOnly
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-[30px] size-12 shrink-0"
                  onClick={handleCopy}
                  aria-label="复制初始密码"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <div className="rounded-lg border border-hairline bg-card p-3 text-sm leading-5 text-muted-foreground">
                请立即通过线下渠道把初始密码转达给成员。成员首次可凭登录邮箱
                （含已绑定的个人邮箱）与初始密码登录，随后自行「修改密码」或
                「忘记密码」更换。
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)} className="w-full">
                我知道了
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="type-title3">创建账号</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                为无法自助注册的成员兜底建号（如已毕业成员，学生邮箱已不可用）。
                登录邮箱须为 @njupt.edu.cn 或 @sast.fun；填写个人邮箱将直绑为
                该账号的登录身份。
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <AuthFormField
                        {...field}
                        ref={field.ref}
                        label="姓名"
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
                  name="college"
                  render={({ field }) => (
                    <FormItem>
                      <label htmlFor="college" className="mb-2 block text-[13px] text-muted-foreground">
                        学院
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
                        label="登录邮箱"
                        type="email"
                        required
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                        description="仅支持 @njupt.edu.cn 或 @sast.fun 邮箱。"
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
                        label="个人邮箱（可选）"
                        type="email"
                        invalid={fieldState.invalid}
                        error={fieldState.error?.message}
                        description="填写后将直绑为该账号的登录身份（免验证），成员可凭此邮箱登录与找回密码。"
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <label htmlFor="role" className="mb-2 block text-[13px] text-muted-foreground">
                        角色
                      </label>
                      <Select id="role" {...field} className={selectClass}>
                        {ROLE_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                      <div className="min-h-4 text-xs">
                        <FormMessage />
                        {field.value === "admin" && (
                          <p className="text-destructive">创建管理员账号将授予全部管理权限，请谨慎确认。</p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <label htmlFor="state" className="mb-2 block text-[13px] text-muted-foreground">
                        状态
                      </label>
                      <Select id="state" {...field} className={selectClass}>
                        {STATE_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </Select>
                      <div className="min-h-4 text-xs">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormError message={form.formState.errors.root?.message} />
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    取消
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <DotLoading /> : "创建账号"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}