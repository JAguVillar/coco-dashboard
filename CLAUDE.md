# CLAUDE.md - Coco Dashboard

## Project Overview

Coco Dashboard (mi-nuxt-ui) is a sports facility management dashboard for padel courts. It handles court bookings, clients, products inventory, categories, and suppliers. The application is built for the Argentine market with Spanish (Argentina) localization.

## Tech Stack

- **Framework**: Nuxt 4 (v4.2.2) with Vue 3 Composition API
- **UI Library**: Nuxt UI 4 (@nuxt/ui v4.3.0) - Dashboard components
- **Backend**: Supabase (Auth + PostgreSQL database)
- **Calendar**: Schedule-X (@schedule-x/vue) for booking management
- **Validation**: Zod (v4.2.1)
- **Date/Time**: temporal-polyfill, @internationalized/date
- **Icons**: Lucide icons via @nuxt/icon

## Project Structure

```
app/
├── assets/css/main.css      # Global styles (Tailwind + Nuxt UI)
├── components/              # Vue components
│   ├── BaseTable.vue        # Reusable table wrapper
│   ├── ScheduleCalendar.client.vue  # Calendar (client-only)
│   ├── TurnoCreateModal.vue # Booking creation modal
│   ├── TurnoFijoCreateModal.vue     # Fixed booking modal
│   ├── TurnoDetailsSlideover.vue    # Booking details panel
│   ├── categorias/          # Category-specific components
│   ├── clientes/            # Client-specific components
│   ├── productos/           # Product-specific components
│   └── proveedores/         # Supplier-specific components
├── composables/             # Vue composables (state/data hooks)
│   ├── useBookings.js       # Booking CRUD operations
│   ├── useBookingsTypes.js  # Booking type management
│   ├── useCategorias.js     # Categories management
│   ├── useClients.js        # Client management
│   ├── useCourts.js         # Court management
│   ├── useProducts.js       # Product/inventory management
│   ├── useProveedores.js    # Supplier management
│   └── useTabs.js           # Tab state management
├── layouts/
│   ├── default.vue          # Main dashboard layout with sidebar
│   └── main.vue             # Simple centered layout (login)
├── lib/
│   ├── mappers/
│   │   └── scheduleX.mapper.js  # DB -> Schedule-X event mapping
│   └── repositories/        # Data access layer
│       ├── bookings.repo.js
│       ├── bookingTypes.repo.js
│       ├── categorias.repo.js
│       ├── clients.repo.js
│       ├── courts.repo.js
│       ├── products.repo.js
│       ├── proveedores.repo.js
│       ├── tabs.repo.js
│       └── tabsItems.repo.js
├── middleware/
│   └── auth.global.js.js    # Auth middleware
├── pages/
│   ├── login.vue            # Auth page (login/register)
│   ├── home.vue             # Empty home (redirects)
│   ├── productos.vue        # Products/inventory page
│   ├── categorias.vue       # Categories page
│   ├── clientes.vue         # Clients page
│   └── proveedores.vue      # Suppliers page
├── plugins/
│   └── temporal.client.js   # Temporal polyfill loader
└── app.vue                  # Root component
```

## Architecture Patterns

### Repository Pattern
Data access is abstracted through repository functions in `app/lib/repositories/`. Each repository:
- Receives the Supabase client as a parameter
- Returns an object with async CRUD methods
- Handles error throwing for the composable layer

```javascript
// Example: app/lib/repositories/clients.repo.js
export function createClientsRepo(supabase) {
  return {
    async list() { /* ... */ },
    async create(payload) { /* ... */ },
    async delete(id) { /* ... */ },
  };
}
```

### Composables Pattern
Vue composables in `app/composables/` wrap repositories and provide:
- Reactive `loading` and `error` refs
- Async methods with try/catch/finally
- Auto-injection of Supabase client via `useSupabaseClient()`

