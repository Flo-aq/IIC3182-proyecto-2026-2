"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { pedir } from "@/lib/api";
import { useTieneLlave } from "@/lib/cuenta/dueno";
import { MAX_NOMBRE } from "@/lib/reunion/limites";
import { type PersonaSet, type ReunionConRespuestas, conjuntos } from "@/lib/reunion/respuestas";
import { useSesion } from "@/lib/cuenta/sesion";

/** El nombre de la cuenta como se usa al responder: sin espacios de más y con el largo permitido. */
const nombreDeCuenta = (n: string): string => n.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE);

/**
 * Con cuenta no se pide el nombre: si el servidor ya sabe que hay una (`cuentaNombre`), Mi horario parte lista desde la primera
 * pantalla, con la respuesta que ya había con ese nombre, si la había. Lo mismo vale para quien creó la reunión sin cuenta en
 * este navegador (`nombreGuardado`, el nombre que escribió al crearla). Así no se ve un instante la pantalla de acceso.
 */
function entradaInicial(datos: ReunionConRespuestas, cuentaNombre: string | null, nombreGuardado: string | null) {
  const entrante = cuentaNombre ?? nombreGuardado;
  if (entrante === null || datos.cerrada) return null;
  const nombre = nombreDeCuenta(entrante);
  const previa = datos.personas.find((p) => p.nombre.trim().toLowerCase() === nombre.toLowerCase());
  return { nombre: previa?.nombre ?? nombre, retomada: previa?.nombre ?? null, disp: previa?.disp ?? null };
}

