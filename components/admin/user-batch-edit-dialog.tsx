"use client";

import { useEffect, useState } from "react";

import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DotLoading } from "@/components/ui/dot-loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BatchEditFields = {
  role?: string;
  state?: string;
  department?: string;
};

interface UserBatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  loading?: boolean;
  onConfirm: (fields: BatchEditFields) => void;
}

const ROLE_OPTIONS = Object.entries(ROLE_LABELS);
const STATE_OPTIONS = Object.entries(STATE_LABELS);
const DEPT_OPTIONS = Object.entries(DEPARTMENT_LABELS);

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

export function UserBatchEditDialog({
  open,
  onOpenChange,
  count,
  loading = false,
  onConfirm,
}: UserBatchEditDialogProps) {
  const [role, setRole] = useState("");
  const [state, setState] = useState("");
  const [department, setDepartment] = useState("");
  const [dangerConfirm, setDangerConfirm] = useState(false);

  const hasChange = Boolean(role || state || department);
  const isDangerous = role === "admin" || state === "is_deleted";

  const reset = () => {
    setRole("");
    setState("");
    setDepartment("");
    setDangerConfirm(false);
  };

  // The parent closes the dialog programmatically (open=false) after a
  // successful batch submit, which does NOT fire onOpenChange — so reset on the
  // open prop itself, or the previous batch's fields leak into the next open.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) reset();
  }, [open]);

  const buildFields = (): BatchEditFields => {
    const fields: BatchEditFields = {};
    if (role) fields.role = role;
    if (state) fields.state = state;
    if (department) fields.department = department;
    return fields;
  };

  const submit = () => {
    if (isDangerous) {
      setDangerConfirm(true);
      return;
    }
    onConfirm(buildFields());
  };

  const doSubmit = () => {
    setDangerConfirm(false);
    onConfirm(buildFields());
  };

  const dangerHints = [
    role === "admin" && `将把 ${count} 名用户设为「管理员」，管理员拥有全部管理权限，请谨慎确认。`,
    state === "is_deleted" && `将把 ${count} 名用户注销，注销后无法登录，但数据会被保留，请谨慎确认。`,
  ].filter(Boolean) as string[];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="border-border/60 bg-card/95 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="type-title3">
            {dangerConfirm ? "请谨慎确认" : "批量修改"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {dangerConfirm
              ? "以下变更影响较大，请确认是否继续"
              : `将修改 ${count} 个用户。只设置要变更的字段，留空的字段保持不变。`}
          </DialogDescription>
        </DialogHeader>

        {dangerConfirm ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
              <ul className="flex list-inside list-disc flex-col gap-2">
                {dangerHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDangerConfirm(false)}
                disabled={loading}
              >
                返回修改
              </Button>
              <Button variant="destructive" onClick={doSubmit} disabled={loading}>
                {loading ? <DotLoading /> : "仍要修改"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 py-2">
              <div>
                <label htmlFor="batch-role" className="mb-2 block text-[13px] text-muted-foreground">
                  角色
                </label>
                <Select id="batch-role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
                  <option value="">保持不变</option>
                  {ROLE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="batch-state" className="mb-2 block text-[13px] text-muted-foreground">
                  状态
                </label>
                <Select id="batch-state" value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
                  <option value="">保持不变</option>
                  {STATE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="batch-department" className="mb-2 block text-[13px] text-muted-foreground">
                  部门
                </label>
                <Select id="batch-department" value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass}>
                  <option value="">保持不变</option>
                  {DEPT_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                取消
              </Button>
              <Button onClick={submit} disabled={!hasChange || loading}>
                {loading ? <DotLoading /> : "确认修改"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
