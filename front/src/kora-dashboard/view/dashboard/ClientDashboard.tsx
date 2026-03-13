import { useState, useEffect, useRef } from "react"
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
        id: 1, agent: "Brandon Levin", price: "$389,781", address: "6391 Elgin St, Celina, Delaware 10299",
        beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: "New", saved: false, views: 1240, rating: 4.8, reviews: 24,
        img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&q=75&auto=format&fit=crop",
        ],
        desc: "A beautifully crafted 4-bedroom home with open-plan living spaces, high ceilings, and a modern kitchen. Located in a quiet residential area close to schools and parks. Features include a large landscaped garden, double garage, and premium finishes throughout.",
        features: ["Garden", "Double Garage", "Modern Kitchen", "High Ceilings", "Quiet Street", "Near Schools"],
    },
    {
        id: 2, agent: "Gustavo Calzoni", price: "$160,581", address: "2715 Ash Dr, San Jose, South Dakota 83475",
        beds: 5, baths: 4, sqft: "2240", status: "For Sale", tag: null, saved: true, views: 876, rating: 4.5, reviews: 18,
        img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=75&auto=format&fit=crop",
        ],
        desc: "Spacious 5-bedroom property offering generous living space across two floors. Recently renovated kitchen and bathrooms, with new hardwood floors throughout. The large backyard is perfect for entertaining.",
        features: ["Renovated Kitchen", "Hardwood Floors", "Large Backyard", "Cul-de-sac", "Two Stories", "New Bathrooms"],
    },
    {
        id: 3, agent: "Chance Dorwart", price: "$2,400 /mo", address: "8502 Preston Rd, Inglewood, Maine 98380",
        beds: 3, baths: 2, sqft: "1850", status: "For Rent", tag: "Featured", saved: false, views: 543, rating: 4.7, reviews: 11,
        img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=75&auto=format&fit=crop",
        ],
        desc: "Modern 3-bedroom rental with stunning city views from the rooftop terrace. Building amenities include a gym, concierge service, and secure underground parking. Available immediately.",
        features: ["City Views", "Rooftop Terrace", "Gym Access", "Concierge", "Underground Parking", "Furnished"],
    },
    {
        id: 4, agent: "Craig Herwitz", price: "$778,100", address: "4140 Parker Rd, New Mexico 31134",
        beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: null, saved: true, views: 2100, rating: 4.9, reviews: 37,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&q=75&auto=format&fit=crop",
        ],
        desc: "A premium 4-bedroom estate with chef's kitchen, formal dining room, home office, and a resort-style pool. The master suite includes a walk-in wardrobe and spa-inspired ensuite.",
        features: ["Swimming Pool", "Chef Kitchen", "Home Office", "Walk-in Wardrobe", "Formal Dining", "Spa Ensuite"],
    },
    {
        id: 5, agent: "Livia Rhiel", price: "$1,200 /mo", address: "1234 Sunset Blvd, Los Angeles, CA 90028",
        beds: 2, baths: 1, sqft: "850", status: "For Rent", tag: null, saved: false, views: 390, rating: 4.2, reviews: 8,
        img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=400&q=75&auto=format&fit=crop",
        ],
        desc: "Charming 2-bedroom apartment in the heart of West Hollywood. Walking distance to restaurants, cafes, and nightlife. Renovated with new appliances and fresh interiors.",
        features: ["Rooftop Garden", "Renovated", "New Appliances", "Parking Spot", "West Hollywood", "Walk to Shops"],
    },
    {
        id: 6, agent: "Nolan Saris", price: "$245,000", address: "9876 Maple Ave, Chicago, IL 60601",
        beds: 3, baths: 2, sqft: "1400", status: "For Sale", tag: "Price Drop", saved: false, views: 720, rating: 4.4, reviews: 14,
        img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&q=75&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=75&auto=format&fit=crop",
        ],
        desc: "Charming brick home in Chicago's Maple Avenue corridor. Three bedrooms, two bathrooms, and a cozy fireplace. Basement ideal as media room or home gym.",
        features: ["Fireplace", "Finished Basement", "Brick Exterior", "Near L-Train", "Media Room", "Updated HVAC"],
    },
]

