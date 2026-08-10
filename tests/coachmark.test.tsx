import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  CoachmarkRoot,
  CoachmarkStep,
  CoachmarkStepper,
  CoachmarkTitle,
  CoachmarkTrigger,
  CoachmarkViewport,
} from "../src";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockElementRect(
  element: Element,
  rect: { height: number; width: number; x: number; y: number },
) {
  return vi
    .spyOn(element, "getBoundingClientRect")
    .mockReturnValue(new DOMRect(rect.x, rect.y, rect.width, rect.height));
}

function mockScrollIntoView(element: Element) {
  const scrollIntoView = vi.fn();
  Object.defineProperty(element, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  return scrollIntoView;
}

function Fixture({
  onStepChange = vi.fn(),
}: {
  onStepChange?: (index: number) => void;
}) {
  const firstTarget = createRef<HTMLButtonElement>();
  const secondTarget = createRef<HTMLButtonElement>();

  return (
    <div>
      <button ref={firstTarget} type="button">
        First target
      </button>
      <button ref={secondTarget} type="button">
        Second target
      </button>
      <Coachmark onStepChange={onStepChange}>
        <CoachmarkTrigger>Start tour</CoachmarkTrigger>
        <CoachmarkBackdrop />
        <CoachmarkStep target={firstTarget}>
          <CoachmarkPositioner className="tour-positioner">
            <CoachmarkPopup className="tour-popup">
              <CoachmarkArrow className="tour-arrow" />
              <CoachmarkStepper>
                {({ stepCount, stepIndex }) =>
                  `Step ${stepIndex + 1} of ${stepCount}`
                }
              </CoachmarkStepper>
              <div>
                <img alt="Feature preview" src="preview.png" />
              </div>
              <CoachmarkTitle>First feature</CoachmarkTitle>
              <CoachmarkDescription>
                This is the first step.
              </CoachmarkDescription>
              <CoachmarkClose aria-label="Close tour">×</CoachmarkClose>
              <div>
                <CoachmarkClose>Skip</CoachmarkClose>
                <div>
                  <CoachmarkPrevious>Back</CoachmarkPrevious>
                  <CoachmarkNext>Next</CoachmarkNext>
                </div>
              </div>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
        <CoachmarkStep target={secondTarget}>
          <CoachmarkPositioner side="top">
            <CoachmarkPopup>
              <CoachmarkStepper>
                {({ stepCount, stepIndex }) =>
                  `Step ${stepIndex + 1} of ${stepCount}`
                }
              </CoachmarkStepper>
              <CoachmarkTitle>Second feature</CoachmarkTitle>
              <CoachmarkDescription>
                This is the second step.
              </CoachmarkDescription>
              <div>
                <CoachmarkClose>Skip</CoachmarkClose>
                <div>
                  <CoachmarkPrevious>Back</CoachmarkPrevious>
                  <CoachmarkNext
                    render={<button data-custom-button="" type="button" />}
                  >
                    Finish
                  </CoachmarkNext>
                </div>
              </div>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
      </Coachmark>
    </div>
  );
}

function FocusFixture({
  finalFocus = "default",
  initialFocus = false,
}: {
  finalFocus?: "default" | "destination" | "none";
  initialFocus?: boolean;
}) {
  const target = useRef<HTMLButtonElement>(null);
  const initialControl = useRef<HTMLButtonElement>(null);
  const destination = useRef<HTMLButtonElement>(null);
  const resolvedFinalFocus =
    finalFocus === "destination"
      ? destination
      : finalFocus === "none"
        ? false
        : undefined;

  return (
    <div>
      <button ref={target} type="button">
        Focus target
      </button>
      <Coachmark>
        <CoachmarkTrigger>Start focus tour</CoachmarkTrigger>
        <CoachmarkStep target={target}>
          <CoachmarkPositioner>
            <CoachmarkPopup
              finalFocus={resolvedFinalFocus}
              initialFocus={initialFocus ? initialControl : undefined}
            >
              <CoachmarkTitle>Focus behavior</CoachmarkTitle>
              <button ref={initialControl} type="button">
                Initial action
              </button>
              <CoachmarkClose>Close focus tour</CoachmarkClose>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
      </Coachmark>
      <button ref={destination} type="button">
        After tour
      </button>
    </div>
  );
}

function LateTargetFixture({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const target = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <Coachmark.Root defaultOpen={defaultOpen}>
        <Coachmark.Trigger>Start late tour</Coachmark.Trigger>
        <Coachmark.Backdrop />
        <Coachmark.Step target={target}>
          <Coachmark.Positioner>
            <Coachmark.Popup>
              <Coachmark.Title>Late target</Coachmark.Title>
              <Coachmark.Next>Finish</Coachmark.Next>
            </Coachmark.Popup>
          </Coachmark.Positioner>
        </Coachmark.Step>
      </Coachmark.Root>
      <button ref={target} type="button">
        Late target
      </button>
    </div>
  );
}

function ScrollFixture({
  rootScrollIntoView,
  stepScrollIntoView,
}: {
  rootScrollIntoView?: boolean | ScrollIntoViewOptions;
  stepScrollIntoView?: boolean | ScrollIntoViewOptions;
}) {
  const target = useRef<HTMLButtonElement>(null);

  return (
    <div data-testid="scroll-container" style={{ overflow: "auto" }}>
      <button ref={target} type="button">
        Scroll target
      </button>
      <Coachmark scrollIntoView={rootScrollIntoView}>
        <CoachmarkTrigger>Start scroll tour</CoachmarkTrigger>
        <CoachmarkStep
          scrollIntoView={stepScrollIntoView}
          target={target}
        >
          <CoachmarkPositioner>
            <CoachmarkPopup>
              <CoachmarkTitle>Scroll step</CoachmarkTitle>
              <CoachmarkNext>Finish</CoachmarkNext>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
      </Coachmark>
    </div>
  );
}

function ControlledStepFixture({ stepIndex }: { stepIndex: number }) {
  const firstTarget = useRef<HTMLButtonElement>(null);
  const secondTarget = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button ref={firstTarget} type="button">
        Controlled first target
      </button>
      <button ref={secondTarget} type="button">
        Controlled second target
      </button>
      <Coachmark
        defaultOpen
        modal={false}
        resetOnOpen={false}
        stepIndex={stepIndex}
      >
        <CoachmarkTrigger>Start controlled tour</CoachmarkTrigger>
        <CoachmarkBackdrop />
        <CoachmarkStep target={firstTarget}>
          <CoachmarkPositioner>
            <CoachmarkPopup>
              <CoachmarkTitle>Controlled first step</CoachmarkTitle>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
        <CoachmarkStep target={secondTarget}>
          <CoachmarkPositioner>
            <CoachmarkPopup>
              <CoachmarkTitle>Controlled second step</CoachmarkTitle>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
      </Coachmark>
    </div>
  );
}

