// src/pages/Home.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [codigoSala, setCodigoSala] = useState("");
  const navigate = useNavigate();

  const unirseSala = () => {
    if (!codigoSala.trim()) return;
    navigate(`/sala/${codigoSala.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
      <h1 className="text-4xl font-bold mb-8">Tutifruti</h1>

      <button
        onClick={() => navigate("/crear")}
        className="w-64 py-3 mb-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold"
      >
        Crear sala
      </button>

      <div className="w-64 flex gap-2">
        <input
          value={codigoSala}
          onChange={(e) => setCodigoSala(e.target.value)}
          placeholder="Código de sala"
          maxLength={4}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 uppercase text-center"
        />
        <button
          onClick={unirseSala}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold"
        >
          Unirse
        </button>
      </div>
    </div>
  );
}