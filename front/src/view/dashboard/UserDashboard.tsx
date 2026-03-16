import { useState, useEffect, useRef } from "react"
import * as T from "three"
import DashboardLayout from "../../component/sidebar"
import {
    IconSearch, IconHeart, IconMapPin, IconBed, IconBath,
    IconSquare, IconArrowLeft, IconStar, IconSend, IconMap,
    IconEye
} from "../../component/Icons"
import "../../style/dashboard.css"
import "../../style/client3d.css"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

const PROPERTIES = [
    {
        id: 1, agent: "Brandon Levin", price: "$389,781",
        address: "6391 Elgin St, Celina, Delaware 10299",
        beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: "New",
        saved: false, views: 1240, rating: 4.8, reviews: 24,
        // Façade extérieure
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            // Salon moderne épuré
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
            // Cuisine blanche avec îlot — sans personne
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            // Chambre master minimaliste
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "A beautifully crafted 4-bedroom modern home with open-plan living, white kitchen and resort-style pool. Stone facade with flat roof architecture.",
        features: ["Swimming Pool", "White Kitchen", "Open Plan", "Master Suite", "Flat Roof", "Double Garage"],
    },
    {
        id: 2, agent: "Gustavo Calzoni", price: "$160,581",
        address: "2715 Ash Dr, San Jose, South Dakota 83475",
        beds: 5, baths: 4, sqft: "2240", status: "For Sale", tag: null,
        saved: true, views: 876, rating: 4.5, reviews: 18,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            // Living room avec baies vitrées
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80&auto=format&fit=crop",
            // Cuisine moderne îlot marbre
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            // Salle de bain spa épurée
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Spacious 5-bedroom villa with pool, generous terrace and two floors. Renovated kitchen with island, hardwood floors and spa bathroom.",
        features: ["Pool Terrace", "Kitchen Island", "Spa Bathroom", "Hardwood Floors", "Two Stories", "Large Garden"],
    },
    {
        id: 3, agent: "Chance Dorwart", price: "$2,400 /mo",
        address: "8502 Preston Rd, Inglewood, Maine 98380",
        beds: 3, baths: 2, sqft: "1850", status: "For Rent", tag: "Featured",
        saved: false, views: 543, rating: 4.7, reviews: 11,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            // Salon ouvert lumineux
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
            // Bureau home office propre
            "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80&auto=format&fit=crop",
            // Chambre avec vue
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Modern 3-bedroom rental with pool and rooftop terrace. Bright living spaces, home office and premium finishes throughout.",
        features: ["Rooftop Terrace", "Pool", "Home Office", "Concierge", "Underground Parking", "Furnished"],
    },
    {
        id: 4, agent: "Craig Herwitz", price: "$778,100",
        address: "4140 Parker Rd, New Mexico 31134",
        beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: null,
        saved: true, views: 2100, rating: 4.9, reviews: 37,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            // Cuisine chef haut de gamme
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            // Salon luxueux sans personnes
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80&auto=format&fit=crop",
            // Salle de bain marbre
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Premium 4-bedroom estate with chef kitchen, home office and resort-style pool. Master suite with walk-in wardrobe and spa ensuite.",
        features: ["Swimming Pool", "Chef Kitchen", "Home Office", "Walk-in Wardrobe", "Spa Ensuite", "Stone Facade"],
    },
    {
        id: 5, agent: "Livia Rhiel", price: "$1,200 /mo",
        address: "1234 Sunset Blvd, Los Angeles, CA 90028",
        beds: 2, baths: 1, sqft: "850", status: "For Rent", tag: null,
        saved: false, views: 390, rating: 4.2, reviews: 8,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            // Chambre épurée moderne
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80&auto=format&fit=crop",
            // Salle de bain minimaliste
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format&fit=crop",
            // Bureau moderne lumineux
            "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Charming 2-bedroom modern unit in West Hollywood. Pool access, private terrace and renovated interiors with premium appliances.",
        features: ["Pool Access", "Private Terrace", "Modern Bedroom", "New Appliances", "Parking", "Walk to Shops"],
    },
    {
        id: 6, agent: "Nolan Saris", price: "$245,000",
        address: "9876 Maple Ave, Chicago, IL 60601",
        beds: 3, baths: 2, sqft: "1400", status: "For Sale", tag: "Price Drop",
        saved: false, views: 720, rating: 4.4, reviews: 14,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            // Salon open-plan
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80&auto=format&fit=crop",
            // Cuisine blanche moderne
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            // Terrasse vue piscine
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Modern home with flat roof design and private pool. Open plan living, white kitchen and spacious terrace perfect for entertaining.",
        features: ["Private Pool", "Flat Roof", "Open Plan", "White Kitchen", "Terrace", "Updated HVAC"],
    },
]