```javascript
// Example usage in components
const { loadClients, createClient, deleteClient, loading, error } = useClients();
```

### Page Component Pattern
Each CRUD page follows a consistent structure:
1. Table display with `BaseTable` component
2. Create modal triggered by button
3. Delete confirmation modal
4. Toast notifications via `useToast()`
5. Column definitions using render functions (`h()`)

## Database Schema (Supabase)

### Main Tables
- `turnos` - Bookings (id, title, start_at, end_at, court_id, booking_type_id, client_id)
- `turnos_types` - Booking types (id, slug, name, color, icon)
- `turnos_states` - Booking states (id, name, icon, color)
- `courts` - Sports courts (id, slug, name, color_main, color_container, color_on_container)
- `clients` - Clients (id, full_name, phone)
- `articulos` - Products/inventory
- `categorias` - Product categories
- `proveedores` - Suppliers

### Timezone
All dates use **America/Argentina/Buenos_Aires** timezone (TZ constant in codebase).

## Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Prepare Nuxt
npm run postinstall
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
SUPABASE_URL=your-project-url-here
SUPABASE_ANON_KEY=your-anon-key-here
```

## Coding Conventions

### Language
- **UI Text**: Spanish (Argentina) - use "vos" conjugation, local terminology
- **Code**: English for variables, functions, and comments
- **Table names**: Spanish (articulos, proveedores, categorias) or English (clients, courts, bookings)

### Vue Components
- Use `<script setup>` with Composition API
- Components use Nuxt UI v4 components (UButton, UModal, UCard, UTable, etc.)
- Dashboard pages use `UDashboardPanel`, `UDashboardNavbar`, `UDashboardSidebar`
- Client-only components use `.client.vue` suffix

### Form Handling
- Validation with Zod schemas
- `UForm` with `:schema` and `:state` props
- Time inputs use `@internationalized/date` types
- Date/time conversion uses Temporal API

### Table Columns
Define columns with computed property using TanStack-style format:
```javascript
const columns = computed(() => [
  {
    accessorKey: "field_name",
    header: "Display Name",
    cell: ({ row }) => /* render function */,
  },
]);
```

### Modal Pattern
```vue
<UModal v-model:open="openModal">
  <UButton label="Open" />
  <template #content>
    <ComponentModal @created="refresh()" @close="openModal = false" />
  </template>
</UModal>
```

### Error Handling
- Repositories throw errors
- Composables catch and store in `error` ref, then re-throw
- Components handle with try/catch and toast notifications

### WhatsApp Integration
The calendar component includes WhatsApp Web integration for booking confirmations:
- Phone normalization for Argentine numbers (+549...)
- Message builder with booking details
- Opens wa.me link in new tab

## Key Files to Know

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Nuxt configuration, modules |
| `app/layouts/default.vue` | Main sidebar navigation |
| `app/components/ScheduleCalendar.client.vue` | Booking calendar with Schedule-X |
| `app/components/BaseTable.vue` | Reusable table component |
| `app/lib/mappers/scheduleX.mapper.js` | Booking to calendar event mapper |

## Nuxt Modules Enabled

- `@nuxt/eslint` - ESLint integration
- `@nuxt/fonts` - Font optimization
- `@nuxt/icon` - Icon components
- `@nuxt/ui` - UI component library
- `@nuxtjs/supabase` - Supabase integration

## Common Tasks

### Adding a New Entity (CRUD Page)

1. Create repository in `app/lib/repositories/{entity}.repo.js`
2. Create composable in `app/composables/use{Entity}.js`
3. Create page in `app/pages/{entity}.vue`
4. Create modal component in `app/components/{entity}/{Entity}CreateModal.vue`
5. Add navigation link in `app/layouts/default.vue`

### Adding a New Booking Type
Insert into `turnos_types` table with: slug, name, color, icon

### Modifying Calendar Events
Update `app/lib/mappers/scheduleX.mapper.js` for event structure changes
