"use client";
// Sesión OAuth 2.0 con Keycloak: Authorization Code + PKCE (cliente público, sin secretos en el navegador).
// Los tokens viven en sessionStorage (se borran al cerrar la pestaña) y se renuevan con el refresh token.
import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Rol } from "./tipos";

const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8080/auth").replace(/\/$/, "");
const REALM = process.env.NEXT_PUBLIC_AUTH_REALM ?? "ruta-salud";
const CLIENT_ID = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ?? "web-ruta-salud";

let gestor: UserManager | null = null;
export function gestorSesion(): UserManager {
  if (!gestor) {
    gestor = new UserManager({
      authority: `${AUTH_URL}/realms/${REALM}`,
      client_id: CLIENT_ID,
      redirect_uri: `${window.location.origin}/callback`,
      post_logout_redirect_uri: window.location.origin,
      response_type: "code",
      scope: "openid profile",
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      automaticSilentRenew: true,
    });
  }
  return gestor;
}

const ROLES: Rol[] = ["coordinador", "equipo_salud", "auditor"];

export function rolesDelToken(token: string): Rol[] {
  try {
    const carga = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const datos = JSON.parse(atob(carga.padEnd(carga.length + ((4 - (carga.length % 4)) % 4), "=")));
    const roles: string[] = datos?.realm_access?.roles ?? [];
    return ROLES.filter((r) => roles.includes(r));
  } catch {
    return [];
  }
}

export function inicioPorRol(roles: Rol[]): string {
  if (roles.includes("coordinador")) return "/planificar";
  if (roles.includes("equipo_salud")) return "/equipo";
  if (roles.includes("auditor")) return "/auditoria";
  return "/";
}

interface EstadoSesion {
  cargando: boolean;
  usuario: User | null;
  nombre: string;
  roles: Rol[];
  ingresar: () => Promise<void>;
  salir: () => Promise<void>;
  token: () => Promise<string | null>;
}

const Contexto = createContext<EstadoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const g = gestorSesion();
    let vivo = true;
    g.getUser().then((u) => {
      if (vivo) {
        setUsuario(u && !u.expired ? u : null);
        setCargando(false);
      }
    });
    const alCargar = (u: User) => setUsuario(u);
    const alSalir = () => setUsuario(null);
    g.events.addUserLoaded(alCargar);
    g.events.addUserUnloaded(alSalir);
    g.events.addSilentRenewError(alSalir);
    return () => {
      vivo = false;
      g.events.removeUserLoaded(alCargar);
      g.events.removeUserUnloaded(alSalir);
      g.events.removeSilentRenewError(alSalir);
    };
  }, []);

  const ingresar = useCallback(() => gestorSesion().signinRedirect(), []);
  const salir = useCallback(async () => {
    const g = gestorSesion();
    const u = await g.getUser();
    await g.removeUser();
    await g.signoutRedirect({ id_token_hint: u?.id_token });
  }, []);
  const token = useCallback(async () => {
    const u = await gestorSesion().getUser();
    if (!u) return null;
    if (u.expired) {
      try {
        return (await gestorSesion().signinSilent())?.access_token ?? null;
      } catch {
        return null;
      }
    }
    return u.access_token;
  }, []);

  const valor = useMemo<EstadoSesion>(
    () => ({
      cargando,
      usuario,
      nombre: (usuario?.profile.preferred_username as string) ?? "",
      roles: usuario ? rolesDelToken(usuario.access_token) : [],
      ingresar,
      salir,
      token,
    }),
    [cargando, usuario, ingresar, salir, token],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): EstadoSesion {
  const c = useContext(Contexto);
  if (!c) throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  return c;
}
