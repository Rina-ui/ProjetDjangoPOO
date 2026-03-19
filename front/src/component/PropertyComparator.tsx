import { useState, useEffect, useRef } from "react"
import * as T from "three"
import type { Property } from "../data/property"
import "../style/comparator.css"

// ── TYPES ─────────────────────────────────────────────────
interface Props {
    propA:   Property
    propB:   Property
    onClose: () => void
}

// ── CRITÈRES DE COMPARAISON
interface CompareRow {
    label: string
    valA:  string | number
    valB:  string | number
    winner: "A" | "B" | "tie"
}

const buildCompareTable = (a: Property, b: Property): CompareRow[] => {
    // Prix — on extrait le nombre pour comparer
    const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ""))
    const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ""))

    return [
        {
            label: "Prix",
            valA: a.price, valB: b.price,
            // Le moins cher gagne
            winner: priceA < priceB ? "A" : priceB < priceA ? "B" : "tie",
        },
        {
            label: "Chambres",
            valA: `${a.beds} beds`, valB: `${b.beds} beds`,
            winner: a.beds > b.beds ? "A" : b.beds > a.beds ? "B" : "tie",
        },
        {
            label: "Salles de bain",
            valA: `${a.baths} baths`, valB: `${b.baths} baths`,
            winner: a.baths > b.baths ? "A" : b.baths > a.baths ? "B" : "tie",
        },
        {
            label: "Surface",
            valA: `${a.sqft} sqft`, valB: `${b.sqft} sqft`,
            winner: parseInt(a.sqft) > parseInt(b.sqft) ? "A" : parseInt(b.sqft) > parseInt(a.sqft) ? "B" : "tie",
        },
        {
            label: "Note",
            valA: `⭐ ${a.rating}`, valB: `⭐ ${b.rating}`,
            winner: a.rating > b.rating ? "A" : b.rating > a.rating ? "B" : "tie",
        },
        {
            label: "Vues",
            valA: a.views.toLocaleString(), valB: b.views.toLocaleString(),
            winner: a.views > b.views ? "A" : b.views > a.views ? "B" : "tie",
        },
        {
            label: "Statut",
            valA: a.status, valB: b.status,
            winner: "tie",
        },
    ]
}

// ── MINI VIEWER 3D
interface MiniViewerProps {
    prop:        Property
    syncTheta:   number        // angle reçu de l'autre viewer
    onTheta:     (t: number) => void  // envoie l'angle à l'autre viewer
    label:       "A" | "B"
}

