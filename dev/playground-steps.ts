export const PLAYGROUND_STEPS = [
  {
    id: "views",
    target: "workspace-views",
    size: "compact",
    title: "Switch between views",
    description:
      "Choose a view to switch the content below. Arrow keys move between tabs. The Activity view has a scrollable list.",
  },
  {
    id: "activation",
    target: "workspace-activation",
    size: "medium",
    title: "Track activation",
    description:
      "Activation shows the share of invited teammates who completed setup. Switch between weekly and monthly metrics to compare progress.",
  },
  {
    id: "invite",
    target: "workspace-invite",
    size: "large",
    title: "Invite your team",
    description:
      "Invite teammates when you are ready to collaborate. Try the button to add a demo invitation to the pending count.",
  },
] as const;

export type PlaygroundStepId = (typeof PLAYGROUND_STEPS)[number]["id"];
