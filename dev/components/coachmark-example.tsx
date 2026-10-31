import { useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import {
  Coachmark,
  CoachmarkArrow,
  CoachmarkBackdrop,
  CoachmarkClose,
  CoachmarkDescription,
  CoachmarkNext,
  CoachmarkPopup,
  CoachmarkPositioner,
  CoachmarkPrevious,
  CoachmarkStep,
  CoachmarkStepper,
  CoachmarkTitle,
  CoachmarkTrigger,
  CoachmarkViewport,
  type CoachmarkPositionerProps,
  type CoachmarkStepProps,
} from "coachmark";

import { Button } from "@/dev/components/ui/button";
import { Switch } from "@/dev/components/ui/switch";
import { PLAYGROUND_STEPS, type PlaygroundStepId } from "../playground-steps";
import { getCoachmarkClassNames } from "../coachmark-styles";
import type { PlaygroundConfig, StylingMode } from "../playground-types";

export function CoachmarkExample({
  config,
  onStepInteractionChange,
  sessionKey,
  stylingMode,
}: {
  config: PlaygroundConfig;
  onStepInteractionChange: (step: PlaygroundStepId, allowed: boolean) => void;
  sessionKey: number;
  stylingMode: StylingMode;
}) {
  const [tour] = useState(Coachmark.createHandle);
  const [weekly, setWeekly] = useState(false);
  const [invitations, setInvitations] = useState(6);
  const viewportEnabled =
    config.viewport &&
    (config.transition === "move" || config.transition === "viewport-only");
  const classNames = {
    compact: getCoachmarkClassNames(stylingMode, config, "compact"),
    large: getCoachmarkClassNames(stylingMode, config, "large"),
    medium: getCoachmarkClassNames(stylingMode, config, "medium"),
  };

  const positionerProps = {
    align: config.align,
    alignOffset: config.alignOffset,
    side: config.side,
    sideOffset: config.sideOffset,
  } satisfies Partial<CoachmarkPositionerProps>;
  const spotlightProps = {
    spotlightPadding: config.spotlightPadding,
    spotlightRadius: config.spotlightRadius,
  } satisfies Partial<CoachmarkStepProps>;

  return (
    <section
      className="mx-auto w-full max-w-2xl"
      aria-label="Basic coachmark example"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Basic tour</span>
        <Coachmark
          key={sessionKey}
          handle={tour}
          modal={config.modal}
          onOpenChange={(nextOpen, details) => {
            if (
              config.keepOpenOnOutsideInteraction &&
              !nextOpen &&
              (details.reason === "outside-press" ||
                details.reason === "focus-out")
            ) {
              details.cancel();
            }
          }}
          resetOnOpen={config.resetOnOpen}
        >
          <CoachmarkTrigger render={<Button size="sm">Start tour</Button>} />
          {config.backdrop ? (
            <CoachmarkBackdrop className={classNames.medium.backdrop} />
          ) : null}
          {PLAYGROUND_STEPS.map((step, index) => (
            <CoachmarkStep
              {...spotlightProps}
              key={step.id}
              target={step.target}
              order={index}
              allowTargetInteraction={config.stepInteraction[step.id]}
            >
              <CoachmarkPositioner
                {...positionerProps}
                className={classNames[step.size].positioner}
              >
                <CoachmarkPopup className={classNames[step.size].popup}>
                  <StepContent
                    arrow={config.arrow}
                    classNames={classNames[step.size]}
                    description={step.description}
                    title={step.title}
                    viewport={viewportEnabled}
                    allowTargetInteraction={config.stepInteraction[step.id]}
                    onInteractionChange={(allowed) =>
                      onStepInteractionChange(step.id, allowed)
                    }
                  />
                </CoachmarkPopup>
              </CoachmarkPositioner>
            </CoachmarkStep>
          ))}
        </Coachmark>
      </div>

      <div className="border-border rounded-xl border bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Workspace</p>
            <h2 className="mt-1 text-lg font-semibold">Overview</h2>
          </div>
          <Coachmark.Target
            handle={tour}
            name="workspace-invite"
            render={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInvitations((current) => current + 1)}
              />
            }
          >
            Invite teammate
          </Coachmark.Target>
        </div>

        <Coachmark.Target
          handle={tour}
          name="workspace-views"
          render={<Tabs.Root defaultValue="overview" />}
        >
          <Tabs.List
            activateOnFocus
            aria-label="Workspace views"
            className="border-border mt-6 flex gap-1 border-b"
          >
            {[
              ["overview", "Overview"],
              ["activity", "Activity"],
              ["settings", "Settings"],
            ].map(([value, label]) => (
              <Tabs.Tab
                className="text-muted-foreground border-b border-transparent px-3 py-2 text-xs outline-none data-active:border-foreground data-active:font-medium data-active:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                key={value}
                value={value}
              >
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="border-border rounded-lg border p-4">
              <span className="text-muted-foreground text-[11px]">Members</span>
              <strong className="mt-2 block text-xl">28</strong>
              <small className="text-muted-foreground text-[10px]">
                4 joined this week
              </small>
            </article>
            <Coachmark.Target
              handle={tour}
              name="workspace-activation"
              render={<article />}
              className="border-border rounded-lg border p-4"
            >
              <span className="text-muted-foreground text-[11px]">
                Activation
              </span>
              <strong className="mt-2 block text-xl" aria-live="polite">
                {weekly ? "74%" : "68%"}
              </strong>
              <small className="text-success-foreground text-[10px]">
                {weekly ? "Up 4% this week" : "Up 6% this month"}
              </small>
              <Button
                size="xs"
                variant="ghost"
                className="mt-2"
                aria-label="Toggle activation period"
                aria-pressed={weekly}
                onClick={() => setWeekly((current) => !current)}
              >
                {weekly ? "This week" : "This month"}
              </Button>
            </Coachmark.Target>
            <article className="border-border rounded-lg border p-4">
              <span className="text-muted-foreground text-[11px]">Pending</span>
              <strong className="mt-2 block text-xl" aria-live="polite">
                {invitations}
              </strong>
              <small className="text-muted-foreground text-[10px]">
                Invitations sent
              </small>
            </article>
          </div>

          <Tabs.Panel
            className="border-border mt-3 min-h-32 rounded-lg border"
            value="overview"
          >
            <div className="border-border grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-3 text-xs">
              <span>Maya Chen</span>
              <span className="text-muted-foreground">Admin</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-xs">
              <span>Jon Bell</span>
              <span className="text-muted-foreground">Member</span>
            </div>
          </Tabs.Panel>
          <Tabs.Panel
            className="border-border mt-3 min-h-32 rounded-lg border"
            value="activity"
          >
            <ul
              aria-label="Workspace activity"
              tabIndex={0}
              className="divide-border max-h-36 overflow-auto divide-y text-xs"
            >
              <li className="grid gap-1 px-4 py-3">
                <span>Maya invited Jon to the workspace.</span>
                <span className="text-muted-foreground">Just now</span>
              </li>
              <li className="grid gap-1 px-4 py-3">
                <span>Jon completed onboarding.</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </li>
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="grid gap-1 px-4 py-3">
                  <span>Workspace setup task {index + 1} completed.</span>
                  <span className="text-muted-foreground">Earlier today</span>
                </li>
              ))}
            </ul>
          </Tabs.Panel>
          <Tabs.Panel
            className="border-border mt-3 min-h-32 rounded-lg border"
            value="settings"
          >
            <dl className="divide-border divide-y text-xs">
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt>Workspace access</dt>
                <dd className="text-muted-foreground">Invite only</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt>Default teammate role</dt>
                <dd className="text-muted-foreground">Member</dd>
              </div>
            </dl>
          </Tabs.Panel>
        </Coachmark.Target>
      </div>
    </section>
  );
}

