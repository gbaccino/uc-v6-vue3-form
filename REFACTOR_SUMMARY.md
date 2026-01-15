# Database Refactor Summary

## Overview

The application has been refactored to work with the new normalized database structure, which separates common interaction data from channel-specific data.

## New Database Structure

### Catalog Tables (Lookup Tables)

- `PERUCOMPRAS_tipo_usuario`
- `PERUCOMPRAS_tipo_documento`
- `PERUCOMPRAS_region`
- `PERUCOMPRAS_tema_consulta`
- `PERUCOMPRAS_estado_consulta`
- `PERUCOMPRAS_estado_atencion`
- `PERUCOMPRAS_organo_atencion`
- `PERUCOMPRAS_satisfaccion_servicio`
- `PERUCOMPRAS_valoracion_atencion`
- `PERUCOMPRAS_acuerdo_marco`

### Main Tables

1. **PERUCOMPRAS_interactions** - Common fields for all channels
2. **PERUCOMPRAS_interaction_llamada** - Phone call specific data
3. **PERUCOMPRAS_interaction_whatsapp** - WhatsApp specific data
4. **PERUCOMPRAS_interaction_email** - Email specific data

**Note:** WEBCHAT channel uses only the common interactions table without a channel-specific table.

## Code Changes

### 1. Data Structure

The flat `formData` object has been replaced with structured objects:

```javascript
// Common interaction data
interaction: {
  guid, channel, fecha_hora_interaccion,
  tipo_usuario_id, tipo_documento_id, numero_documento,
  razon_social, region_id, tema_consulta_id,
  estado_consulta_id, organo_atencion_id,
  agente_id, satisfaccion_servicio_id
}

// Channel-specific data
llamadaData: { numero_telefonico, duracion_llamada, acuerdo_marco_id, ... }
whatsappData: { numero_celular, consulta, respuesta, ... }
emailData: { correo, asunto, fecha_atencion, ... }
```

### 2. New Methods

#### `loadCatalogs()`

- Loads all catalog data from database on initialization
- Populates dropdown options dynamically
- Runs in parallel for efficiency

#### `getAgentId()`

- Fetches the agent's database ID from their account code
- Required for foreign key relationships

#### `generateGuid()`

- Creates unique GUIDs for new interactions
- Used when CTI doesn't provide a GUID

#### `saveChannelSpecificData(isUpdate)`

- Handles saving to the appropriate channel-specific table
- Supports both INSERT and UPDATE operations
- Called automatically by `saveFormData()`

### 3. Updated Methods

#### `initializeForm()`

- Now loads catalogs before initializing
- Gets agent ID for database relationships
- Auto-generates GUID if needed

#### `detectInteractionChannel()`

- Updated to use database ENUM values: 'LLAMADA', 'WHATSAPP', 'EMAIL'
- Populates correct channel-specific data object

#### `saveFormData()`

- Complete rewrite to handle multi-table structure
- Validates common + channel-specific fields
- Saves to interactions table first
- Then saves to channel-specific table

#### `saveAndFinish()`

- Simplified to call `saveFormData()` then close form
- Handles CTI closing properly

#### `searchUsers()`

- Updated to query across all tables with LEFT JOINs
- Returns consolidated results from all channels

#### `loadUserToForm(user)`

- Fetches complete interaction data including channel-specific fields
- Populates all appropriate data objects

#### `resetForm()`

- Clears all structured data objects
- Resets to initial state

## Channel Detection

The system detects channels in the following priority:

1. **WHATSAPP**: CTI Channel contains "whatsapp"
2. **EMAIL**: CTI Channel contains "email" or "mail"
3. **WEBCHAT**: CTI Channel contains "webchat" or "chat"
4. **LLAMADA**: Default (no Channel key or other values)

**Channel-Specific Behavior:**

- **LLAMADA, WHATSAPP, EMAIL**: Save to both `interactions` table and respective channel-specific table
- **WEBCHAT**: Only saves to `interactions` table (no additional channel-specific fields)

## Next Steps: HTML Template Updates

The HTML template ([index.html](src/index.html)) needs to be updated to:

1. **Replace static dropdowns** with catalog-driven `v-select` components
2. **Use v-model bindings** to the new structured data:
   - `v-model="interaction.tipo_usuario_id"` instead of `v-model="formData.userType"`
   - `v-model="catalogs.tipoUsuario"` for `:items`
3. **Show/hide sections** based on `interactionChannel`:
   ```html
   <div v-if="interactionChannel === 'LLAMADA'">
     <!-- Phone call specific fields -->
   </div>
   <div v-if="interactionChannel === 'WHATSAPP'">
     <!-- WhatsApp specific fields -->
   </div>
   <div v-if="interactionChannel === 'EMAIL'">
     <!-- Email specific fields -->
   </div>
   <!-- WEBCHAT has no additional fields, only common interaction fields -->
   ```
4. **Update validation rules** to match new field types

## Benefits of New Structure

✅ **Normalized Data** - Eliminates redundancy and improves data integrity  
✅ **Scalable** - Easy to add new catalog values without code changes  
✅ **Type Safety** - Foreign keys enforce referential integrity  
✅ **Channel Flexibility** - Each channel has its own specific fields  
✅ **Easier Maintenance** - Centralized catalog management  
✅ **Better Queries** - Optimized with proper indexes

## Migration Notes

- All catalog data must be pre-populated in the database before using the form
- Agent IDs in `ccdata.sip` must exist for the foreign key relationships
- The old `PERUCOMPRAS_Atenciones_Llamadas` table is no longer used
- GUIDs must be unique across all interactions
