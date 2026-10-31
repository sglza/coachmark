import { useState } from "react";
import { Coachmark, type CoachmarkHandle } from "coachmark";
import { Button } from "../ui/button";

export function WorkspaceControls({ tour }: { tour: CoachmarkHandle }) {
  const [view, setView] = useState("List");
  const [completed, setCompleted] = useState(false);
  return (
    <Coachmark.Target
      handle={tour}
      name="view"
      render={<section aria-label="Workspace controls" />}
      className="grid gap-3 rounded-lg border p-4"
    >
      <h3 className="text-sm font-medium">Workspace</h3>
      <Button
        variant="outline"
        aria-label="Switch workspace view"
        onClick={() =>
          setView((current) => (current === "List" ? "Board" : "List"))
        }
      >
        View: {view}
      </Button>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={completed}
          onChange={(event) => setCompleted(event.target.checked)}
        />
        Show completed items
      </label>
      <div
        aria-label="Workspace items"
        role="region"
        tabIndex={0}
        className="max-h-24 overflow-auto rounded border p-2 text-xs"
      >
        <ul className="grid gap-3">
          {Array.from({ length: 24 }, (_, index) => (
            <li key={index}>Workspace item {index + 1}</li>
          ))}
        </ul>
      </div>
      <p className="text-muted-foreground text-xs" role="status">
        Current view: {view}
      </p>
    </Coachmark.Target>
  );
}
