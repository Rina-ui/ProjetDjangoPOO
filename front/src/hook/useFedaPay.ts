import { useEffect, useRef, useState } from "react"

declare global {
    interface Window {
        FedaPay: any
    }
}

const SCRIPT_URL = "https://cdn.fedapay.com/checkout.js?v=1.1.7"

// Charge le script une seule fois dans le DOM
let scriptPromise: Promise<void> | null = null
const loadScript = (): Promise<void> => {
    if (scriptPromise) return scriptPromise
    scriptPromise = new Promise((resolve, reject) => {
        if (window.FedaPay) { resolve(); return }
        const s = document.createElement("script")
        s.src = SCRIPT_URL
        s.onload  = () => resolve()
        s.onerror = () => reject(new Error("FedaPay script failed to load"))
        document.head.appendChild(s)
    })
    return scriptPromise
}

export interface FedaPayOptions {
    amount: number
    description: string
    customer: {
        firstname?: string
        lastname?: string
        email?: string
        phone?: string
    }
    onSuccess?: (transaction: any) => void
    onCancel?:  () => void
}

export const useFedaPay = (publicKey: string) => {
    const [ready,   setReady]   = useState(false)
    const [loading, setLoading] = useState(false)
    const widgetRef = useRef<any>(null)

    useEffect(() => {
        loadScript()
            .then(() => setReady(true))
            .catch(err => console.error("[FedaPay]", err))
    }, [])

    const openPayment = (opts: FedaPayOptions) => {
        if (!window.FedaPay) { console.error("FedaPay not loaded"); return }
        setLoading(true)

        const widget = window.FedaPay.init({
            public_key: publicKey,
            transaction: {
                amount:      opts.amount,
                description: opts.description,
            },
            currency: { iso: "XOF" },
            customer: {
                firstname: opts.customer.firstname ?? "",
                lastname:  opts.customer.lastname  ?? "",
                email:     opts.customer.email     ?? "",
                phone:     opts.customer.phone     ?? "",
            },
            onComplete(resp: any) {
                setLoading(false)
                if (resp.reason === window.FedaPay.DIALOG_DISMISSED) {
                    opts.onCancel?.()
                } else {
                    opts.onSuccess?.(resp.transaction)
                }
            },
        })

        widgetRef.current = widget
        widget.open()
        setLoading(false)
    }

    return { ready, loading, openPayment }
}
