import { useRef } from "react";
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
import { getCoachmarkClassNames } from "../coachmark-styles";
import type { PlaygroundConfig, StylingMode } from "../playground-types";

export function CoachmarkExample({
  config,
  sessionKey,
  stylingMode,
}: {
  config: PlaygroundConfig;
  sessionKey: number;
  stylingMode: StylingMode;
}) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const metricRef = useRef<HTMLElement>(null);
  const inviteRef = useRef<HTMLButtonElement>(null);
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
          modal={config.modal}
          resetOnOpen={config.resetOnOpen}
        >
          <CoachmarkTrigger render={<Button size="sm">Start tour</Button>} />
          {config.backdrop ? (
            <CoachmarkBackdrop
              className={classNames.medium.backdrop}
            />
          ) : null}
          <CoachmarkStep
            {...spotlightProps}
            target={tabsRef}
          >
            <CoachmarkPositioner
              {...positionerProps}
              className={classNames.compact.positioner}
            >
              <CoachmarkPopup className={classNames.compact.popup}>
                <StepContent
                  arrow={config.arrow}
                  classNames={classNames.compact}
                  description="Choose a view to switch the content below. Arrow keys move between tabs."
                  title="Switch between views"
                  viewport={viewportEnabled}
                />
              </CoachmarkPopup>
            </CoachmarkPositioner>
          </CoachmarkStep>
          <CoachmarkStep
            {...spotlightProps}
            target={metricRef}
          >
            <CoachmarkPositioner
              {...positionerProps}
              className={classNames.medium.positioner}
            >
              <CoachmarkPopup className={classNames.medium.popup}>
                <StepContent
                  arrow={config.arrow}
                  classNames={classNames.medium}
                  description="Activation shows the share of invited teammates who completed setup, so you can spot where onboarding slows down."
                  title="Track activation"
                  viewport={viewportEnabled}
                />
              </CoachmarkPopup>
            </CoachmarkPositioner>
          </CoachmarkStep>
          <CoachmarkStep
            {...spotlightProps}
            target={inviteRef}
          >
            <CoachmarkPositioner
              {...positionerProps}
              className={classNames.large.positioner}
            >
              <CoachmarkPopup className={classNames.large.popup}>
                <StepContent
                  arrow={config.arrow}
                  classNames={classNames.large}
                  description="Invite teammates when you are ready to collaborate. They will receive a secure link, join this workspace with the Member role, and appear in your activation metrics after setup."
                  title="Invite your team"
                  viewport={viewportEnabled}
                />
              </CoachmarkPopup>
            </CoachmarkPositioner>
          </CoachmarkStep>
        </Coachmark>
      </div>

      <div className="border-border rounded-xl border bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Workspace</p>
            <h2 className="mt-1 text-lg font-semibold">Overview</h2>
          </div>
          <Button ref={inviteRef} size="sm" variant="outline">
            Invite teammate
          </Button>
        </div>

        <Tabs.Root defaultValue="overview">
          <Tabs.List
            activateOnFocus
            aria-label="Workspace views"
            className="border-border mt-6 flex gap-1 border-b"
            ref={tabsRef}
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
            <article
              className="border-border rounded-lg border p-4"
              ref={metricRef}
            >
              <span className="text-muted-foreground text-[11px]">
                Activation
              </span>
              <strong className="mt-2 block text-xl">68%</strong>
              <small className="text-success-foreground text-[10px]">
                Up 6% this month
              </small>
            </article>
            <article className="border-border rounded-lg border p-4">
              <span className="text-muted-foreground text-[11px]">Pending</span>
              <strong className="mt-2 block text-xl">6</strong>
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
            <ul className="divide-border divide-y text-xs">
              <li className="grid gap-1 px-4 py-3">
                <span>Maya invited Jon to the workspace.</span>
                <span className="text-muted-foreground">Just now</span>
              </li>
              <li className="grid gap-1 px-4 py-3">
                <span>Jon completed onboarding.</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </li>
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
        </Tabs.Root>
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
}: {
  arrow: boolean;
  classNames: ReturnType<typeof getCoachmarkClassNames>;
  description: string;
  title: string;
  viewport: boolean;
}) {
  const content = (
    <div className={classNames.content}>
      <CoachmarkStepper className={classNames.stepper}>
        {({ stepCount, stepIndex }) =>
          `Step ${stepIndex + 1} of ${stepCount}`
        }
      </CoachmarkStepper>
      <CoachmarkTitle className={classNames.title}>
        {title}
      </CoachmarkTitle>
      <CoachmarkDescription className={classNames.description}>
        {description}
      </CoachmarkDescription>
      <div className={classNames.actions}>
        <CoachmarkClose render={<Button size="xs" variant="ghost" />}>
          Skip
        </CoachmarkClose>
        <div className={classNames.navigation}>
          <CoachmarkPrevious
            render={<Button size="xs" variant="outline" />}
          >
            Back
          </CoachmarkPrevious>
          <CoachmarkNext render={<Button size="xs" />}>
            {({ isLastStep }) =>
              isLastStep ? "Finish" : "Next"
            }
          </CoachmarkNext>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {arrow ? (
        <CoachmarkArrow className={classNames.arrow} />
      ) : null}
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
