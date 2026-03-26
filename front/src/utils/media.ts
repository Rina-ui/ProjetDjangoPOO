export const resolveMediaUrl = (
    imagePath?: string | null,
    apiBaseUrl?: string
): string | null => {
    if (!imagePath) return null

    const value = imagePath.trim()
    if (!value) return null

    // Absolute or already usable source.
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
        return value
    }

    const fallbackBase = apiBaseUrl || window.location.origin

    try {
        const apiUrl = new URL(fallbackBase)
        const mediaBase = apiUrl.origin
        return value.startsWith("/") ? `${mediaBase}${value}` : `${mediaBase}/${value}`
    } catch {
        const normalizedBase = fallbackBase.replace(/\/$/, "")
        const normalizedPath = value.startsWith("/") ? value : `/${value}`
        return `${normalizedBase}${normalizedPath}`
    }
}

