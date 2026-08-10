import { useMemo, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { createPreviewSource } from "@/dev/code-preview-source";
import { Button } from "@/dev/components/ui/button";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/dev/components/ui/select";
import { SyntaxHighlightedCode } from "@/dev/components/syntax-highlighted-code";
import type { PlaygroundConfig, StylingMode } from "../playground-types";

type CodeTab = "css" | "tsx";

type CodePreviewProps = {
  config: PlaygroundConfig;
  onStylingModeChange: (mode: StylingMode) => void;
  stylingMode: StylingMode;
};

export function CodePreview({
  config,
  onStylingModeChange,
  stylingMode,
}: CodePreviewProps) {
  const [selectedTab, setSelectedTab] = useState<CodeTab>("tsx");
  const [copied, setCopied] = useState(false);
  const activeTab = stylingMode === "tailwind" ? "tsx" : selectedTab;
  const code = useMemo(
    () => createPreviewSource(activeTab, config, stylingMode),
    [activeTab, config, stylingMode],
  );

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="pb-16" aria-labelledby="composition-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
            Implementation anatomy
          </p>
          <h2 className="mt-1 text-base font-semibold" id="composition-heading">
            Component composition
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl text-xs leading-5">
            The code follows the playground settings and uses the selected
            styling approach.
          </p>
        </div>

        <label className="grid gap-1.5">
          <span className="text-muted-foreground text-[11px]">Styling</span>
          <Select
            onValueChange={(value) =>
              onStylingModeChange(value as StylingMode)
            }
            value={stylingMode}
          >
            <SelectTrigger className="w-32" size="sm">
              <SelectValue>
                {(value) =>
                  value === "tailwind" ? "Tailwind" : "CSS Modules"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="css-modules">CSS Modules</SelectItem>
              <SelectItem value="tailwind">Tailwind</SelectItem>
            </SelectPopup>
          </Select>
        </label>
      </div>

      <div className="border-border overflow-hidden rounded-xl border bg-[#fbfbfb] shadow-xs">
        <div className="border-border flex min-h-11 items-center justify-between border-b bg-white px-2">
          <div aria-label="Code files" className="flex self-stretch" role="tablist">
            <CodeTabButton
              active={activeTab === "tsx"}
              id="composition-tsx-tab"
              label="tour.tsx"
              onClick={() => setSelectedTab("tsx")}
            />
            {stylingMode === "css-modules" ? (
              <CodeTabButton
                active={activeTab === "css"}
                id="composition-css-tab"
                label="tour.module.css"
                onClick={() => setSelectedTab("css")}
              />
            ) : null}
          </div>
          <Button
            aria-label={copied ? "Code copied" : "Copy code"}
            onClick={copyCode}
            size="icon-xs"
            variant="ghost"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>

        <pre
          aria-label={`${activeTab.toUpperCase()} source code`}
          aria-labelledby={`composition-${activeTab}-tab`}
          className="max-h-[34rem] overflow-auto p-4 text-[12px] leading-5 [tab-size:2]"
          id="composition-code-panel"
          role="tabpanel"
          tabIndex={0}
        >
          <SyntaxHighlightedCode code={code} language={activeTab} />
        </pre>
      </div>
    </section>
  );
}

function CodeTabButton({
  active,
  id,
  label,
  onClick,
}: {
  active: boolean;
  id: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      aria-controls="composition-code-panel"
      className="text-muted-foreground hover:text-foreground aria-selected:text-foreground relative px-3 text-xs font-medium outline-none after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-selected:after:bg-foreground"
      id={id}
      onClick={onClick}
      role="tab"
      tabIndex={active ? 0 : -1}
      type="button"
    >
      {label}
    </button>
  );
}
