import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

const Page = () => (
    <DashboardLayout navItems={NAV_ITEMS} pageTitle="Leads">
        <div className="pg-header">
            <div>
                <div className="pg-title">Leads</div>
                <div className="pg-subtitle">Potential buyers and tenants</div>
            </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text3)", fontSize: 14 }}>
            Lead management coming soon
        </div>
    </DashboardLayout>
)

export default Page