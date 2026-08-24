"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { AlumniRequest, ApproveAlumniRequestData } from "@/lib/api/types";
import {
  alumniRejectSchema,
  type AlumniRejectFormValues,
} from "@/lib/validations/alumni";
import { toApiError } from "@/lib/api/errors";
import { CODE_ALUMNI_REQUEST_REVIEWED } from "@/lib/api/error-codes";
import { message } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { DotLoading } from "@/components/ui/dot-loading";
import { FormError } from "@/components/ui/form-error";
import { Form, FormField, FormItem } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlumniRequestReviewDialogProps {
  request: AlumniRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: number) => Promise<ApproveAlumniRequestData>;
  onReject: (id: number, reason: string) => Promise<void>;
}

type Mode = "review" | "reject" | "approved";

/** Review a pending request.
 *
 *  Approval is deliberately a single button with no editable fields: the backend
 *  provisions the account from the stored request in one transaction, which is
 *  what removes the transcription step (and with it the class of mistake where a
 *  reviewer forgets `personal_email` and leaves the applicant unable to set a
 *  password). Anything wrong with the data is grounds for rejection with a
 *  reason, not a silent edit here.
 */
export function AlumniRequestReviewDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: AlumniRequestReviewDialogProps) {
  const [mode, setMode] = useState<Mode>("review");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ApproveAlumniRequestData | null>(null);

  const rejectForm = useForm<AlumniRejectFormValues>({
    resolver: zodResolver(alumniRejectSchema),
    defaultValues: { reject_reason: "" },
  });

  const reset = () => {
    setMode("review");
    setLoading(false);
    setError(undefined);
    setResult(null);
    rejectForm.reset({ reject_reason: "" });
  };

  const handleApprove = async () => {
    if (!request) return;
    setLoading(true);
    setError(undefined);
    try {
      const data = await onApprove(request.id);
      setResult(data);
      setMode("approved");
    } catch (caught) {
      const apiError = toApiError(caught);
      // Someone else already ruled on this ticket (or the button was double
      // clicked). Nothing here can succeed on retry, so close and let the list
      // refresh show the verdict that won.
      if (apiError.code === CODE_ALUMNI_REQUEST_REVIEWED) {
        message.warning("该申请已被处理，请查看最新状态");
        onOpenChange(false);
        return;
      }
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = rejectForm.handleSubmit(async ({ reject_reason }) => {
    if (!request) return;
    setLoading(true);
    setError(undefined);
    try {
      await onReject(request.id, reject_reason);
      onOpenChange(false);
    } catch (caught) {
      const apiError = toApiError(caught);
      if (apiError.code === CODE_ALUMNI_REQUEST_REVIEWED) {
        message.warning("该申请已被处理，请查看最新状态");
        onOpenChange(false);
        return;
      }
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {mode === "approved" && result ? (
          <>
            <DialogHeader>
              <DialogTitle className="type-title3">已通过</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                账号已开通（ID {result.user_id}，登录邮箱 {result.login_email}）。
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-hairline bg-card p-3 text-sm leading-6 text-muted-foreground">
              {result.notify_enqueued ? (
                <>
                  通知邮件已进入发送队列，申请人将收到自助设置密码的指引。
                  无需转达任何密码。
                </>
              ) : (
                <>
                  <span className="text-destructive">通知邮件未能入队。</span>
                  账号已经开通，但申请人不会收到邮件，请手动联系
                  {request ? ` ${request.personal_email}` : ""}
                  ，告知其到 /reset 用该邮箱自助设置密码。
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
                我知道了
              </Button>
            </DialogFooter>
          </>
        ) : mode === "reject" ? (
          <>
            <DialogHeader>
              <DialogTitle className="type-title3">驳回申请</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                理由会原文发送给申请人，请写明需要补充或修正的内容。
              </DialogDescription>
            </DialogHeader>
            <Form {...rejectForm}>
              <form
                onSubmit={(event) => void handleReject(event)}
                noValidate
                className="flex flex-col gap-4"
              >
                <FormField
                  control={rejectForm.control}
                  name="reject_reason"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <label
                        htmlFor="reject_reason"
                        className="mb-2 block text-[13px] text-muted-foreground"
                      >
                        驳回理由
                        <span className="ml-0.5 text-destructive">*</span>
                      </label>
                      <textarea
                        {...field}
                        id="reject_reason"
                        rows={4}
                        className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                      />
                      <div className="min-h-4 text-xs">
                        <FormError message={fieldState.error?.message} />
                      </div>
                    </FormItem>
                  )}
                />
                <FormError message={error} />
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => {
                      setError(undefined);
                      setMode("review");
                    }}
                  >
                    返回
                  </Button>
                  <Button type="submit" variant="destructive" disabled={loading}>
                    {loading ? <DotLoading /> : "确认驳回"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="type-title3">审核建号申请</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                请与既有成员档案交叉核对身份。通过后系统将直接建号并邮件通知申请人。
              </DialogDescription>
            </DialogHeader>
            {request && (
              <dl className="flex flex-col gap-2 py-2 text-sm">
                {[
                  ["姓名", request.name],
                  ["学号", request.student_id],
                  ["学号邮箱（账号标识）", request.login_email],
                  ["常用邮箱（登录身份）", request.personal_email],
                  ["手机号", request.phone_number],
                  ["QQ 号", request.qq_number],
                  ["学院", request.college],
                  ["专业", request.major],
                  ["入会年份", request.join_year],
                  ["所属部门", request.department_note || "—"],
                  ["补充说明", request.note || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="w-40 shrink-0 text-tertiary">{label}</dt>
                    <dd className="min-w-0 break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <FormError message={error} />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setError(undefined);
                  setMode("reject");
                }}
              >
                驳回
              </Button>
              <Button type="button" disabled={loading} onClick={() => void handleApprove()}>
                {loading ? <DotLoading /> : "通过并建号"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
