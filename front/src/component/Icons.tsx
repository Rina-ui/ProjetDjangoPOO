// Pure SVG icon library — no emojis, no icon fonts
// All icons are 24x24 by default, stroke-based

interface IconProps {
    size?: number
    color?: string
    strokeWidth?: number
    className?: string
}

const base = (size: number, color: string, sw: number) => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
})

export const IconGrid = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
)

export const IconHome = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
    </svg>
)

export const IconSearch = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
)

export const IconHeart = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "", filled = false }: IconProps & { filled?: boolean }) => (
    <svg {...base(size, color, strokeWidth)} className={className} fill={filled ? color : "none"}>
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
)

export const IconCalendar = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
)

export const IconMessage = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
)

export const IconSettings = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
)

export const IconLogOut = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
)

export const IconBell = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
)

export const IconUsers = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
)

export const IconBarChart = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
)

export const IconCreditCard = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
    </svg>
)

export const IconMapPin = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
)

export const IconBed = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M2 9V4a1 1 0 011-1h18a1 1 0 011 1v5" />
        <path d="M2 9h20v9H2zM2 18v3M22 18v3" />
        <path d="M6 9V7h5v2M13 9V7h5v2" />
    </svg>
)

export const IconBath = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M9 6a2 2 0 114 0v8H2v-3a5 5 0 015-5z" />
        <path d="M2 14h20v2a6 6 0 01-6 6H8a6 6 0 01-6-6v-2z" />
    </svg>
)

export const IconSquare = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 9h18M9 21V9" />
    </svg>
)

export const IconArrowLeft = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
)

export const IconChevronRight = ({ size = 16, color = "currentColor", strokeWidth = 2, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M9 18l6-6-6-6" />
    </svg>
)

export const IconStar = ({ size = 16, color = "currentColor", strokeWidth = 1.8, className = "", filled = false }: IconProps & { filled?: boolean }) => (
    <svg {...base(size, color, strokeWidth)} className={className} fill={filled ? color : "none"}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
)

export const IconSend = ({ size = 16, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
)

export const IconEye = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

export const IconTrendUp = ({ size = 16, color = "currentColor", strokeWidth = 2, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
)

export const IconPlus = ({ size = 20, color = "currentColor", strokeWidth = 2, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M12 5v14M5 12h14" />
    </svg>
)

export const IconEdit = ({ size = 16, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
)

export const IconTrash = ({ size = 16, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
)

export const IconPhone = ({ size = 16, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
    </svg>
)

export const IconMap = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
)

export const IconBuilding = ({ size = 20, color = "currentColor", strokeWidth = 1.8, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <rect x="4" y="2" width="16" height="20" rx="1" />
        <path d="M9 22V12h6v10M8 7h.01M12 7h.01M16 7h.01M8 11h.01M16 11h.01" />
    </svg>
)

export const IconCheck = ({ size = 16, color = "currentColor", strokeWidth = 2.5, className = "" }: IconProps) => (
    <svg {...base(size, color, strokeWidth)} className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
)