function ViewportFixture() {
  const firstTarget = useRef<HTMLButtonElement>(null);
  const secondTarget = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button ref={firstTarget} type="button">
        Viewport first target
      </button>
      <button ref={secondTarget} type="button">
        Viewport second target
      </button>
      <Coachmark>
        <CoachmarkTrigger>Start viewport tour</CoachmarkTrigger>
        <CoachmarkStep target={firstTarget}>
          <CoachmarkPositioner>
            <CoachmarkPopup>
              <CoachmarkViewport>
                <CoachmarkTitle>Viewport first step</CoachmarkTitle>
                <CoachmarkDescription>Compact content.</CoachmarkDescription>
                <CoachmarkNext>Next viewport step</CoachmarkNext>
              </CoachmarkViewport>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
        <CoachmarkStep target={secondTarget}>
          <CoachmarkPositioner>
            <CoachmarkPopup>
              <CoachmarkViewport>
                <CoachmarkTitle>Viewport second step</CoachmarkTitle>
                <CoachmarkDescription>
                  Taller content that gives the next popup a different measured
                  height.
                </CoachmarkDescription>
                <CoachmarkPrevious>Previous viewport step</CoachmarkPrevious>
                <CoachmarkNext>Finish viewport tour</CoachmarkNext>
              </CoachmarkViewport>
            </CoachmarkPopup>
          </CoachmarkPositioner>
        </CoachmarkStep>
      </Coachmark>
    </div>
  );
}

