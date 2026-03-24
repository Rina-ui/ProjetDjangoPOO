import { useState } from "react"
import { useNavigate } from "react-router-dom"

const FAQS = [
    {
        q: "What types of properties do you sell?",
        a: "We offer residential, commercial, and luxury properties, offering a wide range of options to suit every preference. We connect you with trusted lenders offering competitive mortgage options and arrange private showings for you to visit and evaluate properties before making a decision. We cater to clients across different price points, catering to different preferences and investment goals."
    },
    { q: "How do I schedule a property viewing?", a: "Simply contact an owner or agent through KÔRÂ and select a convenient time for a visit. Our platform makes it easy to book and manage visits." },
    { q: "Can I list my property on KÔRÂ?", a: "Yes! Owners can register and list their properties after admin validation. Your listing will be visible to thousands of potential buyers and renters." },
    { q: "Is KÔRÂ available in my country?", a: "KÔRÂ is expanding rapidly across multiple countries and cities. Check our coverage map for the latest availability in your region." },
]

const FAQSection = () => {
    const navigate = useNavigate()
    const [open, setOpen] = useState(0)

    return (
        <section className="faq-section">
            <div className="faq-left">
                <h2>Frequently asked questions</h2>
                <div className="faq-list">
                    {FAQS.map((f, i) => (
                        <div className={`faq-item ${open === i ? "faq-item--open" : ""}`} key={i} onClick={() => setOpen(i)}>
                            <div className="faq-question">
                                <span>{f.q}</span>
                                <span className="faq-chevron">{open === i ? "∧" : "∨"}</span>
                            </div>
                            {open === i && <div className="faq-answer">{f.a}</div>}
                        </div>
                    ))}
                </div>
            </div>
            <div className="faq-right">
                <p>Our experts guide you in making informed investment decisions based on market insights. We offer residential, commercial, and luxury properties tailored to different preferences and budgets.</p>
                <div className="faq-agent">
                    <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&auto=format&fit=crop" alt="agent"/>
                    <div>
                        <div className="faq-agent__name">James Mitchell</div>
                        <div className="faq-agent__role">Senior Real Estate Advisor · KÔRÂ</div>
                    </div>
                </div>
                <button className="faq-cta" onClick={() => navigate("/register")}>
                    Get Started →
                </button>
            </div>
        </section>
    )
}

export default FAQSection
