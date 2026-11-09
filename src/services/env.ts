/**
 * Acceso tipado y validado a variables de entorno.
 *
 * Por que NO usamos `process.env[name]` (acceso dinamico):
 * Next.js solo puede inlinear en el bundle del cliente las variables con
 * prefijo `NEXT_PUBLIC_` cuando el acceso es ESTATICO (`process.env.FOO`).
 * Con un indice dinamico (`process.env[name]`) el bundler no puede resolverlo,
 * el objeto `process.env` queda vacio en el navegador y la variable llega
 * como `undefined` en runtime.
 *
 * Por eso cada getter accede a su variable de forma estatica: asi Next.js
 * reemplaza la referencia por el valor literal durante el build.
 *
 * Los getters (y no constantes) hacen que el error aparezca en el momento del
 * uso, no al importar el modulo.
 */

/** Error lanzo cuando falta una variable de entorno requerida. */
export class MissingEnvError extends Error {
  constructor(name: string) {
    super(
      `[env] Falta la variable de entorno "${name}". ` +
        `Revisá tu .env.local o las variables configuradas en Vercel.`,
    );
    this.name = "MissingEnvError";
  }
}

/**
 * Valida que una variable de entorno requerida tenga valor.
 *
 * @param name - Nombre de la variable, solo para el mensaje de error.
 * @param value - Valor leido de `process.env` (acceso estatico en el llamador).
 * @returns El valor, garantizado como string no vacio.
 */
function ensure(name: string, value: string | undefined): string {
  if (!value) {
    throw new MissingEnvError(name);
  }
  return value;
}

/** URLs y claves de Supabase, resueltas en el momento de uso. */
export const supabaseEnv = {
  get url(): string {
    return ensure(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get publishableKey(): string {
    return ensure(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  },
};

/** Credenciales de EmailJS usadas por el formulario de contacto. */
export const emailJsEnv = {
  get serviceId(): string {
    return ensure(
      "NEXT_PUBLIC_EMAILJS_SERVICE_ID",
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    );
  },
  get templateId(): string {
    return ensure(
      "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID",
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
    );
  },
  get publicKey(): string {
    return ensure(
      "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY",
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    );
  },
};
