# Component plan

This is the build plan for PenguinUi: 100 components, each with its motion and touch behaviour decided before any code is written. It doubles as the reference for what each component is supposed to feel like, so a contributor can tell a bug from a design decision.

## Design read

The references behind this library (motion-primitives, Skiper UI, Vengeance UI, Watermelon UI, 21st.dev, taste-skill, and the hero, navbar, pricing, CTA and footer galleries) are all web libraries. Three things carry over to a phone, and one does not.

**Look.** Neutral zinc surfaces. Off-black, never `#000`. One accent colour, used for state and emphasis only, never for decoration. Interactive controls are pills. Cards use a double bezel: a sunken outer shell holding a raised inner core, with radii that stay concentric. Hairline borders and an inner top highlight do the work that heavy drop shadows usually do.

**Motion.** Springs, not timed fades. State changes morph a shape into its next shape instead of swapping one view for another. Groups enter in a stagger. Where a fixed duration is unavoidable, the curve is `cubic-bezier(0.32, 0.72, 0, 1)`.

**Feedback.** A press always moves something. Nothing changes state instantly.

**What does not carry over: hover.** Most of the reference effects are cursor effects. On a phone each one becomes a gesture (drag, hold, swipe, scrub) and is paired with a haptic, which is the closest thing touch has to a hover state.

## Motion tokens

Every component draws from the same small set, exported from `penguin-ui` as `springs`, `easings` and `durations`.

| Spring | Mass | Stiffness | Damping | Character | Used for |
| --- | --- | --- | --- | --- | --- |
| `press` | 0.2 | 400 | 22 | Overdamped, instant | Press-in response |
| `snappy` | 0.3 | 280 | 18 | Critically damped, fast | Indicators, toggles, digits |
| `bouncy` | 0.6 | 260 | 14 | One visible overshoot | Release, pop-in, success |
| `gentle` | 1 | 170 | 26 | Slow, no overshoot | Cards, flips, reveals |
| `smooth` | 1 | 220 | 30 | Heavy surface | Sheets, dialogs, morphs |
| `wobbly` | 1 | 180 | 12 | Two or three oscillations | Return from a drag |

| Easing | Curve | Used for |
| --- | --- | --- |
| `fluid` | `0.32, 0.72, 0, 1` | Default timed motion |
| `out` | `0.16, 1, 0.3, 1` | Long reveals, path drawing |
| `inOut` | `0.65, 0, 0.35, 1` | Loops that reverse |

Durations: `fast` 160ms, `base` 240ms, `slow` 420ms, `lazy` 700ms.

## Rules every component follows

1. **Reduced motion.** Springs and timings respect the system setting through Reanimated. Loops, parallax and physics collapse to their resting state.
2. **Haptics are optional.** `expo-haptics` is an optional peer. Without it every haptic call is a no-op. Haptics can be switched off globally on the provider.
3. **Only transforms and opacity animate** wherever that is possible. Layout properties animate only on small elements where a transform would distort content (a pill changing width, a sheet changing height).
4. **Animation runs on the UI thread.** Gesture callbacks and scroll handlers are worklets. React state changes only at the end of an interaction.
5. **Theme tokens only.** No component hard-codes a colour, radius or font.
6. **Accessible by default.** Roles, labels and states are set. Touch targets are at least 44pt.

## Catalog

Each entry lists what the component is, how it moves, and what touch and haptics do.

### Actions (12)

**1. Button.** Pill button with an optional leading icon and a trailing icon that sits in its own nested circle.
Motion: press-in scales to 0.97 on `press`; release returns on `bouncy`. The trailing circle nudges 3pt right on press and settles late, so the button has internal movement. `loading` swaps the label for three dots that rise in with an 80ms stagger while the width holds.
Touch: light haptic on press-in.

**2. IconButton.** Circular icon button.
Motion: scales to 0.9 on press. On release a ring expands from the edge (scale 1 to 1.5, opacity 0.25 to 0).
Touch: light haptic.

**3. StatefulButton.** Async submit button with idle, loading, success and error states.
Motion: on loading the width springs down to a circle and an arc spinner takes over. On success the fill crossfades to the success colour and a check draws itself in 320ms, holds, then the pill springs back open. On error the button shakes (six decaying oscillations) and reverts.
Touch: success or error notification haptic.

