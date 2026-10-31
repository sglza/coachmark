import { useState } from "react";
import { Coachmark, type CoachmarkHandle } from "coachmark";
import { Button } from "../ui/button";

export function WorkspaceControls({ tour }: { tour: CoachmarkHandle }) {
  const [view, setView] = useState("List");
  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">Workspace</h3>
      <Coachmark.Target
        handle={tour}
        name="view"
        render={
          <Button
            variant="outline"
            aria-label="Switch workspace view"
            onClick={() =>
              setView((current) => (current === "List" ? "Board" : "List"))
            }
          />
        }
      >
        View: {view}
      </Coachmark.Target>
      <p className="text-muted-foreground text-xs" role="status">
        Current view: {view}
      </p>
    </div>
  );
}
