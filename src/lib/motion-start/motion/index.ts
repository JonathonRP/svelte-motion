/** 
based on framer-motion@11.11.11,
Copyright (c) 2018 Framer B.V.
*/

import {
	afterUpdate,
	beforeUpdate,
	createRawSnippet,
	getContext,
	mount,
	onDestroy,
	onMount,
	setContext,
	tick,
	type Component,
	type Snippet,
} from 'svelte';
import { get, writable, type Writable } from 'svelte/store';
import type { MotionProps } from './types';
import type { RenderComponent, FeatureBundle } from './features/types';
import { MotionConfigContext } from '../context/MotionConfigContext';
import { MotionContext } from '../context/MotionContext';
import { useVisualElement } from './utils/use-visual-element';
import type { UseVisualState } from './utils/use-visual-state';
import { useMotionRef } from './utils/use-motion-ref';
import { useCreateMotionContext } from '../context/MotionContext/create';
import { loadFeatures } from './features/load-features';
import { isBrowser } from '../utils/is-browser';
import { LayoutGroupContext, type LayoutGroupContextProps } from '../context/LayoutGroupContext';
import { LazyContext, type LazyContextProps } from '../context/LazyContext';
import { motionComponentSymbol } from './utils/symbol';
import type { CreateVisualElement } from '../render/types';
import { invariant, warning } from '../utils/errors';
import { featureDefinitions } from './features/definitions';
import Motion from './Motion.svelte';
import type { Ref } from '../utils/safe-react-types';
import { setDomContext } from '../context/DOMcontext';
import type { MeasureLayout } from './features/layout/MeasureLayout';

export interface MotionComponentConfig<Instance, RenderState> {
	preloadedFeatures?: FeatureBundle;
	createVisualElement?: CreateVisualElement<Instance>;
	useRender: RenderComponent<Instance, RenderState>;
	useVisualState: UseVisualState<Instance, RenderState>;
	Component: string;
}

export type MotionComponentProps<Props> = {
	[K in Exclude<keyof Props, keyof MotionProps>]?: Props[K];
} & MotionProps;

/**
 * Create a `motion` component.
 *
 * This function accepts a Component argument, which can be either a string (ie "div"
 * for `MotionDiv`), or an actual React component.
 *
 * Alongside this is a config option which provides a way of rendering the provided
 * component "offline", or outside the React render cycle.
 *
 * @internal
 */
