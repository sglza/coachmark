import { Coachmark } from "coachmark";
import { getCoachmarkClassNames } from "../../coachmark-styles";
import { Button } from "../ui/button";

const classes = getCoachmarkClassNames(
  "css-modules",
  { transition: "none", viewport: false },
  "medium",
);

function Step({
  target,
  order,
  title,
  description,
  allowTargetInteraction = true,
}: {
  target: string;
  order: number;
  title: string;
  description: string;
  allowTargetInteraction?: boolean;
}) {
  return (
    <Coachmark.Step
      target={target}
      order={order}
      allowTargetInteraction={allowTargetInteraction}
    >
      <Coachmark.Positioner className={classes.positioner} sideOffset={12}>
        <Coachmark.Popup className={classes.popup}>
          <p className="text-muted-foreground text-xs">
            {allowTargetInteraction ? "Interactive step" : "Read-only step"}
          </p>
          <Coachmark.Title className={classes.title}>{title}</Coachmark.Title>
          <Coachmark.Description className={classes.description}>
            {description}
          </Coachmark.Description>
          <div className={classes.actions}>
            <Coachmark.Close render={<Button variant="ghost" size="sm" />}>
              Close tour
            </Coachmark.Close>
            <div className={classes.navigation}>
              <Coachmark.Previous
                render={<Button variant="outline" size="sm" />}
              >
                Back
              </Coachmark.Previous>
              <Coachmark.Next render={<Button size="sm" />}>
                {({ isLastStep }) => (isLastStep ? "Finish tour" : "Next step")}
              </Coachmark.Next>
            </div>
          </div>
        </Coachmark.Popup>
      </Coachmark.Positioner>
    </Coachmark.Step>
  );
}

export function TourBackdrop() {
  return <Coachmark.Backdrop className={classes.backdrop} />;
}

export function WorkspaceInstructions() {
  return (
    <>
      <Step
        order={0}
        target="view"
        allowTargetInteraction={false}
        title="Explore workspace controls"
        description="This first step highlights the entire section while its controls and scrolling are blocked. Next enables interaction with the same region."
      />
      <Step
        order={1}
        target="view"
        title="Try another workspace view"
        description="Switch views, toggle completed items, or scroll the list. All controls in this target region are now interactive while the page remains locked."
      />
      <Step
        order={2}
        target="action"
        title="Invite your team"
        description="Send a demo invitation. This target lives in a separate component, connected through the same tour handle."
      />
    </>
  );
}

export function PreferencesInstructions() {
  return (
    <Step
      order={0}
      target="action"
      title="Choose your email preference"
      description="Toggle the digest. This independent tour reuses the target name action without sharing state with the workspace tour."
    />
  );
}
