// src/hooks/useFedaPay.ts
import { useEffect, useState } from "react"

declare global { interface Window { FedaPay: any } }

let _promise: Promise<void> | null = null
const loadSDK = (): Promise<void> => {
    if (_promise) return _promise
    _promise = new Promise((res, rej) => {
        if (window.FedaPay) { res(); return }
        const s = document.createElement("script")
        s.src = "https://cdn.fedapay.com/checkout.js?v=1.1.7"
        s.onload  = () => res()
        s.onerror = () => rej(new Error("FedaPay SDK failed"))
        document.head.appendChild(s)
    })
    return _promise
}

export interface FedaOpts {
    amount:      number
    description: string
    customer?:   { firstname?: string; lastname?: string; email?: string; phone?: string }
    onSuccess?:  (tx: any) => void
    onCancel?:   () => void
}

export const useFedaPay = () => {
    const [ready,   setReady]   = useState(!!window.FedaPay)
    const [loading, setLoading] = useState(false)

    useEffect(() => { loadSDK().then(() => setReady(true)).catch(console.error) }, [])

    const pay = (opts: FedaOpts) => {
        if (!window.FedaPay) return
        setLoading(true)
        const key = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY ?? "pk_sandbox_XXXXXXXXXXXX"
        window.FedaPay.init({
            public_key:  key,
            transaction: { amount: opts.amount, description: opts.description },
            currency:    { iso: "XOF" },
            customer:    opts.customer ?? {},
            onComplete(resp: any) {
                setLoading(false)
                if (resp.reason === window.FedaPay.DIALOG_DISMISSED) opts.onCancel?.()
                else opts.onSuccess?.(resp.transaction)
            },
        }).open()
    }

    return { ready, loading, pay }
}