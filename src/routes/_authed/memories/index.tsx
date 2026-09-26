import { RiBrainLine } from "@remixicon/react";
import { createFileRoute } from "@tanstack/react-router";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "#/components/ui/empty";

export const Route = createFileRoute("/_authed/memories/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Empty className="h-full">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<RiBrainLine />
				</EmptyMedia>
				<EmptyTitle>No memory selected</EmptyTitle>
				<EmptyDescription>Pick a memory from the list to view it here.</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
