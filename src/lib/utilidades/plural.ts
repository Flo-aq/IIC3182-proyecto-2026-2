/** Elige entre el singular y el plural según la cantidad: `plural(2, "persona", "personas")` da "personas". */
export const plural = (n: number, uno: string, varios: string): string => (n === 1 ? uno : varios);

/** La cantidad con su palabra: `cantidad(1, "persona", "personas")` da "1 persona". */
export const cantidad = (n: number, uno: string, varios: string): string => `${n} ${plural(n, uno, varios)}`;
