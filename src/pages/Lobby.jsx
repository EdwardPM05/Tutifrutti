// src/pages/Lobby.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase";

function generarUid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Lobby() {
  const { id: salaId } = useParams();
  const navigate = useNavigate();
  const [sala, setSala] = useState(null);
  const [nombre, setNombre] = useState("");
  const [uniendome, setUniendome] = useState(false);

  const miUid = localStorage.getItem("tutifruti_uid");

  useEffect(() => {
    const salaRef = ref(db, `salas/${salaId}`);
    const unsub = onValue(salaRef, (snap) => {
      const data = snap.val();
      if (!data) {
        navigate("/");
        return;
      }
      setSala(data);
      if (data.estado === "jugando") {
        navigate(`/sala/${salaId}/juego`);
      }
    });
    return () => unsub();
  }, [salaId, navigate]);

  const unirme = async () => {
    if (!nombre.trim()) return;
    const uid = generarUid();
    localStorage.setItem("tutifruti_uid", uid);

    const ordenActual = sala.jugadoresOrden || [];
    await update(ref(db, `salas/${salaId}`), {
      jugadoresOrden: [...ordenActual, uid],
      [`jugadores/${uid}`]: { nombre: nombre.trim(), conectado: true, puntajeTotal: 0 },
    });
    setUniendome(false);
  };

  const iniciarJuego = async () => {
    await update(ref(db, `salas/${salaId}`), {
      estado: "jugando",
      ronda: 1,
      turnoActual: 0,
    });
  };

  if (!sala) return <div className="min-h-screen bg-slate-900" />;

  const yaSoyJugador = miUid && sala.jugadores?.[miUid];
  const soyHost = sala.jugadoresOrden?.[0] === miUid;
  const listaJugadores = (sala.jugadoresOrden || []).map((uid) => sala.jugadores[uid]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
      <h1 className="text-2xl font-bold mb-1">Sala {salaId}</h1>
      <p className="text-slate-400 mb-6 text-sm">Comparte este código con los demás</p>

      <div className="w-72 mb-6">
        <div className="text-sm text-slate-400 mb-2">Jugadores ({listaJugadores.length})</div>
        <div className="flex flex-col gap-2">
          {listaJugadores.map((j, i) => (
            <div key={i} className="bg-slate-800 px-3 py-2 rounded-lg flex justify-between">
              <span>{j.nombre}</span>
              {i === 0 && <span className="text-xs text-emerald-400">host</span>}
            </div>
          ))}
        </div>
      </div>

      {!yaSoyJugador && !uniendome && (
        <button
          onClick={() => setUniendome(true)}
          className="w-72 py-3 mb-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold"
        >
          Unirme a la sala
        </button>
      )}

      {!yaSoyJugador && uniendome && (
        <div className="w-72 flex gap-2 mb-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600"
          />
          <button onClick={unirme} className="px-4 py-2 rounded-lg bg-emerald-500 font-semibold">
            OK
          </button>
        </div>
      )}

      {soyHost && (
        <button
          onClick={iniciarJuego}
          disabled={listaJugadores.length < 2}
          className="w-72 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 font-semibold"
        >
          Iniciar juego
        </button>
      )}
    </div>
  );
}