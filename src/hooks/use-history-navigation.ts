import type { RouterHistory } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";

// The browser can't say whether a forward entry exists, and TanStack's history only
// has canGoBack(). So remember the furthest entry index seen: going back leaves it
// alone (forward is possible), while a PUSH drops the forward entries and resets it.
// Limitation: after a full page reload the forward entries are unknown until visited.
let furthestIndex = -1;
let trackedHistory: RouterHistory | null = null;
const listeners = new Set<() => void>();

function currentIndex(history: RouterHistory) {
	return history.location.state.__TSR_index;
}

function trackHistory(history: RouterHistory) {
	if (trackedHistory === history) return;
	trackedHistory = history;
	furthestIndex = currentIndex(history);

	history.subscribe(({ location, action }) => {
		const index = location.state.__TSR_index;
		furthestIndex = action.type === "PUSH" ? index : Math.max(furthestIndex, index);
		for (const listener of listeners) listener();
	});
}

const CAN_GO_BACK = 1;
const CAN_GO_FORWARD = 2;

export function useHistoryNavigation() {
	const { history } = useRouter();

	// A single number keeps the snapshot referentially stable.
	const flags = useSyncExternalStore(
		(onChange) => {
			trackHistory(history);
			listeners.add(onChange);
			return () => {
				listeners.delete(onChange);
			};
		},
		() => (history.canGoBack() ? CAN_GO_BACK : 0) | (furthestIndex > currentIndex(history) ? CAN_GO_FORWARD : 0),
		() => 0,
	);

	return {
		canGoBack: (flags & CAN_GO_BACK) !== 0,
		canGoForward: (flags & CAN_GO_FORWARD) !== 0,
		goBack: () => history.back(),
		goForward: () => history.forward(),
	};
}
