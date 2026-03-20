import { useState, useEffect, useRef } from "react"
import * as T from "three"
import { ROOMS } from "../data/property"
import type { Property, Room } from "../data/property"
import LightingControls, { type LightingMode, type LightingConfig} from "./LightingControls"
import "../style/lighting.css"

interface Props {
    prop:    Property
    onClose: () => void
}

const Viewer3D = ({ prop, onClose }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sRef      = useRef({ theta: 0.5, phi: 0.72, r: 18, drag: false, px: 0, py: 0, autoRot: true })

    // Refs pour les lumières Three.js (modifiées par LightingControls)
    const ambientRef = useRef<T.AmbientLight | null>(null)
    const sunRef     = useRef<T.DirectionalLight | null>(null)
    const sceneRef   = useRef<T.Scene | null>(null)
    const rendRef    = useRef<T.WebGLRenderer | null>(null)

    // État éclairage
    const [lightMode, setLightMode] = useState<LightingMode>("day")
    const [lightHour, setLightHour] = useState(12)

    const [activeRoom, setActiveRoom] = useState<Room | null>(null)
    const [loaded,     setLoaded]     = useState(false)
    const [loadErr,    setLoadErr]    = useState("")
    const [tooltip,    setTooltip]    = useState<{ x: number; y: number; label: string } | null>(null)
    const [gallery,    setGallery]    = useState<string[] | null>(null)
    const [galleryIdx, setGalleryIdx] = useState(0)

    const allImgs = [prop.img, ...prop.gallery]

    const openGallery = (room: Room) => {
        const ri = ROOMS.findIndex(r => r.id === room.id)
        setGallery([
            allImgs[ri % allImgs.length],
            allImgs[(ri + 1) % allImgs.length],
            allImgs[(ri + 2) % allImgs.length],
        ])
        setGalleryIdx(0)
        setActiveRoom(room)
    }

    useEffect(() => {
        let animId: number
        const canvas = canvasRef.current
        if (!canvas) return

        // Scène
        const scene = new T.Scene()
        scene.background = new T.Color(0x2a2a2a)
        scene.fog        = new T.FogExp2(0x2a2a2a, 0.018)

        const W = canvas.clientWidth  || 760
        const H = canvas.clientHeight || 480
        const camera = new T.PerspectiveCamera(45, W / H, 0.1, 300)

        const renderer = new T.WebGLRenderer({ canvas, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.shadowMap.enabled  = true
        renderer.shadowMap.type     = T.PCFSoftShadowMap
        renderer.outputColorSpace   = T.SRGBColorSpace
        rendRef.current = renderer

        // Lumières
        const ambient = new T.AmbientLight(0xfff8f0, 1.2)
        scene.add(ambient)
        ambientRef.current = ambient
        const sun = new T.DirectionalLight(0xfffbe0, 1.8)
        sun.position.set(12, 20, 12); sun.castShadow = true
        sun.shadow.mapSize.set(2048, 2048)
        sun.shadow.camera.left = -20; sun.shadow.camera.right = 20
        sun.shadow.camera.top  =  20; sun.shadow.camera.bottom = -20
        scene.add(sun)
        const fill = new T.DirectionalLight(0xd0e8ff, 0.5)
        fill.position.set(-10, 8, -8); scene.add(fill)
        const back = new T.DirectionalLight(0xfff0e0, 0.3)
        back.position.set(0, 5, -15); scene.add(back)

        // Sol
        const ground = new T.Mesh(
            new T.PlaneGeometry(80, 80),
            new T.MeshLambertMaterial({ color: 0x3a3a3a })
        )
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)

        // Chargement du modèle GLB
        import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
            const loader = new GLTFLoader()
            loader.load(
                "/models/modern_house.glb",
                (gltf) => {
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
                    tgt.copy(center)
                    sRef.current.r = Math.max(size3.x, size3.z) * 2.2
                    updateCam()
                    setLoaded(true)
                },
                (xhr) => console.log((xhr.loaded / xhr.total * 100).toFixed(0) + "% loaded"),
                (err) => { console.error(err); setLoadErr("Impossible de charger le modèle 3D"); setLoaded(true) }
            )
        }).catch(() => { setLoadErr("GLTFLoader non disponible"); setLoaded(true) })

        // Hotspots numérotés (sprite canvas)
        const hotspots: T.Mesh[] = []
        const raycaster = new T.Raycaster()
        const mouse     = new T.Vector2()

        const makeSprite = (num: number, color: string): T.Sprite => {
            const sz = 128
            const cv = document.createElement("canvas")
            cv.width = sz; cv.height = sz
            const ctx = cv.getContext("2d")!
            ctx.beginPath(); ctx.arc(sz/2, sz/2, sz/2-4, 0, Math.PI*2)
            ctx.fillStyle = color; ctx.fill()
            ctx.beginPath(); ctx.arc(sz/2, sz/2, sz/2-18, 0, Math.PI*2)
            ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fill()
            ctx.fillStyle = color; ctx.font = "bold 58px Arial"
            ctx.textAlign = "center"; ctx.textBaseline = "middle"
            ctx.fillText(String(num), sz/2, sz/2+3)
            const sprite = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true }))
            sprite.scale.set(1.2, 1.2, 1.2)
            return sprite
        }

        ROOMS.forEach((room, idx) => {
            const sphere = new T.Mesh(
                new T.SphereGeometry(0.6, 10, 8),
                new T.MeshBasicMaterial({ transparent: true, opacity: 0 })
            )
            sphere.position.set(room.x * 0.8, room.floor === 0 ? 1.5 : 3.5, room.z * 0.8)
            sphere.userData = { room }
            hotspots.push(sphere); scene.add(sphere)
            const sprite = makeSprite(idx + 1, room.color)
            sprite.position.copy(sphere.position)
            sphere.userData.sprite = sprite
            scene.add(sprite)
        })

        // Contrôles caméra
        const s   = sRef.current
        const tgt = new T.Vector3(0, 2, 0)

        const updateCam = () => {
            camera.position.set(
                tgt.x + s.r * Math.sin(s.phi) * Math.sin(s.theta),
                tgt.y + s.r * Math.cos(s.phi),
                tgt.z + s.r * Math.sin(s.phi) * Math.cos(s.theta)
            )
            camera.lookAt(tgt)
        }
        updateCam()

        const onDown  = (e: MouseEvent) => { s.drag = true; s.autoRot = false; s.px = e.clientX; s.py = e.clientY }
        const onUp    = ()              => { s.drag = false }
        const onMove  = (e: MouseEvent) => {
            if (s.drag) {
                s.theta -= (e.clientX - s.px) * 0.007
                s.phi    = Math.max(0.1, Math.min(Math.PI/2.1, s.phi + (e.clientY - s.py) * 0.007))
                s.px = e.clientX; s.py = e.clientY; updateCam()
            }
            const rect = canvas.getBoundingClientRect()
            mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
            mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length) {
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: hits[0].object.userData.room.label })
                canvas.style.cursor = "pointer"
            } else { setTooltip(null); canvas.style.cursor = s.drag ? "grabbing" : "grab" }
        }
        const onClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
            mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length) {
                const room = hits[0].object.userData.room as Room
                openGallery(room)
                tgt.set(room.x * 0.5, room.floor === 0 ? 1.5 : 3.5, room.z * 0.5)
                s.r = 8; updateCam()
            }
        }
        const onWheel = (e: WheelEvent) => { s.r = Math.max(4, Math.min(40, s.r + e.deltaY * 0.025)); updateCam() }

        canvas.addEventListener("mousedown", onDown)
        canvas.addEventListener("mouseup",   onUp)
        canvas.addEventListener("mousemove", onMove)
        canvas.addEventListener("click",     onClick)
        canvas.addEventListener("wheel",     onWheel)

        // Animation
        const clock = new T.Clock()
        const animate = () => {
            animId = requestAnimationFrame(animate)
            const t = clock.getElapsedTime()
            if (s.autoRot) { s.theta += 0.003; updateCam() }
            hotspots.forEach((h, i) => {
                const base = h.userData.room.floor === 0 ? 1.5 : 3.5
                const newY = base + Math.sin(t * 1.6 + i) * 0.16
                h.position.y = newY
                if (h.userData.sprite) h.userData.sprite.position.y = newY
            })
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
            canvas.removeEventListener("click",     onClick)
            canvas.removeEventListener("wheel",     onWheel)
            window.removeEventListener("resize",    onResize)
            renderer.dispose()
        }
    }, [])

    // Applique un preset d'éclairage aux lumières Three.js
    const applyLighting = (config: LightingConfig) => {
        setLightMode(config.mode)
        setLightHour(config.hour)

        if (ambientRef.current) {
            ambientRef.current.color.setHex(config.ambientColor)
            ambientRef.current.intensity = config.ambientIntensity
        }
        if (sunRef.current) {
            sunRef.current.color.setHex(config.sunColor)
            sunRef.current.intensity = config.sunIntensity
            sunRef.current.position.set(config.sunX, config.sunY, config.sunZ)
        }
        if (sceneRef.current) {
            (sceneRef.current.background as T.Color)?.setHex(config.bgColor)
            if (sceneRef.current.fog instanceof T.FogExp2) {
                (sceneRef.current.fog as T.FogExp2).color.setHex(config.fogColor)
                ;(sceneRef.current.fog as T.FogExp2).density = config.fogDensity
            }
        }
    }

    return (
        <div className="c3d-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="c3d-modal">
                <div className="c3d-header">
                    <div>
                        <div className="c3d-modal-title">{prop.agent}'s Property — Vue 3D</div>
                        <div className="c3d-modal-sub">Drag pour tourner · Scroll pour zoomer · Clic sur un numéro = photos</div>
                    </div>
                    <button className="c3d-close" onClick={onClose}>✕</button>
                </div>

                <div className="c3d-body">
                    <div className="c3d-canvas-wrap">
                        {!loaded && <div className="c3d-loading"><div className="c3d-spinner"/><span>Chargement du modèle 3D…</span></div>}
                        {loadErr && <div className="c3d-load-err"><span>⚠️ {loadErr}</span><p>Vérifie que le fichier est dans <code>public/models/</code></p></div>}
                        <canvas ref={canvasRef} className="c3d-canvas"/>
                        {tooltip && <div className="c3d-tooltip" style={{ left: tooltip.x+14, top: tooltip.y-10 }}>{tooltip.label} — clic pour les photos</div>}
                        {/* Contrôles d'éclairage — positionné en haut à gauche du canvas */}
                        <div className="c3d-lighting-wrap">
                            <LightingControls
                                currentMode={lightMode}
                                currentHour={lightHour}
                                onChange={applyLighting}
                            />
                        </div>

                        <div className="c3d-hints">
                            <span>🖱 Drag — Rotate</span>
                            <span>⚲ Scroll — Zoom</span>
                            <span>● Clic — Photos pièce</span>
                        </div>
                    </div>

                    <div className="c3d-side">
                        <div className="c3d-prop-info">
                            <div className="c3d-prop-price">{prop.price}</div>
                            <div className="c3d-prop-addr">{prop.address}</div>
                            <div className="c3d-prop-specs">
                                <span>{prop.beds} beds</span>
                                <span>{prop.baths} baths</span>
                                <span>{prop.sqft} sqft</span>
                            </div>
                        </div>

                        <div className="c3d-rooms-title">Pièces — clic pour les photos</div>
                        <div className="c3d-rooms">
                            {ROOMS.map(r => (
                                <button key={r.id} className={`c3d-room-btn ${activeRoom?.id === r.id ? "active" : ""}`}
                                        style={{ "--room-color": r.color } as any} onClick={() => openGallery(r)}>
                                    <span className="c3d-room-dot" style={{ background: r.color }}/>
                                    <div className="c3d-room-info">
                                        <span className="c3d-room-name">{r.label}</span>
                                        <span className="c3d-room-area">{r.area} · Floor {r.floor + 1}</span>
                                    </div>
                                    <span className="c3d-360-icon">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                            <circle cx="12" cy="13" r="4"/>
                                        </svg>
                                    </span>
                                </button>
                            ))}
                        </div>

                        {activeRoom ? (
                            <div className="c3d-room-detail" style={{ borderColor: activeRoom.color }}>
                                <div className="c3d-room-detail-header" style={{ background: activeRoom.color }}>
                                    <span>{activeRoom.label}</span><span>{activeRoom.area}</span>
                                </div>
                                <p className="c3d-room-detail-desc">{activeRoom.desc}</p>
                            </div>
                        ) : (
                            <div className="c3d-room-empty">Clique sur un point coloré ou une pièce</div>
                        )}
                        <button className="c3d-book-btn">Book a Visit</button>
                    </div>
                </div>
            </div>

            {gallery && (
                <div className="c3d-gallery-overlay" onClick={() => setGallery(null)}>
                    <div className="c3d-gallery-modal" onClick={e => e.stopPropagation()}>
                        <button className="c3d-gallery-close" onClick={() => setGallery(null)}>✕</button>
                        <div className="c3d-gallery-main">
                            <img src={gallery[galleryIdx]} alt="room" className="c3d-gallery-img"/>
                            {gallery.length > 1 && <>
                                <button className="c3d-gallery-prev" onClick={() => setGalleryIdx(i => (i-1+gallery.length) % gallery.length)}>‹</button>
                                <button className="c3d-gallery-next" onClick={() => setGalleryIdx(i => (i+1) % gallery.length)}>›</button>
                            </>}
                            <div className="c3d-gallery-counter">{galleryIdx+1} / {gallery.length}</div>
                        </div>
                        <div className="c3d-gallery-thumbs">
                            {gallery.map((src, i) => (
                                <div key={i} className={`c3d-gallery-thumb ${i === galleryIdx ? "active" : ""}`} onClick={() => setGalleryIdx(i)}>
                                    <img src={src} alt=""/>
                                </div>
                            ))}
                        </div>
                        {activeRoom && <div className="c3d-gallery-title" style={{ color: activeRoom.color }}>{activeRoom.label} · {activeRoom.area}</div>}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Viewer3D