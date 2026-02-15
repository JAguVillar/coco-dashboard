# 📋 Requerimientos - Sistema de Lotes y Fechas de Vencimiento

**Proyecto:** Coco Dashboard  
**Fecha:** 12 de Febrero 2026  
**Versión:** 2.0 (Reformulada según schema actual)

---

## 🎯 Contexto

### Sistema Actual (Ya Implementado)

✅ **Gestión de Stock:**
- Tabla `articulos` con `stock_actual` (agregado total)
- Descuento automático de stock vía trigger `procesar_venta_item` al insertar `venta_items`
- Restauración de stock vía trigger `manejar_cancelacion_venta` al cancelar ventas

✅ **Trazabilidad de Movimientos:**
- Tabla `movimientos` que registra: ventas, compras, ajustes, devoluciones, mermas, **vencimientos**
- Campos: `stock_anterior`, `stock_posterior`, `precio_unitario`, `precio_total`, `motivo`

✅ **Sistema de Ventas:**
- Estados de venta: pendiente → completada (con triggers automáticos)
- Items de venta con descuentos individuales
- Cálculo automático de totales

### Nuevo Sistema a Implementar

🆕 **Gestión de Lotes:**
- Nueva tabla `articulos_lotes` para gestionar ingresos con fechas de vencimiento
- Descuento de stock por lote (FEFO/FIFO) en lugar de stock agregado
- Trazabilidad lote → venta (qué lote se vendió a qué cliente)
- Control de productos próximos a vencer

---

## 📝 Cuestionario de Requerimientos

### **A. MODELO DE DATOS - LOTES**

#### A1. Información de Lotes

**1. ¿Qué campos debe tener cada lote?**

Marcar los que aplican:

- [ ] **numero_lote** - Código del proveedor (ej: "LOTE-2024-001")
- [ ] **fecha_ingreso** - Cuándo ingresó al depósito
- [ ] **fecha_vencimiento** - Cuándo vence (NULL si no aplica)
- [ ] **fecha_fabricacion** - Cuándo se fabricó
- [ ] **cantidad_inicial** - Cantidad original del lote
- [ ] **cantidad_disponible** - Cantidad actual (se descuenta con ventas)
- [ ] **precio_compra** - Precio unitario de compra de este lote específico
- [ ] **proveedor_id** - Proveedor específico del lote
- [ ] **ubicacion** - Ubicación física (estante, depósito)
- [ ] **notas** - Observaciones libres
- [ ] Otros: __________________

**Notas:**  
_________________________________________________________

---

**2. ¿Todos los productos manejan lotes obligatoriamente?**

- [ ] **Sí** - Todos los productos (suplementos, accesorios, todo)
- [ ] **No** - Solo productos con vencimiento (agregar campo `maneja_lotes` boolean a `articulos`)
- [ ] **No** - Solo categorías específicas: __________________

**Si respondiste NO:**
- ¿Cómo decides si un producto maneja lotes?
  - [ ] Checkbox manual al crear producto
  - [ ] Automático según categoría
  - [ ] Automático según unidad_medida (kg/g/l/ml = lotes, unidad = no)

**Ejemplos de productos SIN lotes en tu negocio:**  
_________________________________________________________

---

**3. ¿La fecha de vencimiento es obligatoria para todos los lotes?**

- [ ] **Sí** - Todos los lotes tienen fecha de vencimiento
- [ ] **No** - Es opcional (NULL permitido)

**Ejemplos de lotes sin vencimiento:**  
_________________________________________________________

---

#### A2. Relación con Stock Actual

**4. ¿Qué hacemos con el campo `stock_actual` de `articulos`?**

- [ ] **Calculado** - Se calcula automáticamente sumando `SUM(cantidad_disponible)` de todos los lotes
- [ ] **Sincronizado** - Se actualiza con triggers al modificar lotes
- [ ] **Eliminar** - Ya no se usa, siempre se calcula on-the-fly

