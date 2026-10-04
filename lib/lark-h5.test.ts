import {
  isLarkUserAgent,
  requestLarkAppCode,
  waitLarkH5Ready,
} from "./lark-h5";

const LARK_SDK_URL = "https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.32.js";

/** Intercept the injected <script> without touching the real document.head:
 *  the test drives onload/onerror manually. */
function makeScriptControls() {
  const scripts: HTMLScriptElement[] = [];
  const createElement = document.createElement.bind(document);
  jest.spyOn(document, "createElement").mockImplementation((tag: string) =>
    createElement(tag),
  );
  jest
    .spyOn(document.head, "appendChild")
    .mockImplementation((node: Node) => {
      if (node instanceof HTMLScriptElement) scripts.push(node);
      return node;
    });
  return {
    lastScript: () => scripts[scripts.length - 1],
  };
}

describe("lib/lark-h5", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    delete (window as { h5sdk?: unknown }).h5sdk;
    delete (window as { tt?: unknown }).tt;
  });

  describe("isLarkUserAgent", () => {
    it("recognizes Feishu and Lark webview UAs in either casing", () => {
      expect(isLarkUserAgent("Mozilla/5.0 ... Lark/6.11.6")).toBe(true);
      expect(isLarkUserAgent("Mozilla/5.0 ... Feishu/7.3.0")).toBe(true);
      expect(isLarkUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/126.0")).toBe(false);
      expect(isLarkUserAgent("")).toBe(false);
    });
  });

  describe("loadLarkH5Sdk", () => {
    // The loader memoizes its promise at module scope; isolate a fresh module
    // instance per test so a prior test's memo cannot leak in.
    async function freshLoadLarkH5Sdk() {
      let load: typeof import("./lark-h5")["loadLarkH5Sdk"];
      await jest.isolateModulesAsync(async () => {
        ({ loadLarkH5Sdk: load } = await import("./lark-h5"));
      });
      return load!;
    }

    it("injects the JSSDK script and resolves on load", async () => {
      const controls = makeScriptControls();
      const load = await freshLoadLarkH5Sdk();

      const promise = load();
      const script = controls.lastScript();
      expect(script?.src).toBe(LARK_SDK_URL);
      script?.onload?.(new Event("load"));

      await expect(promise).resolves.toBeUndefined();
    });

    it("rejects on script error and allows a fresh retry", async () => {
      const controls = makeScriptControls();
      const load = await freshLoadLarkH5Sdk();

      const first = load();
      controls.lastScript()?.onerror?.(new Event("error"));
      await expect(first).rejects.toThrow("无法加载飞书 JSSDK");

      const second = load();
      controls.lastScript()?.onload?.(new Event("load"));
      await expect(second).resolves.toBeUndefined();
    });
  });

  describe("waitLarkH5Ready", () => {
    it("rejects immediately when h5sdk is absent", async () => {
      await expect(waitLarkH5Ready(50)).rejects.toThrow("飞书环境不可用");
    });

    it("resolves when the bridge fires ready", async () => {
      let readyCallback: (() => void) | undefined;
      (window as { h5sdk?: unknown }).h5sdk = {
        ready: (cb: () => void) => {
          readyCallback = cb;
        },
      };

      const promise = waitLarkH5Ready(50);
      readyCallback?.();

      await expect(promise).resolves.toBeUndefined();
    });

    it("times out when the bridge never fires ready", async () => {
      jest.useFakeTimers();
      try {
        (window as { h5sdk?: unknown }).h5sdk = { ready: () => {} };

        const promise = waitLarkH5Ready(1000);
        jest.advanceTimersByTime(1001);

        await expect(promise).rejects.toThrow("飞书环境初始化超时");
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("requestLarkAppCode", () => {
    it("requests via requestAccess with an empty scope list", async () => {
      const requestAccess = jest.fn(
        ({ success }: { success: (r: { code?: string }) => void }) => {
          success({ code: "pre_auth_1" });
        },
      );
      (window as { tt?: unknown }).tt = { requestAccess };

      await expect(requestLarkAppCode("cli_app")).resolves.toBe("pre_auth_1");
      expect(requestAccess).toHaveBeenCalledWith(
        expect.objectContaining({ appID: "cli_app", scopeList: [] }),
      );
    });

    it("falls back to requestAuthCode on errno 103", async () => {
      const requestAccess = jest.fn(
        ({ fail }: { fail: (e: { errno?: number }) => void }) => {
          fail({ errno: 103 });
        },
      );
      const requestAuthCode = jest.fn(
        ({ success }: { success: (r: { code?: string }) => void }) => {
          success({ code: "legacy_code" });
        },
      );
      (window as { tt?: unknown }).tt = { requestAccess, requestAuthCode };

      await expect(requestLarkAppCode("cli_app")).resolves.toBe("legacy_code");
      // The legacy API spells the id differently — appId, not appID.
      expect(requestAuthCode).toHaveBeenCalledWith(
        expect.objectContaining({ appId: "cli_app" }),
      );
    });

    it("goes straight to requestAuthCode when requestAccess is missing", async () => {
      const requestAuthCode = jest.fn(
        ({ success }: { success: (r: { code?: string }) => void }) => {
          success({ code: "legacy_code" });
        },
      );
      (window as { tt?: unknown }).tt = { requestAuthCode };

      await expect(requestLarkAppCode("cli_app")).resolves.toBe("legacy_code");
    });

    it("rejects when neither JSAPI exists", async () => {
      (window as { tt?: unknown }).tt = {};
      await expect(requestLarkAppCode("cli_app")).rejects.toThrow(
        "飞书客户端不支持免登录",
      );
    });

    it("rejects on a non-103 requestAccess failure", async () => {
      const requestAccess = jest.fn(
        ({ fail }: { fail: (e: { errno?: number }) => void }) => {
          fail({ errno: 1 });
        },
      );
      (window as { tt?: unknown }).tt = { requestAccess };

      await expect(requestLarkAppCode("cli_app")).rejects.toThrow("未获得飞书授权");
    });

    it("rejects when no code comes back", async () => {
      const requestAccess = jest.fn(
        ({ success }: { success: (r: { code?: string }) => void }) => {
          success({});
        },
      );
      (window as { tt?: unknown }).tt = { requestAccess };

      await expect(requestLarkAppCode("cli_app")).rejects.toThrow("飞书未返回授权码");
    });
  });
});
