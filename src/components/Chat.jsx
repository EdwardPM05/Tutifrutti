// src/components/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { ref, push, onValue, query, limitToLast } from "firebase/database";
import { db } from "../firebase";

const REACCIONES = [
  { id: "emoji1", src: "/emojis/emoji1.png" },
  { id: "emoji2", src: "/emojis/emoji2.png" },
  { id: "emoji3", src: "/emojis/emoji3.png" },
  { id: "emoji4", src: "/emojis/emoji4.png" },
  { id: "emoji5", src: "/emojis/emoji5.png" },
  { id: "emoji6", src: "/emojis/emoji6.png" },
  { id: "emoji7", src: "/emojis/emoji7.png" },
  { id: "emoji8", src: "/emojis/emoji8.png" },
  { id: "emoji9", src: "/emojis/emoji9.png" },
  { id: "emoji10", src: "/emojis/emoji10.png" },
  { id: "emoji11", src: "/emojis/emoji11.png" },
];

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

      if (!yaCargado.current) {
        yaCargado.current = true;
        return;
      }

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

  const enviarTexto = (contenido) => {
    if (!contenido.trim()) return;
    push(ref(db, `salas/${salaId}/chat`), {
      nombre: miNombre,
      texto: contenido.trim(),
      tipo: "texto",
      ts: Date.now(),
    });
    setTexto("");
  };

  const enviarReaccion = (reaccion) => {
    push(ref(db, `salas/${salaId}/chat`), {
      nombre: miNombre,
      texto: reaccion.src,
      tipo: "emoji",
      ts: Date.now(),
    });
  };

  const abrirDesdeNotificacion = () => {
    setToast(null);
    setAbierto(true);
  };

  const renderContenido = (m, tamaño = "w-6 h-6") =>
    m.tipo === "emoji" ? (
      <img src={m.texto} alt="" className={`${tamaño} inline-block`} />
    ) : (
      <span className="text-white">{m.texto}</span>
    );

  return (
    <>
      {toast && !abierto && (
        <button
          onClick={abrirDesdeNotificacion}
          className="fixed bottom-20 right-4 max-w-xs bg-slate-800 border border-emerald-500 rounded-lg shadow-xl px-3 py-2 z-30 text-left flex items-center gap-2"
        >
          <div>
            <div className="text-xs text-emerald-400 font-semibold">{toast.nombre}</div>
            <div className="text-sm">{renderContenido(toast, "w-8 h-8")}</div>
          </div>
        </button>
      )}

      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-emerald-500 shadow-lg z-20 flex items-center justify-center overflow-hidden"
      >
        <img src="/chat-icon.png" alt="chat" className="w-7 h-7" />
      </button>

      {abierto && (
        <div className="fixed bottom-20 right-4 w-72 h-96 bg-slate-800 rounded-lg shadow-xl flex flex-col z-20 border border-slate-600">
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {mensajes.map((m, i) => (
              <div key={i} className="text-sm flex items-center gap-1">
                <span className="text-emerald-400 font-semibold">{m.nombre}: </span>
                {renderContenido(m)}
              </div>
            ))}
            <div ref={finRef} />
          </div>

          <div className="flex gap-1 px-2 pb-1 overflow-x-auto">
            {REACCIONES.map((r) => (
              <button key={r.id} onClick={() => enviarReaccion(r)} className="shrink-0 px-1">
                <img src={r.src} alt={r.id} className="w-7 h-7" />
              </button>
            ))}
          </div>

          <div className="flex p-2 gap-1 border-t border-slate-700">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarTexto(texto)}
              placeholder="Mensaje..."
              className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-sm"
            />
            <button onClick={() => enviarTexto(texto)} className="px-3 py-1 rounded bg-emerald-500 text-sm">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}