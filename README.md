# Alquileres — Panel de Administración

Sistema profesional de administración de propiedades en alquiler, con gestión de contratos, cobranzas, actualización por IPC CREEBBA y generación de recibos.

## Stack

- **Frontend/Backend**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel
- **Email**: Resend

---

## Deploy en Vercel

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Ejecutar las migraciones en el SQL Editor de Supabase:
   - Copiar y ejecutar `supabase/migrations/001_initial.sql`
   - Copiar y ejecutar `supabase/migrations/002_seed_ipc.sql`
3. En **Authentication → Users**, crear tu usuario admin con email y contraseña
4. Copiar las keys desde **Settings → API**

### 2. Configurar variables de entorno

Crear `.env.local` a partir de `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app

# Opcional — para notificaciones por email
RESEND_API_KEY=re_xxxxx
NOTIFICATION_EMAIL=tu@email.com
```

### 3. Deploy en Vercel

```bash
npm install -g vercel
vercel --prod
```

O bien conectar el repositorio GitHub en [vercel.com](https://vercel.com) y agregar las variables de entorno en el dashboard.

---

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local
# Completar variables en .env.local
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | KPIs, próximos vencimientos, alertas de mora, actividad reciente |
| **Propiedades** | CRUD completo, estado disponible/alquilado |
| **Inquilinos** | CRUD completo con datos de contacto |
| **Contratos** | Gestión completa con historial, adjuntos PDF |
| **IPC CREEBBA** | Carga manual + scraping automático, historial completo |
| **Actualización automática** | Cálculo de nuevo alquiler por coeficiente IPC |
| **Cobranzas** | Navegación por mes, generación batch, registro de pagos |
| **Mora automática** | Cálculo de interés diario configurable por contrato |
| **Recibos** | Generación HTML/PDF profesional, numeración automática |
| **Reportes** | Gráficos de ingresos, evolución por propiedad, IPC histórico |
| **Importador Excel** | Importa propiedades e inquilinos del Excel existente |
| **Notificaciones email** | Alerta cuando se publica nuevo IPC CREEBBA |

---

## Estructura del proyecto

```
app/
  (auth)/login/         ← Login
  (dashboard)/
    dashboard/          ← Dashboard principal
    propiedades/        ← CRUD propiedades
    inquilinos/         ← CRUD inquilinos
    contratos/          ← CRUD + ajuste IPC
    cobranzas/          ← Pagos mensuales
    recibos/            ← Generación recibos
    ipc/                ← Gestión IPC CREEBBA
    reportes/           ← Gráficos y análisis
    importar/           ← Importador Excel
  api/
    receipts/[id]/      ← HTML imprimible
    payments/generate/  ← Generación batch
    ipc/scrape/         ← Scraper CREEBBA
    ipc/notify/         ← Email notificación

components/
  ui/                   ← shadcn/ui base
  layout/               ← Sidebar, Header
  dashboard/            ← KPIs, alertas
  propiedades/          ← Formularios y listas
  inquilinos/
  contratos/            ← + Ajuste IPC
  cobranzas/            ← Registro pagos, batch
  recibos/              ← Preview + print
  ipc/
  reportes/             ← Recharts
  importar/             ← Excel importer

supabase/migrations/    ← SQL schema + seed IPC
lib/
  supabase/             ← client.ts + server.ts
  calculations/rent.ts  ← Lógica IPC
  utils.ts              ← Formatters
types/index.ts
```

---

## Base de datos

Tablas principales:
- `properties` — Propiedades
- `tenants` — Inquilinos
- `contracts` — Contratos (con `current_rent`, `last_adjustment_date`)
- `payments` — Pagos mensuales
- `ipc_indexes` — Índices IPC CREEBBA históricos
- `rent_adjustments` — Historial de actualizaciones
- `files` — Archivos adjuntos (Supabase Storage)
- `notifications` — Notificaciones internas
- `receipt_counter` — Contador correlativo de recibos

Todas las tablas tienen RLS habilitado (solo usuarios autenticados).

---

## Flujo de trabajo mensual

1. **Inicio del mes**: Ir a Cobranzas → "Generar todos" — crea pagos para todos los contratos activos
2. **Al cobrar**: Hacer clic en "Registrar" en cada pago — calcula mora automática si aplica
3. **Recibo**: Desde Recibos → abrir e imprimir/guardar como PDF
4. **IPC**: Cuando CREEBBA publica el índice → IPC CREEBBA → "Verificar automáticamente" o carga manual
5. **Actualización**: Contratos con frecuencia vencida → botón "Aplicar actualización" con cálculo preview
