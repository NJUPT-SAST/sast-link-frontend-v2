"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { AdminAuditLogListParams } from "@/lib/api/types";
import {
  adminAuditLogFiltersSchema,
  type AdminAuditLogFiltersFormValues,
} from "@/lib/validations/admin";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
} from "@/lib/constants/admin";
import { cn } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/list-query";
import { toLocalVisibleDay } from "@/lib/admin/date-time";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DatePickerField } from "@/components/admin/date-picker-field";
import { FilterDrawer } from "@/components/admin/filter-drawer";

interface AuditLogFiltersProps {
  value: AdminAuditLogListParams;
  onChange: (filters: AdminAuditLogListParams) => void;
}

const SUCCESS_OPTIONS = [
  { value: "", label: "全部" },
  { value: "true", label: "成功" },
  { value: "false", label: "失败" },
];

const ACTION_OPTIONS = [
  { value: "", label: "全部操作" },
  ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label })),
];

const RESOURCE_OPTIONS = [
  { value: "", label: "全部资源" },
  ...Object.entries(AUDIT_RESOURCE_LABELS).map(([value, label]) => ({ value, label })),
];

// Shared by every control in the filter row so the row keeps one height/label
// rhythm (DatePickerField matches it too).
const controlClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-[15px] placeholder:text-tertiary focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25";
const selectClass = cn(controlClass, "appearance-none");
const labelClass = "mb-1.5 block text-xs text-muted-foreground";
// At xl the buttons sit next to labelled controls, so they need the label's height
// (text-xs line-height 16px + mb-1.5 6px) as top margin to line up. On mobile
// there is no label above them, so no offset.
const buttonRowClass = "h-11 flex-1 xl:mt-[22px] xl:flex-none";

// Below xl every filter collapses into FilterDrawer (this row has no keyword box
// to keep visible), so the row is a simple column; from xl it becomes one grid row
// where the six filters share what is left after the two auto-sized buttons.
// Track count must match the children present at xl: 6 fields + 2 buttons. The
// toggle is xl:hidden (display:none, so it leaves the grid flow) and the panel and
// actions wrappers are xl:contents. The date pickers get wider tracks (they hold a
// date plus a clear button).
const rowClass =
  "xl:grid xl:items-start xl:gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_auto_auto]";
// Fixed widths would fight the flex column on mobile and the tracks at xl, so the
// fields are full-width and let the layout decide.
const fieldClass = "w-full";



function toFormValues(params: AdminAuditLogListParams): AdminAuditLogFiltersFormValues {
  return {
    page: params.page ?? 1,
    page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
    user_id: params.user_id === undefined ? "" : String(params.user_id),
    action: params.action ?? "",
    resource: params.resource ?? "",
    success: params.success === undefined ? "" : params.success ? "true" : "false",
    start_time: params.start_time ?? "",
    end_time: params.end_time ?? "",
  };
}

function toParams(values: AdminAuditLogFiltersFormValues): AdminAuditLogListParams {
  return {
    // A new search restarts at page 1; the page size is a display preference and
    // survives filter changes.
    page: 1,
    page_size: values.page_size ?? DEFAULT_PAGE_SIZE,
    user_id: values.user_id ? Number(values.user_id) : undefined,
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

  const errors = form.formState.errors;

  useEffect(() => {
    form.reset(toFormValues(value));
  }, [value, form]);

  const submit = form.handleSubmit((values) => {
    onChange(toParams(values));
  });

  const reset = () => {
    const empty: AdminAuditLogListParams = {
      page: 1,
      page_size: form.getValues("page_size") ?? DEFAULT_PAGE_SIZE,
    };
    form.reset(toFormValues(empty));
    onChange(empty);
  };

  const startTime = useWatch({ control: form.control, name: "start_time" });
  const endTime = useWatch({ control: form.control, name: "end_time" });
  const watched = useWatch({ control: form.control });

  // 开始日期 X 存 X 00:00；结束日期 Y 存 (Y+1) 00:00（右开边界，含 Y 全天）。
  // 互锁禁用都用“用户所选日”比较。
  const startDay = toLocalVisibleDay(startTime, false);
  const endDay = toLocalVisibleDay(endTime, true);

  /** 日历选择后即时生效，无需再点“搜索”。 */
  const applyAndNotify = () => {
    void form.handleSubmit((values) => onChange(toParams(values)))();
  };

  // Every field lives in the collapsed panel here, so the badge counts them all.
  const activeCount = [
    watched?.user_id?.toString().trim(),
    watched?.action,
    watched?.resource,
    watched?.success,
    watched?.start_time,
    watched?.end_time,
  ].filter(Boolean).length;

  return (
    <form onSubmit={submit}>
      <FilterDrawer
        rowClass={rowClass}
        activeCount={activeCount}
        actions={
          <div className="flex gap-3 xl:contents">
            <Button type="submit" className={buttonRowClass}>搜索</Button>
            <Button type="button" variant="outline" onClick={reset} className={buttonRowClass}>重置</Button>
          </div>
        }
      >
        <div className={fieldClass}>
          <label htmlFor="user_id" className={labelClass}>
            用户 ID
          </label>
          <input
            id="user_id"
            type="number"
            placeholder="数字"
            aria-invalid={Boolean(errors.user_id)}
            className={cn(
              controlClass,
              errors.user_id && "border-destructive focus-visible:border-destructive",
            )}
            {...form.register("user_id")}
          />
          {errors.user_id ? (
            <p className="mt-1 min-h-4 text-xs text-destructive">{errors.user_id.message}</p>
          ) : null}
        </div>
        <div className={fieldClass}>
          <label htmlFor="action" className={labelClass}>
            操作
          </label>
          <Select id="action" {...form.register("action")} className={selectClass}>
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="resource" className={labelClass}>
            资源
          </label>
          <Select id="resource" {...form.register("resource")} className={selectClass}>
            {RESOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="success" className={labelClass}>
            结果
          </label>
          <Select id="success" {...form.register("success")} className={selectClass}>
            {SUCCESS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className={fieldClass}>
          <DatePickerField
            id="start_time"
            label="开始日期"
            value={startTime}
            maxDate={endDay}
            onChange={(value) => {
              form.setValue("start_time", value, { shouldValidate: true });
              applyAndNotify();
            }}
            onClear={() => {
              form.setValue("start_time", "", { shouldValidate: true });
              applyAndNotify();
            }}
          />
        </div>
        <div className={fieldClass}>
          <DatePickerField
            id="end_time"
            label="结束日期"
            value={endTime}
            endOfDay
            minDate={startDay}
            invalid={Boolean(errors.end_time)}
            error={errors.end_time?.message}
            onChange={(value) => {
              form.setValue("end_time", value, { shouldValidate: true });
              applyAndNotify();
            }}
            onClear={() => {
              form.setValue("end_time", "", { shouldValidate: true });
              applyAndNotify();
            }}
          />
        </div>
      </FilterDrawer>
    </form>
  );
}