**Justificación:**  
_________________________________________________________

---

### **B. DESCUENTO DE STOCK - INTEGRACIÓN CON TRIGGERS**

#### B1. Estrategia de Descuento

**5. Al vender, ¿en qué orden se descargan los lotes?**

- [ ] **FEFO** (First Expired, First Out) - Prioridad: el que vence primero
- [ ] **FIFO** (First In, First Out) - Prioridad: el más antiguo por fecha_ingreso
- [ ] **LIFO** (Last In, First Out) - Prioridad: el más reciente
- [ ] **Manual** - El vendedor elige el lote en cada venta

**Notas:**  
_________________________________________________________

---

**6. Modificación del trigger `procesar_venta_item`**

Actualmente el trigger hace:
```sql
UPDATE articulos 
SET stock_actual = stock_actual - NEW.cantidad
WHERE id = NEW.articulo_id
```

¿Cómo debe funcionar con lotes?

- [ ] **Opción A:** El trigger llama a una función `descontar_de_lotes(articulo_id, cantidad)` que:
  1. Busca lotes según estrategia (FEFO/FIFO)
  2. Descuenta de uno o múltiples lotes
  3. Registra en nueva tabla `venta_items_lotes` qué lotes se usaron
  
- [ ] **Opción B:** El trigger solo valida stock total, el descuento de lotes se hace ANTES desde la app
  
- [ ] **Opción C:** Híbrido - productos sin lotes usan trigger actual, productos con lotes usan función especial

**Preferencia:**  
_________________________________________________________

---

**7. ¿Qué pasa si un item requiere múltiples lotes?**

**Ejemplo:** Venta de 100 unidades, pero solo hay:
- Lote A: 60 unidades (vence 01/03)
- Lote B: 80 unidades (vence 15/05)

- [ ] **Automático** - Descuenta 60 del A + 40 del B sin preguntar
- [ ] **Bloquear** - Error: "Stock insuficiente en lote principal"
- [ ] **Avisar** - Mostrar al vendedor antes de confirmar

**Notas:**  
_________________________________________________________

---

#### B2. Trazabilidad Lote → Venta

**8. ¿Necesitás registrar QUÉ lote se vendió en cada item?**

- [ ] **Sí - Crítico** - Nueva tabla `venta_items_lotes` con:
  - venta_item_id
  - lote_id
  - cantidad_del_lote
  
- [ ] **Sí - Solo en movimientos** - Agregar `lote_id` a tabla `movimientos` existente
  
- [ ] **No** - Solo importa descontar el stock, no registrar qué lote

**Caso de uso principal:**  
_________________________________________________________

---

### **C. PRODUCTOS VENCIDOS - REGLAS DE NEGOCIO**

**9. ¿Qué pasa con lotes vencidos (fecha_vencimiento < HOY)?**

- [ ] **Bloquear venta** - No permitir agregar a venta (error)
- [ ] **Advertencia** - Mostrar alerta pero permitir confirmar
- [ ] **Solo visual** - Marcar en rojo pero no bloquear
- [ ] **Proceso manual** - El usuario da de baja con movimiento tipo='vencimiento'

**Notas:**  
_________________________________________________________

---

**10. ¿Los lotes vencidos suman al stock disponible?**

- [ ] **Sí** - Siguen sumando (con alerta visual)
- [ ] **No** - Automáticamente se excluyen del stock_actual
- [ ] **Depende** - Solo se excluyen si se marcaron como "dado de baja"

**Justificación:**  
_________________________________________________________

---

**11. Gestión de merma por vencimiento**

Actualmente existe `movimientos.tipo = 'vencimiento'`. ¿Cómo se usa?

- [ ] **Automático** - Al vencer un lote, se crea movimiento automático y se marca `cantidad_disponible = 0`
- [ ] **Manual** - El usuario ejecuta "Dar de baja por vencimiento" desde UI
- [ ] **Reporte** - Solo se usa para reportar pérdidas, no afecta stock

