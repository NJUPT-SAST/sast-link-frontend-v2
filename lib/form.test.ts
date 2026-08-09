import { scrollToFirstError } from "./form";

describe("scrollToFirstError", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing when there are no errors", () => {
    document.body.innerHTML = `<input id="a" />`;
    expect(() => scrollToFirstError({}, ["a"])).not.toThrow();
  });

  it("scrolls and focuses the first errored element by id", () => {
    const scrollIntoView = jest.fn();
    const focus = jest.fn();
    document.body.innerHTML = `
      <input id="a" />
      <input id="b" />
    `;
    const b = document.getElementById("b") as HTMLInputElement;
    b.scrollIntoView = scrollIntoView;
    b.focus = focus;

    scrollToFirstError({ b: { type: "required", message: "必填" } }, ["a", "b"]);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("falls back to name selector when id is missing", () => {
    const scrollIntoView = jest.fn();
    const focus = jest.fn();
    document.body.innerHTML = `<input name="c" />`;
    const c = document.querySelector("[name='c']") as HTMLInputElement;
    c.scrollIntoView = scrollIntoView;
    c.focus = focus;

    scrollToFirstError({ c: { type: "required", message: "必填" } }, ["c"]);

    expect(scrollIntoView).toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
  });

  it("skips errors that have no matching element", () => {
    document.body.innerHTML = `<input id="a" />`;
    expect(() =>
      scrollToFirstError(
        { missing: { type: "required", message: "必填" }, a: { type: "required", message: "必填" } },
        ["missing", "a"],
      ),
    ).not.toThrow();
  });
});
