import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

const Page = () => (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Settings">
        <div className="pg-header">
            <div>
                <div className="pg-title">Settings</div>
                <div className="pg-subtitle">Account preferences and notifications</div>
            </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text3)", fontSize: 14 }}>
            Settings panel coming soon
        </div>
    </DashboardLayout>
)

export default Page