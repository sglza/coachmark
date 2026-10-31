import { useState } from "react";
import { CoachmarkExample } from "./components/coachmark-example";
import { CompositionDemo } from "./components/composition/composition-demo";
import { CodePreview } from "./components/code-preview";
import { ConfigControls } from "./components/config-controls";
import { DEFAULT_CONFIG } from "./playground-config";
import type { PlaygroundConfig, StylingMode } from "./playground-types";

export function PlaygroundApp() {
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG);
  const [sessionKey, setSessionKey] = useState(0);
  const [stylingMode, setStylingMode] = useState<StylingMode>("css-modules");

  const changeStylingMode = (mode: StylingMode) => {
    setStylingMode(mode);
    setSessionKey((current) => current + 1);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8 sm:px-10">
      <header className="mb-8 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <strong className="text-sm">Coachmark</strong>
          <span className="text-muted-foreground text-xs">playground</span>
        </div>
        <code className="text-muted-foreground text-[10px]">dist/index.js</code>
      </header>

      <ConfigControls
        config={config}
        onChange={setConfig}
        onStylingModeChange={changeStylingMode}
        stylingMode={stylingMode}
      />

      <div className="flex min-h-[560px] items-center py-16">
        <CoachmarkExample
          config={config}
          sessionKey={sessionKey}
          stylingMode={stylingMode}
        />
      </div>

      <CompositionDemo />

      <CodePreview
        config={config}
        onStylingModeChange={changeStylingMode}
        stylingMode={stylingMode}
      />
    </main>
  );
}
