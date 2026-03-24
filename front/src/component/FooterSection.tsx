// src/component/FooterSection.tsx
import { useNavigate } from "react-router-dom"

const FooterSection = () => {
    const navigate = useNavigate()
    return (
        <footer className="footer">
            <div className="footer-top">
                <div className="footer-brand">
                    <div className="footer-logo">KÔRÂ</div>
                    <p>The smart platform for real estate management, connecting owners, tenants and administrators seamlessly.</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <div className="footer-col__title">Platform</div>
                        <span onClick={() => navigate("/register")}>Browse Properties</span>
                        <span onClick={() => navigate("/register")}>List a Property</span>
                        <span onClick={() => navigate("/login")}>Sign In</span>
                        <span onClick={() => navigate("/register")}>Create Account</span>
                    </div>
                    <div className="footer-col">
                        <div className="footer-col__title">Company</div>
                        <span>About Us</span>
                        <span>Contact</span>
                        <span>Careers</span>
                        <span>Blog</span>
                    </div>
                    <div className="footer-col">
                        <div className="footer-col__title">Legal</div>
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                        <span>Cookie Policy</span>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© 2026 KÔRÂ. All rights reserved.</span>
                <div className="footer-socials">
                    <span>Twitter</span>
                    <span>LinkedIn</span>
                    <span>Instagram</span>
                </div>
            </div>
        </footer>
    )
}

export default FooterSection
