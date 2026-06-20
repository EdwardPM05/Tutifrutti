// src/pages/CrearSala.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, set } from "firebase/database";
import { db } from "../firebase";

const CATEGORIAS_DEFAULT = ["Nombre", "Animal", "Fruta", "Color", "País", "Cosa"];

function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 4; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

function generarUid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CrearSala() {
  const [nombre, setNombre] = useState("");
  const [categorias, setCategorias] = useState(CATEGORIAS_DEFAULT);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const navigate = useNavigate();

  const agregarCategoria = () => {
    if (!nuevaCategoria.trim()) return;
    setCategorias([...categorias, nuevaCategoria.trim()]);
    setNuevaCategoria("");
  };

  const quitarCategoria = (i) => {
    setCategorias(categorias.filter((_, idx) => idx !== i));
  };

  const crearSala = async () => {
    if (!nombre.trim() || categorias.length === 0) return;

    const salaId = generarCodigo();
    const uid = generarUid();

    await set(ref(db, `salas/${salaId}`), {
      categorias,
      estado: "lobby",
      ronda: 0,
      turnoActual: 0,
      letra: null,
      jugadoresOrden: [uid],
      jugadores: {
        [uid]: { nombre: nombre.trim(), conectado: true, puntajeTotal: 0 },
      },
    });

    localStorage.setItem("tutifruti_uid", uid);
    navigate(`/sala/${salaId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-6">Crear sala</h1>

      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Tu nombre"
        className="w-72 px-3 py-2 mb-4 rounded-lg bg-slate-800 border border-slate-600"
      />

      <div className="w-72 mb-2 text-sm text-slate-400">Categorías</div>
      <div className="w-72 flex flex-col gap-2 mb-3">
        {categorias.map((cat, i) => (
          <div key={i} className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded-lg">
            <span>{cat}</span>
            <button onClick={() => quitarCategoria(i)} className="text-red-400 text-sm">
              quitar
            </button>
          </div>
        ))}
      </div>

      <div className="w-72 flex gap-2 mb-6">
        <input
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
          placeholder="Nueva categoría"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600"
        />
        <button onClick={agregarCategoria} className="px-3 py-2 rounded-lg bg-slate-700">
          +
        </button>
      </div>

      <button
        onClick={crearSala}
        className="w-72 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold"
      >
        Crear sala
      </button>
    </div>
  );
}