**Proceso preferido:**  
_________________________________________________________

---

### **D. FLUJO DE INGRESO DE PRODUCTOS**

#### D1. Creación de Productos Nuevos

**12. Al crear un producto por primera vez, ¿cómo funciona con lotes?**

- [ ] **Opción A:** Crear producto vacío (stock 0) → luego "Agregar Lote" en pantalla separada
- [ ] **Opción B:** Crear producto + primer lote en el mismo modal `ProductoCreateModal`
- [ ] **Opción C:** Pregunta al usuario: "¿Agregar stock inicial?" Sí → crear lote, No → producto vacío

**Preferencia:**  
_________________________________________________________

---

**13. Para productos que NO manejan lotes, ¿cómo funciona el ingreso?**

- [ ] **Igual que ahora** - Se ingresa `stock_actual` directo en tabla `articulos`
- [ ] **También usan lotes** - Pero con `fecha_vencimiento = NULL`
- [ ] **Otro:** __________________

**Notas:**  
_________________________________________________________

---

#### D2. Recepción de Mercadería (Productos Existentes)

**14. Cuando recibís más stock de un producto existente, ¿cómo se ingresa?**

- [ ] **Modal "Agregar Lote"** desde página de productos (botón en cada fila)
- [ ] **Módulo separado** "Recepción de Mercadería" (nueva página en menú)
- [ ] **Editar producto** existente (actualizar stock en `ProductoEditModal`)

**Preferencia:**  
_________________________________________________________

---

**15. ¿Pueden recibir múltiples lotes en una sola recepción?**

**Ejemplo:** Proveedor trae 50 unidades del lote A (vence 01/06) + 30 del lote B (vence 15/08)

- [ ] **Sí** - Permitir agregar N lotes en una sola operación
- [ ] **No** - Agregar de a un lote por vez
- [ ] **No es común** en nuestro negocio

**Notas:**  
_________________________________________________________

---

**16. ¿Se registra como movimiento la recepción de lotes?**

- [ ] **Sí** - Crear `movimientos.tipo='compra'` por cada lote nuevo
- [ ] **No** - Solo crear registro en `articulos_lotes`

**Notas:**  
_________________________________________________________

---

### **E. INTERFAZ DE USUARIO - VISUALIZACIÓN**

#### E1. Vista de Productos (Tabla Principal)

**17. En la tabla de productos (`/productos`), ¿cómo mostrar el stock?**

- [ ] **Solo total** - "150 unidades" (sin info de lotes)
- [ ] **Total + próximo vencimiento** - "150 unidades (vence 12/03)"
- [ ] **Total + badge de alerta** - "150 unidades" + 🔴 si hay lotes por vencer
- [ ] **Fila expandible** - Click para ver desglose de lotes

**Preferencia:**  
_________________________________________________________

---

**18. ¿Alertas visuales de productos próximos a vencer?**

- [ ] **Sí** - Badge de color según días faltantes
- [ ] **Sí** - Solo ícono de advertencia
- [ ] **No** - Se ve solo al abrir detalles del producto

**Si respondiste SÍ:**

**¿Con cuántos días de anticipación?**

- [ ] 7 días → Rojo
- [ ] 15 días → Naranja  
- [ ] 30 días → Amarillo
- [ ] Otro: __________ días

**¿Dónde mostrar?**
- [ ] En la columna Stock de la tabla
- [ ] Dashboard/inicio (widget "Productos por vencer")
- [ ] Notificaciones
- [ ] Reporte separado

---

#### E2. Detalle de Producto

**19. Al hacer click en un producto, ¿qué información de lotes mostrar?**

Marcar las que aplican:

- [ ] Lista de lotes activos (tabla con: cantidad, fecha_vencimiento, fecha_ingreso, proveedor)
- [ ] Historial de lotes agotados
- [ ] Movimientos del producto (filtrado de tabla `movimientos`)
- [ ] Gráfico de rotación
- [ ] Valor total del inventario (suma de `cantidad_disponible × precio_compra`)
- [ ] Otros: __________________

