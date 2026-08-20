import { PhotoGlyphs } from "@/components/visual/photo-glyphs";

/** Character-photo block: a centered halftone dot-field of the logo. The
 *  canvas and section are transparent so the page's own backdrop shows
 *  through between the dots. */
export function PhotoGlyphsSection() {
  return (
    <section
      aria-hidden="true"
      className="relative flex min-h-screen items-center justify-center"
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center px-6 py-16">
        <PhotoGlyphs className="block w-full" />
      </div>
    </section>
  );
}
