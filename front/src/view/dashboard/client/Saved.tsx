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
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Saved Properties">
        <div className="pg-header">
            <div>
                <div className="pg-title">Saved Properties</div>
                <div className="pg-subtitle">Properties you bookmarked</div>
            </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text3)", fontSize: 14 }}>
            Your saved properties will appear here
        </div>
    </DashboardLayout>
)

export default Page