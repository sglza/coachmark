import { useState } from "react";
import { Coachmark, type CoachmarkHandle } from "coachmark";
import { Button } from "../ui/button";

export function TeamActions({ tour }: { tour: CoachmarkHandle }) {
  const [invites, setInvites] = useState(0);
  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">Team</h3>
      <Coachmark.Target
        handle={tour}
        name="action"
        render={
          <Button
            variant="outline"
            onClick={() => setInvites((current) => current + 1)}
          />
        }
      >
        Send demo invitation
      </Coachmark.Target>
      <p className="text-muted-foreground text-xs" role="status">
        Invitations sent: {invites}
      </p>
    </div>
  );
}
