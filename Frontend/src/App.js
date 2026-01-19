// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import EntryGate from "./pages/EntryGate";
import ActiveGame from "./pages/ingame/ActiveGame";
import SelectGame from "./pages/ingame/SelectGame";
import "./styles/global.css";
import "./styles/ingame.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry gate */}
        <Route path="/" element={<EntryGate />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Ingame flow */}
        <Route path="/ingame/select" element={<SelectGame />} />
        <Route path="/ingame" element={<ActiveGame />} />
      </Routes>
    </BrowserRouter>
  );
}
