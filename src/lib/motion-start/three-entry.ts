/** 
based on framer-motion@11.11.11,
Copyright (c) 2018 Framer B.V.
*/

export type {
	ResolvedValues,
	ScrapeMotionValuesFromProps,
} from './render/types';

export { AnimationType } from './render/utils/types';
export { animations } from './motion/features/animations.svelte';
export { MotionContext } from './context/MotionContext';
export { createBox } from './projection/geometry/models.svelte';
export { calcLength } from './projection/geometry/delta-calc.svelte';
export { filterProps } from './render/dom/utils/filter-props';
export {
	makeUseVisualState,
	type VisualState,
} from './motion/utils/use-visual-state.svelte';
export { isDragActive } from './gestures/drag/utils/lock';
export { addPointerEvent } from './events/add-pointer-event.svelte';
export { addPointerInfo } from './events/event-info.svelte';
export { isMotionValue } from './value/utils/is-motion-value';
export { isBrowser } from './utils/is-browser';
export { useForceUpdate } from './utils/use-force-update.svelte';
