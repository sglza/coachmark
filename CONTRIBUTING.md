# Contributing

The most useful way to contribute to Coachmark right now is to report a specific problem or describe a focused improvement. You do not need to submit code or know how to implement a fix.

## One topic per issue

Open one issue for one independently addressable problem or feature request. A maintainer should be able to discuss the issue, understand what would resolve it, and close it without also resolving unrelated requests.

For example, these belong in separate issues, even if they were discovered while building the same tour:

- The Finish button does not notify the application that the tour closed.
- Users cannot interact with a highlighted slider while keeping the step open.
- Left and right arrow keys should navigate between steps.

Sharing an application, component, or broad theme such as scrolling does not necessarily make several requests one topic. Link related issues and explain the connection instead of combining them into a general feedback list.

Multiple examples of the same problem can stay in one issue. For example, the same popup-positioning failure in two browsers may be useful evidence for a single report. A suggested fix also belongs with the problem it addresses; you do not need a separate feature request for every possible solution.

You do not need to know the root cause before reporting a problem. Start with one clear symptom or desired outcome. If investigation shows that it contains separate problems, the discussion can identify follow-up issues.

## Before opening an issue

- Search existing open and closed issues for the same problem or request. Add relevant evidence to an existing issue when it already covers your topic.
- Use a specific title describing the behavior or desired outcome, such as "Popup appears before the target finishes scrolling."
- Keep unrelated bugs, feature requests, and general feedback in separate issues.

## Reporting a bug

Explain what you expected and what happened instead. Include the smallest example or sequence of steps that demonstrates the problem, along with your Coachmark version, React version, and browser when relevant.

Useful details include whether the tour uses controlled state, relevant Root or Step options, scrolling containers, and controls whose menus render through a portal. Include only the details that help reproduce this particular problem. A runnable reproduction is especially helpful, but clear steps or a small code example are still useful when one is unavailable.

Separate observations from explanations. "The popup appears while the target is moving" describes an observation. "An unrelated scroll event completes the internal wait" is a possible explanation unless you have verified it. Describe any workaround and its limitations without assuming it is the required fix.

## Requesting an improvement

Describe one use case, the limitation you encounter today, and the outcome you want. Explain your current workaround if you have one. An API suggestion is welcome, but the underlying need matters more than a particular prop name or implementation.

## Following up on a broad report

If an existing issue covers several independent topics, propose smaller follow-up issues and link them back to the original report so its context remains available. Keep each follow-up understandable on its own, with the relevant example and expected outcome. A link to a long discussion alone is not enough.

Do not automatically turn every bullet into an issue: some bullets describe the same symptom, alternative explanations, or possible solutions. Clarify those relationships first. Use a tracking issue only when a collection of related tasks needs coordination; put detailed discussion in the focused issues.

These guidelines apply equally to people and agents drafting or organizing issues.
