import slugifyLib from "slugify"

export function slugify(value: string): string {
    return slugifyLib(value, { lower: true, strict: true, trim: true })
}
