# Ruta Salud Rural · Frontend

Interfaz web del sistema de priorización de rutas de atención domiciliaria en salud rural para las veredas de Fusagasugá (Maratón de Programación con Impacto Social, UCundinamarca 2026, Ciclo de Investigación, problema 9).

Prototipo académico. Usa los colores de la identidad del Hospital San Rafael, pero no es un sistema oficial del hospital.

**Backend:** [iBrayant/ruta-salud-backend](https://github.com/iBrayant/ruta-salud-backend) (microservicios FastAPI, Keycloak, Postgres, Redis y Nginx).

## Pantallas
| Ruta | Rol | Qué hace |
|---|---|---|
| `/` | — | Ingreso con la cuenta institucional (Keycloak, OAuth 2.0 + PKCE) |
| `/planificar` | coordinador | Genera la ruta de la jornada: mapa real, orden de visita, lluvia por visita, explicación, confirmación y simulación de 10 jornadas |
| `/equipo` | equipo_salud, coordinador | La jornada de hoy en el celular y el asistente de preguntas |
| `/auditoria` | auditor | Eventos, verificación de la cadena de hashes y reproducción de rutas |

## Tecnología
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Leaflet + OpenStreetMap · oidc-client-ts.
Las versiones están fijadas y tenían al menos dos semanas de publicadas cuando se eligieron. `npm audit` reporta 0 vulnerabilidades.

## Cómo se conecta con el backend
- **Inicio de sesión:** el navegador habla directo con Keycloak (`NEXT_PUBLIC_AUTH_URL`) usando Authorization Code + PKCE. La contraseña nunca pasa por esta aplicación. Los tokens se guardan en `sessionStorage` y se renuevan con el refresh token.
- **API:** el navegador llama a `/api/*` en el mismo origen y Next.js lo reenvía al gateway (`BACKEND_URL`). Así no hace falta abrir CORS en los microservicios.
- **Mapa:** las teselas vienen de OpenStreetMap y el trazado por vías de OSRM. Solo se muestran ubicaciones fijas de las veredas; no hay rastreo de ubicación.

## Desarrollo local
Requiere el [backend](https://github.com/iBrayant/ruta-salud-backend) corriendo en `http://localhost:8080`.
```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

## Variables de entorno
| Variable | Ejemplo | Uso |
|---|---|---|
| `BACKEND_URL` | `https://<túnel>.trycloudflare.com` | Gateway del backend (solo servidor) |
| `NEXT_PUBLIC_AUTH_URL` | `https://<túnel>.trycloudflare.com/auth` | Keycloak visto desde el navegador |
| `NEXT_PUBLIC_AUTH_REALM` | `ruta-salud` | Realm |
| `NEXT_PUBLIC_AUTH_CLIENT_ID` | `web-ruta-salud` | Cliente público con PKCE |

## Despliegue en Vercel (CI/CD)
1. Importar este repositorio en Vercel (framework: Next.js). Cada push a `main` se despliega automáticamente.
2. Configurar las variables de entorno de la tabla con la URL del túnel del backend.
3. En el backend, registrar la URL de Vercel en Keycloak: `./scripts/registrar_frontend.sh https://<proyecto>.vercel.app`.
4. Si cambia la URL del túnel: actualizar `PUBLIC_BASE_URL` en el backend y las variables en Vercel, y volver a desplegar (los rewrites se fijan al construir).

## Seguridad
- Encabezados: Content-Security-Policy restrictiva, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` y `Permissions-Policy` (sin geolocalización ni cámara).
- Cada página verifica la sesión y el rol, pero **la autorización real la hace el backend** en cada petición. Esta interfaz solo oculta lo que el rol no puede usar.
- No se guardan datos de pacientes. El asistente avisa cuando se ocultan datos personales de una pregunta.
