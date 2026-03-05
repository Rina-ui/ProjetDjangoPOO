import "../style/about.css"

const AboutSection = () => {
    return (
        <section className="about-section">

            <div className="about-header">
                <h2>Your primary home might begin to feel left out.</h2>
            </div>
            <div className="about-grid">
                <div className="about-left">
                    <div className="about-main-img">
                        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop" alt="main house" />

                    </div>
                    <div className="about-thumbnails">
                        <img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200&auto=format&fit=crop" alt="thumb1" />
                        <img src="https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=200&auto=format&fit=crop" alt="thumb2" />
                        <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&auto=format&fit=crop" alt="thumb3" />
                    </div>
                </div>
                <div className="about-center">
                    <h3>Big things can happen in small spaces.</h3>
                    <p>With thoughtful design and smart organization...</p>
                    <button className="btn-details">Details</button>
                    <p className="about-sub">Whether it's creating a cozy corner...</p>
                </div>

                <div className="about-right">
                    <div className="video-card">
                        <img src="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=300&auto=format&fit=crop" alt="video thumb" />
                        <p>Each listing offers unique features...</p>
                    </div>
                    <div className="property-card">
                        <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop" alt="modern house" />
                        <p>Pricing Start at $256K</p>
                        <button className="btn-explore">Explore Properties →</button>
                    </div>
                    <div className="nav-arrows">
                        <button>←</button>
                        <button>→</button>
                    </div>
                </div>

            </div>
        </section>
    )
}

export default AboutSection