const MiniViewer3D = ({ prop, syncTheta, onTheta, label }: MiniViewerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sRef      = useRef({ theta: 0.5, phi: 0.72, r: 16, drag: false, px: 0, autoRot: true })
    const rendRef   = useRef<T.WebGLRenderer | null>(null)
    const cameraRef = useRef<T.PerspectiveCamera | null>(null)
    const tgtRef    = useRef(new T.Vector3(0, 2, 0))
    const [loaded, setLoaded] = useState(false)

    // Quand syncTheta change (vient de l'autre viewer) → mettre à jour la caméra
    useEffect(() => {
        if (!sRef.current.drag) {
            sRef.current.theta = syncTheta
            updateCam()
        }
    }, [syncTheta])

    const updateCam = () => {
        const s      = sRef.current
        const camera = cameraRef.current
        const tgt    = tgtRef.current
        if (!camera) return
        camera.position.set(
            tgt.x + s.r * Math.sin(s.phi) * Math.sin(s.theta),
            tgt.y + s.r * Math.cos(s.phi),
            tgt.z + s.r * Math.sin(s.phi) * Math.cos(s.theta)
        )
        camera.lookAt(tgt)
    }

    useEffect(() => {
        let animId: number
        const canvas = canvasRef.current
        if (!canvas) return

        const scene = new T.Scene()
        scene.background = new T.Color(0x2a2a2a)
        scene.fog        = new T.FogExp2(0x2a2a2a, 0.018)

        const W = canvas.clientWidth  || 480
        const H = canvas.clientHeight || 380
        const camera = new T.PerspectiveCamera(45, W / H, 0.1, 300)
        cameraRef.current = camera

        const renderer = new T.WebGLRenderer({ canvas, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.shadowMap.enabled  = true
        renderer.shadowMap.type     = T.PCFSoftShadowMap
        renderer.outputColorSpace   = T.SRGBColorSpace
        rendRef.current = renderer

        // Lumières
        scene.add(new T.AmbientLight(0xffffff, 1.5))
        const sun = new T.DirectionalLight(0xfffbe0, 1.8)
        sun.position.set(12, 20, 12); sun.castShadow = true
        sun.shadow.mapSize.set(1024, 1024)
        sun.shadow.camera.left = -20; sun.shadow.camera.right = 20
        sun.shadow.camera.top  =  20; sun.shadow.camera.bottom = -20
        scene.add(sun)
        const fill = new T.DirectionalLight(0xd0e8ff, 0.4)
        fill.position.set(-10, 8, -8); scene.add(fill)

        // Sol
        const ground = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshLambertMaterial({ color: 0x3a3a3a }))
        ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)

        // Chargement GLB
        import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
            const loader = new GLTFLoader()
            loader.load("/models/modern_house.glb", (gltf) => {
                const model  = gltf.scene
                const box    = new T.Box3().setFromObject(model)
                const size   = box.getSize(new T.Vector3())
                const maxDim = Math.max(size.x, size.y, size.z)
                model.scale.setScalar(10 / maxDim)
                const box2 = new T.Box3().setFromObject(model)
                model.position.y = -box2.min.y
                model.traverse((child: T.Object3D) => {
                    if ((child as T.Mesh).isMesh) {
                        const m = child as T.Mesh
                        m.castShadow = true; m.receiveShadow = true
                    }
                })
                scene.add(model)
                const box3   = new T.Box3().setFromObject(model)
                const size3  = box3.getSize(new T.Vector3())
                const center = box3.getCenter(new T.Vector3())
                tgtRef.current.copy(center)
                sRef.current.r = Math.max(size3.x, size3.z) * 2.2
                updateCam()
                setLoaded(true)
            }, undefined, () => setLoaded(true))
        })

        // Contrôles
        const s = sRef.current
        const onDown  = (e: MouseEvent) => { s.drag = true; s.autoRot = false; s.px = e.clientX }
        const onUp    = ()              => { s.drag = false }
        const onMove  = (e: MouseEvent) => {
            if (!s.drag) return
            s.theta -= (e.clientX - s.px) * 0.007
            s.px = e.clientX
            updateCam()
            onTheta(s.theta)  // synchronise l'autre viewer
        }
        const onWheel = (e: WheelEvent) => {
            s.r = Math.max(4, Math.min(40, s.r + e.deltaY * 0.025))
            updateCam()
        }
        canvas.addEventListener("mousedown", onDown)
        canvas.addEventListener("mouseup",   onUp)
        canvas.addEventListener("mousemove", onMove)
        canvas.addEventListener("wheel",     onWheel)

        // Animation
        const clock = new T.Clock()
        const animate = () => {
            animId = requestAnimationFrame(animate)
            clock.getElapsedTime();
            if (s.autoRot) { s.theta += 0.003; updateCam(); onTheta(s.theta) }
            renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
            camera.aspect = canvas.clientWidth / canvas.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(canvas.clientWidth, canvas.clientHeight)
        }
        window.addEventListener("resize", onResize)

        return () => {
            cancelAnimationFrame(animId)
            canvas.removeEventListener("mousedown", onDown)
            canvas.removeEventListener("mouseup",   onUp)
            canvas.removeEventListener("mousemove", onMove)
            canvas.removeEventListener("wheel",     onWheel)
            window.removeEventListener("resize",    onResize)
            renderer.dispose()
        }
    }, [])

    return (
        <div className="cmp-viewer-wrap">
            {/* Badge A ou B */}
            <div className={`cmp-viewer-label cmp-label-${label.toLowerCase()}`}>{label}</div>

            {/* Infos propriété en overlay */}
            <div className="cmp-viewer-info">
                <div className="cmp-viewer-price">{prop.price}</div>
                <div className="cmp-viewer-addr">{prop.agent} · {prop.beds}b {prop.baths}ba</div>
            </div>

            {!loaded && (
                <div className="cmp-loading">
                    <div className="cmp-spinner"/>
                    <span>Chargement…</span>
                </div>
            )}
            <canvas ref={canvasRef} className="cmp-canvas"/>
        </div>
    )
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────
const PropertyComparator = ({ propA, propB, onClose }: Props) => {
    // Angle partagé entre les deux viewers (synchronisation)
    const [sharedTheta, setSharedTheta] = useState(0.5)
    const [syncEnabled, setSyncEnabled] = useState(true)
    const [activeTab,   setActiveTab]   = useState<"3d" | "table">("3d")

    const compareTable = buildCompareTable(propA, propB)

    // Score global : compter les victoires
    const scoreA = compareTable.filter(r => r.winner === "A").length
    const scoreB = compareTable.filter(r => r.winner === "B").length
    const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : null

    return (
        <div className="cmp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="cmp-modal">

                {/* ── EN-TÊTE ─────────────────────────────── */}
                <div className="cmp-header">
                    <div className="cmp-header-left">
                        <div className="cmp-title">Comparateur de propriétés</div>
                        <div className="cmp-sub">
                            {winner
                                ? `Propriété ${winner} est recommandée (${winner === "A" ? scoreA : scoreB}/${compareTable.length} critères)`
                                : "Résultat identique sur tous les critères"}
                        </div>
                    </div>

                    {/* Toggle vue 3D / tableau */}
                    <div className="cmp-tabs">
                        <button className={`cmp-tab ${activeTab === "3d" ? "active" : ""}`} onClick={() => setActiveTab("3d")}>
                            Vue 3D
                        </button>
                        <button className={`cmp-tab ${activeTab === "table" ? "active" : ""}`} onClick={() => setActiveTab("table")}>
                            Tableau
                        </button>
                    </div>

                    {/* Toggle synchronisation */}
                    {activeTab === "3d" && (
                        <label className="cmp-sync-toggle">
                            <input type="checkbox" checked={syncEnabled} onChange={e => setSyncEnabled(e.target.checked)}/>
                            <span className="cmp-sync-label">Rotation synchronisée</span>
                        </label>
                    )}

                    <button className="cmp-close" onClick={onClose}>✕</button>
                </div>

                {/* ── VUE 3D ──────────────────────────────── */}
                {activeTab === "3d" && (
                    <div className="cmp-3d-section">
                        {/* Viewer A */}
                        <MiniViewer3D
                            prop={propA}
                            label="A"
                            syncTheta={sharedTheta}
                            onTheta={t => { if (syncEnabled) setSharedTheta(t) }}
                        />

                        {/* Séparateur central */}
                        <div className="cmp-divider">
                            <div className="cmp-divider-line"/>
                            <div className="cmp-vs">VS</div>
                            <div className="cmp-divider-line"/>
                        </div>

                        {/* Viewer B */}
                        <MiniViewer3D
                            prop={propB}
                            label="B"
                            syncTheta={sharedTheta}
                            onTheta={t => { if (syncEnabled) setSharedTheta(t) }}
                        />
                    </div>
                )}

                {/* ── TABLEAU COMPARATIF ───────────────────── */}
                {activeTab === "table" && (
                    <div className="cmp-table-section">
                        {/* Photos en haut */}
                        <div className="cmp-photos-row">
                            <div className="cmp-photo-card">
                                <img src={propA.img} alt={propA.address} className="cmp-photo"/>
                                <div className="cmp-photo-info">
                                    <span className="cmp-photo-agent">{propA.agent}</span>
                                    <span className="cmp-photo-addr">{propA.address}</span>
                                </div>
                                <div className="cmp-score-badge cmp-score-a">
                                    {scoreA} / {compareTable.length}
                                </div>
                            </div>
                            <div className="cmp-photo-card">
                                <img src={propB.img} alt={propB.address} className="cmp-photo"/>
                                <div className="cmp-photo-info">
                                    <span className="cmp-photo-agent">{propB.agent}</span>
                                    <span className="cmp-photo-addr">{propB.address}</span>
                                </div>
                                <div className="cmp-score-badge cmp-score-b">
                                    {scoreB} / {compareTable.length}
                                </div>
                            </div>
                        </div>

                        {/* Tableau ligne par ligne */}
                        <div className="cmp-table">
                            <div className="cmp-table-header">
                                <div className="cmp-th cmp-th-label">Critère</div>
                                <div className="cmp-th cmp-th-a">Propriété A</div>
                                <div className="cmp-th cmp-th-b">Propriété B</div>
                            </div>
                            {compareTable.map((row, i) => (
                                <div className="cmp-table-row" key={i}>
                                    <div className="cmp-td cmp-td-label">{row.label}</div>
                                    <div className={`cmp-td cmp-td-val ${row.winner === "A" ? "cmp-winner" : ""}`}>
                                        {row.winner === "A" && <span className="cmp-win-dot"/>}
                                        {row.valA}
                                    </div>
                                    <div className={`cmp-td cmp-td-val ${row.winner === "B" ? "cmp-winner" : ""}`}>
                                        {row.winner === "B" && <span className="cmp-win-dot"/>}
                                        {row.valB}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Verdict final */}
                        {winner && (
                            <div className={`cmp-verdict cmp-verdict-${winner.toLowerCase()}`}>
                                <span className="cmp-verdict-icon">
                                    {winner === "A" ? "🏆" : "🏆"}
                                </span>
                                <div>
                                    <div className="cmp-verdict-title">
                                        Propriété {winner} recommandée
                                    </div>
                                    <div className="cmp-verdict-sub">
                                        Meilleure sur {winner === "A" ? scoreA : scoreB} critères sur {compareTable.length}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PIED DE PAGE ─────────────────────────── */}
                <div className="cmp-footer">
                    <div className="cmp-footer-props">
                        <div className="cmp-footer-prop">
                            <span className="cmp-footer-badge cmp-footer-a">A</span>
                            <span className="cmp-footer-name">{propA.agent}</span>
                            <span className="cmp-footer-price">{propA.price}</span>
                        </div>
                        <div className="cmp-footer-prop">
                            <span className="cmp-footer-badge cmp-footer-b">B</span>
                            <span className="cmp-footer-name">{propB.agent}</span>
                            <span className="cmp-footer-price">{propB.price}</span>
                        </div>
                    </div>
                    <div className="cmp-footer-actions">
                        <button className="cmp-btn-book">Book A</button>
                        <button className="cmp-btn-book cmp-btn-book-b">Book B</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PropertyComparator