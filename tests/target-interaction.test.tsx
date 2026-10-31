import { forwardRef, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Coachmark } from "../src";

function PopupContent({ title }: { title: string }) {
  return (
    <Coachmark.Positioner>
      <Coachmark.Popup>
        <Coachmark.Title>{title}</Coachmark.Title>
        <Coachmark.Close>Close settings tour</Coachmark.Close>
        <Coachmark.Next>
          {({ isLastStep }) =>
            isLastStep ? "Finish settings tour" : "Next settings step"
          }
        </Coachmark.Next>
      </Coachmark.Popup>
    </Coachmark.Positioner>
  );
}

function RegionFixture({
  policy,
  modal = true,
}: {
  policy?: boolean;
  modal?: boolean;
}) {
  const [tour] = useState(Coachmark.createHandle);
  const [checked, setChecked] = useState(false);
  const [saves, setSaves] = useState(0);
  return (
    <>
      <Coachmark.Target
        handle={tour}
        name="settings"
        data-testid="settings-region"
        render={<section aria-label="Settings" />}
      >
        <label>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          Notifications
        </label>
        <button onClick={() => setSaves((value) => value + 1)}>
          Save settings
        </button>
        <output data-testid="save-count">{saves}</output>
        <div
          style={{ maxHeight: 100, overflow: "auto" }}
          data-testid="settings-scroll"
        >
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>Setting {i + 1}</p>
          ))}
        </div>
      </Coachmark.Target>
      <Coachmark.Root handle={tour} modal={modal} scrollIntoView={false}>
        <Coachmark.Trigger>Start settings tour</Coachmark.Trigger>
        <Coachmark.Step
          target="settings"
          order={0}
          allowTargetInteraction={policy}
        >
          <PopupContent title="Settings introduction" />
        </Coachmark.Step>
      </Coachmark.Root>
    </>
  );
}

async function idle() {
  await waitFor(() =>
    expect(
      document.querySelector('[data-slot="coachmark-popup"]'),
    ).toHaveAttribute("data-phase", "idle"),
  );
}

