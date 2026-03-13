import { useState } from "react"
import DashboardLayout from "../../component/DashboardLayout"
import { IconMapPin, IconEye, IconMessage, IconHeart, IconBuilding, IconBarChart, IconEdit, IconTrash, IconTrendUp, IconPlus } from "../../component/Icons"
import "../../style/dashboard.css"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

const PROPERTIES = [
    { id:1, name:"Villa Anfa",          loc:"Casablanca, Anfa",  type:"Villa",     price:"$850,000",   status:"for_sale", statusLabel:"For Sale", views:1240, inquiries:18, saved:43, trend:"+22%", up:true  },
    { id:2, name:"Appartement Guéliz",  loc:"Marrakech, Guéliz", type:"Apartment", price:"$1,200 /mo", status:"for_rent", statusLabel:"For Rent", views:876,  inquiries:9,  saved:31, trend:"+8%",  up:true  },
    { id:3, name:"Riad Medina",         loc:"Fès, Médina",       type:"House",     price:"$320,000",   status:"for_sale", statusLabel:"For Sale", views:412,  inquiries:4,  saved:17, trend:"-3%",  up:false },
    { id:4, name:"Studio Agdal",        loc:"Rabat, Agdal",      type:"Apartment", price:"$650 /mo",   status:"rented",   statusLabel:"Rented",   views:230,  inquiries:0,  saved:12, trend:"—",    up:true  },
]

const INQUIRIES = [
    { name:"Amine Touhami",   property:"Villa Anfa",         date:"2 hours ago", type:"Visit Request" },
    { name:"Sophie Marchand", property:"Appartement Guéliz", date:"Yesterday",   type:"Price Inquiry" },
    { name:"Omar Bennis",     property:"Riad Medina",        date:"3 days ago",  type:"Visit Request" },
    { name:"Laura Petit",     property:"Villa Anfa",         date:"4 days ago",  type:"Price Inquiry" },
]

const PageAction = () => (
    <>
        <button className="dl-export-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
        </button>
        <button className="dl-add-btn">
            <IconPlus size={15} color="white" />
            Add Property
        </button>
    </>
)

const OwnerDashboard = () => {
    const [activeTab, setActiveTab] = useState<"all"|"sale"|"rent">("all")

    const filtered = PROPERTIES.filter(p => {
        if (activeTab === "sale") return p.status === "for_sale"
        if (activeTab === "rent") return p.status === "for_rent" || p.status === "rented"
        return true
    })

    const totalViews = PROPERTIES.reduce((a,p) => a+p.views, 0)
    const totalInq   = PROPERTIES.reduce((a,p) => a+p.inquiries, 0)
    const totalSaved = PROPERTIES.reduce((a,p) => a+p.saved, 0)

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="My Properties" pageAction={<PageAction />}>
            {/* Stats */}
            <div className="stats-row">
                {[
                    { label:"Total Views",    value:totalViews.toLocaleString(), icon:<IconEye size={18} color="#1d4ed8"/>,     bg:"var(--blue-bg)",  change:"+18%", up:true  },
                    { label:"Inquiries",      value:totalInq,                    icon:<IconMessage size={18} color="#b8922a"/>, bg:"var(--gold-bg)",  change:"+9%",  up:true  },
                    { label:"Saved by Users", value:totalSaved,                  icon:<IconHeart size={18} color="#c0392b"/>,   bg:"var(--red-bg)",   change:"+14%", up:true  },
                    { label:"Active Listings",value:PROPERTIES.filter(p=>p.status!=="rented").length, icon:<IconBuilding size={18} color="#15803d"/>, bg:"var(--green-bg)", change:"", up:true },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className="stat-icon-wrap" style={{ background:s.bg }}>{s.icon}</div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value">{s.value}</span>
                            {s.change && <span className={`stat-change ${s.up?"stat-up":"stat-down"}`}><IconTrendUp size={10} color="var(--green)"/>{s.change}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="owner-grid">
                {/* Listings */}
                <div className="card">
                    <div className="card-hd">
                        <span className="card-title">Listings</span>
                        <div className="tab-pills">
                            {(["all","sale","rent"] as const).map(t => (
                                <button key={t} className={`tab-pill ${activeTab===t?"tab-pill--active":""}`} onClick={() => setActiveTab(t)}>
                                    {t==="all"?"All":t==="sale"?"For Sale":"For Rent"}
                                </button>
                            ))}
                        </div>
                    </div>
                    {filtered.map(p => (
                        <div className="prop-row" key={p.id}>
                            <div className="prop-thumb-lg"/>
                            <div className="prop-main">
                                <div className="prop-name">{p.name}</div>
                                <div className="prop-loc"><IconMapPin size={11} color="var(--text3)"/>{p.loc}</div>
                                <div className="prop-tags">
                                    <span className="tag-type">{p.type}</span>
                                    <span className={`badge badge-${p.status}`}>{p.statusLabel}</span>
                                </div>
                            </div>
                            <div className="prop-price">{p.price}</div>
                            <div className="prop-metrics">
                                <div className="metric"><span className="metric-val">{p.views}</span><span className="metric-lbl">Views</span></div>
                                <div className="metric"><span className="metric-val">{p.inquiries}</span><span className="metric-lbl">Inquiries</span></div>
                                <div className="metric"><span className="metric-val">{p.saved}</span><span className="metric-lbl">Saved</span></div>
                            </div>
                            <div className={`prop-trend ${p.up?"trend-up":"trend-down"}`}>{p.trend}</div>
                            <div className="prop-actions">
                                <button className="btn-icon"><IconEdit size={14}/></button>
                                <button className="btn-icon"><IconTrash size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right col */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div className="card">
                        <div className="card-hd">
                            <span className="card-title">Recent Inquiries</span>
                            <span className="card-action">See all</span>
                        </div>
                        <div className="inq-list">
                            {INQUIRIES.map((inq,i) => (
                                <div className="inq-row" key={i}>
                                    <div className="inq-av">{inq.name.charAt(0)}</div>
                                    <div style={{ flex:1 }}>
                                        <div className="inq-name">{inq.name}</div>
                                        <div className="inq-prop">{inq.property}</div>
                                        <span className="inq-type">{inq.type}</span>
                                    </div>
                                    <span className="inq-date">{inq.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-hd"><span className="card-title">Views This Week</span></div>
                        <svg className="spark-svg" viewBox="0 0 240 56">
                            <defs>
                                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#b8922a" stopOpacity="0.18"/>
                                    <stop offset="100%" stopColor="#b8922a" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <polygon points="0,48 40,34 80,38 120,18 160,26 200,14 240,20 240,56 0,56" fill="url(#sg)"/>
                            <polyline points="0,48 40,34 80,38 120,18 160,26 200,14 240,20" fill="none" stroke="#b8922a" strokeWidth="2" strokeLinejoin="round"/>
                            {[0,40,80,120,160,200,240].map((x,i) => {
                                const ys=[48,34,38,18,26,14,20]
                                return <circle key={i} cx={x} cy={ys[i]} r="3" fill="#b8922a"/>
                            })}
                        </svg>
                        <div className="spark-lbl">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d}>{d}</span>)}</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default OwnerDashboard
