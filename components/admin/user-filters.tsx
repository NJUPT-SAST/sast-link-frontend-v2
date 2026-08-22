"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { AdminUserListParams } from "@/lib/api/types";
import { adminUserFiltersSchema, type AdminUserFiltersFormValues } from "@/lib/validations/admin";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/list-query";
import { cn } from "@/lib/utils";
import { DEPARTMENT_LABELS } from "@/lib/constants/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FilterDrawer } from "@/components/admin/filter-drawer";

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

// Every control in the filter row shares one height/label rhythm so the row
// stays aligned; AuthFormField cannot be used here because it hardcodes a taller
// h-12 input and a different label size.
const controlClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-[15px] placeholder:text-tertiary focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";
const selectClass = cn(controlClass, "appearance-none");
const labelClass = "mb-1.5 block text-xs text-muted-foreground";
// At xl the buttons sit next to labelled controls, so they need the label's height
// (text-xs line-height 16px + mb-1.5 6px) as top margin to line up. On mobile
// there is no label above them, so no offset.
const buttonRowClass = "h-11 flex-1 xl:mt-[22px] xl:flex-none";

// Below xl the secondary filters collapse into FilterDrawer, so the row is a
// simple column; from xl it becomes one grid row where the six filters share what
// is left after the two auto-sized buttons, keeping 搜索/重置 on the same line.
// Track count must match the children present at xl: 关键词 (always visible) + the
// five collapsible fields + two buttons. The toggle is xl:hidden (display:none, so
// it leaves the grid flow) and the panel/actions wrappers are xl:contents.
const rowClass =
  "xl:grid xl:items-start xl:gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_auto_auto]";
// Fixed widths would fight the flex column on mobile and the tracks at xl, so the
// fields are full-width and let the layout decide.
const fieldClass = "w-full";

function toFormValues(params: AdminUserListParams): AdminUserFiltersFormValues {
  return {
    page: params.page ?? 1,
    page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
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
    // A new search always starts at page 1, but the chosen page size is a display
    // preference and survives filter changes.
    page: 1,
    page_size: values.page_size ?? DEFAULT_PAGE_SIZE,
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
    const empty: AdminUserListParams = {
      page: 1,
      page_size: form.getValues("page_size") ?? DEFAULT_PAGE_SIZE,
    };
    form.reset(toFormValues(empty));
    onChange(empty);
  };

  // The badge on the collapsed toggle must reflect exactly the fields inside the
  // panel — 关键词 stays visible, so it is not counted.
  const collapsed = useWatch({ control: form.control });
  const activeCount = [
    collapsed?.role,
    collapsed?.state,
    collapsed?.department,
    collapsed?.needs_completion,
    collapsed?.student_id?.trim(),
  ].filter(Boolean).length;

  return (
    <form onSubmit={submit}>
      <FilterDrawer
        rowClass={rowClass}
        activeCount={activeCount}
        lead={
          <div className={fieldClass}>
            <label htmlFor="keyword" className={labelClass}>
              关键词
            </label>
            <input
              id="keyword"
              type="text"
              placeholder="姓名 / 学号 / 邮箱"
              className={controlClass}
              {...form.register("keyword")}
            />
          </div>
        }
        actions={
          <div className="flex gap-3 xl:contents">
            <Button type="submit" className={buttonRowClass}>搜索</Button>
            <Button type="button" variant="outline" onClick={reset} className={buttonRowClass}>重置</Button>
          </div>
        }
      >
        <div className={fieldClass}>
          <label htmlFor="role" className={labelClass}>
            角色
          </label>
          <Select id="role" {...form.register("role")} className={selectClass}>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="state" className={labelClass}>
            状态
          </label>
          <Select id="state" {...form.register("state")} className={selectClass}>
            {STATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="department" className={labelClass}>
            部门
          </label>
          <Select id="department" {...form.register("department")} className={selectClass}>
            {DEPARTMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="needs_completion" className={labelClass}>
            资料状态
          </label>
          <Select id="needs_completion" {...form.register("needs_completion")} className={selectClass}>
            {COMPLETION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="student_id" className={labelClass}>
            学号
          </label>
          <input
            id="student_id"
            type="text"
            placeholder="精确匹配"
            className={controlClass}
            {...form.register("student_id")}
          />
        </div>
      </FilterDrawer>
    </form>
  );
}
