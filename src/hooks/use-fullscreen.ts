import { type RefObject, useCallback, useEffect, useState } from "react";

/**
 * Wraps the browser Fullscreen API.
 *
 * - `useFullscreen()` targets the whole website (`document.documentElement`).
 * - `useFullscreen(ref)` targets that element (e.g. an editor `div`).
 *
 * `isFullscreen` is true only while *this* hook's target is the fullscreen
 * element, and stays in sync when the user leaves with Esc or the browser UI.
 * `enter`/`toggle` must be called from a user gesture (click, keypress) and
 * reject if the browser refuses.
 */
export function useFullscreen<T extends HTMLElement = HTMLElement>(target?: RefObject<T | null>) {
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isSupported, setIsSupported] = useState(false);

	const getTarget = useCallback(() => target?.current ?? document.documentElement, [target]);

	useEffect(() => {
		setIsSupported(document.fullscreenEnabled);

		const sync = () => setIsFullscreen(document.fullscreenElement === getTarget());
		document.addEventListener("fullscreenchange", sync);
		sync();
		return () => document.removeEventListener("fullscreenchange", sync);
	}, [getTarget]);

	const enter = useCallback(async () => {
		await getTarget().requestFullscreen();
	}, [getTarget]);

	const exit = useCallback(async () => {
		if (document.fullscreenElement === getTarget()) {
			await document.exitFullscreen();
		}
	}, [getTarget]);

	const toggle = useCallback(async () => {
		if (document.fullscreenElement === getTarget()) {
			await document.exitFullscreen();
		} else {
			await getTarget().requestFullscreen();
		}
	}, [getTarget]);

	return { isFullscreen, isSupported, enter, exit, toggle };
}