**Prioridad (1 = más importante):**  
_________________________________________________________

---

#### E3. Vista de Ventas

**20. Al crear una venta, ¿el vendedor debe ver info de lotes?**

- [ ] **No** - Transparente (descuento automático FEFO/FIFO)
- [ ] **Sí** - Mostrar "Stock disponible: 60 (vence 01/03) + 40 (vence 15/05)"
- [ ] **Sí** - Solo si hay lotes próximos a vencer (advertencia)

**Notas:**  
_________________________________________________________

---

**21. Después de la venta, ¿dónde se ve qué lote se vendió?**

- [ ] **En el detalle de la venta** (panel/modal de venta completada)
- [ ] **Solo en reportes** de trazabilidad
- [ ] **En movimientos** (tabla `movimientos` filtrada por venta_id)
- [ ] **No es necesario visualizarlo**

**Preferencia:**  
_________________________________________________________

---

### **F. EDICIÓN Y AJUSTES**

**22. ¿Se pueden editar lotes después de creados?**

Marcar lo que se puede editar:

- [ ] Fecha de vencimiento
- [ ] Cantidad (ajuste de inventario)
- [ ] Número de lote
- [ ] Proveedor
- [ ] Ubicación
- [ ] Precio de compra
- [ ] Solo si `cantidad_disponible = cantidad_inicial` (no se vendió nada)
- [ ] No se pueden editar nunca

**Notas:**  
_________________________________________________________

---

**23. ¿Se pueden eliminar lotes?**

- [ ] Solo si `cantidad_disponible = cantidad_inicial` (no se vendió nada)
- [ ] Solo si `cantidad_disponible = 0` (lote agotado)
- [ ] Sí, siempre (con confirmación)
- [ ] No, solo marcar como inactivo

**Notas:**  
_________________________________________________________

---

**24. Ajustes de inventario (correcciones)**

Si contás físicamente y hay diferencia con el sistema:

- [ ] **Por lote** - Ajustar `cantidad_disponible` de un lote específico
- [ ] **Por producto** - Ajustar total y el sistema distribuye en lotes
- [ ] **Movimiento manual** - Crear `movimientos.tipo='ajuste_positivo/negativo'`

**Preferencia:**  
_________________________________________________________

---

### **G. REPORTES Y ANÁLISIS**

**25. ¿Qué reportes necesitás? (Priorizar 1-5)**

- [ ] (__) **Productos próximos a vencer** (tabla filtrable por días)
- [ ] (__) **Historial de pérdidas por vencimiento** (valor total perdido)
- [ ] (__) **Rotación de stock** (días promedio hasta agotar un lote)
- [ ] (__) **Lotes sin movimiento** (productos parados por más de X meses)
- [ ] (__) **Trazabilidad lote → cliente** (qué cliente compró del lote X)
- [ ] (__) **Análisis de proveedores** (freshness promedio al recibir)
- [ ] (__) **Valor del inventario** (por producto/categoría/proveedor)
- [ ] (__) Otros: __________________

**Top 3 prioritarios:**
1. _________________________________________________________
2. _________________________________________________________
3. _________________________________________________________

---

### **H. MIGRACIÓN Y COMPATIBILIDAD**

**26. ¿Ya tenés productos con stock en producción?**

- [ ] **Sí** - __________ productos con stock total de __________ unidades/kg
- [ ] **No** - Ambiente de desarrollo

**Si respondiste SÍ:**

**¿Cómo migrar el stock actual a lotes?**

- [ ] **Lote "Inicial"** - Crear un lote por cada producto con:
  - numero_lote: "STOCK-INICIAL"
  - cantidad_inicial = cantidad_disponible = stock_actual actual
  - fecha_ingreso: fecha de migración
  - fecha_vencimiento: NULL (o estimada manualmente)
  
