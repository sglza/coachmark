import { memo, useEffect, useMemo, useState } from "react";

import type { CodeLanguage } from "../code-preview-source";

type CreateStarryNight =
  typeof import("@/dev/lib/starry-night")["createStarryNight"];
type StarryNight = Awaited<ReturnType<CreateStarryNight>>;
type HighlightTree = ReturnType<StarryNight["highlight"]>;
type HighlightNode = HighlightTree["children"][number];
type HighlightState = {
  cacheKey: string;
  tree: HighlightTree | null;
};

const HIGHLIGHT_CACHE_LIMIT = 24;
const highlightCache = new Map<string, HighlightTree>();
let starryNightPromise: Promise<StarryNight> | undefined;

const languageScopes: Record<CodeLanguage, "source.css" | "source.tsx"> = {
  css: "source.css",
  tsx: "source.tsx",
};

export const SyntaxHighlightedCode = memo(function SyntaxHighlightedCode({
  code,
  language,
}: {
  code: string;
  language: CodeLanguage;
}) {
  const cacheKey = `${language}\u0000${code}`;
  const [highlightState, setHighlightState] = useState<HighlightState | null>(
    () => {
      const tree = highlightCache.get(cacheKey);
      return tree ? { cacheKey, tree } : null;
    },
  );
  const highlightReady = highlightState?.cacheKey === cacheKey;
  const activeTree = highlightReady ? highlightState.tree : null;

  useEffect(() => {
    const cachedTree = highlightCache.get(cacheKey);
    if (cachedTree) {
      setHighlightState({ cacheKey, tree: cachedTree });
      return;
    }

    let cancelled = false;
    getStarryNight()
      .then((starryNight) => {
        if (cancelled) return;

        const tree = starryNight.highlight(code, languageScopes[language]);
        rememberHighlight(cacheKey, tree);
        setHighlightState({ cacheKey, tree });
      })
      .catch(() => {
        if (!cancelled) setHighlightState({ cacheKey, tree: null });
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, code, language]);

  const highlightedCode = useMemo(
    () => activeTree?.children.map((node, index) => renderNode(node, `${index}`)),
    [activeTree],
  );

  return (
    <code aria-busy={highlightReady ? undefined : true}>
      {activeTree ? highlightedCode : code}
    </code>
  );
});

function getStarryNight() {
  starryNightPromise ??= Promise.all([
    import("@/dev/lib/starry-night"),
    import("@wooorm/starry-night/source.tsx"),
    import("@wooorm/starry-night/source.css"),
  ]).then(([starryNight, tsx, css]) =>
    starryNight.createStarryNight([tsx.default, css.default]),
  );

  return starryNightPromise;
}

function rememberHighlight(cacheKey: string, tree: HighlightTree) {
  if (highlightCache.size >= HIGHLIGHT_CACHE_LIMIT) {
    const oldestKey = highlightCache.keys().next().value;
    if (oldestKey) highlightCache.delete(oldestKey);
  }
  highlightCache.set(cacheKey, tree);
}

function renderNode(node: HighlightNode, key: string): React.ReactNode {
  if (node.type === "text") return node.value;
  if (node.type !== "element") return null;

  const className = Array.isArray(node.properties.className)
    ? node.properties.className.join(" ")
    : String(node.properties.className ?? "");

  return (
    <span className={className || undefined} key={key}>
      {node.children.map((child, index) =>
        renderNode(child, `${key}-${index}`),
      )}
    </span>
  );
}
