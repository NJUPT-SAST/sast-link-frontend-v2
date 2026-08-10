jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

import { renderToStaticMarkup } from "react-dom/server";
import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("exports metadata used by Next.js", () => {
    expect(metadata).toMatchObject({
      title: "SAST Link",
      description: "OAuth of SAST",
    });
  });

  it("renders html/body with font variables and children", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main>content</main>
      </RootLayout>
    );

    expect(markup).toContain('<html lang="zh-CN" data-scroll-behavior="smooth">');
    expect(markup).toContain("--font-geist-sans");
    expect(markup).toContain("--font-geist-mono");
    expect(markup).toContain("antialiased");
    expect(markup).toContain("<main>content</main>");
  });

  it("marks the root html element to tolerate client theme hydration", () => {
    const tree = RootLayout({
      children: <main>content</main>,
    });

    expect(tree.props.suppressHydrationWarning).toBe(true);
  });
});
