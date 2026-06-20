// src/components/Marcador.jsx
export default function Marcador({ sala }) {
  const jugadoresOrdenados = [...sala.jugadoresOrden]
    .map((uid) => ({ uid, ...sala.jugadores[uid] }))
    .sort((a, b) => (b.puntajeTotal || 0) - (a.puntajeTotal || 0));

  return (
    <div className="w-full max-w-sm flex gap-2 mb-6 overflow-x-auto">
      {jugadoresOrdenados.map((j, i) => (
        <div
          key={j.uid}
          className={`flex-1 min-w-[80px] text-center px-2 py-2 rounded-lg ${
            i === 0 ? "bg-emerald-900/50 border border-emerald-500" : "bg-slate-800"
          }`}
        >
          <div className="text-xs text-slate-400 truncate">{j.nombre}</div>
          <div className="font-bold">{j.puntajeTotal || 0}</div>
        </div>
      ))}
    </div>
  );
}