**4. HoldToConfirm.** Press and hold to confirm a destructive action.
Motion: a fill sweeps left to right for the hold duration, and the label inverts colour exactly at the fill edge (a clipped duplicate layer, not a crossfade). Early release retracts the fill on `snappy`. Completion pops the scale to 1.04 and morphs the label.
Touch: soft ticks at 25, 50 and 75 percent, success at completion.

**5. SlideToConfirm.** Drag a thumb across a track.
Motion: thumb tracks the finger 1:1. The label fades with progress and carries an idle shimmer wave. Past 85 percent the thumb springs to the end and its chevron redraws as a check; otherwise it springs back on `bouncy`.
Touch: light haptic on grab, success on completion.

**6. MagneticButton.** A button that leans toward the finger.
Motion: while held, the button follows 35 percent of the drag offset (capped at 14pt) and its label moves a further 15 percent, which reads as depth. Release returns on `wobbly`.
Touch: light haptic on grab.

**7. LikeButton.** Heart toggle with a count.
Motion: squash to 0.7, overshoot to 1.25, settle. Seven particles burst outward and fade, and a ring expands behind them. The count rolls digit by digit. Unliking is a quiet scale dip with no burst.
Touch: medium haptic on like.

**8. SpeedDial.** Floating action button that opens a set of actions.
Motion: the plus rotates into a cross. Actions rise from the button with a 40ms stagger (scale 0.6 to 1), labels slide in from the side, and a scrim fades in. Closing reverses in opposite order, faster.
Touch: light haptic on open, selection haptic on an action.

**9. PopButton.** A pushable button with physical depth.
Motion: the face rides 5pt above a darker base. Pressing drives the face down 4pt on `press`; release bounces it back up.
Touch: rigid haptic.

**10. ShineButton.** Button with a travelling highlight.
Motion: a soft diagonal band of light crosses the button every 2.8s and once more on press.
Touch: light haptic.

**11. CopyButton.** Copy to clipboard with confirmation.
Motion: the copy glyph scales and rotates out while a check draws in. The label morphs from "Copy" to "Copied" letter by letter, then reverts after 1.6s.
Touch: success haptic.

**12. ExpandButton.** A button that becomes an input ("Notify me" into an email field).
Motion: width springs from the label width to full width on `smooth`. The label crossfades into a text field and a circular submit button scales in at the trailing edge. Submitting collapses it back with a check.
Touch: light haptic on expand, success on submit.

### Text and numbers (12)

**13. TextReveal.** Splits text by character, word or line and reveals it.
Motion: presets `rise`, `blur`, `scale`, `mask` and `fade`. Stagger is 22ms per character, 45ms per word, 90ms per line. `mask` slides each line up out of a clipped box.

**14. TextMorph.** Animates between two strings.
Motion: characters that exist in both strings glide to their new positions on `snappy`. Characters that leave fade and shrink; new ones fade in.

**15. RollingNumber.** Odometer-style number.
Motion: each digit is a strip of 0 to 9 that rolls on `snappy`. Digits that appear or disappear animate their width so the number never jumps.

**16. CountUp.** Counts from one value to another.
Motion: ease-out over the duration, formatted on the UI thread so the component does not re-render per frame.

**17. TextScramble.** Decoding text effect.
Motion: characters cycle through random glyphs and resolve left to right with a 28ms stagger. Unresolved characters are muted.

**18. TextShimmer.** Loading label with a moving highlight.
Motion: a wave of brightness passes through the characters on a 1.8s loop.

**19. TextLoop.** Cycles through a list of words in place.
Motion: the outgoing word slides up and fades, the incoming word rises from below, and the container width springs to fit.

**20. Typewriter.** Types text with a caret.
Motion: humanised delay per character (longer after punctuation), blinking caret when idle, optional delete and retype loop.

**21. FlipText.** Characters that roll in on a 3D axis.
Motion: each character rotates on X from 90 degrees to flat with a 30ms stagger.

**22. SpinningText.** Text set on a rotating circle.
Motion: continuous rotation. A press speeds it up and it decays back to the base speed.

**23. Marquee.** Seamless scrolling band.
Motion: linear loop with soft faded edges. Press and hold eases the speed to zero; release resumes.