describe("target regions and step interaction", () => {
  it("preserves container semantics and native child control behavior", async () => {
    const user = userEvent.setup();
    render(<RegionFixture />);
    const region = screen.getByTestId("settings-region");
    expect(region.tagName).toBe("SECTION");
    for (const attribute of [
      "role",
      "tabindex",
      "aria-haspopup",
      "aria-expanded",
      "aria-controls",
    ])
      expect(region).not.toHaveAttribute(attribute);
    expect(fireEvent.keyDown(region, { key: " " })).toBe(true);
    await user.click(screen.getByRole("checkbox", { name: "Notifications" }));
    await user.click(screen.getByRole("button", { name: "Save settings" }));
    expect(screen.getByTestId("save-count")).toHaveTextContent("1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Start settings tour" }),
    );
    await idle();
    expect(region).not.toHaveAttribute("inert");
    expect(region.closest('[aria-hidden="true"]')).toBeNull();
    await user.click(screen.getByRole("checkbox", { name: "Notifications" }));
    expect(
      screen.getByRole("checkbox", { name: "Notifications" }),
    ).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save settings" }));
    expect(screen.getByTestId("save-count")).toHaveTextContent("2");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it.each([true, false])(
    "changes the same region from blocked to interactive and back (modal=%s)",
    async (modal) => {
      function App() {
        return (
          <Coachmark.Root modal={modal} scrollIntoView={false}>
            <Coachmark.Target name="settings" data-testid="shared-region">
              <input aria-label="Project name" defaultValue="Original" />
              <button>Project action</button>
            </Coachmark.Target>
            <Coachmark.Trigger>Start mixed tour</Coachmark.Trigger>
            {[false, true, false].map((allow, index) => (
              <Coachmark.Step
                key={index}
                target="settings"
                order={index}
                allowTargetInteraction={allow}
              >
                <PopupContent title={`Policy step ${index}`} />
              </Coachmark.Step>
            ))}
          </Coachmark.Root>
        );
      }
      const user = userEvent.setup();
      render(<App />);
      const region = screen.getByTestId("shared-region");
      const input = screen.getByRole("textbox", { name: "Project name" });
      await user.click(
        screen.getByRole("button", { name: "Start mixed tour" }),
      );
      await idle();
      expect(region).toHaveAttribute("inert");
      await user.click(
        screen.getByRole("button", { name: "Next settings step" }),
      );
      await idle();
      expect(region).toBe(screen.getByTestId("shared-region"));
      expect(region).not.toHaveAttribute("inert");
      expect(region.closest('[aria-hidden="true"]')).toBeNull();
      await user.type(input, " updated");
      expect(input).toHaveValue("Original updated");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Next settings step" }),
      );
      await idle();
      expect(region).toHaveAttribute("inert");
      expect(input).toHaveValue("Original updated");
      await user.click(
        screen.getByRole("button", { name: "Finish settings tour" }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(region).not.toHaveAttribute("inert");
      expect(input).toHaveValue("Original updated");
    },
  );

  it("moves focus back to the popup when a live policy change blocks the focused target", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RegionFixture policy />);
    await user.click(
      screen.getByRole("button", { name: "Start settings tour" }),
    );
    await idle();
    screen.getByRole("checkbox", { name: "Notifications" }).focus();
    rerender(<RegionFixture policy={false} />);
    await waitFor(() =>
      expect(screen.getByTestId("settings-region")).toHaveAttribute("inert"),
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
    rerender(<RegionFixture policy />);
    await waitFor(() =>
      expect(screen.getByTestId("settings-region")).not.toHaveAttribute(
        "inert",
      ),
    );
    expect(
      screen.getByTestId("settings-region").closest('[aria-hidden="true"]'),
    ).toBeNull();
  });

  it("restores an existing application-owned inert attribute after the tour closes", async () => {
    const user = userEvent.setup();
    render(<RegionFixture policy={false} />);
    const region = screen.getByTestId("settings-region");
    region.setAttribute("inert", "application");
    await user.click(
      screen.getByRole("button", { name: "Start settings tour" }),
    );
    await idle();
    await user.click(
      screen.getByRole("button", { name: "Close settings tour" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(region).toHaveAttribute("inert", "application");
  });

  it("preserves Backdrop event bubbling through the region hit mask", async () => {
    const onPointerDown = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Coachmark.Root scrollIntoView={false} onOpenChange={onOpenChange}>
        <Coachmark.Target name="region">Region content</Coachmark.Target>
        <Coachmark.Trigger>Start backdrop tour</Coachmark.Trigger>
        <Coachmark.Backdrop onPointerDown={onPointerDown} />
        <Coachmark.Step target="region">
          <PopupContent title="Backdrop interaction" />
        </Coachmark.Step>
      </Coachmark.Root>,
    );
    await user.click(
      screen.getByRole("button", { name: "Start backdrop tour" }),
    );
    await idle();
    const backdrop = document.querySelector('[data-slot="coachmark-backdrop"]');
    const mask = document.querySelector(
      '[data-slot="coachmark-interaction-mask"]',
    );
    expect(mask).not.toBeNull();
    expect(backdrop?.contains(mask)).toBe(false);
    fireEvent.pointerDown(mask!);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    await user.click(mask!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.objectContaining({reason:"outside-press"}));
  });

  it("supports custom button renders without injecting popover semantics or validation warnings", async () => {
    const CustomButton = forwardRef<
      HTMLButtonElement,
      React.ComponentProps<"button">
    >((props, ref) => <button {...props} ref={ref} />);
    const onAction = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const user = userEvent.setup();
      render(
        <Coachmark.Root scrollIntoView={false}>
          <Coachmark.Target
            name="custom"
            render={<CustomButton onClick={onAction} aria-pressed={false} />}
          >
            Custom action
          </Coachmark.Target>
          <Coachmark.Trigger>Start custom tour</Coachmark.Trigger>
          <Coachmark.Step target="custom">
            <PopupContent title="Custom control" />
          </Coachmark.Step>
        </Coachmark.Root>,
      );
      const button = screen.getByRole("button", { name: "Custom action" });
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button).not.toHaveAttribute("aria-haspopup");
      expect(button).not.toHaveAttribute("aria-expanded");
      expect(button).not.toHaveAttribute("type");
      button.focus();
      await user.keyboard(" ");
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Start custom tour" }),
      );
      await idle();
      await user.click(button);
      expect(onAction).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
