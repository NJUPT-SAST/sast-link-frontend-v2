"use client";

import { useState } from "react";
import { CalendarDaysIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  addDays,
  toDateInputValue,
  toLocalVisibleDay,
  toRfc3339Local,
} from "@/lib/admin/date-time";
import {
  Calendar,
} from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DatePickerFieldProps {
  id: string;
  label: string;
  /** 值形态与筛选表单保持一致：datetime-local 字符串 `YYYY-MM-DDTHH:mm`，展示取日期部分。
   *  结束日期为右开边界（次日 00:00），因此需配合 endOfDay 还原显示。 */
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  /** 结束日期模式：选某日 Y 时存 (Y+1) 00:00 右开边界（以包含 Y 当天 23:59），界面仍显示 Y。 */
  endOfDay?: boolean;
  /** 禁用早于该日期（用于结束时间不得早于开始时间）。 */
  minDate?: Date;
  /** 禁用晚于该日期（用于开始时间不得晚于结束时间）。 */
  maxDate?: Date;
  /** 初始化展示的月份（默认当前月），主要供测试注入。 */
  defaultMonth?: Date;
  invalid?: boolean;
  error?: string;
  /** 说明性小字，展示在字段下方。 */
  hint?: string;
}

const PICKER_BUTTON_CLASS =
  "h-11 w-full justify-start gap-2 rounded-lg border bg-card px-3.5 text-[15px] font-normal text-foreground shadow-none hover:bg-card hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25";

/**
 * 单日日期选择器：样弹层日历代替手动输入。
 * 开始日期：选 Y 回报 `YYYY-MM-DDT00:00`（含当日 00:00）。
 * 结束日期（endOfDay）：选 Y 回报 `(Y+1)T00:00` 右开边界（含 Y 当天至 23:59），显示仍为 Y。
 */
export function DatePickerField({
  id,
  label,
  value,
  onChange,
  onClear,
  endOfDay = false,
  minDate,
  maxDate,
  defaultMonth,
  invalid,
  error,
  hint,
}: DatePickerFieldProps) {
  const visibleDay = toLocalVisibleDay(value, endOfDay);

  // 记住最近一次点选的日期，让日历再次打开时落在那个月，而不是每次都回到当前月。
  const [lastPicked, setLastPicked] = useState<Date | undefined>(undefined);
  const initialMonth = lastPicked ?? defaultMonth;

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-[13px] text-muted-foreground">
        {label}
      </label>
      <div className="flex w-full gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              aria-label={label}
              aria-invalid={invalid}
              className={cn(
                PICKER_BUTTON_CLASS,
                "flex-1",
                invalid && "border-destructive",
              )}
            >
              <CalendarDaysIcon data-icon="inline-start" />
              <span className={cn(!value && "text-tertiary")}>
                {visibleDay ? toDateInputValue(visibleDay) : "选择日期"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              defaultMonth={initialMonth}
              selected={visibleDay}
              onSelect={(day) => {
                if (day) {
                  const picked = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate(),
                  );
                  setLastPicked(picked);
                  const boundary = endOfDay ? addDays(picked, 1) : picked;
                  onChange(toRfc3339Local(boundary));
                }
              }}
              disabled={(date) =>
                (minDate ? date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false) ||
                (maxDate ? date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : false)
              }
              autoFocus
            />
          </PopoverContent>
        </Popover>
        {value && onClear ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              // 手动清除后，下次打开日历回到当前月
              setLastPicked(undefined);
              onClear();
            }}
            aria-label="清除日期"
            title="清除日期"
            className="h-11 w-11 shrink-0"
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 min-h-4 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-4 text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}