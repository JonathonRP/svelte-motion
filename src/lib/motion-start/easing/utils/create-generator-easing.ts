/** 
based on framer-motion@11.11.11,
Copyright (c) 2018 Framer B.V.
*/

import { calcGeneratorDuration, maxGeneratorDuration } from '../../animation/generators/utils/calc-duration.svelte';
import type { GeneratorFactory, Transition } from '../../animation/types';
import { millisecondsToSeconds } from '../../utils/time-conversion';

/**
 * Create a progress => progress easing function from a generator.
 */
export function createGeneratorEasing(options: Transition, scale = 100, createGenerator: GeneratorFactory) {
	const generator = createGenerator({ ...options, keyframes: [0, scale] });
	const duration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);

	return {
		type: 'keyframes',
		ease: (progress: number) => generator.next(duration * progress).value / scale,
		duration: millisecondsToSeconds(duration),
	};
}
