import { useState } from "react";
import { useNavigate } from "react-router-dom"
import "../style/home.css";

const Home = () => {
    const [activeFilter, setActiveFilter] = useState<string>("City");
    const navigate = useNavigate()

    const filters = ["City", "House", "Residential", "Apartment"];

    return (
        <div className="home">
            {/* NAVBAR */}
            <nav className="navbar">
    <div className="logo">KÔRÂ</div>
        <ul className="nav-links">
    <li className="active">Home</li>
        <li>About Us</li>
    <li>Property List</li>
    <li>Contact Us</li>
    </ul>
    <div className="nav-right">
    <div className="lang-selector">
        <span>🌐</span>
    <span>Eng</span>
    </div>
        <button className="btn-signup" onClick={() => navigate("/register")}>
            Sign Up
        </button>
    </div>
    </nav>

    {/* HERO */}
    <section className="hero">
    <div className="hero-overlay" />

    <div className="hero-content">
        {/* Tags */}
        <div className="hero-tags">
    <span className="tag">House</span>
        <span className="tag">Apartment</span>
        <span className="tag">Residential</span>
        </div>

    {/* Left: Title */}
    <div className="hero-left">
    <h1 className="hero-title">
        Build Your Future, One<br />Property at a Time.
    </h1>
    </div>

    {/* Right: Description */}
    <div className="hero-right">
    <p className="hero-desc">
        Own Your World. One Property at a Time. Own Your World. One
    Property at a Time. Own Your World. One Property at a Time. Own
    Your World. One Property at a Time.
    </p>
    </div>
    </div>

    {/* SEARCH BOX */}
    <div className="search-box">
    <h3 className="search-title">Find the best place</h3>
    <div className="search-fields">
    <div className="field">
        <label>Looking for</label>
                          <input type="text" placeholder="Enter type" />
        </div>
        <div className="field">
        <label>Price</label>
        <select>
        <option>Price</option>
        <option>Under 100k</option>
    <option>100k - 500k</option>
    <option>500k+</option>
    </select>
    </div>
    <div className="field">
        <label>Locations</label>
        <select>
        <option>Location</option>
        <option>Casablanca</option>
        <option>Rabat</option>
        <option>Marrakech</option>
        </select>
        </div>
        <div className="field">
        <label>Number of rooms</label>
    <select>
    <option>2 Bed rooms</option>
    <option>1 Bed room</option>
    <option>3 Bed rooms</option>
    <option>4+ Bed rooms</option>
    </select>
    </div>
    </div>

    <div className="search-footer">
    <div className="filter-row">
    <span className="filter-label">Filter:</span>
    {filters.map((f) => (
        <button
            key={f}
        className={`filter-btn ${activeFilter === f ? "active" : ""}`}
        onClick={() => setActiveFilter(f)}
    >
        {f}
        </button>
    ))}
    </div>
    <button className="btn-search">Search Properties</button>
    </div>
    </div>
    </section>
    </div>
);
};

export default Home;