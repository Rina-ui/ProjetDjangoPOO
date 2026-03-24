import { useNavigate } from "react-router-dom"

const PROPERTIES = [
    {
        tag: "For Sale",
        img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&auto=format&fit=crop",
        beds: 5, baths: 2,
        name: "Highland Park Residences",
        addr: "144 Oak Street, New York",
        price: "$2,49089.99",
    },
    {
        tag: "For Sale",
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80&auto=format&fit=crop",
        beds: 5, baths: 2,
        name: "The Atrium Residences",
        addr: "789 Forest Lane, Denver, CO",
        price: "$4,56745.00",
    },
    {
        tag: "For Sale",
        img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80&auto=format&fit=crop",
        beds: 5, baths: 2,
        name: "Silver Oak Residences",
        addr: "123 Serenity Drive, Austin, TX",
        price: "$4,56745.00",
    },
    {
        tag: "For Sale",
        img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80&auto=format&fit=crop",
        beds: 5, baths: 2,
        name: "Meadow View Residences",
        addr: "144 Oak Street, New York",
        price: "$2,49089.99",
    },
    {
        tag: "For Sale",
        img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&q=80&auto=format&fit=crop",
        beds: 5, baths: 2,
        name: "Parkview Central Apartments",
        addr: "789 Forest Lane, Denver, CO",
        price: "$2,49089.99",
    },
    {
        tag: "For Sale",
        img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop",
        beds: 5, baths: 2,
        name: "Cedar Ridge Townhomes",
        addr: "123 Serenity Drive, Austin, TX",
        price: "$4,56745.00",
    },
]

const PropertiesSection = () => {
    const navigate = useNavigate()
    return (
        <section className="props-section">
            <div className="props-header">
                <div>
                    <h2 className="props-title">Explore our premier houses</h2>
                    <p className="props-sub">
                        Discover listings with unique features, exceptional quality,<br/>
                        and prime locations, crafted for an unmatched living experience!
                    </p>
                </div>
                <button className="props-see-all" onClick={() => navigate("/register")}>
                    See All Properties →
                </button>
            </div>
            <div className="props-grid">
                {PROPERTIES.map((p, i) => (
                    <div className="prop-card-home" key={i} onClick={() => navigate("/register")}>
                        <div className="prop-card-home__img">
                            <img src={p.img} alt={p.name}/>
                            <span className="prop-card-home__tag">{p.tag}</span>
                        </div>
                        <div className="prop-card-home__body">
                            <div className="prop-card-home__specs">
                                <span>🛏 {p.beds} Bedrooms</span>
                                <span>🚿 {p.baths} Bathroom</span>
                            </div>
                            <div className="prop-card-home__name">{p.name}</div>
                            <div className="prop-card-home__addr">{p.addr}</div>
                            <div className="prop-card-home__price">{p.price}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default PropertiesSection
