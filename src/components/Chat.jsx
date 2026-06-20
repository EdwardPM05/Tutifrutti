// src/components/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { ref, push, onValue, query, limitToLast } from "firebase/database";
import { db } from "../firebase";

const EMOJIS = ["😂", "🔥", "😱", "👏", "🤔", "😡", "🎉", "❤️"];

export default function Chat({ salaId, miNombre }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [toast, setToast] = useState(null);
  const finRef = useRef(null);
  const yaCargado = useRef(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const chatRef = query(ref(db, `salas/${salaId}/chat`), limitToLast(50));
    const unsub = onValue(chatRef, (snap) => {
      const data = snap.val() || {};
      const lista = Object.values(data);
      setMensajes(lista);

      const ultimo = lista[lista.length - 1];
      if (!ultimo) return;

      // evita mostrar notificación de mensajes viejos al cargar la sala
      if (!yaCargado.current) {
        yaCargado.current = true;
        return;
      }

      // evita notificarte tu propio mensaje
      if (ultimo.nombre === miNombre) return;

      setToast(ultimo);
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId]);

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  const enviar = (contenido) => {
    if (!contenido.trim()) return;
    push(ref(db, `salas/${salaId}/chat`), {
      nombre: miNombre,
      texto: contenido.trim(),
      ts: Date.now(),
    });
    setTexto("");
  };

  const abrirDesdeNotificacion = () => {
    setToast(null);
    setAbierto(true);
  };

  return (
    <>
      {toast && !abierto && (
        <button
          onClick={abrirDesdeNotificacion}
          className="fixed bottom-20 right-4 max-w-xs bg-slate-800 border border-emerald-500 rounded-lg shadow-xl px-3 py-2 z-30 text-left animate-[slideIn_0.2s_ease-out]"
        >
          <div className="text-xs text-emerald-400 font-semibold">{toast.nombre}</div>
          <div className="text-sm text-white truncate">{toast.texto}</div>
        </button>
      )}

      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-emerald-500 text-white text-xl shadow-lg z-20"
      >
        💬
      </button>

      {abierto && (
        <div className="fixed bottom-20 right-4 w-72 h-96 bg-slate-800 rounded-lg shadow-xl flex flex-col z-20 border border-slate-600">
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {mensajes.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="text-emerald-400 font-semibold">{m.nombre}: </span>
                <span className="text-white">{m.texto}</span>
              </div>
            ))}
            <div ref={finRef} />
          </div>

          <div className="flex gap-1 px-2 pb-1 overflow-x-auto">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => enviar(e)} className="text-lg px-1">
                {e}
              </button>
            ))}
          </div>

          <div className="flex p-2 gap-1 border-t border-slate-700">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar(texto)}
              placeholder="Mensaje..."
              className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-sm"
            />
            <button onClick={() => enviar(texto)} className="px-3 py-1 rounded bg-emerald-500 text-sm">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}