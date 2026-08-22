import { fireEvent, render, screen } from "@testing-library/react";

import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("jumps to a typed page on Enter", () => {
    const onChange = jest.fn();
    render(<Pagination page={1} pageSize={20} total={200} onChange={onChange} />);

    const input = screen.getByLabelText("跳转到页码");
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("jumps on blur as well", () => {
    const onChange = jest.fn();
    render(<Pagination page={1} pageSize={20} total={200} onChange={onChange} />);

    const input = screen.getByLabelText("跳转到页码");
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clamps an out-of-range page to the last page", () => {
    const onChange = jest.fn();
    render(<Pagination page={1} pageSize={20} total={60} onChange={onChange} />);

    const input = screen.getByLabelText("跳转到页码");
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(3);
    expect(input).toHaveValue("3");
  });

  it("ignores non-numeric input and restores the current page when cleared", () => {
    const onChange = jest.fn();
    render(<Pagination page={2} pageSize={20} total={200} onChange={onChange} />);

    const input = screen.getByLabelText("跳转到页码");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveValue("2");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("2");
  });

  it("does not fire when the typed page equals the current page", () => {
    const onChange = jest.fn();
    render(<Pagination page={4} pageSize={20} total={200} onChange={onChange} />);

    const input = screen.getByLabelText("跳转到页码");
    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("resyncs the box when the page changes elsewhere", () => {
    const { rerender } = render(
      <Pagination page={1} pageSize={20} total={200} onChange={jest.fn()} />,
    );
    rerender(<Pagination page={5} pageSize={20} total={200} onChange={jest.fn()} />);

    expect(screen.getByLabelText("跳转到页码")).toHaveValue("5");
  });

  it("renders the page-size options it is given", () => {
    const onPageSizeChange = jest.fn();
    render(
      <Pagination
        page={1}
        pageSize={20}
        total={200}
        onChange={jest.fn()}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[20, 50]}
      />,
    );

    const select = screen.getByLabelText("每页条数");
    expect(select.querySelectorAll("option")).toHaveLength(2);

    fireEvent.change(select, { target: { value: "50" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
