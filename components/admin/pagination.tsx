"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // The jump box is a free-text draft so intermediate states ("", "1" on the way
  // to "12") stay editable; it only turns into a page change on Enter/blur.
  const [draft, setDraft] = useState(() => String(page));
  // Adjusting state during render (instead of in an effect) is React's supported
  // way to resync a draft when the prop it mirrors changes — needed because the
  // page can also move via the arrows, a filter change, or a URL restore.
  const [lastPage, setLastPage] = useState(page);
  if (page !== lastPage) {
    setLastPage(page);
    setDraft(String(page));
  }

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(page));
      return;
    }
    // Out-of-range input clamps instead of erroring — typing 999 in a 7-page
    // list means "last page".
    const next = Math.min(Math.max(parsed, 1), totalPages);
    setDraft(String(next));
    if (next !== page) onChange(next);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-hairline py-4">
      <div className="flex items-center gap-3 text-sm text-tertiary">
        <span>
          {total === 0 ? "共 0 条" : `共 ${total} 条，第 ${start}-${end} 条`}
        </span>
        {onPageSizeChange && (
          <Select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="每页条数"
            className="h-8 rounded border border-input bg-card px-2 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="上一页"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-tertiary">
          <input
            type="text"
            inputMode="numeric"
            aria-label="跳转到页码"
            value={draft}
            onChange={(event) => {
              const raw = event.target.value.trim();
              if (raw === "" || /^\d+$/.test(raw)) setDraft(raw);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
            }}
            onBlur={commit}
            className={cn(
              "type-tech h-8 w-[5ch] rounded border border-input bg-card px-1 text-center text-sm text-foreground",
              "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
            )}
          />
          <span className="type-tech">/ {totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="下一页"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