/** Las respuestas de los demás llegan solas: se actualizan al volver a la pestaña y cada medio minuto. */
export function useRefrescoAutomatico() {
  const router = useRouter();
  useEffect(() => {
    const actualizar = () => document.visibilityState === "visible" && router.refresh();
    const cada = setInterval(actualizar, 30_000);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      clearInterval(cada);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, [router]);
}

/** Quién eres, qué marcaste y cómo se guarda: todo lo de la respuesta propia en la pantalla de responder. */
export function useRespuesta(datos: ReunionConRespuestas, esDuenoCuenta: boolean, cuentaNombre: string | null, nombreGuardado: string | null) {
  const { slug, cerrada } = datos;
  // Cierra la reunión quien la creó: con su cuenta, desde el navegador donde la creó (guardó una llave) o entrando con el
  // nombre que puso como organizador (se calcula cuando ya se sabe con qué nombre se entró).
  const tieneLlave = useTieneLlave(slug);
  const [entrada] = useState(() => entradaInicial(datos, cuentaNombre, nombreGuardado));
  const [mias, setMias] = useState<Set<string>>(() => new Set(entrada?.disp ?? []));
  const [guardadas, setGuardadas] = useState<string[] | null>(entrada?.disp ?? null);
  const [nombre, setNombre] = useState(entrada?.nombre ?? "");
  /** Casilla "Soy integrante clave" de quien responde por primera vez. */
  const [clave, setClave] = useState(false);
  /** Ya dijiste quién eres: se muestra la grilla en vez de la pantalla de acceso. */
  const [listo, setListo] = useState(entrada !== null);
  /** Nombre de la respuesta que ya existía y se está editando (escribir el mismo nombre equivale a entrar). */
  const [retomada, setRetomada] = useState<string | null>(entrada?.retomada ?? null);
  const entroComoOrganizador = listo && Boolean(datos.organizador) && nombre.trim().toLowerCase() === datos.organizador?.trim().toLowerCase();
  const esDueno = esDuenoCuenta || tieneLlave || entroComoOrganizador;
  const [guardando, setGuardando] = useState(false);
  /** Si lo que acabas de guardar quedó como integrante clave (hasta que llegue la lista actualizada del servidor). */
  const [claveGuardada, setClaveGuardada] = useState(false);
  const router = useRouter();
  const { conCuenta, nombre: nombreCuenta } = useSesion();
  /** Para entrar con el nombre de la cuenta una sola vez (si después se pulsa "Cambiar", no se vuelve a entrar sola). */
  const entroSola = useRef(entrada !== null);
  const hayCuenta = cuentaNombre !== null || conCuenta;
  /** La casilla "Soy integrante clave" va en el pie cuando no se pasó por la pantalla de acceso (cuenta o nombre guardado). */
  const [entroSinAcceso, setEntroSinAcceso] = useState(entrada !== null);
  const claveEnElPie = hayCuenta || entroSinAcceso;

  const buscado = nombre.trim().toLowerCase();
  const existente = buscado ? datos.personas.find((p) => p.nombre.trim().toLowerCase() === buscado) : undefined;

  // Si edito una respuesta que ya existía, esa persona soy yo: no se cuenta dos veces ni ocupa un lugar clave extra.
  const otros = useMemo(
    () => datos.personas.filter((p) => p.nombre.trim().toLowerCase() !== retomada?.toLowerCase()),
    [datos.personas, retomada],
  );
  const hayClaves = datos.reunion.claves > 0;
  const clavesLlenas = !hayClaves || otros.filter((p) => p.clave).length >= datos.reunion.claves;
  const propia = retomada ? datos.personas.find((p) => p.nombre.trim().toLowerCase() === retomada.toLowerCase()) : undefined;
  const esClave = retomada ? (propia?.clave ?? claveGuardada) : clave && !clavesLlenas;

  const personas: PersonaSet[] = useMemo(() => {
    const demas = conjuntos(otros);
    if (!guardadas) return demas;
    const set = new Set(guardadas);
    const yo: PersonaSet = { nombre: nombre.trim() || "Tú", clave: esClave, yo: true, puede: (dia, fila) => set.has(`${dia}|${fila}`) };
    return [...demas, yo];
  }, [otros, guardadas, nombre, esClave]);

  const cambiar = (claves: string[], poner: boolean) =>
    setMias((prev) => {
      if (claves.every((k) => prev.has(k) === poner)) return prev;
      const sig = new Set(prev);
      for (const k of claves) {
        if (poner) sig.add(k);
        else sig.delete(k);
      }
      return sig;
    });

  const marcados = mias.size;
  const horas = (marcados * datos.reunion.bloqueMin) / 60;
  const textoHoras = `${Number.isInteger(horas) ? horas : horas.toFixed(1).replace(".", ",")} h`;
  const sinCambios = guardadas !== null && guardadas.length === mias.size && guardadas.every((k) => mias.has(k));

  /** Entra a Mi horario con ese nombre; si ya había una respuesta con él, la carga para editarla. */
  const entrarComo = (escrito: string) => {
    const buscar = escrito.trim().toLowerCase();
    const previa = datos.personas.find((p) => p.nombre.trim().toLowerCase() === buscar);
    if (previa) {
      setRetomada(previa.nombre);
      setNombre(previa.nombre);
      setMias(new Set(previa.disp));
      setGuardadas(previa.disp);
      toast.success(`Cargamos la respuesta de ${previa.nombre}`, { description: "Ya puedes cambiar tus horarios." });
    } else {
      setNombre(escrito.trim());
      setRetomada(null);
    }
    setListo(true);
  };

  const continuar = () => entrarComo(nombre);

  // Con cuenta no se pide el nombre: se entra solo con el de la cuenta (después se puede cambiar desde el menú de arriba).
  useEffect(() => {
    if (!conCuenta || entroSola.current || cerrada) return;
    entroSola.current = true;
    entrarComo(nombreDeCuenta(nombreCuenta));
    // Solo cuando se sabe que hay cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conCuenta]);

  /** Volver a la pantalla de acceso para cambiar el nombre (lo que marcaste de cero se mantiene). */
  const cambiarNombre = () => {
    if (retomada) {
      setRetomada(null);
      setNombre("");
      setClave(false);
      setMias(new Set());
      setGuardadas(null);
    }
    setListo(false);
    setEntroSinAcceso(false);
  };

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const cuerpo = await pedir<{ clave: boolean; claveDenegada: boolean }>(`/api/events/${slug}/responses`, {
        method: "PUT",
        body: JSON.stringify({ nombre: nombre.trim(), clave: esClave || clave, bloques: [...mias] }),
        porDefecto: "No pudimos guardar tus horarios.",
      });
      setGuardadas([...mias]);
      // Desde ahora esta respuesta existe en el servidor: seguimos editándola y no se cuenta dos veces.
      setRetomada(nombre.trim().replace(/\s+/g, " "));
      setClaveGuardada(cuerpo.clave);
      if (cuerpo.claveDenegada) {
        toast.warning("Guardado ✓, pero ya no quedaban lugares de integrante clave", { description: "Quedaste como participante normal." });
      } else {
        toast.success("Guardado ✓", { description: "Vuelve a este link y escribe el mismo nombre para cambiar tus horarios." });
      }
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return {
    mias,
    cambiar,
    guardadas,
    nombre,
    setNombre,
    clave,
    setClave,
    listo,
    retomada,
    esDueno,
    guardando,
    esClave,
    hayCuenta,
    claveEnElPie,
    existente,
    hayClaves,
    clavesLlenas,
    personas,
    marcados,
    textoHoras,
    sinCambios,
    continuar,
    cambiarNombre,
    guardar,
  };
}
