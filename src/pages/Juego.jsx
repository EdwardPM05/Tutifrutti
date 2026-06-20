// src/pages/Juego.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase";
import Marcador from "../components/Marcador";
import Chat from "../components/Chat";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Juego() {
  const { id: salaId } = useParams();
  const navigate = useNavigate();
  const [sala, setSala] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [restante, setRestante] = useState(null);
  const debounceRef = useRef(null);

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
      if (data.estado === "revision") navigate(`/sala/${salaId}/revision`);
      if (data.estado === "lobby") navigate(`/sala/${salaId}`);
      if (data.estado === "finalizado") navigate(`/sala/${salaId}/resultados`);
    });
    return () => unsub();
  }, [salaId, navigate]);

  const presionarBasta = async () => {
    await update(ref(db, `salas/${salaId}/respuestas/ronda${sala.ronda}/${miUid}`), respuestas);
    await update(ref(db, `salas/${salaId}`), { estado: "revision", categoriaRevisando: 0 });
  };

  // countdown del modo con tiempo
  useEffect(() => {
    if (!sala?.tiempoLimite || !sala?.letra || !sala?.tiempoInicio) {
      setRestante(null);
      return;
    }
    const interval = setInterval(() => {
      const transcurrido = (Date.now() - sala.tiempoInicio) / 1000;
      const quedan = Math.max(0, Math.ceil(sala.tiempoLimite - transcurrido));
      setRestante(quedan);
      if (quedan === 0) {
        clearInterval(interval);
        presionarBasta();
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala?.tiempoLimite, sala?.letra, sala?.tiempoInicio]);

  if (!sala) return <div className="min-h-screen bg-slate-900" />;

  const turnoUid = sala.jugadoresOrden[sala.turnoActual];
  const esMiTurno = turnoUid === miUid;
  const nombreTurno = sala.jugadores[turnoUid]?.nombre;
  const letraElegida = sala.letra;
  const miNombre = sala.jugadores[miUid]?.nombre || "Yo";

  const elegirLetra = async (letra) => {
    const usadas = sala.letrasUsadas || [];
    await update(ref(db, `salas/${salaId}`), {
      letra,
      letrasUsadas: [...usadas, letra],
      tiempoInicio: Date.now(),
    });
  };

  const finalizarJuego = async () => {
    await update(ref(db, `salas/${salaId}`), { estado: "finalizado" });
  };

  const cambiarRespuesta = (idx, valor) => {
    const nuevas = { ...respuestas, [idx]: valor };
    setRespuestas(nuevas);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      update(ref(db, `salas/${salaId}/respuestas/ronda${sala.ronda}/${miUid}`), nuevas);
    }, 400);
  };

  // Pantalla: esperando que el jugador en turno elija letra
  if (!letraElegida) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
        <Marcador sala={sala} />
        <h2 className="text-xl mb-2">Ronda {sala.ronda}</h2>
        {esMiTurno ? (
          <>
            <p className="mb-6 text-slate-300">Elige una letra</p>
            <div className="grid grid-cols-6 gap-2 max-w-md mb-6">
              {LETRAS.map((l) => {
                const usada = (sala.letrasUsadas || []).includes(l);
                return (
                  <button
                    key={l}
                    disabled={usada}
                    onClick={() => elegirLetra(l)}
                    className={`w-12 h-12 rounded-lg font-bold ${
                      usada
                        ? "bg-slate-900 text-slate-700 cursor-not-allowed"
                        : "bg-slate-800 hover:bg-emerald-500"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
            <button
              onClick={finalizarJuego}
              className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 text-sm font-medium transition-colors"
            >
              Finalizar juego
            </button>
          </>
        ) : (
          <p className="text-slate-400">Esperando que {nombreTurno} elija la letra...</p>
        )}
        <Chat salaId={salaId} miNombre={miNombre} />
      </div>
    );
  }

  // Pantalla: llenando categorías
  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-900 text-white px-4 py-10">
      <Marcador sala={sala} />
      <div className="text-5xl font-bold mb-1 text-emerald-400">{letraElegida}</div>
      <p className="text-slate-400 mb-6">Ronda {sala.ronda}</p>

      {restante !== null && (
        <div className="w-full max-w-sm mb-6 flex flex-col items-center">
          <div
            className={`text-3xl font-bold mb-2 ${
              restante <= 10 ? "text-red-400 animate-pulse" : "text-white"
            }`}
          >
            {restante}s
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                restante <= 10 ? "bg-red-500" : "bg-emerald-500"
              }`}
              style={{ width: `${(restante / sala.tiempoLimite) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
        {sala.categorias.map((cat, i) => (
          <div key={i}>
            <label className="text-sm text-slate-400">{cat}</label>
            <input
              value={respuestas[i] || ""}
              onChange={(e) => cambiarRespuesta(i, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600"
            />
          </div>
        ))}
      </div>

      <button
        onClick={presionarBasta}
        className="w-full max-w-sm py-4 rounded-lg bg-red-500 hover:bg-red-600 font-bold text-lg"
      >
        ¡BASTA!
      </button>

      <Chat salaId={salaId} miNombre={miNombre} />
    </div>
  );
}