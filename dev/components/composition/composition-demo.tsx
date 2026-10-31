import { useState } from "react";
import { Coachmark } from "coachmark";
import { Button } from "../ui/button";
import { WorkspaceControls } from "./workspace-controls";
import { TeamActions } from "./team-actions";
import { PreferenceControl } from "./preference-control";
import {
  PreferencesInstructions,
  TourBackdrop,
  WorkspaceInstructions,
} from "./tour-instructions";

export function CompositionDemo() {
  const [workspace] = useState(Coachmark.createHandle);
  const [preferences] = useState(Coachmark.createHandle);
  const [activeTour, setActiveTour] = useState<
    "workspace" | "preferences" | null
  >(null);
  const onOpenChange = (tour: "workspace" | "preferences", open: boolean) => {
    setActiveTour((current) =>
      open ? tour : current === tour ? null : current,
    );
  };
  return (
    <section
      aria-label="Distributed tour composition"
      className="my-12 grid gap-5 border-t pt-8"
    >
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold">1.0 composition preview</h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Target regions in separate components connect to two sibling tour
          Roots through handles. Both tours use native modal behavior. This
          example is independent of the controls above.
        </p>
        <p className="text-muted-foreground text-xs">
          The workspace tour starts with a read-only step, then enables the same
          section. Keyboard traversal between popup and target remains
          experimental.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Coachmark.Trigger handle={workspace} render={<Button />}>
          Start workspace tour
        </Coachmark.Trigger>
        <Coachmark.Trigger
          handle={preferences}
          render={<Button variant="outline" />}
        >
          Start preferences tour
        </Coachmark.Trigger>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <WorkspaceControls tour={workspace} />
        <TeamActions tour={workspace} />
        <PreferenceControl tour={preferences} />
      </div>
      <Coachmark.Root
        handle={workspace}
        modal
        open={activeTour === "workspace"}
        onOpenChange={(open) => onOpenChange("workspace", open)}
      >
        <TourBackdrop />
        <WorkspaceInstructions />
      </Coachmark.Root>
      <Coachmark.Root
        handle={preferences}
        modal
        open={activeTour === "preferences"}
        onOpenChange={(open) => onOpenChange("preferences", open)}
      >
        <TourBackdrop />
        <PreferencesInstructions />
      </Coachmark.Root>
    </section>
  );
}
