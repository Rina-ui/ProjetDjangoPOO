import { useEffect, useRef, useState } from "react"
import DashboardLayout from "../../component/DashboardLayout"
import { IconArrowLeft } from "../../component/Icons"
import "../../style/dashboard.css"
import "../../style/viewer3d.css"

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

const ROOMS = [
    { id: "living",  label: "Living Room",  floor: 0, x: -1.2, z: -0.5, color: "#b8922a", area: "42 m²", desc: "Open-plan with floor-to-ceiling windows" },
    { id: "kitchen", label: "Kitchen",      floor: 0, x:  1.2, z: -0.5, color: "#2a7ab8", area: "28 m²", desc: "Modern kitchen with island and premium appliances" },
    { id: "bedroom", label: "Master Bed",   floor: 1, x: -1.0, z:  0.0, color: "#7a2ab8", area: "35 m²", desc: "En-suite with walk-in wardrobe and terrace access" },
    { id: "office",  label: "Home Office",  floor: 1, x:  1.0, z:  0.0, color: "#2ab87a", area: "22 m²", desc: "Quiet corner office with city views" },
    { id: "pool",    label: "Pool Area",    floor: 0, x:  0.0, z:  1.8, color: "#2ab8b8", area: "60 m²", desc: "Heated outdoor pool with deck and loungers" },
]

interface Props { onBack: () => void }

