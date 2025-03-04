/** 
based on framer-motion@4.1.17,
Copyright (c) 2018 Framer B.V.
*/
import type { AnimationControls } from './types';

/** 
based on framer-motion@4.0.3,
Copyright (c) 2018 Framer B.V.
*/

// import { invariant } from '../utils/errors.js';
import { animateVisualElement, stopAnimation } from '../render/utils/animation.js';
import { setValues } from '../render/utils/setters.js';

/**
 * @public
 */
function animationControls(startStopNotifier?: () => () => void) {
	/**
	 * Track whether the host component has mounted.
	 */
	var hasMounted = false;
	/**
	 * Pending animations that are started before a component is mounted.
	 * TODO: Remove this as animations should only run in effects
	 */
	var pendingAnimations: any[] = [];
	/**
	 * A collection of linked component animation controls.
	 */
	var subscribers = new Set<any>();
	var stopNotification: undefined | (() => void);
	var controls = {
		subscribe: (visualElement) => {
			if (subscribers.size === 0) {
				stopNotification = startStopNotifier?.();
			}
			subscribers.add(visualElement);
			return () => {
				subscribers.delete(visualElement);
				if (subscribers.size === 0) {
					stopNotification?.();
				}
			};
		},
		start: (definition, transitionOverride?: any) => {
			/**
			 * TODO: We only perform this hasMounted check because in Framer we used to
			 * encourage the ability to start an animation within the render phase. This
			 * isn't behaviour concurrent-safe so when we make Framer concurrent-safe
			 * we can ditch this.
			 */
			if (hasMounted) {
				var animations_1: any[] = [];
				subscribers.forEach((visualElement) => {
					animations_1.push(
						animateVisualElement(visualElement, definition, {
							transitionOverride: transitionOverride,
						})
					);
				});
				return Promise.all(animations_1);
			} else {
				return new Promise((resolve) => {
					pendingAnimations.push({
						animation: [definition, transitionOverride],
						resolve: resolve,
					});
				});
			}
		},
		set: (definition) => {
			//invariant(hasMounted, "controls.set() should only be called after a component has mounted. Consider calling within a useEffect hook.");
			return subscribers.forEach((visualElement) => {
				setValues(visualElement, definition);
			});
		},
		stop: () => {
			subscribers.forEach((visualElement) => {
				stopAnimation(visualElement);
			});
		},
		mount: () => {
			hasMounted = true;
			pendingAnimations.forEach((_a) => {
				var animation = _a.animation,
					resolve = _a.resolve;
				controls.start.apply(controls, ...[animation]).then(resolve);
			});
			return () => {
				hasMounted = false;
				controls.stop();
			};
		},
	} satisfies AnimationControls;
	return controls;
}

export { animationControls };
