import type { RefObject } from "react";
import { Popover } from "@base-ui/react/popover";
import type { CoachmarkStepProps } from "./coachmark";

export interface RegisteredTarget {
  triggerId: string;
  ref: RefObject<HTMLElement | null>;
}

interface RegisteredStep {
  id: string;
  props: CoachmarkStepProps;
}

export class TourStore {
  readonly popoverHandle = Popover.createHandle();
  private listeners = new Set<() => void>();
  private root: object | null = null;
  private snapshot = {
    targets: new Map<string, RegisteredTarget>(),
    launchers: new Set<HTMLElement>(),
    backdrops: new Set<HTMLElement>(),
    steps: [] as RegisteredStep[],
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  attachRoot(owner: object) {
    if (this.root && this.root !== owner) {
      throw new Error(
        "Coachmark: each handle can be attached to only one Root.",
      );
    }
    this.root = owner;
    return () => {
      if (this.root === owner) this.root = null;
    };
  }

  registerLauncher(element: HTMLElement) {
    if (this.snapshot.launchers.has(element)) return;
    const launchers = new Set(this.snapshot.launchers);
    launchers.add(element);
    this.publish({ ...this.snapshot, launchers });
  }

  unregisterLauncher(element: HTMLElement) {
    if (!this.snapshot.launchers.has(element)) return;
    const launchers = new Set(this.snapshot.launchers);
    launchers.delete(element);
    this.publish({ ...this.snapshot, launchers });
  }

  registerBackdrop(element: HTMLElement) {
    if (this.snapshot.backdrops.has(element)) return;
    const backdrops = new Set(this.snapshot.backdrops);
    backdrops.add(element);
    this.publish({ ...this.snapshot, backdrops });
  }

  unregisterBackdrop(element: HTMLElement) {
    if (!this.snapshot.backdrops.has(element)) return;
    const backdrops = new Set(this.snapshot.backdrops);
    backdrops.delete(element);
    this.publish({ ...this.snapshot, backdrops });
  }

  registerTarget(name: string, target: RegisteredTarget) {
    const previous = this.snapshot.targets.get(name);
    if (previous && previous.triggerId !== target.triggerId) {
      throw new Error(
        `Coachmark: duplicate target name "${name}" in the same tour.`,
      );
    }
    if (previous === target) return;
    const targets = new Map(this.snapshot.targets);
    targets.set(name, target);
    this.publish({ ...this.snapshot, targets });
  }

  unregisterTarget(name: string, triggerId: string) {
    if (this.snapshot.targets.get(name)?.triggerId !== triggerId) return;
    const targets = new Map(this.snapshot.targets);
    targets.delete(name);
    this.publish({ ...this.snapshot, targets });
  }

  isTarget(element: Element | undefined) {
    return (
      !!element &&
      [...this.snapshot.targets.values()].some(
        (target) => target.ref.current === element,
      )
    );
  }

  registerStep(id: string, props: CoachmarkStepProps) {
    const previous = this.snapshot.steps.find((step) => step.id === id);
    if (
      previous &&
      Object.keys(props).length === Object.keys(previous.props).length &&
      Object.entries(props).every(
        ([key, value]) =>
          previous.props[key as keyof CoachmarkStepProps] === value,
      )
    ) {
      return;
    }
    const steps = previous
      ? this.snapshot.steps.map((step) =>
          step.id === id ? { id, props } : step,
        )
      : [...this.snapshot.steps, { id, props }];
    this.publish({ ...this.snapshot, steps });
  }

  unregisterStep(id: string) {
    const steps = this.snapshot.steps.filter((step) => step.id !== id);
    if (steps.length !== this.snapshot.steps.length)
      this.publish({ ...this.snapshot, steps });
  }

  private publish(snapshot: typeof this.snapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

const stores = new WeakMap<CoachmarkHandle, TourStore>();

/** Connects one tour Root with targets and launchers elsewhere in the React tree. */
export class CoachmarkHandle {
  declare private readonly tourHandleBrand: void;
  constructor() {
    stores.set(this, new TourStore());
  }
}

export function createCoachmarkHandle(): CoachmarkHandle {
  return new CoachmarkHandle();
}

export function getTourStore(handle: CoachmarkHandle): TourStore {
  const store = stores.get(handle);
  if (!store)
    throw new Error(
      "Coachmark: use Coachmark.createHandle() to create a tour handle.",
    );
  return store;
}
