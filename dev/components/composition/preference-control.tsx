import { useState } from "react";
import { Coachmark, type CoachmarkHandle } from "coachmark";
import { Button } from "../ui/button";

export function PreferenceControl({ tour }: { tour: CoachmarkHandle }) {
  const [digest, setDigest] = useState(true);
  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">Preferences</h3>
      <Coachmark.Target
        handle={tour}
        name="action"
        render={
          <Button
            variant="outline"
            aria-label="Toggle email digest"
            aria-pressed={digest}
            onClick={() => setDigest((current) => !current)}
          />
        }
      >
        Email digest: {digest ? "On" : "Off"}
      </Coachmark.Target>
      <p className="text-muted-foreground text-xs" role="status">
        Digest {digest ? "enabled" : "disabled"}
      </p>
    </div>
  );
}
