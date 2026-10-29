import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createPortal } from "react-dom";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Coachmark, type CoachmarkProps } from "../src";
import { Popover } from "@base-ui/react/popover";

afterEach(() => vi.restoreAllMocks());

function InteractionFixture({
  backdrop = false,
  modal = false,
  allowTargetInteraction,
  stepAllowTargetInteraction,
  onOpenChange,
  controlled = false,
  registerMenu = true,
  onBackdropClick,
  withNestedPopup = false,
}: {
  backdrop?: boolean;
  modal?: CoachmarkProps["modal"] | "default";
  allowTargetInteraction?: boolean;
  stepAllowTargetInteraction?: boolean;
  onOpenChange?: CoachmarkProps["onOpenChange"];
  controlled?: boolean;
  registerMenu?: boolean;
  onBackdropClick?: () => void;
  withNestedPopup?: boolean;
}) {
  const target = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const secondTarget = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selection, setSelection] = useState("None");
  const [outsideCount, setOutsideCount] = useState(0);
  return (
    <>
      <div ref={target}>
        <label>
          <input type="checkbox" />
          Enable terrain
        </label>
        <label>
          Opacity
          <input type="range" defaultValue="30" />
        </label>
        <button type="button" onClick={() => setMenuOpen(!menuOpen)}>
          Open menu
        </button>
        <output aria-label="Selection">{selection}</output>
      </div>
      <button ref={secondTarget} type="button">
        Second target
      </button>
      <button type="button" onClick={() => setOutsideCount(outsideCount + 1)}>
        Outside action {outsideCount}
      </button>
      {menuOpen &&
        createPortal(
          <div
            ref={menu}
            style={{ position: "fixed", zIndex: 20 }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                setMenuOpen(false);
                target.current?.querySelector("button")?.focus();
              }
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelection("Satellite");
                setMenuOpen(false);
                target.current?.querySelector("button")?.focus();
              }}
            >
              Satellite
            </button>
          </div>,
          document.body,
        )}
      <Coachmark.Root
        modal={modal === "default" ? undefined : modal}
        allowTargetInteraction={allowTargetInteraction}
        scrollIntoView={false}
        open={controlled ? open : undefined}
        onOpenChange={(nextOpen, details) => {
          onOpenChange?.(nextOpen, details);
          if (!details.isCanceled) setOpen(nextOpen);
        }}
      >
        <Coachmark.Trigger>Start interaction tour</Coachmark.Trigger>
        {backdrop && (
          <Coachmark.Backdrop
            data-testid="backdrop"
            onClick={onBackdropClick}
          />
        )}
        <Coachmark.Step
          target={target}
          allowTargetInteraction={stepAllowTargetInteraction}
          interactionRefs={registerMenu ? [menu] : undefined}
        >
          <Coachmark.Positioner>
            <Coachmark.Popup>
              <Coachmark.Title>Try the controls</Coachmark.Title>
              <Coachmark.Close>Close tour</Coachmark.Close>
              <Coachmark.Next>Next step</Coachmark.Next>
              {withNestedPopup && (
                <Popover.Root modal>
                  <Popover.Trigger>Open nested popup</Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Positioner>
                      <Popover.Popup>
                        <Popover.Title>Nested control</Popover.Title>
                        <Popover.Close>Close nested popup</Popover.Close>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </Popover.Root>
              )}
            </Coachmark.Popup>
          </Coachmark.Positioner>
        </Coachmark.Step>
        <Coachmark.Step target={secondTarget}>
          <Coachmark.Positioner>
            <Coachmark.Popup>
              <Coachmark.Title>Second step</Coachmark.Title>
              <Coachmark.Close>Close tour</Coachmark.Close>
              <Coachmark.Next>Finish tour</Coachmark.Next>
            </Coachmark.Popup>
          </Coachmark.Positioner>
        </Coachmark.Step>
      </Coachmark.Root>
    </>
  );
}

async function startTour() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Start interaction tour" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "idle"),
  );
  return user;
}

function StackedModalFixture() {
  const first = useRef<HTMLButtonElement>(null);
  const second = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={first}>First stacked target</button>
      <button ref={second}>Second stacked target</button>
      {[first, second].map((target, index) => (
        <Coachmark.Root key={index} defaultOpen scrollIntoView={false}>
          <Coachmark.Step target={target}>
            <Coachmark.Positioner>
              <Coachmark.Popup>
                <Coachmark.Title>Modal {index + 1}</Coachmark.Title>
                <Coachmark.Close>Close modal {index + 1}</Coachmark.Close>
              </Coachmark.Popup>
            </Coachmark.Positioner>
          </Coachmark.Step>
        </Coachmark.Root>
      ))}
    </>
  );
}

