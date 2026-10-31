import { StrictMode, useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Popover } from "@base-ui/react/popover";
import { Coachmark, type CoachmarkHandle } from "../src";

function TargetControl({
  handle,
  name = "action",
  label = "Application action",
  onAction,
}: {
  handle: CoachmarkHandle;
  name?: string;
  label?: string;
  onAction?: () => void;
}) {
  return (
    <Coachmark.Target
      handle={handle}
      name={name}
      render={<button onClick={onAction} />}
    >
      {label}
    </Coachmark.Target>
  );
}

function Instructions({
  title = "First instructions",
  target = "action",
  order,
}: {
  title?: string;
  target?: string;
  order?: number;
}) {
  return (
    <Coachmark.Step target={target} order={order}>
      <Coachmark.Positioner>
        <Coachmark.Popup>
          <Coachmark.Title>{title}</Coachmark.Title>
          <Coachmark.Close>Dismiss tour</Coachmark.Close>
          <Coachmark.Next>
            {({ isLastStep }) => (isLastStep ? "Finish tour" : "Next step")}
          </Coachmark.Next>
        </Coachmark.Popup>
      </Coachmark.Positioner>
    </Coachmark.Step>
  );
}

function Fixture({
  onAction,
  onOpenChange,
}: {
  onAction?: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [handle] = useState(Coachmark.createHandle);
  return (
    <>
      <TargetControl handle={handle} onAction={onAction} />
      <TargetControl handle={handle} name="second" label="Second action" />
      <Coachmark.Trigger handle={handle}>Detached launcher</Coachmark.Trigger>
      <Coachmark.Root
        handle={handle}
        onOpenChange={onOpenChange}
        scrollIntoView={false}
      >
        <Instructions />
        <Instructions target="second" title="Second instructions" />
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

describe("named tour composition", () => {
  it("connects detached targets, launcher, and component-owned steps without starting on target activation", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <StrictMode>
        <Fixture onAction={onAction} onOpenChange={onOpenChange} />
      </StrictMode>,
    );
    await user.click(
      screen.getByRole("button", { name: "Application action" }),
    );
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Detached launcher" }));
    await idle();
    expect(
      screen.getByRole("heading", { name: "First instructions" }),
    ).toBeInTheDocument();
    const target = screen.getByRole("button", { name: "Application action" });
    expect(target.closest('[aria-hidden="true"]')).toBeNull();
    expect(target).toHaveAttribute("aria-expanded", "true");
    await user.click(target);
    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next step" }));
    await idle();
    expect(
      screen.getByRole("heading", { name: "Second instructions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Second action" }),
    ).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Finish tour" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Detached launcher" }),
    ).toHaveFocus();
  });

  it("scopes repeated names and state to independent sibling Roots", async () => {
    const user = userEvent.setup();
    function Tour({ label }: { label: string }) {
      const [handle] = useState(Coachmark.createHandle);
      return (
        <>
          <TargetControl handle={handle} label={`${label} action`} />
          <Coachmark.Root handle={handle} scrollIntoView={false}>
            <Coachmark.Trigger>{label} launcher</Coachmark.Trigger>
            <Instructions title={`${label} instructions`} />
          </Coachmark.Root>
        </>
      );
    }
    render(
      <>
        <Tour label="First" />
        <Tour label="Second" />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "First launcher" }));
    await idle();
    expect(
      screen.getByRole("heading", { name: "First instructions" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss tour" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Second launcher" }));
    await idle();
    expect(
      screen.getByRole("heading", { name: "Second instructions" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "First instructions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Second action" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("binds a target to its explicit tour even inside an unrelated Base UI Root", async () => {
    const user = userEvent.setup();
    function App() {
      const [handle] = useState(Coachmark.createHandle);
      return (
        <>
          <Popover.Root>
            <TargetControl handle={handle} />
            <Popover.Trigger>Unrelated launcher</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Title>Unrelated popup</Popover.Title>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <Coachmark.Root handle={handle} scrollIntoView={false}>
            <Coachmark.Trigger>Tour launcher</Coachmark.Trigger>
            <Instructions />
          </Coachmark.Root>
        </>
      );
    }
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Application action" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tour launcher" }));
    await idle();
    expect(
      screen.getByRole("button", { name: "Application action" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Unrelated popup")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss tour" }));
    await user.click(
      screen.getByRole("button", { name: "Unrelated launcher" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Unrelated popup" }),
    ).toBeInTheDocument();
  });

  it("uses explicit order rather than component mount order", async () => {
    const user = userEvent.setup();
    render(
      <Coachmark.Root scrollIntoView={false}>
        <Coachmark.Target name="action">Action</Coachmark.Target>
        <Coachmark.Trigger>Ordered launcher</Coachmark.Trigger>
        <Instructions title="Later" order={20} />
        <Instructions title="Earlier" order={10} />
      </Coachmark.Root>,
    );
    await user.click(screen.getByRole("button", { name: "Ordered launcher" }));
    await idle();
    expect(
      screen.getByRole("heading", { name: "Earlier" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next step" }));
    await idle();
    expect(screen.getByRole("heading", { name: "Later" })).toBeInTheDocument();
  });

  it("updates step content without changing registration order", async () => {
    const user = userEvent.setup();
    function App({ title }: { title: string }) {
      return (
        <Coachmark.Root scrollIntoView={false}>
          <Coachmark.Target name="action">Action</Coachmark.Target>
          <Coachmark.Trigger>Content launcher</Coachmark.Trigger>
          <Instructions title={title} />
          <Instructions title="Last instructions" />
        </Coachmark.Root>
      );
    }
    const { rerender } = render(<App title="Original" />);
    await user.click(screen.getByRole("button", { name: "Content launcher" }));
    await idle();
    rerender(<App title="Updated" />);
    expect(
      await screen.findByRole("heading", { name: "Updated" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next step" }));
    await idle();
    expect(
      screen.getByRole("heading", { name: "Last instructions" }),
    ).toBeInTheDocument();
  });

  it("waits for a named target to mount before presenting a default-open tour", async () => {
    function App({ show }: { show: boolean }) {
      return (
        <Coachmark.Root defaultOpen scrollIntoView={false}>
          {show && (
            <Coachmark.Target name="action">Late target</Coachmark.Target>
          )}
          <Instructions />
        </Coachmark.Root>
      );
    }
    const { rerender } = render(<App show={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<App show />);
    await idle();
    expect(
      screen.getByRole("heading", { name: "First instructions" }),
    ).toBeInTheDocument();
  });

  it("releases registrations when a tour unmounts and the handle is reused", async () => {
    const handle = Coachmark.createHandle();
    const { unmount } = render(
      <Coachmark.Root handle={handle}>
        <Coachmark.Target name="action">Original</Coachmark.Target>
        <Instructions />
      </Coachmark.Root>,
    );
    unmount();
    render(
      <Coachmark.Root handle={handle} defaultOpen scrollIntoView={false}>
        <Coachmark.Target name="action">Replacement</Coachmark.Target>
        <Instructions title="Replacement instructions" />
      </Coachmark.Root>,
    );
    await idle();
    expect(
      screen.getByRole("heading", { name: "Replacement instructions" }),
    ).toBeInTheDocument();
  });

  it("preserves the native launcher reference for default-open ref-based tours", async () => {
    function App() {
      const target = useRef<HTMLButtonElement>(null);
      return <>
        <button ref={target}>Legacy target</button>
        <Coachmark.Root defaultOpen scrollIntoView={false}>
          <Coachmark.Trigger>Default-open launcher</Coachmark.Trigger>
          <Coachmark.Step target={target}>
            <Coachmark.Positioner><Coachmark.Popup>
              <Coachmark.Title>Legacy instructions</Coachmark.Title>
              <Coachmark.Close>Close legacy tour</Coachmark.Close>
            </Coachmark.Popup></Coachmark.Positioner>
          </Coachmark.Step>
        </Coachmark.Root>
      </>;
    }
    const user = userEvent.setup();
    render(<App/>); await idle();
    expect(screen.getByRole("button", {name:"Default-open launcher"})).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", {name:"Close legacy tour"}));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", {name:"Default-open launcher"})).toHaveFocus();
  });

  it("rejects duplicate names and sharing a handle across two Roots", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() =>
        render(
          <Coachmark.Root>
            <Coachmark.Target name="same">One</Coachmark.Target>
            <Coachmark.Target name="same">Two</Coachmark.Target>
          </Coachmark.Root>,
        ),
      ).toThrow('duplicate target name "same"');
      const handle = Coachmark.createHandle();
      expect(() =>
        render(
          <>
            <Coachmark.Root handle={handle}>{null}</Coachmark.Root>
            <Coachmark.Root handle={handle}>{null}</Coachmark.Root>
          </>,
        ),
      ).toThrow("only one Root");
    } finally {
      error.mockRestore();
    }
  });
});
