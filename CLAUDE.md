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
├── composables/             # Vue composables (UI state management)
│   ├── useCategorias.js     # Categories management
│   ├── useClients.js        # Client management
│   ├── useDeleteConfirmation.js  # Delete confirmation dialog
│   ├── useMetodosPago.js    # Payment methods management
│   ├── useProducts.js       # Product/inventory management
│   ├── useProveedores.js    # Supplier management
│   ├── useVentas.js         # Sales management
│   └── useVentasListState.js  # Global state for sales list
├── layouts/
│   ├── default.vue          # Main dashboard layout with sidebar
│   └── main.vue             # Simple centered layout (login)
├── lib/
│   ├── mappers/
│   │   └── scheduleX.mapper.js  # DB -> Schedule-X event mapping
│   ├── repositories/        # Data access layer (Supabase queries)
│   │   ├── categorias.repo.js
│   │   ├── clients.repo.js
│   │   ├── metodosPago.repo.js
│   │   ├── products.repo.js
│   │   ├── proveedores.repo.js
│   │   └── ventas.repo.js
│   ├── services/            # Business logic layer
│   │   └── ventas.service.js  # Sales calculations and transformations
│   └── utils/               # Shared utilities
│       └── errors.js        # Centralized error handling
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

The application follows a **4-layer architecture**:

```
Component → Composable → Service → Repository → Database
   (UI)      (State)     (Logic)    (Data)
```

### 1. Repository Layer (`app/lib/repositories/`)

**Purpose**: Pure data access - talks only to Supabase, no business logic.

Each repository:
- Receives Supabase client as parameter via factory function
- Returns object with async CRUD methods: `list()`, `create()`, `update()`, `delete()`
- All `list()` methods support pagination via `{ from, to }` parameters
- All `list()` methods return `{ data, count }` for consistency
- All mutations (`create`, `update`, `delete`) return the affected row(s)
- Throws mapped errors using centralized error utility
- NO business logic (calculations, validations, transformations)

```javascript
// Example: app/lib/repositories/clients.repo.js
import { mapDatabaseError } from "@/lib/utils/errors";

export function createClientsRepo(supabase) {
  return {
    async list({ from, to } = {}) {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("full_name");

      if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw mapDatabaseError(error);
      return { data: data ?? [], count: count ?? 0 };
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("clients")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw mapDatabaseError(error, { entity: "clients" });
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw mapDatabaseError(error, { entity: "clients" });
      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw mapDatabaseError(error);
      return data;
    },
  };
}
```

**Key Principles**:
- ✅ Consistent return values (`{ data, count }` for lists, `data` for mutations)
- ✅ Consistent error handling (use `mapDatabaseError()`)
- ✅ Consistent operation names across all repos
- ✅ Support pagination in all list methods
- ❌ NO business logic (that goes in services)
- ❌ NO UI concerns (that goes in composables)

---

### 2. Service Layer (`app/lib/services/`)

**Purpose**: Business logic - calculations, transformations, validations.

Service layer contains pure functions for:
- Data transformations (normalization, formatting)
- Calculations (totals, subtotals, discounts)
- Business validations
- Payload construction with business defaults
- NO database access (use repositories)
- NO UI state management (use composables)

```javascript
// Example: app/lib/services/ventas.service.js
export function calculateItemTotals({ cantidad, precio_unitario, descuento = 0 }) {
  const subtotal = cantidad * precio_unitario;
  const total = subtotal - descuento;
  return { subtotal, total };
}

export function createVentaItemPayload({
  venta_id,
  articulo_id,
  cantidad,
  precio_unitario,
  descuento = 0,
}) {
  const { subtotal, total } = calculateItemTotals({ cantidad, precio_unitario, descuento });

  return {
    venta_id,
    articulo_id,
    cantidad,
    precio_unitario,
    subtotal,
    descuento,
    total,
  };
}
```

**Key Principles**:
- ✅ Pure functions (no side effects)
- ✅ Testable (easy to unit test)
- ✅ Reusable across composables
- ❌ NO database calls
- ❌ NO reactive state

---

### 3. Composable Layer (`app/composables/`)

**Purpose**: UI state management and coordination.

Vue composables wrap repositories/services and provide:
- Reactive `loading` and `error` refs for UI feedback
- Async methods with try/catch/finally for error handling
- Auto-injection of Supabase client via `useSupabaseClient()`
- Pagination metadata (`page`, `pageSize`)
- Coordinate between service layer (business logic) and repository (data access)
- NO business logic (delegate to services)
- NO direct database queries (delegate to repositories)

```javascript
// Example: app/composables/useClients.js
import { createClientsRepo } from "@/lib/repositories/clients.repo";

export function useClients() {
  const supabase = useSupabaseClient();
  const repo = createClientsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadClients({ page = 1, pageSize = 10 } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count } = await repo.list({ from, to });

      return {
        data: data ?? [],
        count: count ?? 0,
        page,
        pageSize,
      };
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createClient(payload) {
    loading.value = true;
    error.value = null;
    try {
      const row = await repo.create(payload);
      return row;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateClient(id, payload) {
    loading.value = true;
    error.value = null;
    try {
      const row = await repo.update(id, payload);
      return row;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteClient(id) {
    loading.value = true;
    error.value = null;
    try {
      const row = await repo.delete(id);
      return row;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { loadClients, createClient, updateClient, deleteClient, loading, error };
}
```

**Usage in components**:
```javascript
const { loadClients, createClient, updateClient, deleteClient, loading, error } = useClients();
```

