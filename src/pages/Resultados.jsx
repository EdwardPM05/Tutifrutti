// src/pages/Resultados.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Resultados() {
  const { id: salaId } = useParams();
  const navigate = useNavigate();
  const [sala, setSala] = useState(null);

  useEffect(() => {
    const salaRef = ref(db, `salas/${salaId}`);
    const unsub = onValue(salaRef, (snap) => {
      const data = snap.val();
      if (!data) return navigate("/");
      setSala(data);
    });
    return () => unsub();
  }, [salaId, navigate]);

  if (!sala) return <div className="min-h-screen bg-slate-900" />;

  const ranking = [...sala.jugadoresOrden]
    .map((uid) => ({ uid, ...sala.jugadores[uid] }))
    .sort((a, b) => (b.puntajeTotal || 0) - (a.puntajeTotal || 0));

  const ganador = ranking[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
      <p className="text-slate-400 mb-1">🏆 Ganador</p>
      <h1 className="text-4xl font-bold mb-1">{ganador.nombre}</h1>
      <p className="text-emerald-400 text-xl mb-8">{ganador.puntajeTotal || 0} pts</p>

      <div className="w-full max-w-sm flex flex-col gap-2 mb-8">
        {ranking.map((j, i) => (
          <div
            key={j.uid}
            className={`flex justify-between px-4 py-3 rounded-lg ${
              i === 0 ? "bg-emerald-900/50 border border-emerald-500" : "bg-slate-800"
            }`}
          >
            <span>{i + 1}. {j.nombre}</span>
            <span className="font-bold">{j.puntajeTotal || 0}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/")}
        className="w-full max-w-sm py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold"
      >
        Volver al inicio
      </button>
    </div>
  );
}