const PropertyViewer3D = ({ onBack }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const threeRef  = useRef<any>(null)
    const [activeRoom, setActiveRoom]   = useState<typeof ROOMS[0] | null>(null)
    const [mode, setMode]               = useState<"exterior" | "walkthrough">("exterior")
    const [loaded, setLoaded]           = useState(false)
    const [tooltip, setTooltip]         = useState<{ x: number; y: number; label: string } | null>(null)

    useEffect(() => {
        let animId: number
        const canvas = canvasRef.current
        if (!canvas) return

        const THREE = (window as any).THREE
        if (!THREE) { console.error("THREE not loaded"); return }

        // ── Scene setup ──────────────────────────────────────────────
        const scene    = new THREE.Scene()
        scene.background = new THREE.Color(0xf0ece4)
        scene.fog = new THREE.FogExp2(0xf0ece4, 0.04)

        const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 200)
        camera.position.set(8, 6, 12)
        camera.lookAt(0, 1.5, 0)

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(canvas.clientWidth, canvas.clientHeight)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        // ── Lights ───────────────────────────────────────────────────
        const ambient = new THREE.AmbientLight(0xfff8f0, 0.7)
        scene.add(ambient)

        const sun = new THREE.DirectionalLight(0xfff4e0, 1.4)
        sun.position.set(10, 18, 10)
        sun.castShadow = true
        sun.shadow.mapSize.set(2048, 2048)
        sun.shadow.camera.near = 0.5
        sun.shadow.camera.far  = 60
        sun.shadow.camera.left = -12
        sun.shadow.camera.right = 12
        sun.shadow.camera.top  = 12
        sun.shadow.camera.bottom = -12
        scene.add(sun)

        const fill = new THREE.DirectionalLight(0xd0e8ff, 0.4)
        fill.position.set(-8, 4, -6)
        scene.add(fill)

        // ── Materials ────────────────────────────────────────────────
        const matWall    = new THREE.MeshLambertMaterial({ color: 0xf2ece0 })
        const matRoof    = new THREE.MeshLambertMaterial({ color: 0x1e1e1e })
        const matGlass   = new THREE.MeshLambertMaterial({ color: 0x90c8e8, transparent: true, opacity: 0.45 })
        const matGround  = new THREE.MeshLambertMaterial({ color: 0x7ab85a })
        const matPath    = new THREE.MeshLambertMaterial({ color: 0xd4c8a8 })
        const matDoor    = new THREE.MeshLambertMaterial({ color: 0xc8a870 })
        const matPool    = new THREE.MeshLambertMaterial({ color: 0x40a8c8, transparent: true, opacity: 0.8 })
        const matPoolDeck= new THREE.MeshLambertMaterial({ color: 0xe0d4b8 })
        const matGarage  = new THREE.MeshLambertMaterial({ color: 0xd8d0c0 })
        const matWood    = new THREE.MeshLambertMaterial({ color: 0x8b6840 })

        const mkBox = (w: number, h: number, d: number, mat: THREE.Material, x=0, y=0, z=0, shadow=true) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
            m.position.set(x, y, z)
            if (shadow) { m.castShadow = true; m.receiveShadow = true }
            scene.add(m)
            return m
        }

        // ── Ground ───────────────────────────────────────────────────
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), matGround)
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)

        // Path
        mkBox(1.2, 0.05, 4, matPath, 0, 0.02, 3.5)
        // Pool deck
        mkBox(5, 0.1, 3.5, matPoolDeck, 0, 0.05, 5.5)
        // Pool water
        mkBox(3.5, 0.08, 2.5, matPool, 0, 0.12, 5.6)

        // ── Main house body — lower floor ────────────────────────────
        mkBox(5.5, 2.6, 4.5, matWall, -0.4, 1.3, 0)
        // Roof slab lower
        mkBox(6.2, 0.22, 5.2, matRoof, -0.4, 2.72, 0)

        // ── Upper floor ──────────────────────────────────────────────
        mkBox(4.2, 2.4, 4.0, matWall, -0.6, 4.5, 0.1)
        // Wood cladding strip
        mkBox(4.2, 0.5, 4.02, matWood, -0.6, 3.5, 0.1)
        // Roof slab upper
        mkBox(5.0, 0.22, 4.7, matRoof, -0.6, 5.72, 0.1)

        // ── Garage wing ──────────────────────────────────────────────
        mkBox(2.8, 2.0, 3.5, matGarage, 3.0, 1.0, 0.2)
        mkBox(3.2, 0.22, 4.0, matRoof, 3.0, 2.12, 0.2)
        // Garage door
        mkBox(2.2, 1.7, 0.08, matGarage, 3.0, 0.85, -1.53)

        // ── Windows lower floor ──────────────────────────────────────
        // Front large windows
        mkBox(1.8, 1.8, 0.08, matGlass, -1.5, 1.5, -2.27)
        mkBox(1.8, 1.8, 0.08, matGlass,  0.5, 1.5, -2.27)
        // Side window
        mkBox(0.08, 1.4, 1.8, matGlass, -3.51, 1.5, 0)

        // ── Windows upper floor ──────────────────────────────────────
        mkBox(1.6, 1.4, 0.08, matGlass, -1.6, 4.6, -2.17)
        mkBox(1.6, 1.4, 0.08, matGlass,  0.2, 4.6, -2.17)

        // ── Door ─────────────────────────────────────────────────────
        mkBox(0.9, 2.1, 0.08, matDoor, -0.5, 1.05, -2.27)

        // ── Trees ────────────────────────────────────────────────────
        const addTree = (x: number, z: number, h: number, cr: number, color: number) => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, h * 0.4, 8), new THREE.MeshLambertMaterial({ color: 0x5a4030 }))
            trunk.position.set(x, h * 0.2, z)
            trunk.castShadow = true
            scene.add(trunk)
            const canopy = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 8), new THREE.MeshLambertMaterial({ color }))
            canopy.position.set(x, h * 0.4 + cr * 0.7, z)
            canopy.castShadow = true
            scene.add(canopy)
            const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(cr * 0.75, 10, 8), new THREE.MeshLambertMaterial({ color: new THREE.Color(color).offsetHSL(0, 0, 0.08).getHex() }))
            canopy2.position.set(x + 0.2, h * 0.4 + cr * 1.1, z - 0.2)
            canopy2.castShadow = true
            scene.add(canopy2)
        }
        addTree(-5.5, -1,   4.5, 1.4, 0x4a8830)
        addTree(-6.0,  0.5, 4.0, 1.2, 0x5a9840)
        addTree( 5.5, -0.5, 3.5, 1.6, 0xb03828) // red maple
        addTree( 6.2,  1.0, 2.5, 1.0, 0xc84838)
        addTree( 5.8,  2.5, 2.0, 0.7, 0x4a8830)

        // Shrubs
        const shrubMat = new THREE.MeshLambertMaterial({ color: 0x5a8840 })
        ;[[-3.2, -2.1], [0.8, -2.1], [2.2, -1.5]].forEach(([sx, sz]) => {
            const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), shrubMat)
            s.position.set(sx, 0.35, sz)
            s.castShadow = true
            scene.add(s)
        })

        // ── Room hotspot meshes ──────────────────────────────────────
        const hotspots: THREE.Mesh[] = []
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        ROOMS.forEach(room => {
            const geo = new THREE.SphereGeometry(0.25, 12, 8)
            const mat = new THREE.MeshLambertMaterial({
                color: new THREE.Color(room.color),
                transparent: true, opacity: 0.85
            })
            const sphere = new THREE.Mesh(geo, mat)
            sphere.position.set(room.x, room.floor === 0 ? 1.5 : 4.2, room.z)
            sphere.userData = { room }
            hotspots.push(sphere)
            scene.add(sphere)

            // Ring around hotspot
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.35, 0.03, 8, 24),
                new THREE.MeshLambertMaterial({ color: new THREE.Color(room.color) })
            )
            ring.position.copy(sphere.position)
            ring.rotation.x = Math.PI / 2
            scene.add(ring)
        })

        // ── OrbitControls (manual) ───────────────────────────────────
        let isDragging = false
        let prevMouse = { x: 0, y: 0 }
        let spherical = { theta: 0.5, phi: 0.8, radius: 14 }
        let target = new THREE.Vector3(0, 2, 0)

        const updateCamera = () => {
            camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
            camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi)
            camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
            camera.lookAt(target)
        }
        updateCamera()

        canvas.addEventListener("mousedown", e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY } })
        canvas.addEventListener("mouseup",   () => { isDragging = false })

        canvas.addEventListener("mousemove", e => {
            if (isDragging) {
                const dx = (e.clientX - prevMouse.x) * 0.008
                const dy = (e.clientY - prevMouse.y) * 0.008
                spherical.theta -= dx
                spherical.phi = Math.max(0.15, Math.min(Math.PI / 2, spherical.phi + dy))
                prevMouse = { x: e.clientX, y: e.clientY }
                updateCamera()
            }
            // Hover detection
            const rect = canvas.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length > 0) {
                const r = hits[0].object.userData.room
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: r.label })
                canvas.style.cursor = "pointer"
            } else {
                setTooltip(null)
                canvas.style.cursor = "grab"
            }
        })

        canvas.addEventListener("click", e => {
            const rect = canvas.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length > 0) {
                const room = hits[0].object.userData.room
                setActiveRoom(room)
                // Animate camera toward room
                target.set(room.x * 0.8, room.floor === 0 ? 1.5 : 4, room.z * 0.8)
                spherical.radius = 8
                updateCamera()
            }
        })

        canvas.addEventListener("wheel", e => {
            spherical.radius = Math.max(4, Math.min(22, spherical.radius + e.deltaY * 0.02))
            updateCamera()
        })

        // ── Auto-rotate ──────────────────────────────────────────────
        let autoRotate = true
        canvas.addEventListener("mousedown", () => { autoRotate = false })

        // ── Animate ──────────────────────────────────────────────────
        const clock = new THREE.Clock()
        const animate = () => {
            animId = requestAnimationFrame(animate)
            const t = clock.getElapsedTime()
            if (autoRotate) {
                spherical.theta += 0.003
                updateCamera()
            }
            // Bob hotspots
            hotspots.forEach((h, i) => {
                h.position.y = (h.userData.room.floor === 0 ? 1.5 : 4.2) + Math.sin(t * 1.5 + i) * 0.08
            })
            renderer.render(scene, camera)
        }
        animate()

        // Resize
        const onResize = () => {
            camera.aspect = canvas.clientWidth / canvas.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(canvas.clientWidth, canvas.clientHeight)
        }
        window.addEventListener("resize", onResize)

        threeRef.current = { renderer, scene, camera }
        setLoaded(true)

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener("resize", onResize)
            renderer.dispose()
        }
    }, [])

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="3D Property View">
            <div className="v3d-wrap">
                {/* Header */}
                <div className="v3d-header">
                    <button className="v3d-back" onClick={onBack}>
                        <IconArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <div className="v3d-title-block">
                        <h2 className="v3d-title">Villa Anfa — 3D Viewer</h2>
                        <span className="v3d-sub">Drag to rotate · Scroll to zoom · Click hotspots to explore</span>
                    </div>
                    <div className="v3d-mode-toggle">
                        <button className={`v3d-mode-btn ${mode === "exterior" ? "active" : ""}`} onClick={() => setMode("exterior")}>Exterior</button>
                        <button className={`v3d-mode-btn ${mode === "walkthrough" ? "active" : ""}`} onClick={() => setMode("walkthrough")}>Walk-through</button>
                    </div>
                </div>

                {/* Main 3D canvas area */}
                <div className="v3d-canvas-wrap">
                    {!loaded && (
                        <div className="v3d-loading">
                            <div className="v3d-spinner" />
                            <span>Building 3D model…</span>
                        </div>
                    )}
                    <canvas ref={canvasRef} className="v3d-canvas" />

                    {/* Tooltip */}
                    {tooltip && (
                        <div className="v3d-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}>
                            {tooltip.label}
                        </div>
                    )}

                    {/* Controls hint */}
                    <div className="v3d-hints">
                        <span>🖱 Drag — Rotate</span>
                        <span>⚲ Scroll — Zoom</span>
                        <span>● Click dot — Room info</span>
                    </div>
                </div>

                {/* Side panel */}
                <div className="v3d-side">
                    <div className="v3d-legend">
                        <div className="v3d-legend-title">Rooms</div>
                        {ROOMS.map(r => (
                            <button
                                key={r.id}
                                className={`v3d-room-btn ${activeRoom?.id === r.id ? "active" : ""}`}
                                onClick={() => setActiveRoom(r)}
                                style={{ "--room-color": r.color } as any}
                            >
                                <span className="v3d-room-dot" style={{ background: r.color }} />
                                <span className="v3d-room-name">{r.label}</span>
                                <span className="v3d-room-floor">Floor {r.floor + 1}</span>
                            </button>
                        ))}
                    </div>

                    {/* Room detail card */}
                    {activeRoom ? (
                        <div className="v3d-detail-card" style={{ borderColor: activeRoom.color }}>
                            <div className="v3d-detail-header" style={{ background: activeRoom.color }}>
                                {activeRoom.label}
                            </div>
                            <div className="v3d-detail-body">
                                <div className="v3d-detail-row">
                                    <span>Area</span><strong>{activeRoom.area}</strong>
                                </div>
                                <div className="v3d-detail-row">
                                    <span>Floor</span><strong>{activeRoom.floor + 1}</strong>
                                </div>
                                <p className="v3d-detail-desc">{activeRoom.desc}</p>
                                <button className="v3d-detail-btn">Book a Visit</button>
                            </div>
                        </div>
                    ) : (
                        <div className="v3d-detail-card v3d-detail-card--empty">
                            <p>Click a colored dot on the model to see room details</p>
                        </div>
                    )}

                    {/* Property summary */}
                    <div className="v3d-summary">
                        {[["Price","$778,100"],["Beds","4"],["Baths","3"],["Total","182 m²"]].map(([l,v]) => (
                            <div key={l} className="v3d-summary-item">
                                <span className="v3d-summary-lbl">{l}</span>
                                <span className="v3d-summary-val">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default PropertyViewer3D
