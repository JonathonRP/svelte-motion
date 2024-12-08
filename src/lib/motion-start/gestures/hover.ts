/** 
based on framer-motion@11.11.11,
Copyright (c) 2018 Framer B.V.
*/

import { addPointerEvent } from '../events/add-pointer-event';
import { pipe } from '../utils/pipe';
import { isDragActive } from './drag/utils/lock';
import type { EventInfo } from '../events/types';
import type { VisualElement } from '../render/VisualElement.svelte';
import { Feature } from '../motion/features/Feature';
import { frame } from '../frameloop';

function addHoverEvent(node: VisualElement<Element>, isActive: boolean) {
	const eventName = isActive ? 'pointerenter' : 'pointerleave';
	const callbackName = isActive ? 'onHoverStart' : 'onHoverEnd';

	const handleEvent = (event: PointerEvent, info: EventInfo) => {
		if (event.pointerType === 'touch' || isDragActive()) return;

		const props = node.getProps();

		if (node.animationState && props.whileHover) {
			node.animationState.setActive('whileHover', isActive);
		}

		const callback = props[callbackName];
		if (callback) {
			frame.postRender(() => callback(event, info));
		}
	};

	return addPointerEvent(node.current!, eventName, handleEvent, {
		passive: !node.getProps()[callbackName],
	});
}

export class HoverGesture extends Feature<Element> {
	mount() {
		this.unmount = pipe(addHoverEvent(this.node, true), addHoverEvent(this.node, false)) as VoidFunction;
	}

	unmount() {}
}
