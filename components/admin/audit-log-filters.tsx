"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { AdminAuditLogListParams } from "@/lib/api/types";
import {
  adminAuditLogFiltersSchema,
  type AdminAuditLogFiltersFormValues,
} from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AuthFormField } from "@/components/auth/auth-form-field";

interface AuditLogFiltersProps {
  value: AdminAuditLogListParams;
  onChange: (filters: AdminAuditLogListParams) => void;
}

const SUCCESS_OPTIONS = [
  { value: "", label: "全部" },
  { value: "true", label: "成功" },
  { value: "false", label: "失败" },
];

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-[15px] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";

function toFormValues(params: AdminAuditLogListParams): AdminAuditLogFiltersFormValues {
  return {
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
    user_id: params.user_id,
    action: params.action ?? "",
    resource: params.resource ?? "",
    success: params.success === undefined ? "" : params.success ? "true" : "false",
    start_time: params.start_time ?? "",
    end_time: params.end_time ?? "",
  };
}

function toParams(values: AdminAuditLogFiltersFormValues): AdminAuditLogListParams {
  return {
    page: 1,
    page_size: 20,
    user_id: values.user_id,
    action: values.action?.trim() || undefined,
    resource: values.resource?.trim() || undefined,
    success: !values.success ? undefined : values.success === "true",
    start_time: values.start_time?.trim() || undefined,
    end_time: values.end_time?.trim() || undefined,
  };
}

export function AuditLogFilters({ value, onChange }: AuditLogFiltersProps) {
  const form = useForm<AdminAuditLogFiltersFormValues>({
    resolver: zodResolver(adminAuditLogFiltersSchema),
    defaultValues: toFormValues(value),
  });

  useEffect(() => {
    form.reset(toFormValues(value));
  }, [value, form]);

  const submit = form.handleSubmit((values) => {
    onChange(toParams(values));
  });

  const reset = () => {
    const empty: AdminAuditLogListParams = { page: 1, page_size: 20 };
    form.reset(toFormValues(empty));
    onChange(empty);
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="w-[120px]">
        <AuthFormField
          id="user_id"
          label="用户 ID"
          type="number"
          placeholder="数字"
          {...form.register("user_id", { valueAsNumber: true })}
        />
      </div>
      <div className="w-[160px]">
        <AuthFormField id="action" label="操作" placeholder="如 login" {...form.register("action")} />
      </div>
      <div className="w-[160px]">
        <AuthFormField
          id="resource"
          label="资源"
          placeholder="如 user"
          {...form.register("resource")}
        />
      </div>
      <div className="w-[120px]">
        <label htmlFor="success" className="mb-1.5 block text-xs text-muted-foreground">
          结果
        </label>
        <Select id="success" {...form.register("success")} className={selectClass}>
          {SUCCESS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
      <div className="w-[180px]">
        <AuthFormField
          id="start_time"
          label="开始时间"
          type="datetime-local"
          {...form.register("start_time")}
        />
      </div>
      <div className="w-[180px]">
        <AuthFormField
          id="end_time"
          label="结束时间"
          type="datetime-local"
          {...form.register("end_time")}
        />
      </div>
      <Button type="submit" className="h-11">搜索</Button>
      <Button type="button" variant="outline" onClick={reset} className="h-11">重置</Button>
    </form>
  );
}