function StepContent({
  arrow,
  classNames,
  description,
  title,
  viewport,
  allowTargetInteraction,
  onInteractionChange,
}: {
  arrow: boolean;
  classNames: ReturnType<typeof getCoachmarkClassNames>;
  description: string;
  title: string;
  viewport: boolean;
  allowTargetInteraction: boolean;
  onInteractionChange: (allowed: boolean) => void;
}) {
  const content = (
    <div className={classNames.content}>
      <CoachmarkStepper className={classNames.stepper}>
        {({ stepCount, stepIndex }) => `Step ${stepIndex + 1} of ${stepCount}`}
      </CoachmarkStepper>
      <CoachmarkTitle className={classNames.title}>{title}</CoachmarkTitle>
      <label className="flex items-center gap-2 text-xs">
        <Switch
          checked={allowTargetInteraction}
          onCheckedChange={onInteractionChange}
        />
        <span>Allow target interaction</span>
      </label>
      <CoachmarkDescription className={classNames.description}>
        {description}
      </CoachmarkDescription>
      <div className={classNames.actions}>
        <CoachmarkClose render={<Button size="xs" variant="ghost" />}>
          Skip
        </CoachmarkClose>
        <div className={classNames.navigation}>
          <CoachmarkPrevious render={<Button size="xs" variant="outline" />}>
            Back
          </CoachmarkPrevious>
          <CoachmarkNext render={<Button size="xs" />}>
            {({ isLastStep }) => (isLastStep ? "Finish" : "Next")}
          </CoachmarkNext>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {arrow ? <CoachmarkArrow className={classNames.arrow} /> : null}
      {viewport ? (
        <CoachmarkViewport className={classNames.viewport}>
          {content}
        </CoachmarkViewport>
      ) : (
        content
      )}
    </>
  );
}
