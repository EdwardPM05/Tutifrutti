import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CrearSala from "./pages/CrearSala";
import Lobby from "./pages/Lobby";
import Juego from "./pages/Juego";
import Revision from "./pages/Revision";
import Resultados from "./pages/Resultados";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<CrearSala />} />
        <Route path="/sala/:id" element={<Lobby />} />
        <Route path="/sala/:id/juego" element={<Juego />} />
        <Route path="/sala/:id/revision" element={<Revision />} />
        <Route path="/sala/:id/resultados" element={<Resultados />} />
      </Routes>
    </BrowserRouter>
  );
}