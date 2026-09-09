import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authed/memories/new/")({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/_authed/memories/new/"!</div>
}
