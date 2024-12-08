/** 
based on framer-motion@11.11.11,
Copyright (c) 2018 Framer B.V.
*/

import type { VisualElement } from '../../render/VisualElement.svelte';
import { createContext } from '../utils/context.svelte';

export interface MotionContextProps<Instance = unknown> {
	visualElement?: VisualElement<Instance>;
	initial?: false | string | string[];
	animate?: string | string[];
}

export const MotionContext = createContext<MotionContextProps>({});
