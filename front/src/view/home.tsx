import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../style/home.css"
import "../style/landing.css"
import StatsBar          from "../component/StatsBar"
import DiscoverSection   from "../component/DiscoverSection"
import AboutSection      from "../component/aboutSection"
import PropertiesSection from "../component/PropertiesSection"
import FAQSection        from "../component/FAQSection"
import FooterSection     from "../component/FooterSection"

const Home = () => {
    const [activeFilter, setActiveFilter] = useState<string>("City")
    const [lookingFor, setLookingFor] = useState("")
    const [price, setPrice] = useState("any")
    const [location, setLocation] = useState("any")
    const [rooms, setRooms] = useState("2")
    const navigate = useNavigate()
    const filters = ["City", "House", "Residential", "Apartment"]

    const runSearch = () => {
        const params = new URLSearchParams()
        if (lookingFor.trim()) params.set("q", lookingFor.trim())
        if (activeFilter === "Apartment") params.set("category", "Apartment")
        if (activeFilter === "House") params.set("category", "House")
        if (location !== "any") params.set("location", location)
        if (price !== "any") params.set("price", price)
        if (rooms) params.set("rooms", rooms)
        params.set("type", "Rent")
        navigate(`/dashboard/client?${params.toString()}`)
    }

    return (
        <div className="home">
            <nav className="navbar">
                <div className="logo">KÔRÂ</div>
                <ul className="nav-links">
                    <li className="active">Home</li>
                    <li>About Us</li>
                    <li>Property List</li>
                    <li>Contact Us</li>
                </ul>
                <div className="nav-right">
                    <div className="lang-selector"><span>🌐</span><span>Eng</span></div>
                    <button className="btn-signup" onClick={() => navigate("/register")}>Sign Up</button>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <div className="hero-tags">
                        <span className="tag">House</span>
                        <span className="tag">Apartment</span>
                        <span className="tag">Residential</span>
                    </div>
                    <div className="hero-left">
                        <h1 className="hero-title">Build Your Future, One<br />Property at a Time.</h1>
                    </div>
                    <div className="hero-right">
                        <p className="hero-desc">Own Your World. One Property at a Time. Own Your World. One Property at a Time. Own Your World. One Property at a Time. Own Your World. One Property at a Time.</p>
                    </div>
                </div>
                <div className="search-box">
                    <h3 className="search-title">Find the best place</h3>
                    <div className="search-fields">
                        <div className="field"><label>Looking for</label><input type="text" placeholder="Enter type" value={lookingFor} onChange={e => setLookingFor(e.target.value)} /></div>
                        <div className="field"><label>Price</label><select value={price} onChange={e => setPrice(e.target.value)}><option value="any">Any price</option><option value="under_200k">Under 200k</option><option value="200k_500k">200k - 500k</option><option value="over_500k">500k+</option></select></div>
                        <div className="field"><label>Locations</label><select value={location} onChange={e => setLocation(e.target.value)}><option value="any">Any location</option><option value="lome">Lome</option><option value="kara">Kara</option><option value="sokode">Sokode</option></select></div>
                        <div className="field"><label>Number of rooms</label><select value={rooms} onChange={e => setRooms(e.target.value)}><option value="2">2 Bed rooms</option><option value="1">1 Bed room</option><option value="3">3 Bed rooms</option><option value="4+">4+</option></select></div>
                    </div>
                    <div className="search-footer">
                        <div className="filter-row">
                            <span className="filter-label">Filter:</span>
                            {filters.map(f => (
                                <button key={f} className={`filter-btn ${activeFilter === f ? "active" : ""}`} onClick={() => setActiveFilter(f)}>{f}</button>
                            ))}
                        </div>
                        <button className="btn-search" onClick={runSearch}>Search Properties</button>
                    </div>
                </div>
            </section>

            <StatsBar />
            <DiscoverSection />
            <AboutSection />
            <PropertiesSection />
            <FAQSection />
            <FooterSection />
        </div>
    )
}

export default Home