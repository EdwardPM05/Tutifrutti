// src/pages/Revision.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase";
import Marcador from "../components/Marcador";

function normalizar(str) {
  return (str || "").trim().toLowerCase();
}

export default function Revision() {
  const { id: salaId } = useParams();
  const navigate = useNavigate();
  const [sala, setSala] = useState(null);

  const miUid = localStorage.getItem("tutifruti_uid");

  useEffect(() => {
    const salaRef = ref(db, `salas/${salaId}`);
    const unsub = onValue(salaRef, (snap) => {
      const data = snap.val();
      if (!data) return navigate("/");
      setSala(data);
      if (data.estado === "jugando") navigate(`/sala/${salaId}/juego`);
      if (data.estado === "finalizado") navigate(`/sala/${salaId}/resultados`);
    });
    return () => unsub();
  }, [salaId, navigate]);

  if (!sala) return <div className="min-h-screen bg-slate-900" />;

  const soyHost = sala.jugadoresOrden[0] === miUid;
  const catIdx = sala.categoriaRevisando || 0;
  const categoria = sala.categorias[catIdx];
  const esUltimaCategoria = catIdx === sala.categorias.length - 1;
  const respuestasRonda = sala.respuestas?.[`ronda${sala.ronda}`] || {};
  const puntosRonda = sala.puntosRonda?.[`ronda${sala.ronda}`] || {};
  const puntosCategoria = puntosRonda[catIdx] || {};

  const calcularAuto = () => {
    const conteo = {};
    sala.jugadoresOrden.forEach((uid) => {
      const resp = normalizar(respuestasRonda[uid]?.[catIdx]);
      const valido = resp && resp[0] === sala.letra.toLowerCase();
      if (valido) conteo[resp] = (conteo[resp] || 0) + 1;
    });
    const puntos = {};
    sala.jugadoresOrden.forEach((uid) => {
      const respRaw = respuestasRonda[uid]?.[catIdx] || "";
      const resp = normalizar(respRaw);
      const valido = resp && resp[0] === sala.letra.toLowerCase();
      if (!valido) puntos[uid] = 0;
      else puntos[uid] = conteo[resp] > 1 ? 50 : 100;
    });
    return puntos;
  };

  const puntosActuales = Object.keys(puntosCategoria).length ? puntosCategoria : calcularAuto();

  const cambiarPunto = async (uid, valor) => {
    if (!soyHost) return;
    await update(ref(db, `salas/${salaId}/puntosRonda/ronda${sala.ronda}/${catIdx}`), {
      ...puntosActuales,
      [uid]: valor,
    });
  };

  const siguienteCategoria = async () => {
    await update(ref(db, `salas/${salaId}/puntosRonda/ronda${sala.ronda}/${catIdx}`), puntosActuales);
    await update(ref(db, `salas/${salaId}`), { categoriaRevisando: catIdx + 1 });
  };

  const finalizarRonda = async () => {
    await update(ref(db, `salas/${salaId}/puntosRonda/ronda${sala.ronda}/${catIdx}`), puntosActuales);

    const totalesRonda = {};
    sala.jugadoresOrden.forEach((uid) => (totalesRonda[uid] = 0));
    sala.categorias.forEach((_, i) => {
      const ptsCat = i === catIdx ? puntosActuales : puntosRonda[i] || {};
      Object.entries(ptsCat).forEach(([uid, pts]) => {
        totalesRonda[uid] = (totalesRonda[uid] || 0) + pts;
      });
    });

    const updates = {};
    sala.jugadoresOrden.forEach((uid) => {
      const actual = sala.jugadores[uid].puntajeTotal || 0;
      updates[`jugadores/${uid}/puntajeTotal`] = actual + totalesRonda[uid];
    });

    const nuevoTurno = (sala.turnoActual + 1) % sala.jugadoresOrden.length;
    updates["turnoActual"] = nuevoTurno;
    updates["letra"] = null;
    updates["categoriaRevisando"] = 0;
    updates["ronda"] = sala.ronda + 1;
    updates["estado"] = "jugando";

    await update(ref(db, `salas/${salaId}`), updates);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-900 text-white px-4 py-10">
      <Marcador sala={sala} />
      <p className="text-slate-400 mb-1">
        Categoría {catIdx + 1} de {sala.categorias.length}
      </p>
      <h2 className="text-3xl font-bold mb-1">{categoria}</h2>
      <p className="text-emerald-400 mb-6">Letra {sala.letra}</p>

      <div className="w-full max-w-sm flex flex-col gap-2 mb-8">
        {sala.jugadoresOrden.map((uid) => {
          const respuesta = respuestasRonda[uid]?.[catIdx] || "(vacío)";
          const pts = puntosActuales[uid] ?? 0;
          return (
            <div key={uid} className="bg-slate-800 px-3 py-2 rounded-lg flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400">{sala.jugadores[uid].nombre}</div>
                <div className="font-medium">{respuesta}</div>
              </div>
              {soyHost ? (
                <div className="flex gap-1">
                  {[0, 50, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => cambiarPunto(uid, v)}
                      className={`px-2 py-1 rounded text-sm ${
                        pts === v ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-emerald-400 font-bold">{pts}</span>
              )}
            </div>
          );
        })}
      </div>

      {soyHost && (
        <button
          onClick={esUltimaCategoria ? finalizarRonda : siguienteCategoria}
          className="w-full max-w-sm py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold"
        >
          {esUltimaCategoria ? "Finalizar ronda" : "Siguiente categoría"}
        </button>
      )}
      {!soyHost && <p className="text-slate-500 text-sm">Esperando al host...</p>}
    </div>
  );
}