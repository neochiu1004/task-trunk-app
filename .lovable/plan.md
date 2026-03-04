

## Problem Analysis

The "Add Ticket" modal on mobile uses Vaul Drawer with `dismissible={false}`. The likely causes of input/scroll issues:

1. **`touchAction: 'pan-y'`** on DrawerContent (line 37 of drawer.tsx) can interfere with touch events on child elements, causing inputs to be unresponsive or scroll to break.
2. **Framer Motion `motion.div` wrappers** with animation variants on every section add unnecessary complexity and can capture/block touch events.
3. **`pb-32` padding** on the content creates a large dead zone at the bottom.

## Plan

### 1. Simplify DrawerContent touch handling
In `src/components/ui/drawer.tsx`, remove `style={{ touchAction: 'pan-y' }}` from DrawerContent — Vaul already handles drag-to-dismiss internally, and this CSS property can conflict with input focus and scrolling on iOS.

### 2. Replace `motion.div` with plain `div` in AddModal form sections
In `src/components/modals/AddModal.tsx`, replace all `motion.div` wrappers (with `sectionVariants`) around form fields with plain `<div>`. Keep the template section's animation if desired, but the input fields (name, tags, serial, expiry, URL, submit button) should use plain `<div>` to avoid framer-motion capturing touch/pointer events. Remove the `sectionVariants` object entirely.

### 3. Reduce bottom padding
Change `pb-32` to `pb-8` on the content wrapper — `pb-32` is excessive and may cause the illusion of fields "disappearing."

These three changes together should resolve the touch, focus, and scroll issues with minimal code changes.