**24. HighlightText.** Marker highlight behind a phrase.
Motion: the marker scales in from the left edge in 450ms on `fluid`. Optional hand-drawn underline that draws itself.

### Inputs (14)

**25. TextField.** Text input with a floating label.
Motion: the label floats and scales to 0.78 on focus. A focus ring fades in around the field. Errors shake the field and slide the helper text.
Touch: error haptic on invalid.

**26. OTPInput.** One-time code entry.
Motion: the active cell gets a ring, typed digits pop in on `bouncy`, and an empty active cell shows a blinking caret. Error shakes the row. Success pulses the cells in a wave.
Touch: selection haptic per digit, notification on result.

**27. SearchBar.** Search field that expands from an icon.
Motion: a circle widens into a full field on `smooth`. Cancel slides in from the right. The placeholder cycles through suggestions.

**28. PasswordField.** Password input with strength feedback.
Motion: a strike line draws through the eye icon when hidden. Four strength segments fill in sequence with a colour ramp, and the strength word morphs.

**29. Stepper.** Increment and decrement a number.
Motion: the value rolls up or down to match the direction. Holding repeats with acceleration. At a bound the value shakes.
Touch: selection haptic per step, warning at a bound.

**30. Slider.** Single-value slider.
Motion: the thumb grows while dragged. A value bubble springs up and leans against the direction of travel. Dragging past either end stretches the track like a rubber band.
Touch: selection tick per step.

**31. RangeSlider.** Two-thumb range.
Motion: as Slider, with the fill between the thumbs and a minimum gap the thumbs push against.

**32. AmountInput.** Large currency amount with its own keypad.
Motion: digits spring in from below and leave downward. The amount scales down to stay on one line. Invalid input shakes it.
Touch: light haptic per key.

**33. PinPad.** PIN entry with a dot row.
Motion: dots fill with a pop. A wrong PIN shakes the row and clears the dots with a stagger. A correct PIN bounces them in a wave.
Touch: light haptic per key, notification on result.

**34. WheelPicker.** 3D wheel picker.
Motion: items rotate around a cylinder and fade with distance from centre. Release decays and snaps to the nearest item.
Touch: selection tick on every item crossed.

**35. TagInput.** Free-text tags.
Motion: a committed tag pops in and neighbours reflow with a layout spring. Backspace on an empty field wiggles the last tag before deleting it.

**36. PromptInput.** AI prompt composer.
Motion: height springs as lines are added. The action button morphs between microphone, send and stop. While loading, a beam of light orbits the border.

**37. RatingInput.** Star rating.
Motion: stars fill with a staggered pop. Dragging across them scrubs the value.
Touch: selection haptic on each star.

**38. DateStrip.** Horizontal week selector.
Motion: a single selection pill slides between days on `snappy`. Day labels crossfade colour.
Touch: selection haptic.

### Selection and controls (8)

**39. Switch.** Toggle.
Motion: the thumb stretches toward the centre while pressed, then travels on `snappy`. Track colour interpolates. Draggable.
Touch: light haptic on change.

**40. Checkbox.** Checkbox with optional label.
Motion: the fill scales from the centre on `bouncy`, then the check draws. Unchecking erases the check first. The label can strike through for task lists.
Touch: light haptic.

**41. RadioGroup.** Single choice from a list.
Motion: the dot springs in. A row highlight slides between options instead of jumping.
Touch: selection haptic.

**42. SegmentedControl.** Segmented picker.
Motion: a shared thumb slides between segments and stretches while it travels. The thumb can be dragged.
Touch: selection haptic.

**43. ChipGroup.** Single or multi-select chips.
Motion: the chip fill interpolates and a check draws in, pushing the label over.
Touch: selection haptic.

**44. ThemeToggle.** Light and dark switch.
Motion: the sun's rays retract as a moon bite slides across the core, with a quarter turn of rotation.
Touch: light haptic.

**45. Knob.** Rotary dial.
Motion: a ring of ticks lights up to the current value, and the value rolls in the centre.
Touch: selection tick per step.

**46. PlanPicker.** Pricing plan selection with a billing toggle.
Motion: prices roll when the billing period changes. The selected plan's border draws around it, a check springs in, and its feature list expands with staggered ticks.
Touch: selection haptic.

### Navigation (11)

