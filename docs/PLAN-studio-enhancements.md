# Plan: Studio Enhancements

## Goal
Implement a series of UI and functional enhancements to the DesignMatch Studio, focusing on color-aware SERP searching, improved toolbar UX, global scrollbar styling, and refined Pro feature gating.

## Task Breakdown

### 1. SERP API Color-Aware Search
- **Objective**: Detect shirt color and inject it into the search query, then filter for priced items.
- **Implementation**:
  - Add a simple hex-to-color-name mapper in `Studio.tsx` (e.g., `#ef4444` -> "Red").
  - Append the detected color to the search query in `handleLookup` before building the dynamic links (e.g., `[Color] [ProductName]`).
  - Add a `.filter(result => result.price && result.price !== "" && result.price !== "Dynamic")` to any real `visual-search` results to ensure only priced items are displayed in the `ResultsDrawer`.

### 2. Canvas Background Toggle Fix
- **Objective**: Ensure BG On/Off only affects the canvas bounds without bleeding into the main app background.
- **Implementation**:
  - In `CanvasEditor.tsx` and `Studio.tsx`, ensure `showBg` state strictly toggles `canvas.backgroundColor` and the canvas wrapper `div` background, while the absolute parent `PhoneFrame` and `Studio` containers maintain their permanent `#0a0a0a` dark theme.

### 3. Dark Theme Scrollbars
- **Objective**: Style all scrollbars to be thin, dark, and match the iOS 26 Liquid Glass aesthetic.
- **Implementation**:
  - Update `index.css` to include global `::-webkit-scrollbar` styling with a transparent track and a semi-transparent `rgba(255,255,255,0.2)` thumbnail for perfectly styled dark-mode scrollbars.

### 4. Collapsible Toolbar & Pinned Pro Button
- **Objective**: Make the toolbar collapsible via a chevron to save screen space, while pinning the "Upgrade to Pro" banner identically at the bottom.
- **Implementation**:
  - In `BottomToolbar.tsx`, introduce an `isExpanded` boolean state (defaulting to true).
  - Add a chevron toggle button at the top header of the toolbar.
  - Wrap the dynamic tool rows (Creative Tools, Properties, Actions, Global Settings) in an `<AnimatePresence>` block that collapses height to `0` when `!isExpanded`.
  - Fix the "Upgrade to Pro" container outside the collapsible flex area, pinning it permanently to the bottom of the screen above the phone bezels.

### 5. Pro Feature Gating UX
- **Objective**: Tools should visibly look premium but remain clickable (not `pointer-events-none`) to successfully trigger the Paywall modal on interaction.
- **Implementation**:
  - In `BottomToolbar.tsx`, remove `pointer-events-none` from the Font, Stroke, and Drop Shadow properties.
  - Re-route their container `onClickCapture` events to fire `onRequirePro()` and physically stop propagation if the user is not authenticated as Pro.

## Verification Checklist
1. Review the generated links in `ResultsDrawer` to ensure color names are successfully injected (e.g., "Search Red Custom Design Product on Amazon").
2. Validate that scrollbars in the `BottomToolbar` and `ResultsDrawer` are dark and sleek.
3. Toggle the new Toolbar Chevron to verify the animation and confirm the Pro Banner remains docked at the bottom.
4. Click a locked Pro Feature (e.g., Shadow) to guarantee the modal opens gracefully.
