import { fireEvent, render, screen } from "@testing-library/react";

import { DatePickerField } from "./date-picker-field";

// 固定到 2026 年 6 月，保证日期数字/可访问名唯一、不受“今天”影响
const JUNE_2026 = new Date(2026, 5, 1);

describe("DatePickerField", () => {
  it("shows a placeholder when empty", () => {
    render(<DatePickerField id="t" label="结束日期" onChange={jest.fn()} />);
    expect(screen.getByText("选择日期")).toBeInTheDocument();
  });

  it("shows the chosen date instead of the placeholder", () => {
    render(
      <DatePickerField
        id="t"
        label="开始日期"
        value="2026-06-15T00:00:00+08:00"
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("2026-06-15")).toBeInTheDocument();
    expect(screen.queryByText("选择日期")).not.toBeInTheDocument();
  });

  it("opens a calendar popover on click", () => {
    render(<DatePickerField id="t" label="结束日期" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "结束日期" }));
    expect(document.querySelector('[data-slot="calendar"]')).not.toBeNull();
  });

  it("picks a day and reports an RFC3339 local-midnight value", () => {
    const onChange = jest.fn();
    render(
      <DatePickerField
        id="t"
        label="开始日期"
        defaultMonth={JUNE_2026}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "开始日期" }));
    // day button 的可访问名来自 react-day-picker 的 labelDayButton（如 "Wednesday, June 15th, 2026"）
    fireEvent.click(screen.getByRole("button", { name: /june 15/i }));

    const reported = onChange.mock.calls[0][0] as string;
    expect(reported).toMatch(/^2026-06-15T00:00:00[+-]\d{2}:\d{2}$/);
  });

  it("endOfDay reports the next-day boundary but displays the picked day", () => {
    const onChange = jest.fn();
    render(
      <DatePickerField
        id="t"
        label="结束日期"
        endOfDay
        defaultMonth={JUNE_2026}
        value="2026-06-16T00:00:00+08:00"
        onChange={onChange}
      />,
    );
    // 值存的是次日边界，显示应回退为用户所选日
    expect(screen.getByText("2026-06-15")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "结束日期" }));
    fireEvent.click(screen.getByRole("button", { name: /june 17/i }));

    expect(onChange.mock.calls[0][0]).toMatch(/^2026-06-18T00:00:00[+-]\d{2}:\d{2}$/);
  });

  it("clears via the trailing icon", () => {
    const onClear = jest.fn();
    render(
      <DatePickerField
        id="t"
        label="结束日期"
        value="2026-06-15T00:00:00+08:00"
        onChange={jest.fn()}
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByLabelText("清除日期"));
    expect(onClear).toHaveBeenCalled();
  });

  it("reopens on the month of the last picked day instead of the current month", () => {
    render(
      <DatePickerField
        id="t"
        label="开始日期"
        defaultMonth={JUNE_2026}
        onChange={jest.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: "开始日期" });

    fireEvent.click(trigger); // 打开（初始显示 6 月）
    fireEvent.click(screen.getByRole("button", { name: /june 15/i }));
    fireEvent.click(trigger); // 关闭
    fireEvent.click(trigger); // 再次打开

    expect(screen.getByText(/june 2026/i)).toBeInTheDocument();
  });

  it("does not report a day before minDate", () => {
    const onChange = jest.fn();
    render(
      <DatePickerField
        id="t"
        label="结束日期"
        defaultMonth={JUNE_2026}
        minDate={new Date(2026, 5, 10)}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "结束日期" }));
    fireEvent.click(screen.getByRole("button", { name: /june 8/i }));

    expect(onChange).not.toHaveBeenCalled();
  });
});