const COMMENTS: Record<number, { name: string; date: string; rating: number; text: string }[]> = {
    1: [
        { name: "Amina Touré", date: "2 days ago", rating: 5, text: "Visited this property last weekend — absolutely stunning. The garden is even more beautiful in person and the open-plan living area is very well designed." },
        { name: "James W.",    date: "1 week ago", rating: 4, text: "Great location and the house is immaculate. The only downside is parking can be a bit tricky on weekends due to the nearby market." },
    ],
    2: [{ name: "Sofia Chen",    date: "3 days ago", rating: 5, text: "Great value for money! The renovation quality is excellent and the neighborhood is peaceful. Highly recommend visiting." }],
    3: [{ name: "Rania M.",      date: "5 days ago", rating: 5, text: "The rooftop terrace has an incredible view. Building management is responsive and the gym is well-equipped." }],
    4: [
        { name: "Lucas Bernard", date: "1 day ago",  rating: 5, text: "Dream property. The pool and chef kitchen are worth every cent. Viewing was impressive, the agent was very professional." },
        { name: "Nadia P.",      date: "4 days ago", rating: 5, text: "By far the most impressive listing I've visited. The spa ensuite is a showstopper." },
    ],
    5: [{ name: "Marco F.",      date: "1 week ago", rating: 4, text: "Perfect location for anyone who enjoys the LA lifestyle. The rooftop garden is a real bonus." }],
    6: [{ name: "Ella D.",       date: "3 days ago", rating: 4, text: "Great starter home in a convenient location. The finished basement is a big plus — used it as a home office." }],
}

// ── 3D VIEWER DATA ───────────────────────────────────────────────────
const ROOMS = [
    { id: "living",  label: "Living Room",   floor: 0, x: -1.2, z: -0.5, color: "#b8922a", area: "42 m²", desc: "Open-plan with floor-to-ceiling windows and premium finishes." },
    { id: "kitchen", label: "Kitchen",        floor: 0, x:  1.2, z: -0.5, color: "#2a7ab8", area: "28 m²", desc: "Modern kitchen with island, gas range, and premium appliances." },
    { id: "bedroom", label: "Master Bedroom", floor: 1, x: -1.0, z:  0.2, color: "#7a2ab8", area: "35 m²", desc: "En-suite with walk-in wardrobe and private terrace access." },
    { id: "office",  label: "Home Office",    floor: 1, x:  1.0, z:  0.2, color: "#2ab87a", area: "22 m²", desc: "Quiet corner office with built-in shelving and city views." },
    { id: "pool",    label: "Pool & Garden",  floor: 0, x:  0.0, z:  1.8, color: "#2ab8b8", area: "60 m²", desc: "Heated outdoor pool with sun deck and landscaped garden." },
]