describe("Coachmark", () => {
  it("exposes both compound and individual component APIs", () => {
    expect(Coachmark.Root).toBe(CoachmarkRoot);
    expect(Coachmark.Trigger).toBe(CoachmarkTrigger);
    expect(Coachmark.Backdrop).toBe(CoachmarkBackdrop);
    expect(Coachmark.Step).toBe(CoachmarkStep);
    expect(Coachmark.Positioner).toBe(CoachmarkPositioner);
    expect(Coachmark.Popup).toBe(CoachmarkPopup);
    expect(Coachmark.Arrow).toBe(CoachmarkArrow);
    expect(Coachmark.Stepper).toBe(CoachmarkStepper);
    expect(Coachmark.Title).toBe(CoachmarkTitle);
    expect(Coachmark.Description).toBe(CoachmarkDescription);
    expect(Coachmark.Close).toBe(CoachmarkClose);
    expect(Coachmark.Previous).toBe(CoachmarkPrevious);
    expect(Coachmark.Next).toBe(CoachmarkNext);
  });

  it("keeps positioner and popup props on their owning parts", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });

    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).toHaveClass("tour-positioner");
    expect(
      document.querySelector('[data-slot="coachmark-popup"]'),
    ).toHaveClass("tour-popup");
  });

  it("scrolls an offscreen target into view when the tour opens", async () => {
    const user = userEvent.setup();
    render(<ScrollFixture />);
    const target = screen.getByRole("button", { name: "Scroll target" });
    const scrollIntoView = mockScrollIntoView(target);
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 900 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    mockElementRect(target, { height: 40, width: 120, x: 20, y: 20 });
    document.dispatchEvent(new Event("scrollend"));

    expect(
      await screen.findByRole("dialog", { name: "Scroll step" }),
    ).toBeInTheDocument();
  });

  it("scrolls when a target is clipped by a scroll container", async () => {
    const user = userEvent.setup();
    render(<ScrollFixture />);
    const target = screen.getByRole("button", { name: "Scroll target" });
    const container = screen.getByTestId("scroll-container");
    const scrollIntoView = mockScrollIntoView(target);
    mockElementRect(container, { height: 200, width: 400, x: 0, y: 0 });
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 500 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );

    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it("scrolls when a target is only partially visible", async () => {
    const user = userEvent.setup();
    render(<ScrollFixture />);
    const target = screen.getByRole("button", { name: "Scroll target" });
    const container = screen.getByTestId("scroll-container");
    const scrollIntoView = mockScrollIntoView(target);
    mockElementRect(container, { height: 200, width: 400, x: 0, y: 0 });
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 180 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );

    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it("does not repeatedly move a target larger than its scroll container", async () => {
    const user = userEvent.setup();
    render(<ScrollFixture />);
    const target = screen.getByRole("button", { name: "Scroll target" });
    const container = screen.getByTestId("scroll-container");
    const scrollIntoView = mockScrollIntoView(target);
    mockElementRect(container, { height: 200, width: 400, x: 0, y: 0 });
    mockElementRect(target, { height: 400, width: 120, x: 20, y: -100 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not move a target that is already visible", async () => {
    const user = userEvent.setup();
    render(<ScrollFixture />);
    const target = screen.getByRole("button", { name: "Scroll target" });
    const container = screen.getByTestId("scroll-container");
    const scrollIntoView = mockScrollIntoView(target);
    mockElementRect(container, { height: 200, width: 400, x: 0, y: 0 });
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 20 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("supports root opt-out and step-level scrolling options", async () => {
    const user = userEvent.setup();
    const firstRender = render(
      <ScrollFixture rootScrollIntoView={false} />,
    );
    let target = screen.getByRole("button", { name: "Scroll target" });
    let scrollIntoView = mockScrollIntoView(target);
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 900 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    firstRender.unmount();
    render(
      <ScrollFixture
        rootScrollIntoView={false}
        stepScrollIntoView={{ behavior: "auto", block: "start" }}
      />,
    );
    target = screen.getByRole("button", { name: "Scroll target" });
    scrollIntoView = mockScrollIntoView(target);
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 900 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
      inline: "nearest",
    });
  });

  it("reveals the next target when advancing the tour", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(<Fixture onStepChange={onStepChange} />);
    const firstTarget = screen.getByRole("button", { name: "First target" });
    const secondTarget = screen.getByRole("button", { name: "Second target" });
    const firstScroll = mockScrollIntoView(firstTarget);
    const secondScroll = mockScrollIntoView(secondTarget);
    mockElementRect(firstTarget, { height: 40, width: 120, x: 20, y: 20 });
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 900 });

    await user.click(screen.getByRole("button", { name: "Start tour" }));
    expect(firstScroll).not.toHaveBeenCalled();
    await screen.findByRole("dialog", { name: "First feature" });

    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-backdrop"]',
    );
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(secondScroll).toHaveBeenCalledOnce());
    expect(
      document.querySelector('[data-slot="coachmark-popup"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).toHaveAttribute("data-transitioning");
    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).toHaveAttribute("data-concealed");
    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).toHaveAttribute("data-motion-state", "repositioning");
    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).toHaveStyle({ opacity: "0", pointerEvents: "none" });
    expect(
      backdrop,
    ).toHaveAttribute("data-transitioning");
    expect(backdrop?.style.visibility).toBe("");
    expect(backdrop?.style.clipPath).toBe("none");
    expect(document.querySelector('[data-slot="coachmark-backdrop"]')).toBe(
      backdrop,
    );
    expect(onStepChange).not.toHaveBeenCalledWith(1);

    const animationFrames: FrameRequestCallback[] = [];
    const requestAnimationFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        animationFrames.push(callback);
        return animationFrames.length;
      });
    mockElementRect(secondTarget, {
      height: 40,
      width: 120,
      x: 300,
      y: 200,
    });
    document.dispatchEvent(new Event("scrollend"));

    await waitFor(() =>
      expect(backdrop).toHaveAttribute("data-phase", "positioning"),
    );
    expect(backdrop).toHaveStyle({ clipPath: "none" });

    await act(async () => {
      for (
        let index = 0;
        index < 20 && animationFrames.length > 0;
        index += 1
      ) {
        const callbacks = animationFrames.splice(0);
        callbacks.forEach((callback) => callback(performance.now()));
        await Promise.resolve();
      }
    });
    requestAnimationFrame.mockRestore();

    expect(
      await screen.findByRole("dialog", { name: "Second feature" }),
    ).toBeInTheDocument();
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).not.toHaveAttribute("data-transitioning");
    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).toHaveAttribute("data-motion-state", "idle");
  });

  it("waits for rendered exit motion before scrolling", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const firstTarget = screen.getByRole("button", { name: "First target" });
    const secondTarget = screen.getByRole("button", { name: "Second target" });
    mockElementRect(firstTarget, { height: 40, width: 120, x: 20, y: 20 });
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 900 });
    const secondScroll = mockScrollIntoView(secondTarget);

    await user.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });

    const positioner = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-positioner"]',
    );
    let finishAnimation = () => {};
    const finished = new Promise<void>((resolve) => {
      finishAnimation = resolve;
    });
    Object.defineProperty(positioner, "getAnimations", {
      configurable: true,
      value: () => [{ finished, playState: "running" }],
    });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(positioner).toHaveAttribute("data-motion-state", "exiting"),
    );
    expect(secondScroll).not.toHaveBeenCalled();

    finishAnimation();
    await waitFor(() => expect(secondScroll).toHaveBeenCalledOnce());
  });

  it("waits for rendered exit motion before changing a visible step", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(<Fixture onStepChange={onStepChange} />);
    const firstTarget = screen.getByRole("button", { name: "First target" });
    const secondTarget = screen.getByRole("button", { name: "Second target" });
    mockElementRect(firstTarget, { height: 40, width: 120, x: 20, y: 20 });
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 20 });
    const secondScroll = mockScrollIntoView(secondTarget);

    await user.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });

    const positioner = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-positioner"]',
    );
    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-backdrop"]',
    );
    let finishAnimation = () => {};
    const finished = new Promise<void>((resolve) => {
      finishAnimation = resolve;
    });
    Object.defineProperty(backdrop, "getAnimations", {
      configurable: true,
      value: () => [{ finished, playState: "running" }],
    });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(positioner).toHaveAttribute("data-motion-state", "exiting"),
    );
    expect(positioner).toHaveAttribute("data-transitioning");
    expect(positioner).not.toHaveAttribute("data-concealed");
    expect(onStepChange).not.toHaveBeenCalledWith(1);
    expect(secondScroll).not.toHaveBeenCalled();

    finishAnimation();

    expect(
      await screen.findByRole("dialog", { name: "Second feature" }),
    ).toBeInTheDocument();
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(secondScroll).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(positioner).toHaveAttribute("data-motion-state", "idle"),
    );
  });

  it("morphs viewport content and exposes its activation direction", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        if (this.textContent?.trim() === "Viewport first target") {
          return new DOMRect(20, 20, 100, 40);
        }
        if (this.textContent?.trim() === "Viewport second target") {
          return new DOMRect(300, 200, 100, 40);
        }
        if (this.getAttribute("data-slot") === "coachmark-popup") {
          const currentContent = this.querySelector("[data-current]")?.textContent;
          return new DOMRect(
            0,
            0,
            currentContent?.includes("Viewport second step") ? 240 : 200,
            currentContent?.includes("Viewport second step") ? 160 : 100,
          );
        }

        return new DOMRect();
      },
    );

    const user = userEvent.setup();
    render(<ViewportFixture />);
    await user.click(
      screen.getByRole("button", { name: "Start viewport tour" }),
    );
    await screen.findByRole("dialog", { name: "Viewport first step" });

    const popup = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-popup"]',
    );
    const positioner = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-positioner"]',
    );
    const viewport = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-viewport"]',
    );
    let finishAnimation = () => {};
    const finished = new Promise<void>((resolve) => {
      finishAnimation = resolve;
    });
    Object.defineProperty(positioner, "getAnimations", {
      configurable: true,
      value: () =>
        positioner?.getAttribute("data-phase") === "positioning" &&
        popup?.querySelector("[data-current]")?.textContent?.includes(
          "Viewport second step",
        )
          ? [{ finished, playState: "running" }]
          : [],
    });

    await user.click(
      screen.getByRole("button", { name: "Next viewport step" }),
    );

    await waitFor(() => expect(viewport).toHaveAttribute("data-transitioning"));
    expect(viewport).toHaveAttribute("data-motion-state", "repositioning");
    expect(viewport).toHaveAttribute("data-step-index", "1");
    expect(viewport).toHaveAttribute("data-step-count", "2");
    expect(viewport).toHaveAttribute("data-last-step");
    expect(viewport).not.toHaveAttribute("data-motionstate");
    expect(viewport).not.toHaveAttribute("data-stepindex");
    expect(viewport).not.toHaveAttribute("data-stepcount");
    expect(viewport).not.toHaveAttribute("data-islaststep");
    expect(
      document.querySelector('[data-slot="coachmark-viewport"]'),
    ).toBe(viewport);
    expect(viewport).toHaveAttribute(
      "data-activation-direction",
      "right down",
    );
    expect(positioner).toHaveAttribute("data-motion-state", "repositioning");
    expect(positioner?.style.getPropertyValue("--positioner-width")).toBe(
      "240px",
    );
    expect(positioner?.style.getPropertyValue("--positioner-height")).toBe(
      "160px",
    );
    expect(viewport?.querySelector("[data-current]")).toHaveTextContent(
      "Viewport second step",
    );
    const previousContent = viewport?.querySelector<HTMLElement>(
      "[data-previous]",
    );
    expect(previousContent).toHaveAttribute("aria-hidden", "true");
    expect(previousContent).toHaveAttribute("inert");
    expect(previousContent).toHaveTextContent("Viewport first step");
    expect(previousContent?.style.getPropertyValue("--popup-width")).toBe(
      "200px",
    );
    expect(previousContent?.style.getPropertyValue("--popup-height")).toBe(
      "100px",
    );

    finishAnimation();
    await waitFor(() =>
      expect(positioner).toHaveAttribute("data-motion-state", "idle"),
    );
    expect(viewport).not.toHaveAttribute("data-transitioning");
    expect(viewport?.querySelector("[data-previous]")).toBeNull();
  });

  it("cancels a pending step change when the tour closes", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(<Fixture onStepChange={onStepChange} />);
    const secondTarget = screen.getByRole("button", { name: "Second target" });
    const secondScroll = mockScrollIntoView(secondTarget);
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 900 });

    await user.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(secondScroll).toHaveBeenCalledOnce());
    fireEvent.keyDown(document, { key: "Escape" });
    document.dispatchEvent(new Event("scrollend"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onStepChange).not.toHaveBeenCalledWith(1);
  });

  it("commits after scroll events settle when scrollend is unavailable", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const secondTarget = screen.getByRole("button", { name: "Second target" });
    const secondScroll = mockScrollIntoView(secondTarget);
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 900 });

    await user.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(secondScroll).toHaveBeenCalledOnce());
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 20 });
    document.dispatchEvent(new Event("scroll"));

    expect(
      document.querySelector('[data-slot="coachmark-popup"]'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("dialog", { name: "Second feature" }),
    ).toBeInTheDocument();
  });

  it("stages an externally controlled step change before revealing it", async () => {
    const { rerender } = render(<ControlledStepFixture stepIndex={0} />);
    const firstTarget = screen.getByRole("button", {
      name: "Controlled first target",
    });
    const secondTarget = screen.getByRole("button", {
      name: "Controlled second target",
    });
    mockElementRect(firstTarget, { height: 40, width: 120, x: 20, y: 20 });
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 900 });
    const secondScroll = mockScrollIntoView(secondTarget);

    await screen.findByRole("dialog", { name: "Controlled first step" });
    const backdrop = document.querySelector('[data-slot="coachmark-backdrop"]');

    rerender(<ControlledStepFixture stepIndex={1} />);

    await waitFor(() => expect(secondScroll).toHaveBeenCalledOnce());
    expect(
      screen.queryByRole("dialog", { name: "Controlled second step" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="coachmark-backdrop"]')).toBe(
      backdrop,
    );
    expect(backdrop).toHaveStyle({ clipPath: "none" });

    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 20 });
    document.dispatchEvent(new Event("scrollend"));

    expect(
      await screen.findByRole("dialog", { name: "Controlled second step" }),
    ).toBeInTheDocument();
  });

  it("disables smooth target scrolling when reduced motion is preferred", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    const user = userEvent.setup();
    render(<ScrollFixture />);
    const target = screen.getByRole("button", { name: "Scroll target" });
    const scrollIntoView = mockScrollIntoView(target);
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 900 });

    await user.click(
      screen.getByRole("button", { name: "Start scroll tour" }),
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "instant",
      block: "center",
      inline: "nearest",
    });
  });

  it("does not wait for rendered step motion when reduced motion is preferred", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    const user = userEvent.setup();
    render(<Fixture />);
    const firstTarget = screen.getByRole("button", { name: "First target" });
    const secondTarget = screen.getByRole("button", { name: "Second target" });
    mockElementRect(firstTarget, { height: 40, width: 120, x: 20, y: 20 });
    mockElementRect(secondTarget, { height: 40, width: 120, x: 20, y: 20 });

    await user.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });

    const positioner = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-positioner"]',
    );
    Object.defineProperty(positioner, "getAnimations", {
      configurable: true,
      value: () => [
        {
          finished: new Promise<void>(() => {}),
          playState: "running",
        },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByRole("dialog", { name: "Second feature" }),
    ).toBeInTheDocument();
  });

  it("exposes motion state on every animated part", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });

    for (const slot of ["backdrop", "positioner", "popup"]) {
      const element = document.querySelector(
        `[data-slot="coachmark-${slot}"]`,
      );
      expect(element).toHaveAttribute("data-motion-state", "idle");
      expect(element).not.toHaveAttribute("data-animate");
    }

    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-backdrop"]',
    );
    const openCutout = backdrop?.style.getPropertyValue(
      "--coachmark-cutout-open",
    );
    const closedCutout = backdrop?.style.getPropertyValue(
      "--coachmark-cutout-closed",
    );
    expect(openCutout).toContain("path(evenodd");
    expect(closedCutout).toContain("path(evenodd");
    expect(closedCutout).not.toBe(openCutout);
    expect(backdrop?.style.clipPath).toBe(
      "var(--coachmark-cutout-path, var(--coachmark-cutout-open))",
    );
  });

  it("uses padding without rounding the spotlight by default", async () => {
    render(<Fixture />);
    const target = screen.getByRole("button", { name: "First target" });
    mockElementRect(target, { height: 40, width: 120, x: 20, y: 20 });

    await userEvent.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "First feature" });

    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-backdrop"]',
    );
    expect(
      backdrop?.style.getPropertyValue("--coachmark-cutout-open"),
    ).toContain("M 12 12 H 148 Q 148 12 148 12");
  });

  it("measures the first spotlight when its target renders after the coachmark", async () => {
    const user = userEvent.setup();
    render(<LateTargetFixture />);

    await user.click(screen.getByRole("button", { name: "Start late tour" }));

    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="coachmark-backdrop"]',
    );
    expect(backdrop).not.toBeNull();
    expect(backdrop?.style.visibility).toBe("");
    expect(backdrop?.style.clipPath).not.toBe("");
  });

  it("retries the first spotlight measurement for an initially open tour", async () => {
    render(<LateTargetFixture defaultOpen />);

    await waitFor(() => {
      const backdrop = document.querySelector<HTMLElement>(
        '[data-slot="coachmark-backdrop"]',
      );
      expect(backdrop?.style.visibility).toBe("");
      expect(backdrop?.style.clipPath).not.toBe("");
    });
  });

  it("opens a tour and advances between anchored steps", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(<Fixture onStepChange={onStepChange} />);

    await user.click(screen.getByRole("button", { name: "Start tour" }));

    expect(
      await screen.findByRole("dialog", { name: "First feature" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    for (const element of [
      screen.getByText("Step 1 of 2"),
      screen.getByRole("button", { name: "Next" }),
    ]) {
      expect(element).toHaveAttribute("data-step-index", "0");
      expect(element).toHaveAttribute("data-step-count", "2");
      expect(element).toHaveAttribute("data-first-step");
      expect(element).not.toHaveAttribute("data-last-step");
      expect(element).not.toHaveAttribute("data-stepindex");
      expect(element).not.toHaveAttribute("data-stepcount");
      expect(element).not.toHaveAttribute("data-isfirststep");
      expect(element).not.toHaveAttribute("data-islaststep");
    }
    expect(screen.getByRole("img", { name: "Feature preview" })).toBeVisible();
    const arrow = document.querySelector('[data-slot="coachmark-arrow"]');
    expect(arrow).toHaveClass("tour-arrow");
    expect(arrow).toHaveAttribute("aria-hidden", "true");
    expect(arrow).toHaveAttribute("data-side", "bottom");
    expect(
      screen.getByRole("heading", { name: "First feature" }),
    ).toHaveAttribute("data-slot", "coachmark-title");
    expect(screen.getByText("This is the first step.")).toHaveAttribute(
      "data-slot",
      "coachmark-description",
    );
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.getByRole("button", { name: "Skip" })).toHaveAttribute(
      "data-slot",
      "coachmark-close",
    );
    expect(screen.getByRole("button", { name: "Close tour" })).toHaveAttribute(
      "data-slot",
      "coachmark-close",
    );
    const positioner = document.querySelector(
      '[data-slot="coachmark-positioner"]',
    );
    const popup = document.querySelector('[data-slot="coachmark-popup"]');

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByRole("dialog", { name: "Second feature" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="coachmark-positioner"]'),
    ).toBe(positioner);
    expect(document.querySelector('[data-slot="coachmark-popup"]')).toBe(
      popup,
    );
    expect(document.querySelector('[data-slot="coachmark-arrow"]')).toBeNull();
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(
      screen.getByRole("button", { name: "Finish" }),
    ).toHaveAttribute("data-custom-button");
    for (const element of [
      screen.getByText("Step 2 of 2"),
      screen.getByRole("button", { name: "Back" }),
      screen.getByRole("button", { name: "Finish" }),
    ]) {
      expect(element).toHaveAttribute("data-motion-state", "idle");
      expect(element).toHaveAttribute("data-step-index", "1");
      expect(element).toHaveAttribute("data-step-count", "2");
      expect(element).toHaveAttribute("data-last-step");
      expect(element).not.toHaveAttribute("data-first-step");
      expect(element).not.toHaveAttribute("data-motionstate");
      expect(element).not.toHaveAttribute("data-stepindex");
      expect(element).not.toHaveAttribute("data-stepcount");
      expect(element).not.toHaveAttribute("data-isfirststep");
      expect(element).not.toHaveAttribute("data-islaststep");
    }
  });

  it("closes early regardless of how the close action is presented", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const trigger = screen.getByRole("button", { name: "Start tour" });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "First feature" });
    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("finishes the last step and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const trigger = screen.getByRole("button", { name: "Start tour" });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "First feature" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("dialog", { name: "Second feature" });
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("honors the active step's initialFocus", async () => {
    const user = userEvent.setup();
    render(<FocusFixture initialFocus />);

    await user.click(screen.getByRole("button", { name: "Start focus tour" }));

    expect(
      await screen.findByRole("button", { name: "Initial action" }),
    ).toHaveFocus();
  });

  it("honors a custom finalFocus target", async () => {
    const user = userEvent.setup();
    render(<FocusFixture finalFocus="destination" />);

    await user.click(screen.getByRole("button", { name: "Start focus tour" }));
    await user.click(
      await screen.findByRole("button", { name: "Close focus tour" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "After tour" })).toHaveFocus();
  });

  it("does not return focus when finalFocus is false", async () => {
    const user = userEvent.setup();
    render(<FocusFixture finalFocus="none" />);

    const trigger = screen.getByRole("button", { name: "Start focus tour" });
    await user.click(trigger);
    await user.click(
      await screen.findByRole("button", { name: "Close focus tour" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).not.toHaveFocus();
  });
});