**47. TabBar.** Floating pill tab bar.
Motion: the active tab widens to show its label over a sliding highlight. Icons bounce on select.
Touch: selection haptic.

**48. LiquidTabBar.** Tab bar with a travelling notch.
Motion: a curved notch in the bar slides to the active tab while the active icon drops out and rises into a floating circle.
Touch: selection haptic.

**49. Tabs.** Top tabs with content.
Motion: the underline stretches: its leading edge moves first and the trailing edge catches up. Panels slide in the direction of travel.

**50. PageDots.** Page indicator.
Motion: driven by scroll progress, the active dot elongates and hands off to its neighbour continuously.

**51. CollapsingHeader.** Large title that collapses on scroll.
Motion: the title shrinks into the bar, a hairline fades in, and overscroll stretches the title.

**52. Dock.** Magnifying dock.
Motion: sliding a finger across magnifies icons by their distance to it and lifts them. A label follows the nearest icon.
Touch: selection haptic when the nearest icon changes.

**53. StepProgress.** Multi-step progress.
Motion: connectors fill, completed steps redraw their number as a check, and the active step pulses.

**54. MenuOverlay.** Full-screen menu.
Motion: the hamburger bars rotate into a cross. The panel expands as a circle from the button, and links rise out of clipped boxes with a 60ms stagger.

**55. ContextMenu.** Long-press menu.
Motion: the pressed item lifts, the backdrop dims, and the menu scales out from the item's corner with rows in a stagger.
Touch: medium haptic on open, selection while dragging across rows.

**56. RadialMenu.** Circular menu at the touch point.
Motion: items fan out around the finger. Dragging toward one enlarges it. Releasing selects.
Touch: medium haptic on open, selection on hover change.

**57. Onboarding.** Paged introduction.
Motion: art, title and body move at different rates for parallax. On the last page the round next button widens into a labelled call to action.

### Overlays and feedback (13)

**58. BottomSheet.** Draggable sheet with detents.
Motion: rubber-bands past the top detent, snaps by projected velocity on release, and ties backdrop opacity to position. The handle bends into a chevron while dragging down.
Touch: light haptic when a detent is reached.

**59. Dialog.** Centred modal.
Motion: scales from 0.92 with a 12pt rise on `bouncy`. Exits faster than it enters.

**60. MorphingDialog.** A card that expands into a dialog.
Motion: the trigger's frame is measured and the dialog grows out of it (position, size and radius on `smooth`). Closing returns it to the trigger. Dragging down shrinks and dismisses.

**61. ActionSheet.** List of actions from the bottom.
Motion: slides up on `smooth` with rows rising in a 30ms stagger.

**62. Toast.** Stacked notifications.
Motion: new toasts spring in and older ones scale back and tuck behind (three visible). Tapping fans the stack open. Swipe dismisses with velocity. A promise toast morphs from loading to result.
Touch: notification haptic by type.

**63. DynamicIsland.** Morphing status pill.
Motion: width, height and radius spring between idle, compact and expanded on `bouncy`. Content crossfades with a slight scale.

**64. Tooltip.** Anchored hint.
Motion: scales out of its arrow on `snappy`. Flips above or below to stay on screen.

**65. Banner.** Inline or top alert.
Motion: slides down on a spring with a timer line that shrinks toward dismissal. Swipe up to dismiss.

**66. Skeleton.** Loading placeholder.
Motion: a soft band of light sweeps across. Placeholders in a group share one clock so the sweep reads as a single pass.

**67. Spinner.** Loading indicators.
Motion: five variants. `arc` breathes its length as it rotates, `dots` wave, `bars` equalise, `orbit` chases, `pulse` breathes.

**68. ProgressBar.** Linear progress.
Motion: determinate fill springs on `smooth`. Indeterminate sweeps a segment of changing width.

**69. CircularProgress.** Ring progress.
Motion: the stroke springs to the value with a rolling number in the centre. At 100 percent the ring turns to success and a check draws.

**70. PullToRefresh.** Liquid pull to refresh.
Motion: pulling stretches a droplet from the top edge. At the threshold it detaches into a spinner.
Touch: medium haptic at the threshold.

### Cards and lists (14)

**71. Card.** Double-bezel surface.
Motion: the pressable variant scales to 0.985.