function ControlledStepFixture() {
  const first = useRef<HTMLButtonElement>(null);
  const second = useRef<HTMLButtonElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  return (
    <>
      <button ref={first} onClick={() => setStepIndex(1)}>
        Advance from target
      </button>
      <button ref={second}>Controlled second target</button>
      <Coachmark.Root defaultOpen stepIndex={stepIndex} scrollIntoView={false}>
        {[first, second].map((target, index) => (
          <Coachmark.Step key={index} target={target}>
            <Coachmark.Positioner>
              <Coachmark.Popup>
                <Coachmark.Title>Controlled step {index + 1}</Coachmark.Title>
                <Coachmark.Close>Close controlled tour</Coachmark.Close>
              </Coachmark.Popup>
            </Coachmark.Positioner>
          </Coachmark.Step>
        ))}
      </Coachmark.Root>
    </>
  );
}

describe("nonmodal target interaction", () => {
  it("removes the target exemption when interaction is disabled", async () => {
    render(<InteractionFixture allowTargetInteraction={false} />);
    const user = await startTour();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it.each([false, true])(
    "keeps target operations open with backdrop=%s",
    async (backdrop) => {
      const onOpenChange = vi.fn();
      render(
        <InteractionFixture backdrop={backdrop} onOpenChange={onOpenChange} />,
      );
      const user = await startTour();
      onOpenChange.mockClear();
      const dialog = screen.getByRole("dialog");
      await user.click(screen.getByRole("checkbox"));
      expect(screen.getByRole("checkbox")).toBeChecked();
      fireEvent.change(screen.getByRole("slider"), { target: { value: "65" } });
      expect(screen.getByRole("slider")).toHaveValue("65");
      expect(screen.getByRole("dialog")).toBe(dialog);
      expect(dialog).toHaveAccessibleName("Try the controls");
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("checkbox").closest('[aria-hidden="true"]'),
      ).toBeNull();
    },
  );

  it("also keeps a controlled tour open on target interaction", async () => {
    const onOpenChange = vi.fn();
    render(<InteractionFixture controlled onOpenChange={onOpenChange} />);
    const user = await startTour();
    onOpenChange.mockClear();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("operates unrelated controls and dismisses without a backdrop", async () => {
    const onOpenChange = vi.fn();
    render(<InteractionFixture onOpenChange={onOpenChange} />);
    const user = await startTour();
    onOpenChange.mockClear();
    await user.click(screen.getByRole("button", { name: "Outside action 0" }));
    expect(
      screen.getByRole("button", { name: "Outside action 1" }),
    ).toBeVisible();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({
        reason: expect.stringMatching(/^(outside-press|focus-out)$/),
      }),
    );
  });

  it("dismisses when the backdrop is clicked", async () => {
    render(<InteractionFixture backdrop />);
    const user = await startTour();
    await user.click(
      screen.getByTestId("backdrop").lastElementChild as HTMLElement,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Outside action 0" }),
    ).toBeVisible();
  });

  it("reads a registered portal ref when its menu mounts after opening", async () => {
    const onOpenChange = vi.fn();
    render(<InteractionFixture onOpenChange={onOpenChange} />);
    const user = await startTour();
    onOpenChange.mockClear();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Satellite" }));
    expect(screen.getByLabelText("Selection")).toHaveTextContent("Satellite");
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not exempt an unregistered portal from outside dismissal", async () => {
    render(<InteractionFixture registerMenu={false} />);
    const user = await startTour();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Satellite" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("preserves popup-to-target focus and dismisses on leaving the target", async () => {
    const onOpenChange = vi.fn();
    render(<InteractionFixture onOpenChange={onOpenChange} />);
    await startTour();
    onOpenChange.mockClear();
    await act(async () =>
      screen.getByRole("button", { name: "Close tour" }).focus(),
    );
    await act(async () => screen.getByRole("checkbox").focus());
    expect(screen.getByRole("checkbox")).toHaveFocus();
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () =>
      screen.getByRole("button", { name: "Outside action 0" }).focus(),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
      false,
      expect.objectContaining({
        reason: "focus-out",
        event: expect.any(FocusEvent),
      }),
    );
  });

  it("lets applications cancel outside presses and focus-out without disabling Escape", async () => {
    const onOpenChange = vi.fn<NonNullable<CoachmarkProps["onOpenChange"]>>(
      (open, details) => {
        if (
          !open &&
          (details.reason === "outside-press" || details.reason === "focus-out")
        )
          details.cancel();
      },
    );
    render(<InteractionFixture onOpenChange={onOpenChange} />);
    const user = await startTour();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Outside action 0" }));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Outside action 1" }),
    ).toBeVisible();
    await act(async () => screen.getByRole("checkbox").focus());
    await act(async () =>
      screen.getByRole("button", { name: "Outside action 1" }).focus(),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(
      onOpenChange.mock.calls.some(
        ([, details]) => details.reason === "focus-out" && details.isCanceled,
      ),
    ).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes through its trigger after target interaction", async () => {
    render(<InteractionFixture />);
    const user = await startTour();
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Start interaction tour" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lets a target-owned menu consume Escape before the tour", async () => {
    render(<InteractionFixture />);
    const user = await startTour();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Satellite" }));
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await act(async () =>
      screen.getByRole("button", { name: "Satellite" }).focus(),
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Satellite" })).toBeNull();
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps a drag that starts on the target open when released outside", async () => {
    render(<InteractionFixture />);
    const user = await startTour();
    const outside = screen.getByRole("button", { name: "Outside action 0" });
    await user.pointer([
      { keys: "[MouseLeft>]", target: screen.getByRole("slider") },
      { keys: "[/MouseLeft]", target: outside },
    ]);
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.click(outside);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("provides a keyboard route to the target and back without trapping page focus", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      new DOMRect(0, 0, 100, 40),
    ] as unknown as DOMRectList);
    render(<InteractionFixture />);
    const user = await startTour();
    const next = screen.getByRole("button", { name: "Next step" });
    await act(async () => next.focus());
    await user.tab();
    expect(screen.getByRole("checkbox")).toHaveFocus();
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.tab({ shift: true });
    expect(next).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("slider")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Second target" })).toHaveFocus();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps touch gestures open and clears their ownership on cancellation", async () => {
    render(<InteractionFixture />);
    await startTour();
    const slider = screen.getByRole("slider");
    const outside = screen.getByRole("button", { name: "Outside action 0" });
    fireEvent.touchStart(slider, { touches: [{ identifier: 1 }] });
    fireEvent.touchEnd(outside, { touches: [] });
    expect(screen.getByRole("dialog")).toBeVisible();
    fireEvent.pointerDown(slider, { pointerId: 1, pointerType: "touch" });
    fireEvent.pointerCancel(slider, { pointerId: 1, pointerType: "touch" });
    fireEvent.click(outside);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each(["target", "menu"] as const)(
    "does not retain the previous step's %s exemption",
    async (region) => {
      render(<InteractionFixture />);
      const user = await startTour();
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      await user.click(screen.getByRole("button", { name: "Next step" }));
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toHaveAccessibleName("Second step"),
      );
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toHaveAttribute(
          "data-phase",
          "idle",
        ),
      );
      await user.click(
        region === "target"
          ? screen.getByRole("checkbox")
          : screen.getByRole("button", { name: "Satellite" }),
      );
      expect(screen.queryByRole("dialog")).toBeNull();
    },
  );

  it.each([true, "trap-focus"] as const)(
    "retains popup-only focus management for modal=%s",
    async (modal) => {
      render(
        <InteractionFixture modal={modal} allowTargetInteraction={false} />,
      );
      const user = await startTour();
      const target = screen.getByText("Enable terrain");
      expect(target.closest('[aria-hidden="true"]')).not.toBeNull();
      // JSDOM cannot hit-test the modal overlay, so dispatch an outside press directly.
      await user.click(target);
      expect(screen.queryByRole("dialog")).toBeNull();
    },
  );
});

describe("modal target interaction", () => {
  it("permits a background pinch gesture without dismissing the modal", async () => {
    const onOpenChange = vi.fn();
    render(<InteractionFixture modal="default" onOpenChange={onOpenChange} />);
    await startTour();
    onOpenChange.mockClear();
    const outside = screen.getByText("Outside action 0");
    const touches = [
      { identifier: 1, clientX: 10, clientY: 10 },
      { identifier: 2, clientX: 40, clientY: 40 },
    ];
    fireEvent.touchStart(outside, { touches });
    expect(fireEvent.touchMove(outside, { touches })).toBe(true);
    fireEvent.touchEnd(outside, { touches: [] });
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
  it("recognizes Base UI portals owned by the instructions without extra refs", async () => {
    const onOpenChange = vi.fn();
    render(
      <InteractionFixture
        modal="default"
        withNestedPopup
        onOpenChange={onOpenChange}
      />,
    );
    const user = await startTour();
    onOpenChange.mockClear();
    await user.click(screen.getByRole("button", { name: "Open nested popup" }));
    await screen.findByRole("dialog", { name: "Nested control" });
    await user.tab();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Nested control" }),
      ).toBeNull(),
    );
    expect(
      screen.getByRole("dialog", { name: "Try the controls" }),
    ).toBeVisible();
    expect(document.body).toHaveAttribute("data-scroll-locked");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
  it("moves focus into the new boundary on a controlled step change", async () => {
    render(<ControlledStepFixture />);
    const user = userEvent.setup();
    await screen.findByRole("dialog", { name: "Controlled step 1" });
    await user.click(
      screen.getByRole("button", { name: "Advance from target" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Controlled step 2" }),
    ).toHaveFocus();
    expect(document.body).toHaveAttribute("data-scroll-locked");
  });
  it("suspends an underlying modal boundary and restores it after closing the top tour", async () => {
    render(<StackedModalFixture />);
    const user = userEvent.setup();
    await screen.findByRole("dialog", { name: "Modal 2" });
    expect(screen.queryByRole("dialog", { name: "Modal 1" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Close modal 2" }));
    await screen.findByRole("dialog", { name: "Modal 1" });
    expect(document.body).toHaveAttribute("data-scroll-locked");
    await user.click(screen.getByRole("button", { name: "Close modal 1" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });
  it("preserves backdrop handlers and cancelable dismissal", async () => {
    const onBackdropClick = vi.fn();
    render(
      <InteractionFixture
        modal="default"
        backdrop
        onBackdropClick={onBackdropClick}
        onOpenChange={(open, details) => {
          if (!open && details.reason === "outside-press") details.cancel();
        }}
      />,
    );
    const user = await startTour();
    await user.click(
      screen.getByTestId("backdrop").lastElementChild as HTMLElement,
    );
    expect(onBackdropClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("keeps focus on the instructions when step controls are replaced", async () => {
    render(<InteractionFixture modal="default" />);
    const user = await startTour();
    await user.click(screen.getByRole("button", { name: "Next step" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveAttribute("data-phase", "idle"),
    );
    expect(screen.getByRole("dialog", { name: "Second step" })).toHaveFocus();
    expect(document.body).toHaveAttribute("data-scroll-locked");
  });

  it.each([false, true])(
    "defaults to interactive targets and blocked background with backdrop=%s",
    async (backdrop) => {
      render(<InteractionFixture modal="default" backdrop={backdrop} />);
      const user = await startTour();
      await user.click(screen.getByRole("checkbox"));
      expect(screen.getByRole("checkbox")).toBeChecked();
      expect(screen.getByRole("dialog")).toBeVisible();
      expect(document.body).toHaveAttribute("data-scroll-locked");
      const outside = screen.getByText("Outside action 0");
      expect(outside.closest('[aria-hidden="true"]')).not.toBeNull();
      fireEvent.click(outside);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Outside action 0" }),
      ).toBeVisible();
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
    },
  );

  it("can cancel outside dismissal without activating the background control", async () => {
    const onOpenChange = vi.fn<NonNullable<CoachmarkProps["onOpenChange"]>>(
      (open, details) => {
        if (!open && details.reason === "outside-press") details.cancel();
      },
    );
    render(<InteractionFixture modal="default" onOpenChange={onOpenChange} />);
    const user = await startTour();
    onOpenChange.mockClear();
    fireEvent.click(screen.getByText("Outside action 0"));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
      false,
      expect.objectContaining({
        reason: "outside-press",
        event: expect.any(MouseEvent),
        isCanceled: true,
      }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(document.body).toHaveAttribute("data-scroll-locked");
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Outside action 0" }),
    ).toBeVisible();
  });

  it("keeps keyboard focus within the popup, target, and associated menu", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      new DOMRect(0, 0, 100, 40),
    ] as unknown as DOMRectList);
    const onOpenChange = vi.fn();
    render(<InteractionFixture modal="default" onOpenChange={onOpenChange} />);
    const user = await startTour();
    onOpenChange.mockClear();
    await act(async () =>
      screen.getByRole("button", { name: "Next step" }).focus(),
    );
    await user.tab();
    expect(screen.getByRole("checkbox")).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Next step" })).toHaveFocus();
    await act(async () =>
      screen.getByRole("button", { name: "Open menu" }).focus(),
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Close tour" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    await act(async () => screen.getByText("Outside action 0").focus());
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menuItem = await screen.findByRole("button", { name: "Satellite" });
    await act(async () => menuItem.focus());
    expect(menuItem).toHaveFocus();
    await user.click(menuItem);
    expect(screen.getByLabelText("Selection")).toHaveTextContent("Satellite");
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("supports a step enabling target interaction over a restrictive root", async () => {
    render(
      <InteractionFixture
        modal="default"
        allowTargetInteraction={false}
        stepAllowTargetInteraction
      />,
    );
    const user = await startTour();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("supports a step opting out of target interaction", async () => {
    render(
      <InteractionFixture modal="default" stepAllowTargetInteraction={false} />,
    );
    await startTour();
    expect(
      screen.getByText("Enable terrain").closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  it("expands trap-focus mode without locking page scroll", async () => {
    render(<InteractionFixture modal="trap-focus" />);
    const user = await startTour();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });

  it("restores accessibility and scroll state when unmounted while open", async () => {
    const { unmount } = render(<InteractionFixture modal="default" />);
    await startTour();
    expect(document.body).toHaveAttribute("data-scroll-locked");
    unmount();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
