import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ChatProvider } from "./context/Chatcontext"
import { NotificationProvider } from "./context/Notificationcontext"
import { ThemeProvider } from "./context/ThemeContext"
import ProtectedRoute from "./routes/ProtectedRoute"

// ── Pages 2FA
import TwoFactorSetup  from "./view/auth/TwoFactorSetup"
import TwoFactorVerify from "./view/auth/TwoFactorVerify"

// ── Pages publiques
import Home          from "./view/home"
import Login         from "./view/login"
import Register      from "./view/register"
import NotAuthorized from "./view/Notauthorized"

// ── Dashboard Client
import ClientBrowse   from "./view/dashboard/client/Browse"
import ClientSaved    from "./view/dashboard/client/Saved"
import ClientVisits   from "./view/dashboard/client/Visits"
import ClientMessages from "./view/dashboard/client/Messages"
import ClientSettings from "./view/dashboard/client/Settings"

// ── Dashboard Owner
import OwnerOverview   from "./view/dashboard/owner/Overview"
import OwnerProperties from "./view/dashboard/owner/Properties"
import OwnerAnalytics  from "./view/dashboard/owner/Analytics"
import OwnerMessages   from "./view/dashboard/owner/Messages"
import OwnerSettings   from "./view/dashboard/owner/Settings"

// ── Dashboard Admin
import AdminDashboard    from "./view/dashboard/AdminDashboard"
import AdminLeads        from "./view/dashboard/admin/Leads"
import AdminProperties   from "./view/dashboard/admin/Properties"
import AdminTransactions from "./view/dashboard/admin/Transactions"
import AdminCalendar     from "./view/dashboard/admin/Calendar"
import AdminSettings     from "./view/dashboard/admin/Settings"
import { PaymentProvider } from "./context/PaymentContext"

// ── Redirect selon le rôle
const DashboardRedirect = () => {
    const { user, loading } = useAuth()
    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text3)", fontSize: 14 }}>
            Loading…
        </div>
    )
    if (!user)                 return <Navigate to="/login"          replace />
    if (user.role === "admin") return <Navigate to="/dashboard/admin" replace />
    if (user.role === "owner") return <Navigate to="/dashboard/owner" replace />
    return <Navigate to="/dashboard/client" replace />
}

const App = () => (
    <ThemeProvider>
        <AuthProvider>
            <BrowserRouter>
                <PaymentProvider>
                    <ChatProvider>
                        <NotificationProvider>
                            <Routes>
                            {/* ── Public */}
                            <Route path="/"               element={<Home />} />
                            <Route path="/login"          element={<Login />} />
                            <Route path="/register"       element={<Register />} />
                            <Route path="/not-authorized" element={<NotAuthorized />} />
                            <Route path="/2fa/setup"      element={<TwoFactorSetup />} />
                            <Route path="/2fa/verify"     element={<TwoFactorVerify />} />
                            <Route path="/dashboard"      element={<DashboardRedirect />} />

                            {/* ── Admin */}
                            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>}/>
                            <Route path="/dashboard/admin/leads" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLeads /></ProtectedRoute>}/>
                            <Route path="/dashboard/admin/properties" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProperties /></ProtectedRoute>}/>
                            <Route path="/dashboard/admin/transactions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTransactions /></ProtectedRoute>}/>
                            <Route path="/dashboard/admin/calendar" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCalendar /></ProtectedRoute>}/>
                            <Route path="/dashboard/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>}/>

                            {/* ── Owner */}
                            <Route path="/dashboard/owner" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerOverview /></ProtectedRoute>}/>
                            <Route path="/dashboard/owner/properties" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerProperties /></ProtectedRoute>}/>
                            <Route path="/dashboard/owner/analytics" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerAnalytics /></ProtectedRoute>}/>
                            <Route path="/dashboard/owner/messages" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerMessages /></ProtectedRoute>}/>
                            <Route path="/dashboard/owner/settings" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerSettings /></ProtectedRoute>}/>

                            {/* ── Client */}
                            <Route path="/dashboard/client" element={<ProtectedRoute allowedRoles={["client"]}><ClientBrowse /></ProtectedRoute>}/>
                            <Route path="/dashboard/client/saved" element={<ProtectedRoute allowedRoles={["client"]}><ClientSaved /></ProtectedRoute>}/>
                            <Route path="/dashboard/client/visits" element={<ProtectedRoute allowedRoles={["client"]}><ClientVisits /></ProtectedRoute>}/>
                            <Route path="/dashboard/client/messages" element={<ProtectedRoute allowedRoles={["client"]}><ClientMessages /></ProtectedRoute>}/>
                            <Route path="/dashboard/client/settings" element={<ProtectedRoute allowedRoles={["client"]}><ClientSettings /></ProtectedRoute>}/>

                            {/* ── Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </NotificationProvider>
                    </ChatProvider>
                </PaymentProvider>
            </BrowserRouter>
        </AuthProvider>
    </ThemeProvider>
)

export default App