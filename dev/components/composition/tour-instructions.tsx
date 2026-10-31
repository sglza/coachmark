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
}: {
  target: string;
  order: number;
  title: string;
  description: string;
}) {
  return (
    <Coachmark.Step target={target} order={order}>
      <Coachmark.Positioner className={classes.positioner} sideOffset={12}>
        <Coachmark.Popup className={classes.popup}>
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
        title="Try another workspace view"
        description="Click the highlighted control to switch between List and Board while keeping these instructions open."
      />
      <Step
        order={1}
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