- [ ] **Vaciar y recargar** - Poner todo en 0 y cargar desde cero
  
- [ ] **Migrar solo categorías específicas:** __________________
  
- [ ] **Dejar stock actual + lotes nuevos** (sistema híbrido)

**Preferencia:**  
_________________________________________________________

---

### **I. PRIORIDADES Y FASES**

**27. ¿Implementar todo de una vez o por fases?**

- [ ] **Todo junto** - Implementación completa

- [ ] **Por fases:**

  **FASE 1 - MVP:**
  - [ ] Tabla `articulos_lotes`
  - [ ] CRUD de lotes (crear, listar, editar)
  - [ ] Descuento automático FEFO/FIFO al vender
  - [ ] Vista de lotes en detalle de producto

  **FASE 2 - Alertas:**
  - [ ] Badges visuales de vencimiento próximo
  - [ ] Reporte "Productos por vencer"

  **FASE 3 - Trazabilidad:**
  - [ ] Tabla `venta_items_lotes`
  - [ ] Registro lote → venta
  - [ ] Reporte de trazabilidad

  **FASE 4 - Avanzado:**
  - [ ] Dashboard de vencimientos
  - [ ] Reportes de rotación y valor
  - [ ] Notificaciones automáticas

**Preferencia:**  
_________________________________________________________

---

**28. ¿Cuál es el caso de uso MÁS IMPORTANTE?**

- [ ] **Evitar vender productos vencidos** (control sanitario)
- [ ] **Trazabilidad legal** (recalls, auditorías ANMAT)
- [ ] **Optimizar compras** (saber cuánto stock real hay y cuándo vence)
- [ ] **Control de pérdidas** (medir cuánto se pierde por vencimiento)
- [ ] **Rotación FEFO** (vender primero lo que vence primero)
- [ ] Otro: __________________

**Explicación:**  
_________________________________________________________
_________________________________________________________

---

**29. ¿Hay restricciones de tiempo/recursos?**

- Fecha límite deseada: __________________
- Usuarios que usarán el sistema: __________________
- ¿Ya están usando el sistema en producción?: Sí / No

**Notas:**  
_________________________________________________________

---

## 📊 RESUMEN DE DECISIONES TÉCNICAS

Una vez completado, resumir aquí las decisiones clave:

### Modelo de Datos
- [ ] Todos los productos usan lotes / Solo algunos
- [ ] Campo `stock_actual`: Calculado / Sincronizado / Eliminado
- [ ] Fecha vencimiento: Obligatoria / Opcional

### Descuento de Stock
- [ ] Estrategia: FEFO / FIFO / LIFO / Manual
- [ ] Trigger: Modificar `procesar_venta_item` / Nuevo trigger / Función separada
- [ ] Trazabilidad: Tabla `venta_items_lotes` / Campo en `movimientos` / No registrar

### Vencimientos
- [ ] Lotes vencidos: Bloquear venta / Advertencia / Solo visual
- [ ] Stock disponible: Incluye vencidos / Excluye vencidos
- [ ] Baja por vencimiento: Automática / Manual

### UI/UX
- [ ] Ingreso lotes: Modal separado / Junto con producto / Módulo recepción
- [ ] Vista en tabla: Total simple / Total + alerta / Expandible
- [ ] Vendedor ve lotes: Sí / No / Solo advertencias

### Migración
- [ ] Stock actual → Lote inicial / Vaciar y recargar / Híbrido

---

## ✅ Checklist de Entrega

- [ ] Revisar todas las preguntas
- [ ] Completar notas adicionales
- [ ] Validar con stakeholders
- [ ] Definir prioridades (fases)
- [ ] Enviar al equipo de desarrollo

---

**Completado por:** __________________  
**Fecha:** __________________  
**Aprobación:** __________________

---

_Documento generado para Coco Dashboard - v2.0_  
_Basado en schema actual (12/02/2026)_
