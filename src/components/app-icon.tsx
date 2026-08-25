export function AppIcon({ name, logo }: { name: string; logo?: string }) {
    if (logo) {
        return <img src={logo} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover shadow-sm" />
    }
    const initial = name.trim().charAt(0).toUpperCase() || "?"
    return (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-xl font-semibold text-white shadow-sm">
            {initial}
        </div>
    )
}
