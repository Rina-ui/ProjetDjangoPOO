import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from './view/home.tsx'
import Login from "./view/login.tsx";
import Register from "./view/register.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App