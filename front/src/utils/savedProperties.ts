const toList = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.results)) return payload.results
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.ids)) return payload.ids
    return []
}

const asNumber = (value: unknown): number | null => {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
}

const extractBienId = (entry: any): number | null => {
    if (typeof entry === "number") return asNumber(entry)

    const bienRaw = entry?.bien_id ?? entry?.bien
    if (typeof bienRaw === "number" || typeof bienRaw === "string") {
        return asNumber(bienRaw)
    }

    if (typeof bienRaw === "object" && bienRaw !== null) {
        return asNumber((bienRaw as any).id)
    }

    return asNumber(entry?.id)
}

export const extractSavedIds = (payload: any): number[] => (
    toList(payload)
        .map(extractBienId)
        .filter((id: number | null): id is number => id !== null)
)

export const extractSavedMap = (payload: any): Record<number, number> => (
    toList(payload).reduce((acc: Record<number, number>, item: any) => {
        const bienId = extractBienId(item)
        const saveId = asNumber(item?.id)
        if (bienId !== null && saveId !== null) {
            acc[bienId] = saveId
        }
        return acc
    }, {})
)

export const extractSavedCountByProperty = (payload: any): Record<number, number> => (
    toList(payload).reduce((acc: Record<number, number>, item: any) => {
        const bienId = extractBienId(item)
        if (bienId !== null) {
            acc[bienId] = (acc[bienId] ?? 0) + 1
        }
        return acc
    }, {})
)

