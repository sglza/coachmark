import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { CodePreview } from "../dev/components/code-preview";
import {
  CSS_SOURCE,
  createTsxSource,
} from "../dev/code-preview-source";
import { DEFAULT_CONFIG } from "../dev/playground-config";
import type { StylingMode } from "../dev/playground-types";

function CodePreviewFixture() {
  const [stylingMode, setStylingMode] =
    useState<StylingMode>("css-modules");

  return (
    <CodePreview
      config={DEFAULT_CONFIG}
      onStylingModeChange={setStylingMode}
      stylingMode={stylingMode}
    />
  );
}

describe("CodePreview", () => {
  it("keeps the styling selector and available source tabs in sync", async () => {
    const user = userEvent.setup();
    const { container } = render(<CodePreviewFixture />);

    expect(screen.getByRole("tab", { name: "tour.tsx" })).toBeVisible();
    expect(
      screen.getByRole("tab", { name: "tour.module.css" }),
    ).toBeVisible();
    expect(screen.getByRole("tabpanel")).toHaveTextContent('side="bottom"');

    await user.click(
      screen.getByRole("tab", { name: "tour.module.css" }),
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(".Popup");

    await user.click(screen.getByRole("combobox", { name: "Styling" }));
    await user.click(screen.getByRole("option", { name: "Tailwind" }));

    expect(
      screen.queryByRole("tab", { name: "tour.module.css" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "tour.tsx" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("fixed inset-0");
    await waitFor(() => {
      expect(container.querySelector(".pl-k")).toBeInTheDocument();
    });
  });

  it("generates consistently nested TSX source", () => {
    const source = createTsxSource(DEFAULT_CONFIG, "css-modules");

    expect(source).toContain('import styles from "./tour.module.css";');

    expect(source).toContain(`    <Coachmark.Root
      allowTargetInteraction
      modal
      resetOnOpen
    >`);
    expect(source).toContain(`      <Coachmark.Step
        spotlightPadding={8}
        spotlightRadius={12}
        target={targetRef}
      >
        <Coachmark.Positioner
          align="center"
          alignOffset={0}
          side="bottom"
          sideOffset={20}`);
    expect(source).toContain(`          <Coachmark.Popup
            className={[
              styles.Popup,
              styles.sizeMedium,
              styles.transitionMove,
              styles.withViewport,
            ].join(" ")}
          >
            <Coachmark.Viewport
              className={styles.Viewport}
            >
              <div
                className={styles.Content}
              >`);
    expect(source).toContain(`        <Coachmark.Positioner
          align="center"
          alignOffset={0}
          side="bottom"
          sideOffset={20}
          className={[
            styles.Positioner,
            styles.transitionMove,
            styles.withViewport,
          ].join(" ")}`);
  });

  it("previews the complete stylesheet used by the CSS Module strategy", () => {
    expect(CSS_SOURCE).toContain(".Popup.sizeCompact");
    expect(CSS_SOURCE).toContain(".transitionFade");
    expect(CSS_SOURCE).toContain(".transitionNone");
    expect(CSS_SOURCE).toContain(".transitionViewportOnly");
    expect(CSS_SOURCE).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("generates a viewport-only diagnostic with static outer parts", () => {
    const config = {
      ...DEFAULT_CONFIG,
      transition: "viewport-only" as const,
    };
    const cssModulesSource = createTsxSource(config, "css-modules");
    const tailwindSource = createTsxSource(config, "tailwind");

    expect(cssModulesSource).toContain("styles.transitionViewportOnly");
    expect(cssModulesSource).toContain("styles.withViewport");
    expect(cssModulesSource).toContain("<Coachmark.Viewport");
    expect(tailwindSource).toContain("[transition:none]");
    expect(tailwindSource).toContain("<Coachmark.Viewport");
    expect(tailwindSource).toContain(
      "[&>[data-current]]:[transition:opacity_240ms_ease-in-out,transform_240ms_ease-in-out]",
    );
    expect(tailwindSource).not.toContain(
      "[transition:top_240ms_ease-in-out,left_240ms_ease-in-out,transform_240ms_ease-in-out,opacity_180ms_ease-out]",
    );
  });

  it("aligns wrapped Tailwind class lists with their JSX props", () => {
    const source = createTsxSource(DEFAULT_CONFIG, "tailwind");

    expect(source).toMatch(
      /^ {12}className=\{\[\n {14}"relative flex box-border/m,
    );
    expect(source).toMatch(/^ {12}\]\.join\(" "\)\}/m);
    expect(source).toContain(
      "data-[ending-style]:[transform:scale(0.97)]",
    );
    expect(source).toContain("data-[ending-style]:opacity-0");
    expect(source).toContain(
      "data-[ending-style]:[transition-timing-function:ease-out]",
    );
    expect(source).toContain(
      "[&>[data-current]]:[transition:opacity_240ms_ease-in-out,transform_240ms_ease-in-out]",
    );
    expect(source).toContain(
      "[&>[data-current][data-starting-style]]:[transform:translate(var(--coachmark-current-x),var(--coachmark-current-y))]",
    );
  });

  it.each([
    ["fade", "transitionFade", "[transition:opacity_180ms_ease-out]"],
    [
      "move",
      "transitionMove",
      "[transition:opacity_180ms_ease-out,transform_180ms_ease-out]",
    ],
    ["none", "transitionNone", "[transition:none]"],
    [
      "viewport-only",
      "transitionViewportOnly",
      "[transition:none]",
    ],
  ] as const)(
    "keeps the %s transition equivalent in both generated strategies",
    (transition, moduleClass, tailwindClass) => {
      const config = { ...DEFAULT_CONFIG, transition, viewport: false };

      expect(createTsxSource(config, "css-modules")).toContain(
        `styles.${moduleClass}`,
      );
      expect(createTsxSource(config, "tailwind")).toContain(tailwindClass);
    },
  );
});
