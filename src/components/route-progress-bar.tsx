import { Progress } from "@base-ui/react/progress"
import { useRouterState } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

export function RouteProgressBar() {
    const isNavigating = useRouterState({ select: (state) => state.status === "pending" })

    const [progress, setProgress] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => {
        clearInterval(intervalRef.current)
        clearTimeout(hideTimeoutRef.current)
        clearTimeout(resetTimeoutRef.current)

        if (isNavigating) {
            setIsVisible(true)
            setProgress(15)

            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 85) {
                        clearInterval(intervalRef.current)
                        return prev
                    }
                    const step = Math.max(1, (85 - prev) / 10)
                    return Math.min(prev + step, 85)
                })
            }, 200)
        } else {
            setProgress((prev) => (prev === 0 ? 0 : 100))

            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false)
                resetTimeoutRef.current = setTimeout(() => setProgress(0), 200)
            }, 300)
        }

        return () => {
            clearInterval(intervalRef.current)
            clearTimeout(hideTimeoutRef.current)
            clearTimeout(resetTimeoutRef.current)
        }
    }, [isNavigating])

    if (!isVisible && progress === 0) return null

    return (
        <Progress.Root
            value={progress}
            aria-label="Page loading"
            data-slot="progress"
            className="pointer-events-none fixed left-0 top-0 z-100 w-full"
        >
            <Progress.Track className="relative flex h-0.5 w-full items-center overflow-x-hidden rounded-none bg-transparent">
                <Progress.Indicator className="h-full bg-primary transition-[width] duration-200 ease-out" />
            </Progress.Track>
        </Progress.Root>
    )
}