**Key Principles**:
- ✅ Consistent try/catch/finally pattern
- ✅ Always set `loading = true` at start, `false` in finally
- ✅ Store errors in `error.value` then re-throw for components
- ✅ Return pagination metadata from load methods
- ❌ NO business logic (delegate to service layer)
- ❌ NO direct Supabase calls (delegate to repositories)

---

### 4. Error Handling (`app/lib/utils/errors.js`)

Centralized error mapping utility for consistent, user-friendly error messages in Spanish (Argentina).

**Features**:
- Error code constants (`ErrorCodes`)
- PostgreSQL error code mapping
- User-friendly Spanish (Argentina) messages
- Context-aware error transformation

```javascript
// Example usage in repositories
import { mapDatabaseError } from "@/lib/utils/errors";

if (error) throw mapDatabaseError(error, { entity: "clients" });
```

**Supported error codes**:
- `CLIENT_PHONE_EXISTS` - Duplicate phone number
- `UNIQUE_VIOLATION` - Generic unique constraint
- `FOREIGN_KEY_VIOLATION` - Cannot delete (in use)
- `PERMISSION_DENIED` - Auth/permission errors
- And more (see `app/lib/utils/errors.js`)

---

### Global State Pattern (`useVentasListState`)

For entities that need **global state shared across components**, use the state composable pattern:

```javascript
// app/composables/useVentasListState.js
export const useVentasListState = () => {
  const rows = useState("ventas:rows", () => []);
  const { loadVentas, loading, error } = useVentas();

  const refresh = async (params = {}) => {
    const response = await loadVentas(params);
    rows.value = response?.data ?? [];
    return response;
  };

  const upsertRow = (venta) => {
    const idx = rows.value.findIndex((v) => v.id === venta.id);
    if (idx === -1) rows.value.unshift(venta);
    else rows.value[idx] = { ...rows.value[idx], ...venta };
  };

  const removeRow = (id) => {
    rows.value = rows.value.filter((v) => v.id !== id);
  };

  return { rows, loading, error, refresh, upsertRow, removeRow };
};
```

**Key Principles**:
- Uses `useState()` for SSR-compatible global state
- Delegates data fetching to entity composable (`useVentas`)
- NO duplicate loading/error states (reuse from delegated composable)
- Provides local mutations (`upsertRow`, `removeRow`) for optimistic updates

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
- **Repositories** throw mapped errors using `mapDatabaseError()` from `app/lib/utils/errors.js`
- **Composables** catch errors, store in `error.value` ref, then re-throw
- **Components** handle errors with try/catch and display toast notifications via `useToast()`
- All error messages are in Spanish (Argentina) for end users
- See `app/lib/utils/errors.js` for error codes and messages

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

Follow the 4-layer architecture:

1. **Repository Layer** - Create `app/lib/repositories/{entity}.repo.js`
   ```javascript
   import { mapDatabaseError } from "@/lib/utils/errors";

   export function createEntityRepo(supabase) {
     return {
       async list({ from, to } = {}) { /* ... */ },
       async create(payload) { /* ... */ },
       async update(id, payload) { /* ... */ },
       async delete(id) { /* ... */ },
     };
   }
   ```

2. **Service Layer** (optional) - Create `app/lib/services/{entity}.service.js` if business logic is needed
   ```javascript
   // Only if you need calculations, transformations, or validations
   export function calculateEntityTotal(params) { /* ... */ }
   export function createEntityPayload(params) { /* ... */ }
   ```

3. **Composable Layer** - Create `app/composables/use{Entity}.js`
   ```javascript
   import { createEntityRepo } from "@/lib/repositories/{entity}.repo";

   export function useEntity() {
     const supabase = useSupabaseClient();
     const repo = createEntityRepo(supabase);
     const loading = ref(false);
     const error = ref(null);

     async function loadEntities({ page = 1, pageSize = 10 } = {}) { /* ... */ }
     async function createEntity(payload) { /* ... */ }
     async function updateEntity(id, payload) { /* ... */ }
     async function deleteEntity(id) { /* ... */ }

     return { loadEntities, createEntity, updateEntity, deleteEntity, loading, error };
   }
   ```

4. **Component Layer** - Create page and modals
   - Page: `app/pages/{entity}.vue`
   - Create modal: `app/components/{entity}/{Entity}CreateModal.vue`
   - Edit modal: `app/components/{entity}/{Entity}EditModal.vue`

5. **Navigation** - Add link in `app/layouts/default.vue`

### Repository Best Practices

- ✅ Always use `mapDatabaseError()` for error handling
- ✅ All `list()` methods return `{ data, count }`
- ✅ All mutations return the affected row(s)
- ✅ Support `{ from, to }` pagination parameters
- ✅ NO business logic in repositories

### Service Layer Best Practices

- ✅ Use pure functions (no side effects)
- ✅ Keep functions small and focused
- ✅ Export individual functions (not a factory)
- ❌ NO database access
- ❌ NO reactive state

### Composable Best Practices

- ✅ Consistent try/catch/finally pattern
- ✅ Set `loading = true` at start, `false` in finally
- ✅ Store errors in `error.value` then re-throw
- ✅ Add pagination metadata to load methods
- ❌ NO business logic (delegate to services)
- ❌ NO direct Supabase calls (delegate to repositories)

### Adding a New Booking Type
Insert into `turnos_types` table with: slug, name, color, icon

### Modifying Calendar Events
Update `app/lib/mappers/scheduleX.mapper.js` for event structure changes
