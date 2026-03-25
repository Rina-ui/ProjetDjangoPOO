import { useState } from "react"
import { useFedaPay, FedaPayOptions } from "./useFedaPay"

// Remplace par ta vraie clé sandbox depuis ton compte FedaPay
// https://app.fedapay.com → Paramètres → Clés API → Clé publique sandbox
const FEDAPAY_PUBLIC_KEY = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY ?? "pk_sandbox_XXXXXXXXXXXX"

interface FedaPayButtonProps {
    amount:      number
    description: string
    customer?: {
        firstname?: string
        lastname?:  string
        email?:     string
        phone?:     string
    }
    label?:     string
    variant?:   "primary" | "outline" | "ghost"
    size?:      "sm" | "md" | "lg"
    onSuccess?: (transaction: any) => void
    onCancel?:  () => void
    disabled?:  boolean
    className?: string
    style?:     React.CSSProperties
}

export const FedaPayButton = ({
    amount,
    description,
    customer = {},
    label,
    variant  = "primary",
    size     = "md",
    onSuccess,
    onCancel,
    disabled,
    className,
    style,
}: FedaPayButtonProps) => {
    const { ready, loading, openPayment } = useFedaPay(FEDAPAY_PUBLIC_KEY)

    const handleClick = () => {
        if (!ready || loading || disabled) return
        openPayment({ amount, description, customer, onSuccess, onCancel })
    }

    const sizeMap = {
        sm: { padding: "7px 14px",  fontSize: 12 },
        md: { padding: "10px 20px", fontSize: 13 },
        lg: { padding: "14px 28px", fontSize: 15 },
    }
    const variantMap = {
        primary: { background: "#1a1814", color: "#fff",  border: "none" },
        outline: { background: "transparent", color: "#1a1814", border: "1.5px solid #1a1814" },
        ghost:   { background: "transparent", color: "var(--text2)", border: "1.5px solid var(--border)" },
    }

    const baseStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 11,
        fontWeight: 700,
        cursor: (ready && !loading && !disabled) ? "pointer" : "not-allowed",
        opacity: (!ready || disabled) ? 0.5 : 1,
        transition: "transform .15s, opacity .15s",
        letterSpacing: ".01em",
        ...sizeMap[size],
        ...variantMap[variant],
        ...style,
    }

    return (
        <button
            onClick={handleClick}
            disabled={!ready || loading || disabled}
            style={baseStyle}
            className={className}
        >
            {loading ? (
                <span style={{
                    display: "inline-block",
                    width: 14, height: 14,
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                }}/>
            ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <rect x="1" y="4" width="22" height="16" rx="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
            )}
            {loading ? "Traitement…" : (label ?? `Payer ${amount.toLocaleString()} XOF`)}
        </button>
    )
}

export default FedaPayButton
