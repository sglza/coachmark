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

## API

The compound parts are available on `Coachmark` and as individual named exports such as `CoachmarkRoot`, `CoachmarkStep`, and `CoachmarkPopup`.

Rendered parts accept their native HTML props, including `className` and `style`. Parts built on Base UI also accept the corresponding [Base UI Popover props](https://base-ui.com/react/components/popover), including `render` for replacing the default element. The tables below focus on behavior specific to Coachmark and the attributes available for styling.

### Root

Controls the tour's open state and active step. It does not render a DOM element.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | A trigger, optional backdrop, and one or more steps. |
| `open` | `boolean` | — | Controls whether the tour is open. |
| `defaultOpen` | `boolean` | `false` | Sets the initial open state when uncontrolled. |
| `onOpenChange` | `(open, details) => void` | — | Called when an interaction or hook action requests an open-state change. |
| `stepIndex` | `number` | — | Controls the active step. |
| `defaultStepIndex` | `number` | `0` | Sets the initial step when uncontrolled. |
| `onStepChange` | `(index) => void` | — | Called when the active step changes. |
| `modal` | `boolean \| "trap-focus"` | `true` | Locks page scrolling and restricts outside interaction. Interactive targets join the modal boundary. `"trap-focus"` confines focus without blocking outside pointers or page scrolling. |
| `allowTargetInteraction` | `boolean` | `true` | Includes the active target and registered regions in the tour's interaction boundary. Can be overridden per step. |
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

Tours default to `modal={true}` and `allowTargetInteraction={true}`. Page scrolling is locked, while users can click, drag, type, and move focus between the popup, active target, and registered regions without dismissing the step. Target interaction does not advance the tour. Allowed controls remain available to assistive technology, and their arrow keys retain their normal behavior. Scrollable target content and menus can still scroll; automatic scrolling between steps remains supported.

In modal mode, keyboard focus cycles through the popup, target, and registered regions. Unrelated content is hidden from assistive technology and cannot be activated, even without a backdrop. Outside presses request dismissal without activating the underlying controls; canceling that request keeps the modal restrictions in place. An optional styled `Backdrop` provides the visible spotlight.

Set `modal={false}` to allow page scrolling and unrelated page interaction. Target interaction still keeps the step open when enabled. Tab from the last popup control moves to the target's first tab stop; Shift+Tab returns to the popup. Focus can then continue through the page normally and request dismissal. Without a backdrop, unrelated controls operate and request dismissal; a styled backdrop intercepts outside clicks. To keep a nonmodal tour open while users explore the page, cancel both outside-press and focus-out requests:

```tsx
<Coachmark.Root
  modal={false}
  onOpenChange={(open, details) => {
    if (
      !open &&
      (details.reason === "outside-press" || details.reason === "focus-out")
    ) {
      details.cancel();
    }
  }}
>
  {/* Trigger and steps; Backdrop is optional */}
</Coachmark.Root>
```

Escape, Close, and Finish still request dismissal. Target-owned menus should handle and stop propagation of Escape while open, returning focus to their control; a subsequent Escape can then close the tour. Recognized nested Base UI popups retain Base UI's dismissal behavior.

`modal="trap-focus"` confines focus to the allowed regions but permits outside pointer interaction and page scrolling. With target interaction enabled, Coachmark manages containment across the disjoint regions using Base UI's positioning and open-change pipeline. Setting `allowTargetInteraction={false}` uses Base UI's original popup-only modal handling. Include a `Coachmark.Close` inside the popup when using focus trapping.

**Migration:** `modal` remains `true` by default. Target interaction is now enabled by default; set `allowTargetInteraction={false}` to retain the previous popup-only behavior. In nonmodal mode, disabling target interaction removes the target's dismissal exemption while outside controls remain operable.

### Trigger

Opens the tour. Renders a `<button>` by default and accepts all Base UI Popover Trigger props.

| Prop or attribute | Type or value | Description |
| --- | --- | --- |
| `nativeButton` | `boolean` | Whether a custom rendered element is a native button. |
| `disabled` | `boolean` | Disables the trigger. |
| `openOnHover` | `boolean` | Opens the tour when the trigger is hovered. |
| `delay` / `closeDelay` | `number` | Configures hover open and close delays in milliseconds. |
| `render` | `ReactElement \| function` | Replaces the default button. |
| `data-slot` | `"coachmark-trigger"` | Stable part selector. |
| `data-popup-open` | Present when open | Added by Base UI. |
| `data-pressed` | Present when pressed | Added by Base UI for press-opened popovers. |

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

Defines one target and its content. It does not render a DOM element. Steps must be direct children of the root; fragments are supported, and their order defines the tour order.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `RefObject<HTMLElement \| null>` | — | Element highlighted and used as the positioner anchor. |
| `allowTargetInteraction` | `boolean` | Inherited | Overrides the root's target interaction policy for this step. |
| `interactionRefs` | `readonly RefObject<HTMLElement \| null>[]` | — | Additional allowed regions, such as a target's portaled menu. |
| `children` | `ReactNode` | — | The positioner and popup for this step. |
| `spotlightPadding` | `number` | `8` | Space around the spotlight cutout in CSS pixels. |
| `spotlightRadius` | `number` | `0` | Corner radius of the spotlight cutout in CSS pixels. |
| `scrollIntoView` | `boolean \| ScrollIntoViewOptions` | Inherited | Overrides automatic scrolling for this step. |

When target interaction is enabled, the target and its descendants are automatically allowed interaction regions in every modal mode. Register associated portal content with `interactionRefs`; refs may initially be null and are read when interactions occur. These regions do not change the spotlight or popup anchor:

```tsx
<Coachmark.Step target={selectRef} interactionRefs={[selectPopupRef]}>
  {/* Positioner and popup */}
</Coachmark.Step>
```

Base UI portals mounted inside the instructions' portal are recognized automatically. Target-owned or independently mounted menus use `interactionRefs` to join the boundary.

Render associated menus above the backdrop, using your application's stacking styles. For a menu with its own interception backdrop, register the outer portal so that its backdrop can dismiss the menu before the tour. Refs establish dismissal, focus, and scrolling ownership; they do not alter the menu's styling, keyboard behavior, or focus restoration. Only the active step's refs apply. Spotlight padding is visual and does not register neighboring elements for interaction.

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

The [issue investigation briefs](docs/issues/github-2/README.md) preserve the context, evidence, and open questions from GitHub issue 2 for future maintenance work.

### Releases

Run `pnpm changeset` with each user-facing change and commit the generated release note with your PR. Changes accumulate in a draft release PR; merge it when the batch is ready to publish. Use `pnpm changeset status` to inspect the pending release without publishing.

See the [release guide](.changeset/README.md) for the full workflow and one-time GitHub/npm setup.

## License

MIT