// ── 3D VIEWER MODAL ──────────────────────────────────────────────────
const Viewer3D = ({ prop, onClose }: { prop: typeof PROPERTIES[0]; onClose: () => void }) => {
    const canvasRef   = useRef<HTMLCanvasElement>(null)
    const [activeRoom, setActiveRoom] = useState<typeof ROOMS[0] | null>(null)
    const [tooltip,    setTooltip]    = useState<{ x: number; y: number; label: string } | null>(null)
    const [loaded,     setLoaded]     = useState(false)

    useEffect(() => {
        let animId: number
        const canvas = canvasRef.current
        if (!canvas) return
        const THREE = (window as any).THREE
        if (!THREE) { console.error("Three.js not loaded — add CDN to index.html"); return }

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf0ece4)
        scene.fog = new THREE.FogExp2(0xf0ece4, 0.035)

        const W = canvas.clientWidth, H = canvas.clientHeight
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200)
        camera.position.set(8, 6, 12)
        camera.lookAt(0, 1.5, 0)

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        // Lights
        scene.add(new THREE.AmbientLight(0xfff8f0, 0.75))
        const sun = new THREE.DirectionalLight(0xfff4e0, 1.4)
        sun.position.set(10, 18, 10)
        sun.castShadow = true
        sun.shadow.mapSize.set(2048, 2048)
        sun.shadow.camera.left   = -12; sun.shadow.camera.right = 12
        sun.shadow.camera.top    =  12; sun.shadow.camera.bottom = -12
        scene.add(sun)
        const fill = new THREE.DirectionalLight(0xd0e8ff, 0.35)
        fill.position.set(-8, 4, -6); scene.add(fill)

        // Materials
        const mat = (col: number, opts: any = {}) => new THREE.MeshLambertMaterial({ color: col, ...opts })
        const mWall   = mat(0xf2ece0)
        const mRoof   = mat(0x1e1e1e)
        const mGlass  = mat(0x90c8e8, { transparent: true, opacity: 0.45 })
        const mGround = mat(0x7ab85a)
        const mPath   = mat(0xd4c8a8)
        const mDoor   = mat(0xc8a870)
        const mPool   = mat(0x40a8c8, { transparent: true, opacity: 0.8 })
        const mDeck   = mat(0xe0d4b8)
        const mGarage = mat(0xd8d0c0)
        const mWood   = mat(0x8b6840)

        const box = (w: number, h: number, d: number, m: any, x=0, y=0, z=0) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
            mesh.position.set(x, y, z)
            mesh.castShadow = true; mesh.receiveShadow = true
            scene.add(mesh); return mesh
        }

        // Ground & landscaping
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mGround)
        ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)
        box(1.2, 0.05, 4,   mPath,  0,    0.02,  3.5)   // path
        box(5,   0.1,  3.5, mDeck,  0,    0.05,  5.5)   // pool deck
        box(3.5, 0.08, 2.5, mPool,  0,    0.12,  5.6)   // pool water

        // Lower floor
        box(5.5, 2.6, 4.5, mWall,  -0.4, 1.3,   0)
        box(6.2, 0.22,5.2, mRoof,  -0.4, 2.72,  0)
        // Upper floor
        box(4.2, 2.4, 4.0, mWall,  -0.6, 4.5,   0.1)
        box(4.2, 0.5, 4.02,mWood,  -0.6, 3.5,   0.1)   // wood strip
        box(5.0, 0.22,4.7, mRoof,  -0.6, 5.72,  0.1)
        // Garage
        box(2.8, 2.0, 3.5, mGarage, 3.0, 1.0,   0.2)
        box(3.2, 0.22,4.0, mRoof,   3.0, 2.12,  0.2)
        // Windows
        box(1.8, 1.8, 0.08, mGlass, -1.5, 1.5, -2.27)
        box(1.8, 1.8, 0.08, mGlass,  0.5, 1.5, -2.27)
        box(1.6, 1.4, 0.08, mGlass, -1.6, 4.6, -2.17)
        box(1.6, 1.4, 0.08, mGlass,  0.2, 4.6, -2.17)
        // Door
        box(0.9, 2.1, 0.08, mDoor, -0.5, 1.05, -2.27)

        // Trees
        const tree = (x: number, z: number, h: number, cr: number, col: number) => {
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.16, h * 0.4, 8),
                mat(0x5a4030)
            )
            trunk.position.set(x, h * 0.2, z); trunk.castShadow = true; scene.add(trunk)
            const c1 = new THREE.Mesh(new THREE.SphereGeometry(cr, 10, 8), mat(col))
            c1.position.set(x, h * 0.4 + cr * 0.7, z); c1.castShadow = true; scene.add(c1)
            const c2 = new THREE.Mesh(
                new THREE.SphereGeometry(cr * 0.75, 10, 8),
                mat(new THREE.Color(col).offsetHSL(0, 0, 0.08).getHex())
            )
            c2.position.set(x + 0.2, h * 0.4 + cr * 1.1, z - 0.2); c2.castShadow = true; scene.add(c2)
        }
        tree(-5.5, -1,   4.5, 1.4, 0x4a8830)
        tree(-6.0,  0.5, 4.0, 1.2, 0x5a9840)
        tree( 5.5, -0.5, 3.5, 1.6, 0xb03828)
        tree( 6.2,  1.0, 2.5, 1.0, 0xc84838)
        tree( 5.8,  2.5, 2.0, 0.7, 0x4a8830)

        // Shrubs
        const shrubM = mat(0x5a8840)
        ;[[-3.2, -2.1], [0.8, -2.1], [2.2, -1.5]].forEach(([sx, sz]) => {
            const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), shrubM)
            s.position.set(sx, 0.35, sz); s.castShadow = true; scene.add(s)
        })

        // Room hotspots
        const hotspots: THREE.Mesh[] = []
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        ROOMS.forEach(room => {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.28, 12, 8),
                mat(new THREE.Color(room.color).getHex(), { transparent: true, opacity: 0.9 })
            )
            sphere.position.set(room.x, room.floor === 0 ? 1.6 : 4.4, room.z)
            sphere.userData = { room }
            hotspots.push(sphere); scene.add(sphere)

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.38, 0.03, 8, 24),
                mat(new THREE.Color(room.color).getHex())
            )
            ring.position.copy(sphere.position)
            ring.rotation.x = Math.PI / 2; scene.add(ring)
        })

        // Manual orbit
        let drag = false, prev = { x: 0, y: 0 }
        let sph = { theta: 0.5, phi: 0.78, r: 14 }
        const tgt = new THREE.Vector3(0, 2, 0)
        let autoRot = true

        const updateCam = () => {
            camera.position.set(
                tgt.x + sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
                tgt.y + sph.r * Math.cos(sph.phi),
                tgt.z + sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
            )
            camera.lookAt(tgt)
        }
        updateCam()

        const onDown  = (e: MouseEvent) => { drag = true; autoRot = false; prev = { x: e.clientX, y: e.clientY } }
        const onUp    = ()              => { drag = false }
        const onMove  = (e: MouseEvent) => {
            if (drag) {
                sph.theta -= (e.clientX - prev.x) * 0.008
                sph.phi    = Math.max(0.15, Math.min(Math.PI / 2.1, sph.phi + (e.clientY - prev.y) * 0.008))
                prev = { x: e.clientX, y: e.clientY }; updateCam()
            }
            const rect = canvas.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length) {
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: hits[0].object.userData.room.label })
                canvas.style.cursor = "pointer"
            } else { setTooltip(null); canvas.style.cursor = "grab" }
        }
        const onClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(hotspots)
            if (hits.length) {
                const room = hits[0].object.userData.room
                setActiveRoom(room)
                tgt.set(room.x * 0.7, room.floor === 0 ? 1.5 : 4, room.z * 0.7)
                sph.r = 7; updateCam()
            }
        }
        const onWheel = (e: WheelEvent) => { sph.r = Math.max(4, Math.min(22, sph.r + e.deltaY * 0.02)); updateCam() }

        canvas.addEventListener("mousedown", onDown)
        canvas.addEventListener("mouseup",   onUp)
        canvas.addEventListener("mousemove", onMove)
        canvas.addEventListener("click",     onClick)
        canvas.addEventListener("wheel",     onWheel)

        const clock = new THREE.Clock()
        const animate = () => {
            animId = requestAnimationFrame(animate)
            const t = clock.getElapsedTime()
            if (autoRot) { sph.theta += 0.004; updateCam() }
            hotspots.forEach((h, i) => {
                h.position.y = (h.userData.room.floor === 0 ? 1.6 : 4.4) + Math.sin(t * 1.5 + i) * 0.1
            })
            renderer.render(scene, camera)
        }
        animate()
        setLoaded(true)

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
                {/* Header */}
                <div className="c3d-header">
                    <div>
                        <div className="c3d-modal-title">
                            {prop.agent}'s Property — 3D View
                        </div>
                        <div className="c3d-modal-sub">
                            Drag to rotate · Scroll to zoom · Click a dot to explore rooms
                        </div>
                    </div>
                    <button className="c3d-close" onClick={onClose}>✕</button>
                </div>

                <div className="c3d-body">
                    {/* Canvas zone */}
                    <div className="c3d-canvas-wrap">
                        {!loaded && (
                            <div className="c3d-loading">
                                <div className="c3d-spinner" />
                                <span>Building 3D model…</span>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="c3d-canvas" />
                        {tooltip && (
                            <div className="c3d-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}>
                                {tooltip.label}
                            </div>
                        )}
                        <div className="c3d-hints">
                            <span>🖱 Drag — Rotate</span>
                            <span>⚲ Scroll — Zoom</span>
                            <span>● Click dot — Room</span>
                        </div>
                    </div>

                    {/* Side panel */}
                    <div className="c3d-side">
                        {/* Property info */}
                        <div className="c3d-prop-info">
                            <div className="c3d-prop-price">{prop.price}</div>
                            <div className="c3d-prop-addr">{prop.address}</div>
                            <div className="c3d-prop-specs">
                                <span>{prop.beds} beds</span>
                                <span>{prop.baths} baths</span>
                                <span>{prop.sqft} sqft</span>
                            </div>
                        </div>

                        <div className="c3d-rooms-title">Explore Rooms</div>

                        {/* Room buttons */}
                        <div className="c3d-rooms">
                            {ROOMS.map(r => (
                                <button
                                    key={r.id}
                                    className={`c3d-room-btn ${activeRoom?.id === r.id ? "active" : ""}`}
                                    style={{ "--room-color": r.color } as any}
                                    onClick={() => setActiveRoom(r)}
                                >
                                    <span className="c3d-room-dot" style={{ background: r.color }} />
                                    <div className="c3d-room-info">
                                        <span className="c3d-room-name">{r.label}</span>
                                        <span className="c3d-room-area">{r.area} · Floor {r.floor + 1}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Room detail */}
                        {activeRoom ? (
                            <div className="c3d-room-detail" style={{ borderColor: activeRoom.color }}>
                                <div className="c3d-room-detail-header" style={{ background: activeRoom.color }}>
                                    <span>{activeRoom.label}</span>
                                    <span>{activeRoom.area}</span>
                                </div>
                                <p className="c3d-room-detail-desc">{activeRoom.desc}</p>
                            </div>
                        ) : (
                            <div className="c3d-room-empty">
                                Click a colored dot on the model to explore a room
                            </div>
                        )}

                        <button className="c3d-book-btn">Book a Visit</button>
                    </div>
                </div>
            </div>
        </div>
    )
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
                        {/* LEFT — gallery + comments */}
                        <div>
                            {/* Main image + 3D button */}
                            <div className="detail-main-img">
                                <img src={selectedProp.img} alt={selectedProp.address} className="detail-main-photo" />
                                <button className="detail-3d-btn" onClick={() => setShow3D(true)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                        <path d="M2 17l10 5 10-5"/>
                                        <path d="M2 12l10 5 10-5"/>
                                    </svg>
                                    View in 3D
                                </button>
                            </div>

                            <div className="detail-gallery-row">
                                {selectedProp.gallery.map((src, i) => (
                                    <div key={i} className="detail-thumb">
                                        <img src={src} alt={`view ${i+1}`} className="detail-thumb-photo" />
                                    </div>
                                ))}
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

                        {/* RIGHT — info panel */}
                        <div>
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

                            <div className="detail-map">
                                <IconMap size={28} color="var(--border2)" />
                                <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text2)" }}>Location Map</div>
                                <div style={{ fontSize: 11 }}>Integrate Mapbox / Google Maps here</div>
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
