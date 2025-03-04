/** 
based on framer-motion@4.1.17,
Copyright (c) 2018 Framer B.V.
*/
import type { Axis, AxisDelta, BoxDelta, AxisBox2D } from "../../types/geometry";
import type { ResolvedValues } from "../../render/types";
import type { TargetProjection } from "../../render/utils/state";


/** 
based on framer-motion@4.1.15,
Copyright (c) 2018 Framer B.V.
*/
import {fixed} from '../fix-process-env';
import { mix, distance, clamp, progress } from 'popmotion';

var clampProgress = function (v: number) { return clamp(0, 1, v); };
/**
 * Returns true if the provided value is within maxDistance of the provided target
 */
function isNear(value: number, target?: number, maxDistance?: number) {
    if (target === void 0) { target = 0; }
    if (maxDistance === void 0) { maxDistance = 0.01; }
    return distance(value, target) < maxDistance;
}
function calcLength(axis: Axis) {
    return axis.max - axis.min;
}
/**
 * Calculate a transform origin relative to the source axis, between 0-1, that results
 * in an asthetically pleasing scale/transform needed to project from source to target.
 */
function calcOrigin(source: Axis, target: Axis) {
    var origin = 0.5;
    var sourceLength = calcLength(source);
    var targetLength = calcLength(target);
    if (targetLength > sourceLength) {
        origin = progress(target.min, target.max - sourceLength, source.min);
    }
    else if (sourceLength > targetLength) {
        origin = progress(source.min, source.max - targetLength, target.min);
    }
    return clampProgress(origin);
}
/**
 * Update the AxisDelta with a transform that projects source into target.
 *
 * The transform `origin` is optional. If not provided, it'll be automatically
 * calculated based on the relative positions of the two bounding boxes.
 */
function updateAxisDelta(delta: AxisDelta, source: Axis, target: Axis, origin?: number) {
    if (origin === void 0) { origin = 0.5; }
    delta.origin = origin;
    delta.originPoint = mix(source.min, source.max, delta.origin);
    delta.scale = calcLength(target) / calcLength(source);
    if (isNear(delta.scale, 1, 0.0001))
        delta.scale = 1;
    delta.translate =
        mix(target.min, target.max, delta.origin) - delta.originPoint;
    if (isNear(delta.translate))
        delta.translate = 0;
}
/**
 * Update the BoxDelta with a transform that projects the source into the target.
 *
 * The transform `origin` is optional. If not provided, it'll be automatically
 * calculated based on the relative positions of the two bounding boxes.
 */
function updateBoxDelta(delta: BoxDelta, source: AxisBox2D, target: AxisBox2D, origin: ResolvedValues) {// @ts-expect-error
    updateAxisDelta(delta.x, source.x, target.x, defaultOrigin(origin.originX));// @ts-expect-error
    updateAxisDelta(delta.y, source.y, target.y, defaultOrigin(origin.originY));
}
/**
 * Currently this only accepts numerical origins, measured as 0-1, but could
 * accept pixel values by comparing to the target axis.
 */
function defaultOrigin(origin: string | number) {
    return typeof origin === "number" ? origin : 0.5;
}
function calcRelativeAxis(target: Axis, relative: Axis, parent: Axis) {
    target.min = parent.min + relative.min;
    target.max = target.min + calcLength(relative);
}
function calcRelativeBox(projection: TargetProjection, parentProjection: TargetProjection) {
    calcRelativeAxis(projection.target.x, projection!.relativeTarget!.x, parentProjection.target.x);
    calcRelativeAxis(projection.target.y, projection!.relativeTarget!.y, parentProjection.target.y);
}

export { calcOrigin, calcRelativeAxis, calcRelativeBox, isNear, updateAxisDelta, updateBoxDelta };
