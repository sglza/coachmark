import { getCoachmarkClassNames } from "./coachmark-styles";
import type { PlaygroundConfig, StylingMode } from "./playground-types";
import cssModuleSource from "./coachmark.module.css?raw";

export type CodeLanguage = "css" | "tsx";

export const CSS_SOURCE = cssModuleSource;

export function createPreviewSource(
  language: CodeLanguage,
  config: PlaygroundConfig,
  stylingMode: StylingMode,
) {
  return language === "css" ? CSS_SOURCE : createTsxSource(config, stylingMode);
}

export function createTsxSource(
  config: PlaygroundConfig,
  stylingMode: StylingMode,
) {
  const classes =
    stylingMode === "css-modules"
      ? getCssModulePreviewClassNames(config)
      : getCoachmarkClassNames(stylingMode, config, "medium");
  const viewportEnabled = config.viewport && config.transition === "move";
  const writer = new SourceWriter();

  writer.line('import { useRef } from "react";');
  writer.line('import { Coachmark } from "coachmark";');
  if (stylingMode === "css-modules") {
    writer.line('import styles from "./tour.module.css";');
  }
  writer.blank();
  writer.line("export function ActivationTour() {");
  writer.line("const targetRef = useRef<HTMLDivElement>(null);", 1);
  writer.blank();
  writer.line("return (", 1);
  writer.line("<Coachmark.Root", 2);
  writer.line(formatValueProp("modal", config.modal), 3);
  writer.line(formatValueProp("resetOnOpen", config.resetOnOpen), 3);
  writer.line(">", 2);
  writer.line("<Coachmark.Trigger>Start tour</Coachmark.Trigger>", 3);

  if (config.backdrop) {
    writer.line("<Coachmark.Backdrop", 3);
    writeClassNameProp(
      writer,
      4,
      "className",
      classes.backdrop,
      stylingMode,
    );
    writer.line("/>", 3);
  }

  writer.line("<Coachmark.Step", 3);
  writer.line(`spotlightPadding={${config.spotlightPadding}}`, 4);
  writer.line(`spotlightRadius={${config.spotlightRadius}}`, 4);
  writer.line("target={targetRef}", 4);
  writer.line(">", 3);
  writer.line("<Coachmark.Positioner", 4);
  writer.line(`align="${config.align}"`, 5);
  writer.line(`alignOffset={${config.alignOffset}}`, 5);
  writer.line(`side="${config.side}"`, 5);
  writer.line(`sideOffset={${config.sideOffset}}`, 5);
  writeClassNameProp(
    writer,
    5,
    "className",
    classes.positioner,
    stylingMode,
  );
  writer.line(">", 4);
  writer.line("<Coachmark.Popup", 5);
  writeClassNameProp(
    writer,
    6,
    "className",
    classes.popup,
    stylingMode,
  );
  writer.line(">", 5);

  if (viewportEnabled) {
    writer.line("<Coachmark.Viewport", 6);
    writeClassNameProp(
      writer,
      7,
      "className",
      classes.viewport,
      stylingMode,
    );
    writer.line(">", 6);
    writeStepContent(writer, 7, config, stylingMode, classes);
    writer.line("</Coachmark.Viewport>", 6);
  } else {
    writeStepContent(writer, 6, config, stylingMode, classes);
  }

  writer.line("</Coachmark.Popup>", 5);
  writer.line("</Coachmark.Positioner>", 4);
  writer.line("</Coachmark.Step>", 3);
  writer.line("</Coachmark.Root>", 2);
  writer.line(");", 1);
  writer.line("}");

  return writer.toString();
}