export const createRendererMotionComponent = <Props extends {}, Instance, RenderState>({
	preloadedFeatures,
	createVisualElement,
	useRender,
	useVisualState,
	Component,
}: MotionComponentConfig<Instance, RenderState>) => {
	preloadedFeatures && loadFeatures(preloadedFeatures);

	const MotionComponent: Component<MotionComponentProps<Props> & { externalRef?: Ref<Instance> | undefined }> = (
		anchor,
		{ externalRef, ...props }
	) => {
		/**
		 * If we need to measure the element we load this functionality in a
		 * separate class component in order to gain access to getSnapshotBeforeUpdate.
		 */
		let useMeasureLayout: typeof MeasureLayout | undefined = undefined;
		let render: Snippet | undefined = undefined;

		let mcc = getContext<Writable<MotionConfigContext>>(MotionConfigContext);

		onMount(() => {
			mcc = mcc || MotionConfigContext(Component);
		});

		const context = useCreateMotionContext<Instance>(props);

		const configAndProps = {
			...get(mcc),
			...props,
			layoutId: useLayoutId(props),
		};

		const { isStatic } = configAndProps;

		const visualState = useVisualState(props, isStatic);

		if (!isStatic && isBrowser) {
			useStrictMode(configAndProps, preloadedFeatures);

			const layoutProjection = getProjectionFunctionality(configAndProps);
			useMeasureLayout = layoutProjection.MeasureLayout;

			/**
			 * Create a VisualElement for this component. A VisualElement provides a common
			 * interface to renderer-specific APIs (ie DOM/Three.js etc) as well as
			 * providing a way of rendering to these APIs outside of the React render loop
			 * for more performant animations and interactions
			 */
			context.visualElement = useVisualElement<Instance, RenderState>(
				Component,
				visualState,
				configAndProps,
				createVisualElement,
				layoutProjection.ProjectionNode
			);

			// MotionContext.Provider
			const store = writable(context);
			store.set(context);

			setContext(MotionContext, store);
			setDomContext('Motion', this, store);
		}

		// Since useMotionRef is not called on destroy, the visual element is unmounted here
		onDestroy(() => {
			context?.visualElement?.unmount();
		});

		// style="display: contents"
		render = createRawSnippet(() => {
			return {
				render: () => '<slot>',
				setup(node: Element) {
					useMeasureLayout && context.visualElement
						? useMeasureLayout({ visualElement: context.visualElement, ...configAndProps })
						: null;
					mount(useRender, {
						target: node,
						props: {
							Component,
							props,
							ref: useMotionRef<Instance, RenderState>(visualState, context.visualElement, externalRef),
							visualState,
							isStatic,
							visualElement: context.visualElement,
							children: props.children ? props.children : undefined,
							$$slots: { default: props.children },
						},
					});
				},
			};
		});

		return Motion(anchor, { children: render, $$slots: { default: true } });
		// return [
		// 	useMeasureLayout && context.visualElement
		// 		? useMeasureLayout({ visualElement: context.visualElement, ...configAndProps })
		// 		: null,
		// 	useRender(
		// 		Component,
		// 		props,
		// 		useMotionRef<Instance, RenderState>(visualState, context.visualElement, externalRef),
		// 		visualState,
		// 		isStatic,
		// 		context.visualElement
		// 	),
		// ].join('');
		// return Motion(
		// 	anchor,
		// 	{
		// 		MeasureLayout:
		// 			useMeasureLayout && context.visualElement
		// 				? useMeasureLayout({ visualElement: context.visualElement, ...configAndProps })
		// 				: null,
		// 		UseRender: useRender(
		// 			Component,
		// 			props,
		// 			useMotionRef<Instance, RenderState>(visualState, context.visualElement, externalRef),
		// 			visualState,
		// 			isStatic,
		// 			context.visualElement
		// 		),
		// 	},
		// 	...options
		// );
	};

	(MotionComponent as any)[motionComponentSymbol] = Component;
	return MotionComponent;
	// return new Proxy(
	// 	MotionComponent as Component<{ props: MotionComponentProps<Props>; externalRef?: Ref<Instance> | undefined }>,
	// 	{
	// 		get(target, _key, args) {
	// 			const props = args[1].props;
	// 			const externalRef = args[1].externalRef;
	// 			const mcc = getContext<Writable<MotionConfigContext>>(MotionConfigContext) || MotionConfigContext(Component);
	// 			/**
	// 			 * If we need to measure the element we load this functionality in a
	// 			 * separate class component in order to gain access to getSnapshotBeforeUpdate.
	// 			 */
	// 			let useMeasureLayout: typeof MeasureLayout | undefined = undefined;

	// 			const configAndProps = {
	// 				...get(mcc),
	// 				...props,
	// 				layoutId: useLayoutId(props),
	// 			};

	// 			const { isStatic } = configAndProps;

	// 			const context = useCreateMotionContext<Instance>(props);

	// 			const visualState = useVisualState(props, isStatic);

	// 			if (!isStatic && isBrowser) {
	// 				useStrictMode(configAndProps, preloadedFeatures);

	// 				const layoutProjection = getProjectionFunctionality(configAndProps);
	// 				useMeasureLayout = layoutProjection.MeasureLayout;

	// 				/**
	// 				 * Create a VisualElement for this component. A VisualElement provides a common
	// 				 * interface to renderer-specific APIs (ie DOM/Three.js etc) as well as
	// 				 * providing a way of rendering to these APIs outside of the React render loop
	// 				 * for more performant animations and interactions
	// 				 */
	// 				context.visualElement = useVisualElement<Instance, RenderState>(
	// 					Component,
	// 					visualState,
	// 					configAndProps,
	// 					createVisualElement,
	// 					layoutProjection.ProjectionNode
	// 				);
	// 			}

	// 			// MotionContext.Provider
	// 			const store = writable(context);
	// 			store.set(context);

	// 			setContext(MotionContext, store);
	// 			setDomContext('Motion', Component, store);

	// 			// Since useMotionRef is not called on destroy, the visual element is unmounted here
	// 			onDestroy(() => {
	// 				context?.visualElement?.unmount();
	// 			});

	// 			const children = createRawSnippet(() => {
	// 				return {
	// 					render: () => `<${Component}></${Component}>`,
	// 					setup(node: Element) {
	// 						beforeUpdate(() => {
	// 							useMeasureLayout && context.visualElement
	// 								? mount(useMeasureLayout({ visualElement: context.visualElement, ...configAndProps }), {
	// 										target: node,
	// 									})
	// 								: null;
	// 							mount(
	// 								useRender(
	// 									Component,
	// 									props,
	// 									useMotionRef<Instance, RenderState>(visualState, context.visualElement, externalRef),
	// 									visualState,
	// 									isStatic,
	// 									context.visualElement
	// 								),
	// 								{ target: node }
	// 							);
	// 						});
	// 					},
	// 				};
	// 			});

	// 			console.log(Component);
	// 			if (!args[1]) {
	// 				args[1] = {
	// 					children,
	// 					$$slots: {
	// 						default: true,
	// 					},
	// 				};
	// 			} else {
	// 				args[1].children = children;
	// 				args[1].$$slots.default = true;
	// 			}

	// 			// @ts-expect-error
	// 			return target(...args);
	// 		},
	// 	}
	// );
};

function useLayoutId({ layoutId }: MotionProps, isCustom = false) {
	const layoutGroupId = get(
		getContext<ReturnType<typeof LayoutGroupContext>>(LayoutGroupContext) || LayoutGroupContext(isCustom)
	).id;
	return layoutGroupId && layoutId !== undefined ? layoutGroupId + '-' + layoutId : layoutId;
}

function useStrictMode(configAndProps: MotionProps, preloadedFeatures?: FeatureBundle, isCustom = false) {
	const isStrict = get(getContext<ReturnType<typeof LazyContext>>(LazyContext) || LazyContext(isCustom)).strict;

	/**
	 * If we're in development mode, check to make sure we're not rendering a motion component
	 * as a child of LazyMotion, as this will break the file-size benefits of using it.
	 */
	if (process.env.NODE_ENV !== 'production' && preloadedFeatures && isStrict) {
		const strictMessage =
			'You have rendered a `motion` component within a `LazyMotion` component. This will break tree shaking. Import and render a `m` component instead.';
		configAndProps.ignoreStrict ? warning(false, strictMessage) : invariant(false, strictMessage);
	}
}

function getProjectionFunctionality(props: MotionProps) {
	const { drag, layout } = featureDefinitions;

	if (!drag && !layout) return {};

	const combined = { ...drag, ...layout };

	return {
		MeasureLayout: drag?.isEnabled(props) || layout?.isEnabled(props) ? combined.MeasureLayout : undefined,
		ProjectionNode: combined.ProjectionNode,
	};
}
