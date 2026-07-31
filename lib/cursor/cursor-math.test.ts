import {
  resolveLockTarget,
  bracketCorners,
  tightRect,
  lerp,
} from "./cursor-math";

describe("resolveLockTarget", () => {
  it("returns the closest interactive ancestor", () => {
    document.body.innerHTML = `<button><span id="inner">hi</span></button>`;
    const inner = document.getElementById("inner")!;
    expect(resolveLockTarget(inner)?.tagName).toBe("BUTTON");
  });

  it("matches data-cursor-target on non-interactive elements", () => {
    document.body.innerHTML = `<div data-cursor-target><span id="inner">x</span></div>`;
    const inner = document.getElementById("inner")!;
    expect(resolveLockTarget(inner)).not.toBeNull();
  });

  it("does not lock text-editing controls", () => {
    document.body.innerHTML = `<div data-cursor-target><input id="input" /><textarea id="textarea"></textarea><span contenteditable="true" id="editable">x</span></div>`;
    expect(resolveLockTarget(document.getElementById("input"))).toBeNull();
    expect(resolveLockTarget(document.getElementById("textarea"))).toBeNull();
    expect(resolveLockTarget(document.getElementById("editable"))).toBeNull();
  });

  it("returns null for non-interactive targets and non-elements", () => {
    document.body.innerHTML = `<div><span id="inner">x</span></div>`;
    expect(resolveLockTarget(document.getElementById("inner"))).toBeNull();
    expect(resolveLockTarget(null)).toBeNull();
    expect(resolveLockTarget(document)).toBeNull();
  });
});

describe("bracketCorners", () => {
  it("expands the rect by pad on every corner", () => {
    expect(bracketCorners({ x: 10, y: 20, width: 100, height: 40 }, 4)).toEqual({
      tl: { x: 6, y: 16 },
      tr: { x: 114, y: 16 },
      bl: { x: 6, y: 64 },
      br: { x: 114, y: 64 },
    });
  });
});

describe("tightRect", () => {
  it("centers a square on the pointer", () => {
    expect(tightRect(50, 60, 8)).toEqual({ x: 46, y: 56, width: 8, height: 8 });
  });
});

describe("lerp", () => {
  it("interpolates", () => {
    expect(lerp(0, 10, 0.3)).toBeCloseTo(3);
  });
});
