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

afterEach(() => vi.restoreAllMocks());

function InteractionFixture({
  backdrop = false,
  modal,
  onOpenChange,
  controlled = false,
  registerMenu = true,
}: {
  backdrop?: boolean;
  modal?: CoachmarkProps["modal"];
  onOpenChange?: CoachmarkProps["onOpenChange"];
  controlled?: boolean;
  registerMenu?: boolean;
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
        modal={modal}
        scrollIntoView={false}
        open={controlled ? open : undefined}
        onOpenChange={(nextOpen, details) => {
          onOpenChange?.(nextOpen, details);
          if (!details.isCanceled) setOpen(nextOpen);
        }}
      >
        <Coachmark.Trigger>Start interaction tour</Coachmark.Trigger>
        {backdrop && <Coachmark.Backdrop data-testid="backdrop" />}
        <Coachmark.Step
          target={target}
          interactionRefs={registerMenu ? [menu] : undefined}
        >
          <Coachmark.Positioner>
            <Coachmark.Popup>
              <Coachmark.Title>Try the controls</Coachmark.Title>
              <Coachmark.Close>Close tour</Coachmark.Close>
              <Coachmark.Next>Next step</Coachmark.Next>
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

describe("nonmodal target interaction", () => {
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
    await user.click(screen.getByTestId("backdrop"));
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
      render(<InteractionFixture modal={modal} />);
      const user = await startTour();
      const target = screen.getByText("Enable terrain");
      expect(target.closest('[aria-hidden="true"]')).not.toBeNull();
      // JSDOM cannot hit-test the modal overlay, so dispatch an outside press directly.
      await user.click(target);
      expect(screen.queryByRole("dialog")).toBeNull();
    },
  );
});