// ── ROOMS ────────────────────────────────────────────────────────────
interface Room {
    id: string; label: string; floor: number
    x: number; z: number; color: string
    area: string; desc: string
}

const ROOMS: Room[] = [
    { id: "living",  label: "Living Room",    floor: 0, x: -1.2, z: -0.5, color: "#b8922a", area: "42 m²", desc: "Open-plan with floor-to-ceiling windows and premium finishes." },
    { id: "kitchen", label: "Kitchen",         floor: 0, x:  1.2, z: -0.5, color: "#2a7ab8", area: "28 m²", desc: "Modern kitchen with island, gas range, and premium appliances." },
    { id: "bedroom", label: "Master Bedroom",  floor: 1, x: -1.0, z:  0.2, color: "#7a2ab8", area: "35 m²", desc: "En-suite with walk-in wardrobe and private terrace access." },
    { id: "office",  label: "Home Office",     floor: 1, x:  1.0, z:  0.2, color: "#2ab87a", area: "22 m²", desc: "Quiet corner office with built-in shelving and city views." },
    { id: "pool",    label: "Pool & Garden",   floor: 0, x:  0.0, z:  1.8, color: "#2ab8b8", area: "60 m²", desc: "Heated outdoor pool with sun deck and landscaped garden." },
]

// ── 3D HOUSE VIEWER — GLB MODEL ─────────────────────────────────────
const Viewer3D = ({ prop, onClose }: { prop: typeof PROPERTIES[0]; onClose: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sRef = useRef({ theta: 0.5, phi: 0.72, r: 18, drag: false, px: 0, py: 0, autoRot: true })
    const [activeRoom,  setActiveRoom]  = useState<typeof ROOMS[number] | null>(null)
    const [loaded,      setLoaded]      = useState(false)
    const [loadErr,     setLoadErr]     = useState("")
    const [tooltip,     setTooltip]     = useState<{ x: number; y: number; label: string } | null>(null)
    const [gallery,     setGallery]     = useState<string[] | null>(null)
    const [galleryIdx,  setGalleryIdx]  = useState(0)
    const allImgs = [prop.img, ...prop.gallery]

    const openGallery = (room: typeof ROOMS[number]) => {
        const ri = ROOMS.findIndex(r => r.id === room.id)
        setGallery([allImgs[ri % allImgs.length], allImgs[(ri+1) % allImgs.length], allImgs[(ri+2) % allImgs.length]])
        setGalleryIdx(0)
        setActiveRoom(room)
    }

    useEffect(() => {
        let animId: number
        const canvas = canvasRef.current
        if (!canvas) return

        // ── Scene ─────────────────────────────────────────────────
        const scene = new T.Scene()
        scene.background = new T.Color(0x2a2a2a)
        scene.fog = new T.FogExp2(0x2a2a2a, 0.018)

        const W = canvas.clientWidth || 760
        const H = canvas.clientHeight || 480
        const camera = new T.PerspectiveCamera(45, W / H, 0.1, 300)

        const renderer = new T.WebGLRenderer({ canvas, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = T.PCFSoftShadowMap
        renderer.outputColorSpace = T.SRGBColorSpace

        // ── Lights ────────────────────────────────────────────────
        scene.add(new T.AmbientLight(0xffffff, 1.5))
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

        // ── Ground ────────────────────────────────────────────────
        const ground = new T.Mesh(
            new T.PlaneGeometry(80, 80),
            new T.MeshLambertMaterial({ color: 0x3a3a3a })
        )
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)

        // ── Load GLB model ────────────────────────────────────────
        // Dynamic import to avoid TypeScript issues
        import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
            const loader = new GLTFLoader()
            loader.load(
                "/models/modern_house.glb",
                (gltf) => {
                    const model = gltf.scene

                    // Auto-center and scale the model
                    const box  = new T.Box3().setFromObject(model)
                    const size = box.getSize(new T.Vector3())
                    const maxDim = Math.max(size.x, size.y, size.z)
                    const scale = 10 / maxDim
                    model.scale.setScalar(scale)

                    // Place on ground
                    const box2 = new T.Box3().setFromObject(model)
                    model.position.y = -box2.min.y
                    model.position.x = 0
                    model.position.z = 0

                    // Enable shadows on all meshes
                    model.traverse((child: T.Object3D) => {
                        if ((child as T.Mesh).isMesh) {
                            const mesh = child as T.Mesh
                            mesh.castShadow = true
                            mesh.receiveShadow = true
                        }
                    })

                    scene.add(model)

                    // Adjust camera distance based on model size
                    const box3  = new T.Box3().setFromObject(model)
                    const size3 = box3.getSize(new T.Vector3())
                    const center = box3.getCenter(new T.Vector3())
                    tgt.copy(center)
                    sRef.current.r = Math.max(size3.x, size3.z) * 2.2
                    updateCam()

                    setLoaded(true)
                },
                (xhr) => {
                    // progress — could show % if needed
                    console.log((xhr.loaded / xhr.total * 100).toFixed(0) + "% loaded")
                },
                (err) => {
                    console.error("GLB load error:", err)
                    setLoadErr("Impossible de charger le modèle 3D")
                    setLoaded(true)
                }
            )
        }).catch(err => {
            console.error("GLTFLoader import error:", err)
            setLoadErr("GLTFLoader non disponible")
            setLoaded(true)
        })

        // ── Hotspots — numbered badges ────────────────────────────
        const hotspots: T.Mesh[] = []
        const raycaster = new T.Raycaster()
        const mouse = new T.Vector2()

        const makeNumberSprite = (num: number, color: string): T.Sprite => {
            const size = 128
            const cv = document.createElement("canvas")
            cv.width = size; cv.height = size
            const ctx = cv.getContext("2d")!
            // Outer ring
            ctx.beginPath()
            ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI*2)
            ctx.fillStyle = color
            ctx.fill()
            // White inner circle
            ctx.beginPath()
            ctx.arc(size/2, size/2, size/2 - 18, 0, Math.PI*2)
            ctx.fillStyle = "rgba(255,255,255,0.92)"
            ctx.fill()
            // Number
            ctx.fillStyle = color
            ctx.font = "bold 58px Arial"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(String(num), size/2, size/2 + 3)
            const tex = new T.CanvasTexture(cv)
            const mat = new T.SpriteMaterial({ map: tex, transparent: true })
            const sprite = new T.Sprite(mat)
            sprite.scale.set(1.2, 1.2, 1.2)
            return sprite
        }

        ROOMS.forEach((room, idx) => {
            // Invisible sphere for raycasting
            const sphere = new T.Mesh(
                new T.SphereGeometry(0.6, 10, 8),
                new T.MeshBasicMaterial({ transparent: true, opacity: 0 })
            )
            sphere.position.set(room.x * 0.8, room.floor === 0 ? 1.5 : 3.5, room.z * 0.8)
            sphere.userData = { room }
            hotspots.push(sphere); scene.add(sphere)

            // Numbered sprite
            const sprite = makeNumberSprite(idx + 1, room.color)
            sprite.position.copy(sphere.position)
            sprite.userData = { isSprite: true, idx }
            scene.add(sprite)

            // Store sprite ref on sphere for animation
            sphere.userData.sprite = sprite
        })

        // ── Orbit ─────────────────────────────────────────────────
        const s = sRef.current
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

        const onDown = (e: MouseEvent) => { s.drag=true; s.autoRot=false; s.px=e.clientX; s.py=e.clientY }
        const onUp   = () => { s.drag=false }
        const onMove = (e: MouseEvent) => {
            if (s.drag) {
                s.theta -= (e.clientX-s.px) * 0.007
                s.phi    = Math.max(0.1, Math.min(Math.PI/2.1, s.phi+(e.clientY-s.py)*0.007))
                s.px=e.clientX; s.py=e.clientY; updateCam()
            }
            const rect = canvas.getBoundingClientRect()
            mouse.x = ((e.clientX-rect.left)/rect.width)*2-1
            mouse.y = -((e.clientY-rect.top)/rect.height)*2+1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length) {
                setTooltip({ x: e.clientX-rect.left, y: e.clientY-rect.top, label: hits[0].object.userData.room.label })
                canvas.style.cursor = "pointer"
            } else { setTooltip(null); canvas.style.cursor = s.drag ? "grabbing" : "grab" }
        }
        const onClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouse.x = ((e.clientX-rect.left)/rect.width)*2-1
            mouse.y = -((e.clientY-rect.top)/rect.height)*2+1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length) {
                const room = hits[0].object.userData.room as typeof ROOMS[number]
                openGallery(room)
                tgt.set(room.x*0.5, room.floor===0?1.5:3.5, room.z*0.5)
                s.r = 8; updateCam()
            }
        }
        const onWheel = (e: WheelEvent) => { s.r=Math.max(4,Math.min(40,s.r+e.deltaY*0.025)); updateCam() }

        canvas.addEventListener("mousedown", onDown)
        canvas.addEventListener("mouseup",   onUp)
        canvas.addEventListener("mousemove", onMove)
        canvas.addEventListener("click",     onClick)
        canvas.addEventListener("wheel",     onWheel)

        // ── Animate ───────────────────────────────────────────────
        const clock = new T.Clock()
        const animate = () => {
            animId = requestAnimationFrame(animate)
            const t = clock.getElapsedTime()
            if (s.autoRot) { s.theta += 0.003; updateCam() }
            hotspots.forEach((h, i) => {
                const base = h.userData.room.floor === 0 ? 1.5 : 3.5
                const newY = base + Math.sin(t * 1.6 + i) * 0.16
                h.position.y = newY
                // Animate the sprite too
                if (h.userData.sprite) {
                    h.userData.sprite.position.y = newY
                }
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

    return (
        <div className="c3d-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="c3d-modal">
                <div className="c3d-header">
                    <div>
                        <div className="c3d-modal-title">{prop.agent}'s Property — Vue 3D</div>
                        <div className="c3d-modal-sub">Drag pour tourner · Scroll pour zoomer · Clic sur un point = photos de la pièce</div>
                    </div>
                    <button className="c3d-close" onClick={onClose}>✕</button>
                </div>

                <div className="c3d-body">
                    <div className="c3d-canvas-wrap">
                        {!loaded && (
                            <div className="c3d-loading">
                                <div className="c3d-spinner"/>
                                <span>Chargement du modèle 3D…</span>
                            </div>
                        )}
                        {loadErr && (
                            <div className="c3d-load-err">
                                <span>⚠️ {loadErr}</span>
                                <p>Vérifie que le fichier est dans <code>public/models/</code></p>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="c3d-canvas" />
                        {tooltip && (
                            <div className="c3d-tooltip" style={{ left: tooltip.x+14, top: tooltip.y-10 }}>
                                {tooltip.label} — clic pour les photos
                            </div>
                        )}
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
                                <button key={r.id}
                                        className={`c3d-room-btn ${activeRoom?.id===r.id?"active":""}`}
                                        style={{"--room-color":r.color} as any}
                                        onClick={() => openGallery(r)}>
                                    <span className="c3d-room-dot" style={{background:r.color}}/>
                                    <div className="c3d-room-info">
                                        <span className="c3d-room-name">{r.label}</span>
                                        <span className="c3d-room-area">{r.area} · Floor {r.floor+1}</span>
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
                            <div className="c3d-room-detail" style={{borderColor:activeRoom.color}}>
                                <div className="c3d-room-detail-header" style={{background:activeRoom.color}}>
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
                                <button className="c3d-gallery-prev" onClick={()=>setGalleryIdx(i=>(i-1+gallery.length)%gallery.length)}>‹</button>
                                <button className="c3d-gallery-next" onClick={()=>setGalleryIdx(i=>(i+1)%gallery.length)}>›</button>
                            </>}
                            <div className="c3d-gallery-counter">{galleryIdx+1} / {gallery.length}</div>
                        </div>
                        <div className="c3d-gallery-thumbs">
                            {gallery.map((src,i) => (
                                <div key={i} className={`c3d-gallery-thumb ${i===galleryIdx?"active":""}`} onClick={()=>setGalleryIdx(i)}>
                                    <img src={src} alt=""/>
                                </div>
                            ))}
                        </div>
                        {activeRoom && <div className="c3d-gallery-title" style={{color:activeRoom.color}}>{activeRoom.label} · {activeRoom.area}</div>}
                    </div>
                </div>
            )}
        </div>
    )
}

const COMMENTS: Record<number, { name: string; date: string; rating: number; text: string }[]> = {
    1: [
        { name: "Amina Touré", date: "2 days ago", rating: 5, text: "Visited this property last weekend — absolutely stunning. The pool and stone facade are even more impressive in person." },
        { name: "James W.",    date: "1 week ago", rating: 4, text: "Great location and the house is immaculate. The open-plan living space is very well designed." },
    ],
    2: [{ name: "Sofia Chen",    date: "3 days ago", rating: 5, text: "Great value! The stone architecture is excellent and the pool terrace is perfect for entertaining." }],
    3: [{ name: "Rania M.",      date: "5 days ago", rating: 5, text: "The rooftop terrace has an incredible view. Building management is responsive and the gym is well-equipped." }],
    4: [
        { name: "Lucas Bernard", date: "1 day ago",  rating: 5, text: "Dream property. The pool and chef kitchen are worth every cent. Very professional agent." },
        { name: "Nadia P.",      date: "4 days ago", rating: 5, text: "By far the most impressive listing. The spa ensuite and stone walls are a showstopper." },
    ],
    5: [{ name: "Marco F.",      date: "1 week ago", rating: 4, text: "Perfect location. The pool access and private terrace are a real bonus." }],
    6: [{ name: "Ella D.",       date: "3 days ago", rating: 4, text: "Great modern home. The private pool and flat roof design are very stylish." }],
}

// ── MAIN DASHBOARD ───────────────────────────────────────────────────
const ClientDashboard = () => {
    const [activeType,   setActiveType]   = useState<"Buy" | "Rent" | "Sell">("Buy")
    const [activeFilter, setActiveFilter] = useState("House")
    const [viewMode,     setViewMode]     = useState<"grid" | "map">("grid")
    const [search,       setSearch]       = useState("")
    const [savedIds,     setSavedIds]     = useState<number[]>([2, 4])
    const [selectedProp, setSelectedProp] = useState<typeof PROPERTIES[0] | null>(null)
    const [comment,      setComment]      = useState("")
    const [allComments,  setAllComments]  = useState(COMMENTS)
    const [show3D,       setShow3D]       = useState(false)

    const toggleSave = (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const submitComment = () => {
        if (!comment.trim() || !selectedProp) return
        setAllComments(prev => ({
            ...prev,
            [selectedProp.id]: [{ name: "You", date: "Just now", rating: 5, text: comment }, ...(prev[selectedProp.id] || [])]
        }))
        setComment("")
    }

    const filtered = PROPERTIES.filter(p => {
        if (activeType === "Rent" && p.status !== "For Rent") return false
        if (activeType === "Buy"  && p.status !== "For Sale") return false
        if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !p.agent.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    // ── DETAIL VIEW ──────────────────────────────────────────────────
    if (selectedProp) {
        const propComments = allComments[selectedProp.id] || []
        return (
            <>
                {/* 3D Modal — portaled above everything */}
                {show3D && <Viewer3D prop={selectedProp} onClose={() => setShow3D(false)} />}

                <DashboardLayout navItems={NAV_ITEMS} pageTitle="Property Detail">
                    <button className="detail-back" onClick={() => setSelectedProp(null)}>
                        <IconArrowLeft size={16} /> Back to listings
                    </button>

                    <div className="detail-grid">
                        {/* LEFT — hero image + gallery + comments */}
                        <div>
                            <div className="detail-hero-block">
                                {/* Grande image principale */}
                                <div className="detail-main-img">
                                    <img src={selectedProp.img} alt={selectedProp.address} className="detail-main-photo" />
                                    {/* Bouton 3D positionné en bas à droite de l'image */}
                                    <button className="detail-3d-btn" onClick={() => setShow3D(true)}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                            <path d="M2 17l10 5 10-5"/>
                                            <path d="M2 12l10 5 10-5"/>
                                        </svg>
                                        View in 3D
                                    </button>
                                </div>
                                {/* Gallery thumbnails collées sous l'image */}
                                <div className="detail-gallery-row">
                                    {selectedProp.gallery.map((src, i) => (
                                        <div key={i} className="detail-thumb">
                                            <img src={src} alt={`view ${i+1}`} className="detail-thumb-photo" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="card">
                                <div className="card-hd">
                                    <span className="card-title">Reviews & Comments ({propComments.length})</span>
                                </div>
                                {propComments.length === 0 && (
                                    <p style={{ color: "var(--text3)", fontSize: "13px", padding: "12px 0" }}>No comments yet. Be the first to leave a review.</p>
                                )}
                                {propComments.map((c, i) => (
                                    <div className="comment-item" key={i}>
                                        <div className="comment-av">{c.name.charAt(0)}</div>
                                        <div className="comment-body">
                                            <div className="comment-header">
                                                <span className="comment-name">{c.name}</span>
                                                <span className="comment-date">{c.date}</span>
                                            </div>
                                            <div className="comment-stars">
                                                {[1,2,3,4,5].map(s => (
                                                    <IconStar key={s} size={12} color={s <= c.rating ? "#b8922a" : "#d4cfc7"} filled={s <= c.rating} />
                                                ))}
                                            </div>
                                            <p className="comment-text">{c.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="comment-form">
                                    <div className="comment-input-wrap">
                                        <div className="comment-av" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>Y</div>
                                        <input
                                            className="comment-input"
                                            placeholder="Share your thoughts about this property..."
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && submitComment()}
                                        />
                                    </div>
                                    <button className="comment-send" onClick={submitComment}>
                                        <IconSend size={14} color="white" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT — info panel sticky */}
                        <div className="detail-right-panel">
                            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                <span className={`badge badge-${selectedProp.status === "For Sale" ? "sale" : "rent"}`}>
                                    {selectedProp.status}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                                    <IconEye size={13} color="var(--text3)" /> {selectedProp.views.toLocaleString()} views
                                </span>
                            </div>

                            <h1 className="detail-title">{selectedProp.agent}'s Property</h1>
                            <div className="detail-loc">
                                <IconMapPin size={14} color="var(--gold)" />{selectedProp.address}
                            </div>
                            <div className="detail-price">
                                {selectedProp.price}
                                {selectedProp.status === "For Rent" && <span> / month</span>}
                            </div>

                            <div className="detail-specs">
                                {[["Bedrooms", selectedProp.beds], ["Bathrooms", selectedProp.baths], ["Sq. ft", selectedProp.sqft], ["Rating", selectedProp.rating]].map(([l, v]) => (
                                    <div key={String(l)} className="detail-spec">
                                        <span className="detail-spec-val" style={l === "Rating" ? { color: "var(--gold)" } : {}}>{v}</span>
                                        <span className="detail-spec-lbl">{l}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="detail-desc">{selectedProp.desc}</p>

                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Features & Amenities</div>
                            <div className="detail-features">
                                {selectedProp.features.map(f => (
                                    <span className="feature-chip" key={f}>
                                        <span style={{ width: 5, height: 5, background: "var(--gold)", borderRadius: "50%", flexShrink: 0 }} />{f}
                                    </span>
                                ))}
                            </div>

                            <div className="detail-actions">
                                <button className="btn-primary">Book a Visit</button>
                                <button
                                    className="btn-ghost"
                                    onClick={() => setSavedIds(p => p.includes(selectedProp.id) ? p.filter(i => i !== selectedProp.id) : [...p, selectedProp.id])}
                                    style={{ color: savedIds.includes(selectedProp.id) ? "var(--red)" : undefined }}
                                >
                                    {savedIds.includes(selectedProp.id) ? "Saved" : "Save"}
                                </button>
                            </div>

                            <div className="detail-map-wrap">
                                <div className="detail-map-header">
                                    <IconMap size={14} color="var(--gold)" />
                                    <span>Localisation</span>
                                    <span className="detail-map-addr">{selectedProp.address}</span>
                                </div>
                                <div className="detail-map-frame">
                                    <iframe
                                        title="map"
                                        className="detail-map-iframe"
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=1.1309%2C6.1096%2C1.2309%2C6.1696&layer=mapnik&marker=6.1375%2C1.2123`}
                                        loading="lazy"
                                    />
                                    <a
                                        href="https://www.openstreetmap.org/?mlat=6.1375&mlon=1.2123#map=14/6.1375/1.2123"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="detail-map-link"
                                    >
                                        Ouvrir dans OpenStreetMap ↗
                                    </a>
                                </div>
                            </div>

                            <div className="card" style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>Listed by</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div className="comment-av" style={{ width: 40, height: 40, fontSize: 15 }}>{selectedProp.agent.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedProp.agent}</div>
                                        <div style={{ fontSize: 11, color: "var(--text3)" }}>Certified Agent · KÔRÂ</div>
                                    </div>
                                    <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Contact</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            </>
        )
    }

    // ── BROWSE VIEW ──────────────────────────────────────────────────
    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Browse Properties" pageAction={
            <button className="dl-add-btn" style={{ fontSize: 13 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                Explore Map
            </button>
        }>
            {/* Search bar */}
            <div className="c-search-bar">
                <div className="c-type-tabs">
                    {(["Buy", "Rent", "Sell"] as const).map(t => (
                        <button key={t} className={`c-tab ${activeType === t ? "c-tab--active" : ""}`} onClick={() => setActiveType(t)}>{t}</button>
                    ))}
                </div>
                <div className="c-search-input-wrap">
                    <IconSearch size={16} color="var(--text3)" />
                    <input className="c-search-input" placeholder="Search city, address, agent..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="c-view-toggle">
                    <button className={`c-view-btn ${viewMode === "grid" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("grid")}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        Grid
                    </button>
                    <button className={`c-view-btn ${viewMode === "map" ? "c-view-btn--active" : ""}`} onClick={() => setViewMode("map")}>
                        <IconMap size={13} /> Map
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="c-filters">
                <span className="c-filter-lbl">Filter:</span>
                {["House", "Villa", "Apartment", "Guesthouse"].map(f => (
                    <button key={f} className={`c-filter-pill ${activeFilter === f ? "c-filter-pill--active" : ""}`} onClick={() => setActiveFilter(f)}>{f}</button>
                ))}
                <select className="c-select"><option>Any Price</option><option>Under $200K</option><option>$200K–$500K</option><option>$500K+</option></select>
                <select className="c-select"><option>Any Location</option><option>Casablanca</option><option>Rabat</option><option>Marrakech</option></select>
            </div>

            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                <strong>{filtered.length}</strong> properties found
            </div>

            {/* Grid + Map */}
            <div className="c-grid">
                <div className={`c-cards ${viewMode === "map" ? "c-cards--with-map" : ""}`}>
                    {filtered.map(prop => (
                        <div className="p-card" key={prop.id} onClick={() => setSelectedProp(prop)}>
                            <div className="p-card-img">
                                <img src={prop.img} alt={prop.address} className="p-card-photo" />
                                {prop.tag && <span className="p-tag">{prop.tag}</span>}
                                <button className={`p-save-btn ${savedIds.includes(prop.id) ? "p-save-btn--saved" : ""}`} onClick={e => toggleSave(prop.id, e)}>
                                    <IconHeart size={14} filled={savedIds.includes(prop.id)} color={savedIds.includes(prop.id) ? "var(--red)" : "var(--text2)"} />
                                </button>
                                <div className="p-agent">
                                    <div className="p-agent-av">{prop.agent.charAt(0)}</div>
                                    <span>{prop.agent}</span>
                                </div>
                                <span className="p-3d-badge">3D</span>
                            </div>
                            <div className="p-body">
                                <div className="p-status">
                                    <div className={`p-status-dot p-status-dot--${prop.status === "For Sale" ? "sale" : "rent"}`} />
                                    <span style={{ color: prop.status === "For Sale" ? "var(--blue)" : "var(--gold)" }}>{prop.status}</span>
                                </div>
                                <div className="p-price">{prop.price}</div>
                                <div className="p-specs">
                                    <div className="p-spec"><IconBed size={12} color="var(--text3)" />{prop.beds} bed</div>
                                    <div className="p-spec"><IconBath size={12} color="var(--text3)" />{prop.baths} bath</div>
                                    <div className="p-spec"><IconSquare size={12} color="var(--text3)" />{prop.sqft} sqft</div>
                                </div>
                                <div className="p-addr"><IconMapPin size={10} color="var(--text3)" />{prop.address}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {viewMode === "map" && (
                    <div className="c-map-panel">
                        <div className="c-map-box">
                            <IconMap size={36} color="var(--border2)" />
                            <p>Map view — integrate Mapbox or Google Maps</p>
                            <div className="c-map-pin pin-1">$389K</div>
                            <div className="c-map-pin pin-2">$160K</div>
                            <div className="c-map-pin pin-3">$778K</div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default ClientDashboard