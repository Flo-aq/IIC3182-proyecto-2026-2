/**
 * Los tipos de botón de WeMeet. Cada tipo significa lo mismo en todas las pantallas, y cuanto más importante es la acción,
 * más pesado se ve el botón (relleno > borde > solo texto). Se usan junto al `variant` de <Button>:
 *
 * - principal (variant por defecto, violeta relleno): la acción que hace avanzar la pantalla o el diálogo. Debería haber una sola.
 *   Crear reunión, Continuar, Guardar mis horarios, Activar aviso, Copiar link. La de Crear reunión es la única "héroe".
 * - secundario (variant="outline", grande): otra opción de igual rango o una alternativa. Volver, Cerrar, Notificarme,
 *   Cerrar reunión, Copiar resumen, Crear otra reunión, Iniciar sesión. En Compartir, Cerrar reunión y Notificarme van uno bajo el
 *   otro, iguales (pesan lo mismo), y una línea marcada los separa de Copiar resumen.
 * - compacto (variant="outline", chico): acciones dentro del contenido o de una barra. Compartir, Filtros, Rellenar, Copiar link
 *   de una reunión, Crear (un tag).
 * - confirmar (violeta relleno, chico): la acción afirmativa de un recuadro chico. Listo.
 * - texto (variant="ghost", violeta): acciones menores. Ver más, Editar tags, Limpiar, Duplicar, Ver el texto del resumen.
 * - cancelar (variant="ghost", gris): salir sin hacer nada. Cancelar.
 * - peligro (variant="ghost", rojo): borrar algo. Quitar una regla, Quitar el aviso. Es solo texto: nunca va relleno.
 * - icono (variant="outline", redondo): una acción sin texto. Semana anterior y siguiente.
 *
 * Los cierres de información ("Entendido") no son una acción principal: van como secundario.
 */
export const BOTON = {
  principal: "h-12 rounded-full text-base font-extrabold",
  heroe: "h-14 rounded-full text-[1.0625rem] font-extrabold",
  secundario: "h-12 gap-2 rounded-full text-base font-bold",
  compacto: "h-9 gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-bold",
  confirmar: "h-9 rounded-full px-4 text-[0.8125rem] font-bold",
  texto: "h-9 gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-bold text-primary",
  cancelar: "h-9 rounded-full px-3 text-sm font-bold text-muted-foreground",
  peligro: "h-9 gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive",
  icono: "size-9 rounded-full",
} as const;
