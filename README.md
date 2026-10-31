# Coachmark

An accessible, unstyled React coachmark primitive for product tours, built on top of [Base UI Popover](https://base-ui.com/react/components/popover).

[Read more](https://sglza.xyz/coachmark)

## Install

```sh
pnpm add coachmark
```

`react` and `react-dom` ≥18 are required peer dependencies.

## Quick start

Each step points to an element ref and composes a positioner, popup, and any content or controls it needs.

```tsx
"use client";

import { useRef } from "react";
import { Coachmark } from "coachmark";

export function ToolbarTour() {
  const profileRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={profileRef}>Profile</button>
      <button ref={settingsRef}>Settings</button>

      <Coachmark.Root>
        <Coachmark.Trigger>Start tour</Coachmark.Trigger>
        <Coachmark.Backdrop />

        <Coachmark.Step target={profileRef}>
          <Coachmark.Positioner sideOffset={12}>
            <Coachmark.Popup>
              <Coachmark.Arrow />
              <Coachmark.Stepper>
                {({ stepIndex, stepCount }) =>
                  `${stepIndex + 1} of ${stepCount}`
                }
              </Coachmark.Stepper>
              <Coachmark.Title>Your profile</Coachmark.Title>
              <Coachmark.Description>
                Update your name and avatar here.
              </Coachmark.Description>
              <Coachmark.Close>Skip</Coachmark.Close>
              <Coachmark.Next>Next</Coachmark.Next>
            </Coachmark.Popup>
          </Coachmark.Positioner>
        </Coachmark.Step>

        <Coachmark.Step target={settingsRef}>
          <Coachmark.Positioner sideOffset={12}>
            <Coachmark.Popup>
              <Coachmark.Title>Settings</Coachmark.Title>
              <Coachmark.Description>
                Choose how the application behaves.
              </Coachmark.Description>
              <Coachmark.Previous>Back</Coachmark.Previous>
              <Coachmark.Next>Done</Coachmark.Next>
            </Coachmark.Popup>
          </Coachmark.Positioner>
        </Coachmark.Step>
      </Coachmark.Root>
    </>
  );
}
```

Coachmark ships no stylesheet. Style each part with `className`, `style`, the Base UI `render` prop, or its stable `data-slot` attribute.

## 1.0 composition work in progress

This branch starts the 1.0 composition redesign. The current package version remains `0.1.1`; the new interaction model is not release-ready. The existing ref-based examples above remain supported during migration.

A tour can now connect controls in separate components to a sibling Root through a stable handle:

```tsx
const [tour] = useState(Coachmark.createHandle);

return (
  <>
    <WorkspaceControls tour={tour} />
    <Coachmark.Trigger handle={tour}>Start tour</Coachmark.Trigger>

    <Coachmark.Root handle={tour} modal>
      <WorkspaceInstructions />
    </Coachmark.Root>
  </>
);
```

The application component registers a target region. It defaults to a `div`; `render` can use an existing section or control without adding a wrapper:

```tsx
<Coachmark.Target
  handle={tour}
  name="workspace-view"
  render={<section aria-label="Workspace controls" />}
>
  <button onClick={switchView}>Switch view</button>
  <label><input type="checkbox" /> Show completed</label>
  <div style={{ maxHeight: 200, overflow: "auto" }}>
    {/* Scrollable workspace content */}
  </div>
</Coachmark.Target>
```

Instructions can live in their own component. Each step controls interaction with the entire target subtree, including its controls and scrollable sections. Interaction defaults to enabled. The same target can be read-only in one step and interactive in another:

```tsx
<Coachmark.Step target="workspace-view" order={0} allowTargetInteraction={false}>
  {/* Explain the region while its controls and scrolling are blocked */}
</Coachmark.Step>

<Coachmark.Step target="workspace-view" order={1} allowTargetInteraction>
  <Coachmark.Positioner>
    <Coachmark.Popup>
      <Coachmark.Title>Try another view</Coachmark.Title>
      <Coachmark.Close>Close</Coachmark.Close>
      <Coachmark.Next>Finish</Coachmark.Next>
    </Coachmark.Popup>
  </Coachmark.Positioner>
</Coachmark.Step>
```

- Create a handle once per mounted tour, using a lazy `useState` initializer. Handles connect parts; use a Trigger or controlled `open` to start a tour.
- Each handle attaches to one Root. Explicit handles take precedence over surrounding Coachmark or Base UI contexts. Targets inside their own Root can omit the handle.
- Target names are scoped to the handle; independent tours can reuse names. Duplicate mounted names within one tour are rejected.
- Steps register across component boundaries. They default to registration order; use explicit `order` values for distributed or conditional definitions so mount order does not determine the sequence.
- Target regions retain their own semantics and handlers. They receive no synthetic button role, tab stop, popover ARIA attributes, or activation handlers. A separate Trigger starts the tour and receives focus after dismissal.
- `Step.allowTargetInteraction` defaults to `true`. An enabled named region participates in Base UI's native modal reference boundary. A disabled step makes only its target subtree inert while open, and restores its previous inert state when the policy changes or the tour closes. Controls remain mounted and retain their state.
- When a live policy change blocks a focused target, focus moves into the popup. Pointer interaction with a blocked region follows outside-dismissal rules; applications may cancel that dismissal through `onOpenChange`.
- Interactive hit areas leave a physical gap around the actual target rectangle so wheel scrolling works in Chromium. The styled backdrop's padding does not enlarge the allowed interaction region. The mask also exists without a visible backdrop in modal mode. Base UI still owns modality, document scroll locking, and popup focus management; no wheel forwarding or custom scroll lock is added.
- A named step waits for its target to mount before presenting. Its position in the sequence is retained.
- Keep independent Roots as siblings and control which tour opens. No global Provider, automatic tour arbitration, custom scroll lock, or replacement modal system is introduced.

Containers, direct controls, and scrollable target content are supported by the step policy. The interactive modal behavior requires a registered `Target`; plain ref targets retain the legacy behavior during migration. Keyboard operation of a focused native control is preserved, but Tab traversal between the popup and target is **not resolved**: native modal guards still cycle within the popup, and focus can leave an interactive target through the page's normal Tab order. Targets that also trigger another popup and target-owned portaled menus still need verification before 1.0. This work is not evidence that those cases are supported.

See `dev/components/composition/` for a runnable example with targets in separate files, repeated target names across two sibling tours, and parent-controlled mutual exclusion. The original playground example and generated ref-based code remain available for regression comparison.

## API

The compound parts are available on `Coachmark` and as individual named exports such as `CoachmarkRoot`, `CoachmarkStep`, and `CoachmarkPopup`.

Rendered parts accept their native HTML props, including `className` and `style`. Parts built on Base UI also accept the corresponding [Base UI Popover props](https://base-ui.com/react/components/popover), including `render` for replacing the default element. The tables below focus on behavior specific to Coachmark and the attributes available for styling.

### Root

Controls the tour's open state and active step. It does not render a DOM element.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Application content, targets, launchers, backdrop, and step definitions. |
| `handle` | `CoachmarkHandle` | Internal | Connects detached targets and launchers to this tour. |
| `open` | `boolean` | — | Controls whether the tour is open. |
| `defaultOpen` | `boolean` | `false` | Sets the initial open state when uncontrolled. |
| `onOpenChange` | `(open, details) => void` | — | Called when an interaction or hook action requests an open-state change. |
| `stepIndex` | `number` | — | Controls the active step. |
| `defaultStepIndex` | `number` | `0` | Sets the initial step when uncontrolled. |
| `onStepChange` | `(index) => void` | — | Called when the active step changes. |
| `modal` | `boolean \| "trap-focus"` | `true` | Configures Base UI's modal and focus-trapping behavior. |
| `resetOnOpen` | `boolean` | `true` | Resets the tour to its first step whenever it opens. |
| `scrollIntoView` | `boolean \| ScrollIntoViewOptions` | `true` | Configures automatic scrolling for offscreen targets. |

`onOpenChange` receives `CoachmarkOpenChangeEventDetails`, which preserves Base UI's event details and adds an optional `action`. Final Next and `useCoachmark().finish()` set `details.action` to `"finish"`; hook `close()` sets it to `"close"`. These actions use Base UI's `"imperative-action"` reason and a generated `Event`, including when Finish is clicked. Close, Skip, Escape, and outside press retain their Base UI reasons and have no `action`.

Use the action to distinguish completion from early dismissal:

```tsx
<Coachmark.Root
  open={open}
  onOpenChange={(nextOpen, details) => {
    setOpen(nextOpen);
    if (!nextOpen && details.action === "finish") {
      localStorage.setItem("tour-seen", "true");
    }
  }}
>
  {/* Trigger and steps */}
</Coachmark.Root>
```

Call `details.cancel()` to prevent a request, including its step changes. A controlled tour stays open until its parent supplies `open={false}`. Each action while it remains open can request closing again; completion metadata describes the request. Persist completion when accepting it. Uncontrolled tours ignore repeated close/finish calls after an accepted close, including calls in the same batch. Opening the tour again allows a new completion request.

### Trigger

Opens the tour. Renders a `<button>` by default and accepts all Base UI Popover Trigger props.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `handle` | `CoachmarkHandle` | Explicitly associates a detached launcher with a tour. |
| `nativeButton` | `boolean` | Whether a custom rendered element is a native button. |
| `disabled` | `boolean` | Disables the trigger. |
| `openOnHover` | `boolean` | Opens the tour when the trigger is hovered. |
| `delay` / `closeDelay` | `number` | Configures hover open and close delays in milliseconds. |
| `render` | `ReactElement \| function` | Replaces the default button. |
| `data-slot` | `"coachmark-trigger"` | Stable part selector. |
| `data-popup-open` | Present when open | Added by Base UI. |
| `data-pressed` | Present when pressed | Added by Base UI for press-opened popovers. |

### Target (1.0 draft)

Registers a named region with the tour. It renders a `div` by default and accepts `render` to use a section, control, or custom component. It forwards application props and refs without injecting button behavior or popover accessibility attributes. It can be inside Root or detached with an explicit handle. Interactivity is controlled by each Step, not by the Target.

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | Required target name, unique among mounted targets in this tour. |
| `handle` | `CoachmarkHandle` | Connects a target outside Root, or overrides the surrounding tour context. |
| `render` | `ReactElement \| function` | Uses an existing control without adding a DOM wrapper. |

### Backdrop

Adds an optional backdrop and spotlight cutout. Renders a `<div>` in a portal and accepts all Base UI Popover Backdrop props except `children`.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `render` | `ReactElement \| function` | Replaces the default element. |
| `data-slot` | `"coachmark-backdrop"` | Stable part selector. |
| `data-open` / `data-closed` | Presence | Current open state from Base UI. |
| `data-starting-style` / `data-ending-style` | Presence | Base UI transition state. |
| `data-motion-state` | `"entering" \| "exiting" \| "repositioning" \| "idle"` | Current tour motion state. |
| `data-phase` | `"closed" \| "preparing-open" \| "entering" \| "exiting" \| "scrolling" \| "positioning" \| "idle"` | Detailed presentation phase. |
| `data-transitioning` | Presence | Present while a step transition is active. |
| `data-concealed` | Presence | Present while an offscreen target is being prepared. |

The backdrop also exposes `--coachmark-cutout-open` and `--coachmark-cutout-closed`. Set `--coachmark-cutout-path` to override the path used by `clip-path`.

### Step

Defines one target and its content. It renders no DOM at the definition site. Definitions may live inside separate components under Root; only the active step content renders, through a shared portal that preserves popup and viewport continuity. Use `order` to define a stable sequence across independently mounted components.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `string \| RefObject<HTMLElement \| null>` | — | Registered target name, or an element ref during migration. |
| `order` | `number` | `0` | Sorts the sequence; equal values retain registration order. |
| `allowTargetInteraction` | `boolean` | `true` | Allows operation and scrolling of the target subtree. Set false for a read-only step. |
| `children` | `ReactNode` | — | The positioner and popup for this step. |
| `spotlightPadding` | `number` | `8` | Space around the spotlight cutout in CSS pixels. |
| `spotlightRadius` | `number` | `0` | Corner radius of the spotlight cutout in CSS pixels. |
| `scrollIntoView` | `boolean \| ScrollIntoViewOptions` | Inherited | Overrides automatic scrolling for this step. |

### Positioner

Positions a step relative to its target. Renders a `<div>` in the step's portal and accepts Base UI Popover Positioner props except `anchor`, which comes from `Step.target`.

| Prop or attribute | Type or value | Default | Description |
| --- | --- | --- | --- |
| `side` | `"top" \| "bottom" \| "left" \| "right" \| "inline-start" \| "inline-end"` | `"bottom"` | Preferred side of the target. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alignment along the chosen side. |
| `sideOffset` | `number \| function` | `0` | Distance from the target. |
| `alignOffset` | `number \| function` | `0` | Offset along the alignment axis. |
| `positionMethod` | `"absolute" \| "fixed"` | `"absolute"` | CSS positioning strategy. |
| `collisionBoundary` | Element, elements, rect, or `"clipping-ancestors"` | `"clipping-ancestors"` | Boundary used for collision detection. |
| `collisionPadding` | `number \| Padding` | `5` | Space kept from the collision boundary. |
| `collisionAvoidance` | `CollisionAvoidance` | Base UI default | Controls flipping and shifting when space is limited. |
| `sticky` | `boolean` | `false` | Keeps the popup visible after its target leaves the viewport. |
| `arrowPadding` | `number` | `5` | Minimum space between the arrow and popup edges. |
| `disableAnchorTracking` | `boolean` | `false` | Stops tracking layout shifts of the target. |
| `data-slot` | `"coachmark-positioner"` | — | Stable part selector. |
| `data-open` / `data-closed` | Presence | — | Current open state from Base UI. |
| `data-side` | Positioner side | — | Resolved side after collision handling. |
| `data-align` | Positioner alignment | — | Resolved alignment after collision handling. |
| `data-anchor-hidden` | Presence | — | Present when the target is hidden. |
| `data-instant` | String | — | Reason Base UI disabled its positioning transition. |
| `data-motion-state` | Motion state | — | Current tour motion state. |
| `data-phase` | Presentation phase | — | Detailed tour presentation phase. |
| `data-transitioning` | Presence | — | Present while a step transition is active. |
| `data-concealed` | Presence | — | Present while an offscreen target is being prepared. |

Base UI exposes positioning variables including `--available-width`, `--available-height`, `--anchor-width`, `--anchor-height`, and `--transform-origin`.

### Popup

Contains the accessible step content. Renders a `<div role="dialog">` and accepts all Base UI Popover Popup props.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `initialFocus` | `boolean \| RefObject \| function` | Chooses what receives focus when the tour opens. |
| `finalFocus` | `boolean \| RefObject \| function` | Chooses what receives focus when the tour closes. |
| `render` | `ReactElement \| function` | Replaces the default element. |
| `data-slot` | `"coachmark-popup"` | Stable part selector. |
| `data-open` / `data-closed` | Presence | Current open state from Base UI. |
| `data-starting-style` / `data-ending-style` | Presence | Base UI transition state. |
| `data-side` / `data-align` | String | Resolved placement from Base UI. |
| `data-instant` | String | Reason Base UI disabled its transition. |
| `data-motion-state` | Motion state | Current tour motion state. |
| `data-phase` | Presentation phase | Detailed tour presentation phase. |
| `data-transitioning` | Presence | Present while a step transition is active. |
| `data-concealed` | Presence | Present while an offscreen target is being prepared. |

When `Viewport` is used, the popup also receives `--popup-width` and `--popup-height` measurements.

### Arrow

Displays an optional arrow pointing toward the target. Renders a `<div>` and accepts all Base UI Popover Arrow props.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `render` | `ReactElement \| function` | Replaces the default element. |
| `data-slot` | `"coachmark-arrow"` | Stable part selector. |
| `data-open` / `data-closed` | Presence | Current open state from Base UI. |
| `data-side` / `data-align` | String | Resolved placement from Base UI. |
| `data-uncentered` | Presence | Present when the arrow cannot be centered on the target. |

### Stepper

Renders progress for the active step. Renders a `<div>` by default.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `children` | `ReactNode \| (state) => ReactNode` | Static content or content derived from the tour state. |
| `render` | `ReactElement \| function` | Replaces the default element. |
| `data-slot` | `"coachmark-stepper"` | Stable part selector. |
| `data-first-step` / `data-last-step` | Presence | Present for the corresponding boundary step. |
| `data-step-index` / `data-step-count` | Number | Current zero-based index and total count. Both are always present. |
| `data-motion-state` | Motion state | Current tour motion state. |
| `data-transitioning` | Presence | Present while a step transition is active. |

### Title

Provides the popup's accessible name. Renders an `<h2>` by default and accepts all Base UI Popover Title props.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `render` | `ReactElement \| function` | Replaces the default heading. |
| `data-slot` | `"coachmark-title"` | Stable part selector. |

### Description

Provides the popup's accessible description. Renders a `<p>` by default and accepts all Base UI Popover Description props.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `render` | `ReactElement \| function` | Replaces the default paragraph. |
| `data-slot` | `"coachmark-description"` | Stable part selector. |

### Previous

Moves to the previous step. Renders a `<button>` by default and is not mounted on the first step unless `keepMounted` is enabled.

| Prop or attribute | Type or value | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode \| (state) => ReactNode` | — | Static content or content derived from the tour state. |
| `keepMounted` | `boolean` | `false` | Keeps the button mounted and disabled on the first step. |
| `render` | `ReactElement \| function` | — | Replaces the default button. |
| `data-slot` | `"coachmark-previous"` | — | Stable part selector. |
| `data-first-step` / `data-last-step` | Presence | — | Present for the corresponding boundary step. |
| `data-step-index` / `data-step-count` | Number | — | Current zero-based index and total count. Both are always present. |
| `data-motion-state` | Motion state | — | Current tour motion state. |
| `data-transitioning` | Presence | — | Present while a step transition is active. |

### Next

Moves forward, or finishes and closes the tour on the final step. Renders a `<button>` by default.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `children` | `ReactNode \| (state) => ReactNode` | Static content or content derived from the tour state. |
| `render` | `ReactElement \| function` | Replaces the default button. |
| `data-slot` | `"coachmark-next" \| "coachmark-finish"` | Changes to `coachmark-finish` on the final step. |
| `data-first-step` / `data-last-step` | Presence | Present for the corresponding boundary step. |
| `data-step-index` / `data-step-count` | Number | Current zero-based index and total count. Both are always present. |
| `data-motion-state` | Motion state | Current tour motion state. |
| `data-transitioning` | Presence | Present while a step transition is active. |

Function children receive the complete tour state, so labels can change on the final step:

```tsx
<Coachmark.Next render={<Button variant="primary" />}>
  {({ isLastStep }) => (isLastStep ? "Finish" : "Continue")}
</Coachmark.Next>
```

### Close

Closes the tour early. Renders a `<button>` and accepts all Base UI Popover Close props.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `nativeButton` | `boolean` | Whether a custom rendered element is a native button. |
| `render` | `ReactElement \| function` | Replaces the default button. |
| `data-slot` | `"coachmark-close"` | Stable part selector. |

### Viewport

Optionally snapshots the previous step's content so size and content changes can be animated. Renders a `<div>` by default.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `children` | `ReactNode` | Content that changes between steps. Keep the arrow outside the viewport. |
| `render` | `ReactElement \| function` | Replaces the default element. |
| `data-slot` | `"coachmark-viewport"` | Stable part selector. |
| `data-activation-direction` | Space-separated directions | Direction from the previous target, such as `"right down"`. |
| `data-first-step` / `data-last-step` | Presence | Present for the corresponding boundary step. |
| `data-step-index` / `data-step-count` | Number | Current zero-based index and total count. Both are always present. |
| `data-motion-state` | Motion state | Current tour motion state. |
| `data-transitioning` | Presence | Present while previous and current content are rendered together. |
| `data-current` / `data-previous` | Presence on child wrappers | Identifies incoming and outgoing content. |
| `data-starting-style` / `data-ending-style` | Presence on child wrappers | Marks the active content transition phase. |

When a viewport transition is active, the popup receives `--popup-width` and `--popup-height`; the positioner receives `--positioner-width` and `--positioner-height`.

### useCoachmark

Returns the current tour state and navigation actions. It must be used inside `Coachmark.Root`.

| Value | Type | Description |
| --- | --- | --- |
| `stepIndex` / `stepCount` | `number` | Current zero-based index and total number of steps. |
| `isFirstStep` / `isLastStep` | `boolean` | Whether the active step is at either boundary. |
| `motionState` | `"entering" \| "exiting" \| "repositioning" \| "idle"` | Current motion state. |
| `transitioning` | `boolean` | Whether a step transition is active. |
| `next()` / `previous()` | `() => void` | Moves one step in either direction. |
| `goTo(index)` | `(number) => void` | Moves to a specific step. |
| `close()` | `() => void` | Closes the tour without changing the active step. |
| `finish()` | `() => void` | Moves to the final step and closes the tour. |

## Development

```sh
pnpm install
pnpm dev
```

`pnpm dev` watches the library and runs the playground. Use `pnpm check` to run type checking and tests.

### Releases

Run `pnpm changeset` with each user-facing change and commit the generated release note with your PR. Changes accumulate in a draft release PR; merge it when the batch is ready to publish. Use `pnpm changeset status` to inspect the pending release without publishing.

See the [release guide](.changeset/README.md) for the full workflow and one-time GitHub/npm setup.

## License

MIT