**72. TiltCard.** Card that tilts toward the finger.
Motion: up to 10 degrees on each axis with perspective, and a glare that moves opposite the tilt. Returns on `wobbly`.

**73. FlipCard.** Two-sided card.
Motion: flips on Y with a `gentle` spring and a slight dip in scale at the midpoint. Can be dragged through the flip.

**74. SwipeDeck.** Swipeable card stack.
Motion: the top card follows the finger with rotation and shows a stamp. The card beneath scales up as it goes. Release flings it off or springs it back.
Touch: light haptic crossing the threshold.

**75. CardStack.** Wallet-style stack.
Motion: tapping a card lifts it to the top while the rest collapse to the bottom edge with staggered springs.

**76. ExpandableCard.** Card that expands in place.
Motion: height springs on `smooth`, the chevron rotates, and detail content staggers in.

**77. Accordion.** Collapsible sections.
Motion: height springs open, the chevron turns, and content fades up. The `detached` variant separates the open item from its neighbours.

**78. SwipeableRow.** Row with swipe actions.
Motion: action icons scale with the reveal. Past the full-swipe threshold the action colour floods the row and the icon jumps.
Touch: medium haptic at the threshold.

**79. ReorderList.** Drag to reorder.
Motion: a long press lifts the row. Other rows spring out of the way as it moves.
Touch: medium haptic on lift, selection on each slot change.

**80. StaggerList.** Staggered group reveal.
Motion: children enter with a preset (rise, scale, fade, slide). Adding and removing items uses layout springs.

**81. StackedScroll.** Cards that pin and stack on scroll.
Motion: each card sticks at the top, then scales back and dims as the next one covers it.

**82. Carousel.** Snap carousel with parallax.
Motion: images move inside their frames against the scroll. Neighbours scale down.

**83. CoverflowCarousel.** 3D carousel.
Motion: items rotate on Y and recede with distance from the centre.

**84. AvatarStack.** Overlapping avatars.
Motion: tapping fans them out. A new avatar scales in and pushes the rest along.

### Media and data (9)

**85. PlayPauseButton.** Play and pause.
Motion: the triangle morphs into two bars by interpolating the path, not by crossfading icons.

**86. Waveform.** Audio waveform.
Motion: bars near the finger swell while scrubbing. `live` mode animates levels.
Touch: selection haptic while scrubbing.

**87. MiniPlayer.** Player that expands from a pill.
Motion: one progress value drives the pill into a full card. The artwork grows and controls stagger in. Drag down to collapse.

**88. VoiceRecordButton.** Hold to record.
Motion: the button grows and emits pulse rings while held. Sliding away reveals a cancel target.
Touch: medium haptic on start, light on cancel or send.

**89. Stories.** Story viewer.
Motion: segmented bars fill over each story's duration. Holding pauses and fades the chrome.

**90. ImageCompare.** Before and after.
Motion: a divider follows the finger with a slight spring lag. The handle grows when grabbed.

**91. BarChart.** Bar chart.
Motion: bars grow with a stagger on `bouncy`. Scrubbing dims the others and slides a value bubble between bars.
Touch: selection haptic per bar.

**92. LineChart.** Line chart.
Motion: the line draws itself and the area fades in. Scrubbing snaps a cursor to the nearest point.
Touch: selection haptic per point.

**93. ActivityRings.** Concentric progress rings.
Motion: rings sweep in with a 120ms stagger on a spring.

### Effects and primitives (7)

**94. PressableScale.** The press primitive every other component builds on.
Motion: scale on `press`, release on `bouncy`, optional dim.

**95. BorderBeam.** A light that travels around a border.
Motion: a bright segment orbits a rounded rectangle on a loop.

**96. PulseRings.** Radar-style rings.
Motion: rings expand and fade from a centre in a staggered loop.

**97. AuroraBackground.** Slow colour field.
Motion: soft blobs drift on long, offset loops. Static under reduced motion.

**98. DotGrid.** Touch-reactive dot grid.
Motion: a touch sends a ripple through the grid; dots swell as the wavefront passes.

**99. Confetti.** Celebration burst.
Motion: pieces launch with random velocity and spin, fall under gravity and fade. Computed in closed form on the UI thread.

**100. SuccessCheck.** Animated result mark.
Motion: the circle draws, fills, and the check draws with a pop and a few sparks. The error variant draws a cross and shakes.
