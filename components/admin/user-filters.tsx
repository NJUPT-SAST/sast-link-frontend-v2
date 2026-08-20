"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { AdminUserListParams } from "@/lib/api/types";
import { adminUserFiltersSchema, type AdminUserFiltersFormValues } from "@/lib/validations/admin";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AuthFormField } from "@/components/auth/auth-form-field";

interface UserFiltersProps {
  value: AdminUserListParams;
  onChange: (filters: AdminUserListParams) => void;
}

const ROLE_OPTIONS = [
  { value: "", label: "全部角色" },
  { value: "freshman", label: "新生" },
  { value: "member", label: "成员" },
  { value: "lecturer", label: "讲师" },
  { value: "admin", label: "管理员" },
];

const STATE_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "njupter", label: "在校学生" },
  { value: "on_sast", label: "SAST 成员" },
  { value: "retired_sast", label: "已退休" },
  { value: "is_deleted", label: "已注销" },
];

const DEPARTMENT_OPTIONS = [
  { value: "", label: "全部部门" },
  ...Object.entries(DEPARTMENT_LABELS).map(([value, label]) => ({ value, label })),
];

const COMPLETION_OPTIONS = [
  { value: "", label: "全部资料状态" },
  { value: "true", label: "待补全" },
  { value: "false", label: "已完整" },
];

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

function toFormValues(params: AdminUserListParams): AdminUserFiltersFormValues {
  return {
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
    role: (params.role ?? "") as AdminUserFiltersFormValues["role"],
    state: (params.state ?? "") as AdminUserFiltersFormValues["state"],
    department: (params.department ?? "") as AdminUserFiltersFormValues["department"],
    student_id: params.student_id ?? "",
    keyword: params.keyword ?? "",
    needs_completion:
      params.needs_completion === undefined
        ? ""
        : (String(params.needs_completion) as "true" | "false"),
  };
}

function toParams(values: AdminUserFiltersFormValues): AdminUserListParams {
  return {
    page: 1,
    page_size: 20,
    role: values.role ? (values.role as Exclude<typeof values.role, "">) : undefined,
    state: values.state ? (values.state as Exclude<typeof values.state, "">) : undefined,
    department: values.department ? (values.department as Exclude<typeof values.department, "">) : undefined,
    student_id: values.student_id?.trim() || undefined,
    keyword: values.keyword?.trim() || undefined,
    needs_completion:
      values.needs_completion === "" ? undefined : values.needs_completion === "true",
  };
}

export function UserFilters({ value, onChange }: UserFiltersProps) {
  const form = useForm<AdminUserFiltersFormValues>({
    resolver: zodResolver(adminUserFiltersSchema),
    defaultValues: toFormValues(value),
  });

  useEffect(() => {
    form.reset(toFormValues(value));
  }, [value, form]);

  const submit = form.handleSubmit((values) => {
    onChange(toParams(values));
  });

  const reset = () => {
    const empty: AdminUserListParams = { page: 1, page_size: 20 };
    form.reset(toFormValues(empty));
    onChange(empty);
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="w-[140px]">
        <label htmlFor="role" className="mb-1.5 block text-xs text-muted-foreground">
          角色
        </label>
        <Select id="role" {...form.register("role")} className={selectClass}>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
      <div className="w-[140px]">
        <label htmlFor="state" className="mb-1.5 block text-xs text-muted-foreground">
          状态
        </label>
        <Select id="state" {...form.register("state")} className={selectClass}>
          {STATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
      <div className="w-[140px]">
        <label htmlFor="department" className="mb-1.5 block text-xs text-muted-foreground">
          部门
        </label>
        <Select id="department" {...form.register("department")} className={selectClass}>
          {DEPARTMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
      <div className="w-[150px]">
        <label htmlFor="needs_completion" className="mb-1.5 block text-xs text-muted-foreground">
          资料状态
        </label>
        <Select id="needs_completion" {...form.register("needs_completion")} className={selectClass}>
          {COMPLETION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
      <div className="w-[180px]">
        <AuthFormField
          id="student_id"
          label="学号"
          placeholder="精确匹配"
          {...form.register("student_id")}
        />
      </div>
      <div className="w-[220px]">
        <AuthFormField
          id="keyword"
          label="关键词"
          placeholder="姓名 / 学号 / 邮箱"
          {...form.register("keyword")}
        />
      </div>
      <Button type="submit" className="h-11">搜索</Button>
      <Button type="button" variant="outline" onClick={reset} className="h-11">重置</Button>
    </form>
  );
}
