# Guía de Pruebas QA - Formulario PeruCompras

## Información General

**Sistema:** Formulario de Gestión de Interacciones Multi-Canal  
**Cliente:** PeruCompras  
**Plataforma:** uContact v6  
**Tecnología:** Vue3 + Vuetify 3

---

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Pruebas de Carga Inicial](#pruebas-de-carga-inicial)
3. [Pruebas de Integración CTI](#pruebas-de-integración-cti)
4. [Pruebas por Canal](#pruebas-por-canal)
5. [Pruebas de Validaciones](#pruebas-de-validaciones)
6. [Pruebas de Búsqueda](#pruebas-de-búsqueda)
7. [Pruebas de Operaciones CRUD](#pruebas-de-operaciones-crud)
8. [Pruebas de Manejo de Errores](#pruebas-de-manejo-de-errores)
9. [Casos de Prueba Específicos](#casos-de-prueba-específicos)
10. [Matriz de Pruebas](#matriz-de-pruebas)

---

## Requisitos Previos

### Datos de Prueba Necesarios

- [ ] Base de datos con catálogos cargados (9 catálogos)
- [ ] Acceso a uContact con permisos de agente
- [ ] Credenciales de agente SIP configuradas
- [ ] Entorno de pruebas con CTI funcional
- [ ] Registros de prueba existentes en la base de datos

### Herramientas Requeridas

- Navegador web (Chrome/Firefox recomendados)
- Acceso a consola del navegador (F12)
- Documentación de esquema de base de datos
- Cliente de base de datos (HeidiSQL/MySQL Workbench)

---

## Pruebas de Carga Inicial

### TC-01: Carga del Formulario sin CTI

**Objetivo:** Verificar que el formulario carga correctamente en modo manual (sin CTI)

**Pasos:**

1. Acceder al formulario directamente desde el menú de uContact
2. Observar el estado inicial del formulario

**Resultado Esperado:**

- ✅ El formulario carga sin errores
- ✅ El canal está configurado en "PRESENCIAL"
- ✅ Todos los campos están vacíos
- ✅ Se muestra un GUID autogenerado
- ✅ Todos los catálogos se cargan correctamente (9 dropdowns poblados)
- ✅ Los campos obligatorios están marcados con asterisco (\*)
- ✅ Se muestran dos pestañas: "Formulario" y "Búsqueda de Usuarios"

**Datos a Verificar:**

- Tipo de Usuario (dropdown con opciones)
- Tipo de Documento (dropdown con opciones)
- Región (dropdown con opciones)
- Tema de Consulta (dropdown con opciones)
- Estado de Consulta (dropdown con opciones)
- Órgano de Atención (dropdown con opciones)
- Satisfacción del Servicio (dropdown con opciones)
- Valoración de Atención (dropdown con opciones)
- Acuerdo Marco (dropdown con opciones)

### TC-02: Tiempo de Carga de Catálogos

**Objetivo:** Medir el rendimiento de carga de catálogos

**Pasos:**

1. Abrir consola del navegador (F12)
2. Acceder al formulario
3. Observar los logs de carga

**Resultado Esperado:**

- ✅ Los 9 catálogos cargan en paralelo
- ✅ Tiempo total de carga < 3 segundos
- ✅ No hay errores en consola

---

## Pruebas de Integración CTI

### TC-03: Formulario con Llamada Entrante CTI

**Objetivo:** Verificar integración con CTI en llamada entrante

**Pasos:**

1. Generar una llamada entrante al agente
2. Abrir el formulario desde el CTI

**Resultado Esperado:**

- ✅ El formulario detecta la presencia de CTI
- ✅ Canal configurado automáticamente en "LLAMADA"
- ✅ GUID obtenido del CTI
- ✅ Número telefónico pre-poblado en campo correspondiente
- ✅ ID del agente detectado automáticamente
- ✅ Botón "Guardar y Finalizar" cierra el formulario después de guardar

### TC-04: Identificación del Agente

**Objetivo:** Verificar que el sistema identifica correctamente al agente

**Pasos:**

1. Iniciar sesión como agente con accountcode conocido
2. Abrir el formulario (con o sin CTI)
3. Guardar una interacción
4. Verificar en base de datos

**Resultado Esperado:**

- ✅ Campo `agent_id` en tabla principal contiene el ID correcto
- ✅ ID corresponde al `id` de la tabla `ccdata.sip` del agente
- ✅ Búsqueda por agente muestra los registros correctos

---

## Pruebas por Canal

### TC-05: Canal LLAMADA

**Objetivo:** Verificar funcionalidad completa del canal LLAMADA

**Datos de Prueba:**

```
Razón Social: EMPRESA DE PRUEBAS SAC
Tipo Usuario: Proveedor
Tipo Documento: RUC
Número Documento: 20123456789
Tema Consulta: Consulta técnica
Estado Consulta: Pendiente
Número Telefónico: 987654321012
Duración Llamada: 300
Acuerdo Marco: (Seleccionar uno)
Detalle Acuerdo Marco: Consulta sobre términos del acuerdo
Detalle Consulta: Usuario consulta sobre proceso de homologación
```

**Pasos:**

1. Seleccionar canal "LLAMADA" (o llegar desde CTI)
2. Llenar todos los campos comunes
3. Llenar campos específicos de LLAMADA
4. Hacer clic en "Guardar y Finalizar"

**Resultado Esperado:**

- ✅ Formulario guarda sin errores
- ✅ Mensaje de éxito: "Interacción guardada correctamente"
- ✅ Registro insertado en `PERUCOMPRAS_interaction`
- ✅ Registro insertado en `PERUCOMPRAS_interaction_llamada`
- ✅ GUID coincide en ambas tablas
- ✅ Formulario se resetea después de guardar
- ✅ Si vino de CTI, el formulario se cierra

### TC-06: Canal WHATSAPP

**Objetivo:** Verificar funcionalidad completa del canal WHATSAPP

**Datos de Prueba:**

```
Razón Social: Juan Pérez Mendoza
Tipo Usuario: Usuario Final
Número Celular: 98765432101
Consulta: ¿Cómo puedo registrarme en el portal?
Respuesta: Debe ingresar a www.perucompras.gob.pe/registro
Valoración Atención: (Seleccionar una opción)
```

**Pasos:**

1. Seleccionar canal "WHATSAPP"
2. Llenar campos comunes y específicos
3. Guardar

**Resultado Esperado:**

- ✅ Validación de número celular (11 dígitos)
- ✅ Guarda correctamente
- ✅ Registro en `PERUCOMPRAS_interaction_whatsapp`

### TC-07: Canal EMAIL

**Objetivo:** Verificar funcionalidad completa del canal EMAIL

**Datos de Prueba:**

```
Razón Social: María González
Tipo Usuario: Entidad
Correo: maria.gonzalez@entidad.gob.pe
Asunto: Consulta sobre proceso de compra
Fecha Atención: 2026-01-20
Estado Atención: Pendiente
Encauzado: Sí
Fecha Derivación: 2026-01-20
Días Atención Órgano: 5
Estado Atención Órgano: (Seleccionar)
Agente Atendió: (Seleccionar)
```

**Pasos:**

1. Seleccionar canal "EMAIL"
2. Llenar todos los campos
3. Marcar/desmarcar checkbox "Encauzado"
4. Guardar

**Resultado Esperado:**

- ✅ Validación de formato de email
- ✅ Checkbox "Encauzado" funciona correctamente
- ✅ Campos de fecha aceptan formato válido
- ✅ Registro en `PERUCOMPRAS_interaction_email`
- ✅ Campo `estado_atencion_encauzado` es 0 o 1 según checkbox

### TC-08: Canal WEBCHAT

**Objetivo:** Verificar funcionalidad del canal WEBCHAT

**Datos de Prueba:**

```
Razón Social: Cliente Webchat
Tipo Usuario: Usuario Final
Tema Consulta: Información general
Estado Consulta: Atendido
```

**Pasos:**

1. Seleccionar canal "WEBCHAT"
2. Llenar solo campos comunes (no hay campos específicos)
3. Guardar

**Resultado Esperado:**

- ✅ No muestra sección de campos específicos
- ✅ Solo guarda en tabla principal
- ✅ No intenta insertar en tabla de canal específico

### TC-09: Canal PRESENCIAL

**Objetivo:** Verificar funcionalidad completa del canal PRESENCIAL

**Datos de Prueba:**

```
Razón Social: Visitante Presencial
Tipo Usuario: Usuario Final
Hora Ingreso: 09:30
Hora Salida: 10:15
Número Telefónico: 987123456789
Correo: visitante@correo.com
Detalle Consulta: Consulta sobre proceso de licitación presencial
```

**Pasos:**

1. Seleccionar canal "PRESENCIAL"
2. Llenar campos de hora (usar selectores de tiempo)
3. Llenar campos opcionales
4. Guardar

**Resultado Esperado:**

- ✅ Campos de hora funcionan correctamente
- ✅ Campos telefónico y correo son opcionales
- ✅ Registro en `PERUCOMPRAS_interaction_presencial`

---

## Pruebas de Validaciones

### TC-10: Validación de Campos Obligatorios

**Objetivo:** Verificar que no se puede guardar sin campos obligatorios

**Pasos:**

1. Dejar vacío el campo "Razón Social"
2. Intentar guardar
3. Repetir para cada campo obligatorio

**Campos Obligatorios a Probar:**

- Razón Social
- Tipo de Usuario
- Tema de Consulta
- Estado de Consulta

**Resultado Esperado:**

- ✅ Mensaje: "Por favor, complete todos los campos obligatorios"
- ✅ Color rojo en notificación
- ✅ Formulario no se guarda
- ✅ Datos no se insertan en base de datos

### TC-11: Validación de Número Telefónico

**Objetivo:** Verificar validación de longitud de teléfono

**Casos de Prueba:**

| Valor                 | Longitud   | Resultado Esperado              |
| --------------------- | ---------- | ------------------------------- |
| 123456789             | 9 dígitos  | ❌ Debe ser entre 11-20 dígitos |
| 12345678901           | 11 dígitos | ✅ Válido                       |
| 98765432109876543210  | 20 dígitos | ✅ Válido                       |
| 987654321098765432101 | 21 dígitos | ❌ Debe ser entre 11-20 dígitos |

**Resultado Esperado:**

- ✅ Mensaje de validación aparece debajo del campo
- ✅ No permite guardar con valores inválidos

### TC-12: Validación de Número de Documento

**Objetivo:** Verificar validación de número de documento

**Casos de Prueba:**

| Valor           | Longitud   | Resultado Esperado   |
| --------------- | ---------- | -------------------- |
| 1234567890      | 10 dígitos | ❌ Mínimo 11 dígitos |
| 12345678901     | 11 dígitos | ✅ Válido            |
| 123456789012345 | 15 dígitos | ✅ Válido            |

### TC-13: Validación de Email

**Objetivo:** Verificar formato de correo electrónico

**Casos de Prueba:**

| Email                        | Resultado Esperado  |
| ---------------------------- | ------------------- |
| correo@dominio.com           | ✅ Válido           |
| correo.prueba@dominio.gob.pe | ✅ Válido           |
| correo@dominio               | ❌ Formato inválido |
| correo.sin.arroba.com        | ❌ Formato inválido |
| @dominio.com                 | ❌ Formato inválido |

### TC-14: Filtrado de Entrada en Campos Numéricos

**Objetivo:** Verificar que campos numéricos solo aceptan números

**Campos a Probar:**

- Número de Teléfono
- Número de Documento
- Número de Celular (WhatsApp)
- Duración de Llamada
- Días de Atención Órgano

**Pasos:**

1. Hacer clic en un campo numérico
2. Intentar escribir letras: "ABC123XYZ"
3. Observar el resultado

**Resultado Esperado:**

- ✅ Solo se ingresan los números: "123"
- ✅ Las letras son filtradas automáticamente
- ✅ No es necesario borrar manualmente

### TC-15: Validación de Límites de Caracteres

**Objetivo:** Verificar que la base de datos rechaza datos que exceden límites

**Pasos:**

1. Ingresar un texto de 200+ caracteres en "Razón Social" (límite típico: 100-150)
2. Intentar guardar
3. Observar notificación

**Resultado Esperado:**

- ✅ Mensaje: "Error al guardar la interacción principal. Verifique que los datos no excedan los límites permitidos."
- ✅ Color rojo en notificación
- ✅ No se guarda en base de datos
- ✅ Formulario mantiene los datos ingresados

---

## Pruebas de Búsqueda

### TC-16: Búsqueda sin Filtros

**Objetivo:** Verificar carga inicial de búsqueda

**Pasos:**

1. Hacer clic en pestaña "Búsqueda de Usuarios"
2. Observar la tabla de resultados

**Resultado Esperado:**

- ✅ Se ejecuta búsqueda automáticamente
- ✅ Filtro "Estado Consulta" está en "Pendiente" por defecto
- ✅ Se muestran solo registros con estado "Pendiente"
- ✅ Tabla tiene paginación (10 registros por página)
- ✅ Muestra columnas: Razón Social, Tipo Usuario, N° Documento, Canal, Tema, Estado, Fecha Creación, Acciones

### TC-17: Búsqueda por Número de Teléfono

**Objetivo:** Verificar filtro de teléfono

**Datos de Prueba:**

- Buscar: "987" (búsqueda parcial)

**Pasos:**

1. Ir a pestaña "Búsqueda de Usuarios"
2. Ingresar "987" en campo "Número de Teléfono"
3. Hacer clic en "Buscar"

**Resultado Esperado:**

- ✅ Muestra registros donde el teléfono contiene "987"
- ✅ Funciona con canales LLAMADA, WHATSAPP, PRESENCIAL
- ✅ Búsqueda es case-insensitive

### TC-18: Búsqueda por Número de Documento

**Objetivo:** Verificar filtro de documento

**Datos de Prueba:**

- Buscar: "2012345" (búsqueda parcial)

**Resultado Esperado:**

- ✅ Muestra registros donde el documento contiene "2012345"
- ✅ Búsqueda parcial funciona (LIKE %valor%)

### TC-19: Búsqueda por Razón Social

**Objetivo:** Verificar filtro de nombre/razón social

**Datos de Prueba:**

- Buscar: "EMPRESA" (búsqueda parcial)

**Resultado Esperado:**

- ✅ Muestra todos los registros con "EMPRESA" en razón social
- ✅ No distingue mayúsculas/minúsculas

### TC-20: Búsqueda por Múltiples Canales

**Objetivo:** Verificar selección múltiple de canales

**Pasos:**

1. En campo "Canales", seleccionar "LLAMADA" y "EMAIL"
2. Hacer clic en "Buscar"

**Resultado Esperado:**

- ✅ Muestra solo registros de canales LLAMADA o EMAIL
- ✅ No muestra otros canales

### TC-21: Búsqueda por Agente

**Objetivo:** Verificar filtro de agente

**Pasos:**

1. Seleccionar un agente del dropdown
2. Buscar

**Resultado Esperado:**

- ✅ Muestra solo interacciones atendidas por ese agente
- ✅ Dropdown muestra lista de agentes desde `ccdata.sip`

### TC-22: Búsqueda Combinada (Múltiples Filtros)

**Objetivo:** Verificar que múltiples filtros funcionan en conjunto

**Datos de Prueba:**

- Teléfono: "987"
- Canal: "LLAMADA"
- Estado: "Atendido"

**Resultado Esperado:**

- ✅ Muestra solo registros que cumplen TODOS los criterios
- ✅ Consulta SQL usa AND entre filtros

### TC-23: Limpiar Filtros

**Objetivo:** Verificar que se pueden limpiar los filtros

**Pasos:**

1. Aplicar varios filtros
2. Hacer clic en el botón de limpiar (X) de cada campo
3. Volver a buscar

**Resultado Esperado:**

- ✅ Campos se limpian
- ✅ Búsqueda vuelve a mostrar todos los registros (solo con filtro "Pendiente")

---

## Pruebas de Operaciones CRUD

### TC-24: Crear Nueva Interacción (INSERT)

**Objetivo:** Verificar creación de nuevo registro

**Pasos:**

1. Llenar formulario con datos válidos
2. Guardar
3. Verificar en base de datos

**Resultado Esperado:**

- ✅ Notificación: "Interacción guardada correctamente"
- ✅ Nuevo registro en `PERUCOMPRAS_interaction`
- ✅ Nuevo registro en tabla del canal específico
- ✅ GUID único generado
- ✅ Fecha de creación (`created_at`) registrada
- ✅ Campo `updated_at` es NULL

### TC-25: Cargar Interacción Existente

**Objetivo:** Verificar carga de registro desde búsqueda

**Pasos:**

1. Ir a "Búsqueda de Usuarios"
2. Buscar un registro específico
3. Hacer clic en botón "Cargar" de un registro

**Resultado Esperado:**

- ✅ Formulario cambia a pestaña "Formulario"
- ✅ Todos los campos se llenan con datos del registro
- ✅ Canal correcto seleccionado
- ✅ Campos específicos del canal cargados
- ✅ GUID preservado del registro original

### TC-26: Actualizar Interacción (UPDATE)

**Objetivo:** Verificar actualización de registro existente

**Pasos:**

1. Cargar un registro desde búsqueda
2. Modificar algunos campos
3. Guardar

**Resultado Esperado:**

- ✅ Notificación de éxito
- ✅ Registro actualizado en base de datos
- ✅ GUID permanece igual
- ✅ Campo `updated_at` se actualiza con timestamp actual
- ✅ Campo `created_at` no cambia

### TC-27: Prevención de Duplicados

**Objetivo:** Verificar advertencia al cargar mismo registro dos veces

**Pasos:**

1. Cargar un registro desde búsqueda
2. Sin guardar, volver a búsqueda
3. Cargar el mismo registro nuevamente

**Resultado Esperado:**

- ✅ Mensaje: "Este registro ya está cargado en el formulario"
- ✅ Color amarillo/naranja (warning)
- ✅ No recarga el formulario

---

## Pruebas de Manejo de Errores

### TC-28: Error de Conexión a Base de Datos

**Objetivo:** Verificar manejo de errores de BD

**Pasos:**

1. (Requiere simulación) Detener servicio de base de datos
2. Intentar guardar

**Resultado Esperado:**

- ✅ Mensaje de error claro
- ✅ No se pierde información del formulario
- ✅ Usuario puede corregir y reintentar

### TC-29: Error en INSERT de Tabla Principal

**Objetivo:** Verificar detección de error en interacción principal

**Pasos:**

1. Ingresar datos que violen restricción de BD (ej: razon_social > 150 caracteres)
2. Guardar

**Resultado Esperado:**

- ✅ Notificación: "Error al guardar la interacción principal. Verifique que los datos no excedan los límites permitidos."
- ✅ Retorno desde `UC_exec_async` es "ERROR"
- ✅ No se guarda nada (ni tabla principal ni canal)

### TC-30: Error en INSERT de Canal Específico - LLAMADA

**Objetivo:** Verificar detección de error en tabla de canal

**Pasos:**

1. Guardar con datos válidos en principal pero inválidos en canal
2. Por ejemplo: detalle_consulta > límite de caracteres

**Resultado Esperado:**

- ✅ Notificación: "Error al guardar los datos de llamada. Verifique que los datos no excedan los límites permitidos."
- ✅ No se guarda en tabla de canal

### TC-31: Error en INSERT de Canal Específico - WHATSAPP

**Resultado Esperado:**

- ✅ Notificación específica: "Error al guardar los datos de WhatsApp..."

### TC-32: Error en INSERT de Canal Específico - EMAIL

**Resultado Esperado:**

- ✅ Notificación específica: "Error al guardar los datos de email..."

### TC-33: Error en INSERT de Canal Específico - PRESENCIAL

**Resultado Esperado:**

- ✅ Notificación específica: "Error al guardar los datos presenciales..."

---

## Casos de Prueba Específicos

### TC-34: Reset de Formulario después de Guardar

**Objetivo:** Verificar que el formulario se limpia correctamente

**Escenario 1: Con CTI**

1. Formulario viene de llamada CTI (canal LLAMADA)
2. Guardar exitosamente
3. Observar estado del formulario

**Resultado Esperado:**

- ✅ Todos los campos se limpian
- ✅ Canal se mantiene en "LLAMADA" (porque hay CTI)
- ✅ Nuevo GUID generado
- ✅ Número de teléfono se mantiene (viene de CTI)

**Escenario 2: Sin CTI (Manual)**

1. Formulario en modo manual (canal PRESENCIAL)
2. Guardar exitosamente
3. Observar estado

**Resultado Esperado:**

- ✅ Todos los campos se limpian
- ✅ Canal vuelve a "PRESENCIAL"
- ✅ Nuevo GUID generado

### TC-35: No Reset en Validación Fallida

**Objetivo:** Verificar que el formulario no se limpia si hay error

**Pasos:**

1. Llenar formulario con datos inválidos
2. Intentar guardar
3. Observar formulario

**Resultado Esperado:**

- ✅ Formulario mantiene todos los datos ingresados
- ✅ Usuario puede corregir errores sin re-ingresar todo
- ✅ Canal no cambia

### TC-36: Cierre Automático con CTI

**Objetivo:** Verificar cierre automático solo con CTI

**Escenario 1: Con CTI**

1. Abrir desde llamada CTI
2. Guardar exitosamente

**Resultado Esperado:**

- ✅ Formulario se cierra automáticamente
- ✅ Función `UC_closeForm()` es llamada

**Escenario 2: Sin CTI**

1. Abrir manualmente
2. Guardar exitosamente

**Resultado Esperado:**

- ✅ Formulario NO se cierra
- ✅ Solo se resetea para nueva captura

### TC-37: Cambio de Canal con Datos Cargados

**Objetivo:** Verificar comportamiento al cambiar de canal

**Pasos:**

1. Seleccionar canal "LLAMADA"
2. Llenar campos específicos de LLAMADA
3. Cambiar a canal "EMAIL"
4. Observar campos

**Resultado Esperado:**

- ✅ Campos comunes se mantienen
- ✅ Sección de campos específicos cambia
- ✅ Datos de LLAMADA no se pierden (están en el objeto de datos)
- ✅ Si vuelve a LLAMADA, los datos siguen ahí

### TC-38: Paginación en Búsqueda

**Objetivo:** Verificar funcionamiento de paginación

**Pre-requisito:** Más de 10 registros en base de datos

**Pasos:**

1. Realizar búsqueda que retorne > 10 resultados
2. Observar tabla y controles de paginación

**Resultado Esperado:**

- ✅ Se muestran solo 10 registros por página
- ✅ Aparecen controles de paginación
- ✅ Puede navegar a página siguiente
- ✅ Puede navegar a página anterior
- ✅ Indicador muestra "1-10 de XX"

### TC-39: Auto-carga al Cambiar a Pestaña de Búsqueda

**Objetivo:** Verificar búsqueda automática

**Pasos:**

1. Estar en pestaña "Formulario"
2. Cambiar a pestaña "Búsqueda de Usuarios" por primera vez

**Resultado Esperado:**

- ✅ Búsqueda se ejecuta automáticamente
- ✅ Solo ocurre en el primer cambio de pestaña
- ✅ Cambios posteriores no re-ejecutan búsqueda automática

### TC-40: Estado por Defecto "Pendiente"

**Objetivo:** Verificar filtro por defecto

**Pasos:**

1. Abrir pestaña de búsqueda por primera vez

**Resultado Esperado:**

- ✅ Campo "Estado Consulta" tiene "Pendiente" seleccionado
- ✅ Resultados muestran solo registros pendientes
- ✅ Usuario puede cambiar a otro estado

---

## Matriz de Pruebas

### Cobertura por Canal

| Canal      | Campos Comunes | Campos Específicos | Validaciones | INSERT | UPDATE | Búsqueda | Error Handling |
| ---------- | -------------- | ------------------ | ------------ | ------ | ------ | -------- | -------------- |
| LLAMADA    | ✅             | ✅                 | ✅           | ✅     | ✅     | ✅       | ✅             |
| WHATSAPP   | ✅             | ✅                 | ✅           | ✅     | ✅     | ✅       | ✅             |
| EMAIL      | ✅             | ✅                 | ✅           | ✅     | ✅     | ✅       | ✅             |
| WEBCHAT    | ✅             | N/A                | ✅           | ✅     | ✅     | ✅       | ✅             |
| PRESENCIAL | ✅             | ✅                 | ✅           | ✅     | ✅     | ✅       | ✅             |

### Checklist de Validaciones

- [ ] Razón Social (obligatorio)
- [ ] Tipo de Usuario (obligatorio)
- [ ] Tema de Consulta (obligatorio)
- [ ] Estado de Consulta (obligatorio)
- [ ] Número de Teléfono (11-20 dígitos, solo números)
- [ ] Número de Documento (11+ dígitos, solo números)
- [ ] Número de Celular WhatsApp (11 dígitos, solo números)
- [ ] Email (formato válido)
- [ ] Duración de Llamada (solo números)
- [ ] Días de Atención Órgano (solo números)
- [ ] Límites de caracteres en campos de texto

### Checklist de Búsqueda

- [ ] Búsqueda por teléfono (parcial)
- [ ] Búsqueda por documento (parcial)
- [ ] Búsqueda por razón social (parcial)
- [ ] Filtro por canales (múltiple)
- [ ] Filtro por agente
- [ ] Filtro por estado consulta
- [ ] Combinación de múltiples filtros
- [ ] Paginación
- [ ] Auto-carga inicial
- [ ] Limpiar filtros

### Checklist de CRUD

- [ ] CREATE: Nueva interacción con todos los canales
- [ ] READ: Búsqueda y carga en formulario
- [ ] UPDATE: Modificación de registro existente
- [ ] Prevención de duplicados
- [ ] Timestamps correctos (created_at, updated_at)
- [ ] GUID consistente en todas las tablas

---

## Criterios de Aceptación

### Funcionalidad Mínima Requerida

✅ **Debe Funcionar:**

- Carga de formulario sin errores
- Los 9 catálogos cargan correctamente
- CRUD completo en los 5 canales
- Validaciones de campos obligatorios
- Validaciones de formato (teléfono, documento, email)
- Búsqueda con todos los filtros
- Integración CTI (detección de canal y callerID)
- Manejo de errores de base de datos
- Notificaciones claras al usuario

### Criterios de Rendimiento

- Carga inicial del formulario: < 2 segundos
- Carga de catálogos: < 3 segundos
- Guardado de interacción: < 1 segundo
- Búsqueda: < 2 segundos (con hasta 1000 registros)

### Criterios de Usabilidad

- Interfaz responsiva y clara
- Mensajes de error descriptivos
- Feedback visual en todas las acciones
- No se pierden datos al cambiar de canal
- Campos numéricos solo aceptan números

---

## Notas para el Equipo QA

1. **Base de Datos:** Asegúrense de tener datos de prueba variados en todos los canales
2. **CTI Testing:** Coordinar con el equipo técnico para pruebas de CTI
3. **Navegadores:** Probar en Chrome y Firefox como mínimo
4. **Logs:** Mantener consola del navegador abierta para detectar errores JavaScript
5. **Datos Límite:** Probar con valores en los límites (mínimo/máximo de caracteres)
6. **Performance:** Si hay >1000 registros, evaluar rendimiento de búsqueda
7. **SQL Injection:** NO PROBAR ataques de seguridad sin autorización
8. **Documentar:** Capturar pantallas de bugs encontrados