function writeStepContent(
  writer: SourceWriter,
  level: number,
  config: PlaygroundConfig,
  stylingMode: StylingMode,
  classes: ReturnType<typeof getCoachmarkClassNames>,
) {
  writer.line("<div", level);
  writeClassNameProp(
    writer,
    level + 1,
    "className",
    classes.content,
    stylingMode,
  );
  writer.line(">", level);

  if (config.arrow) {
    writer.line("<Coachmark.Arrow", level + 1);
    writeClassNameProp(
      writer,
      level + 2,
      "className",
      classes.arrow,
      stylingMode,
    );
    writer.line("/>", level + 1);
  }

  writer.line("<Coachmark.Stepper", level + 1);
  writeClassNameProp(
    writer,
    level + 2,
    "className",
    classes.stepper,
    stylingMode,
  );
  writer.line(">", level + 1);
  writer.line("{({ stepCount, stepIndex }) =>", level + 2);
  writer.line("`Step ${stepIndex + 1} of ${stepCount}`", level + 3);
  writer.line("}", level + 2);
  writer.line("</Coachmark.Stepper>", level + 1);

  writer.line("<Coachmark.Title", level + 1);
  writeClassNameProp(
    writer,
    level + 2,
    "className",
    classes.title,
    stylingMode,
  );
  writer.line(">", level + 1);
  writer.line("Track activation", level + 2);
  writer.line("</Coachmark.Title>", level + 1);

  writer.line("<Coachmark.Description", level + 1);
  writeClassNameProp(
    writer,
    level + 2,
    "className",
    classes.description,
    stylingMode,
  );
  writer.line(">", level + 1);
  writer.line("See where onboarding slows down.", level + 2);
  writer.line("</Coachmark.Description>", level + 1);

  writer.line("<div", level + 1);
  writeClassNameProp(
    writer,
    level + 2,
    "className",
    classes.actions,
    stylingMode,
  );
  writer.line(">", level + 1);
  writer.line("<Coachmark.Close>Skip</Coachmark.Close>", level + 2);
  writer.line("<div", level + 2);
  writeClassNameProp(
    writer,
    level + 3,
    "className",
    classes.navigation,
    stylingMode,
  );
  writer.line(">", level + 2);
  writer.line("<Coachmark.Previous>Back</Coachmark.Previous>", level + 3);
  writer.line("<Coachmark.Next>Next</Coachmark.Next>", level + 3);
  writer.line("</div>", level + 2);
  writer.line("</div>", level + 1);
  writer.line("</div>", level);
}

function writeClassNameProp(
  writer: SourceWriter,
  level: number,
  name: string,
  value: string,
  stylingMode: StylingMode,
) {
  if (stylingMode === "css-modules") {
    const classNames = value.split(" ");

    if (classNames.length === 1) {
      writer.line(`${name}={styles.${value}}`, level);
      return;
    }

    writer.line(`${name}={[`, level);
    for (const className of classNames) {
      writer.line(`styles.${className},`, level + 1);
    }
    writer.line('].join(" ")}', level);
    return;
  }

  writer.line(`${name}={[`, level);
  for (const line of wrapTokens(value.split(" "), 72)) {
    writer.line(`${JSON.stringify(line)},`, level + 1);
  }
  writer.line('].join(" ")}', level);
}

function getCssModulePreviewClassNames(
  config: Pick<PlaygroundConfig, "transition" | "viewport">,
): ReturnType<typeof getCoachmarkClassNames> {
  const transition = {
    fade: "transitionFade",
    move: "transitionMove",
    none: "transitionNone",
  }[config.transition];
  const viewport =
    config.viewport && config.transition === "move" ? "withViewport" : "";
  const withTransition = (base: string) =>
    [base, transition].filter(Boolean).join(" ");
  const withViewport = (base: string) =>
    [base, transition, viewport].filter(Boolean).join(" ");

  return {
    actions: "Actions",
    arrow: "Arrow",
    backdrop: withTransition("Backdrop"),
    content: "Content",
    description: "Description",
    navigation: "Navigation",
    popup: withViewport("Popup sizeMedium"),
    positioner: withViewport("Positioner"),
    stepper: "Stepper",
    title: "Title",
    viewport: "Viewport",
  };
}

function formatValueProp(name: string, value: boolean | string) {
  if (value === true) return name;
  if (value === false) return `${name}={false}`;
  return `${name}="${value}"`;
}

function wrapTokens(tokens: string[], maxLength: number) {
  const lines: string[] = [];
  let line = "";

  for (const token of tokens) {
    if (line && line.length + token.length + 1 > maxLength) {
      lines.push(line);
      line = token;
    } else {
      line = line ? `${line} ${token}` : token;
    }
  }

  if (line) lines.push(line);
  return lines;
}

class SourceWriter {
  private readonly lines: string[] = [];

  blank() {
    this.lines.push("");
  }

  line(value: string, level = 0) {
    this.lines.push(`${"  ".repeat(level)}${value}`);
  }

  toString() {
    return this.lines.join("\n");
  }
}
