import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

const Page = () => (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Settings">
        <div className="pg-header">
            <div>
                <div className="pg-title">Settings</div>
                <div className="pg-subtitle">Account and notification preferences</div>
            </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text3)", fontSize: 14 }}>
            Settings panel coming soon
        </div>
    </DashboardLayout>
)

export default Page