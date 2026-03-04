# Ejemplo: Actualización de CSVs con Foreign Keys

## Conversión directa desde un archivo Excel

Si recibes un workbook de Excel (cada hoja corresponde a una tabla), puedes
exportar rápidamente cada hoja a CSV usando la utilidad incluida en este
repositorio.

```bash
# instalar dependencia (solo una vez)
npm install xlsx --save-dev

# convertir workbook.xlsx en múltiples CSVs dentro de /data
node scripts/excel-to-csv.js "/ruta/al/archivo.xlsx"
```

La herramienta crea `data/<nombre_de_hoja>.csv` (el nombre se limpia de
caracteres inválidos y se reemplazan por `_`). El delimitador es punto y
coma para que coincida con el formato actual. Si la hoja contiene una tabla
formateada de Excel (Insert > Table) y ésta tiene el mismo nombre que la
hoja (por ejemplo, hoja "Proyectos" con tabla llamada "Proyectos"), el
script exportará únicamente el rango de esa tabla. Esto garantiza que sólo
los datos verdaderos se conviertan y no celdas vacías o notas alrededor.

----

## Formato Actual (Sin IDs)

**tecnologias.csv:**
```csv
TECN_N;TECN_NombreTecnologia;TECN_NombreProyecto;TECN_Descripcion
1;Periodontal;Tratamiento Periodontal con Nanotecnología 2015;desc...
2;Nanopartículas;Otro Proyecto;desc...
```

**Proyectos.csv:**
```csv
PROY_ID;PROY_NombreProyecto;PROY_InvestigadorLiderUANDES
TRATXX15TE01;Tratamiento Periodontal con Nanotecnología 2015;David Rosenberg
```

**Investigadores.csv:**
```csv
INV_ID;INV_NombreCompleto;INV_EmailPrincipal
inv_001;David Rosenberg;david@uandes.cl
```

---

## Formato Mejorado (Con IDs/FKs)

**tecnologias.csv:** (Agregar columnas FK)
```csv
TECN_ID;TECN_N;TECN_NombreTecnologia;PROY_ID;PROY_NombreProyecto;INV_ID;TECN_Investigadores;TECN_Descripcion
1;1;Periodontal;TRATXX15TE01;Tratamiento Periodontal con Nanotecnología 2015;inv_001;David Rosenberg;desc...
2;2;Nanopartículas;OTRO_PROJ_ID;Otro Proyecto;inv_002;Otra Persona;desc...
```

**Proyectos.csv:** (Mantener IDs primarios, agregar FK)
```csv
PROY_ID;PROY_NombreProyecto;INV_ID;PROY_InvestigadorLiderUANDES;INST_ID;PROY_Descripcion
TRATXX15TE01;Tratamiento Periodontal con Nanotecnología 2015;inv_001;David Rosenberg;INST-001;desc...
OTRO_PROJ_ID;Otro Proyecto;inv_002;Otra Persona;INST-002;desc...
```

**Investigadores.csv:** (Mantener igual)
```csv
INV_ID;INV_NombreCompleto;INV_EmailPrincipal;INV_Facultad_Unidad
inv_001;David Rosenberg;david@uandes.cl;Facultad Salud
inv_002;Otra Persona;otra@uandes.cl;Facultad Ing
```

**Instituciones.csv:** (Asegurar ID único)
```csv
INST_ID;INST_NombreFantasia;INST_RazonSocial;INST_Tipo
INST-001;Institución A;Razon Social A;Privada
INST-002;Institución B;Razon Social B;Pública
```

---

## Cambios Específicos por Tabla

### 1. tecnologias.csv
| Campo | Acción | Ejemplo |
|-------|--------|---------|
| `TECN_ID` | ✅ Crear si no existe | `TECN-001`, `TECN-002` |
| `PROY_ID` | ✅ Agregar (FK a Proyectos) | `TRATXX15TE01` |
| `INV_ID` | ✅ Agregar (FK a Investigadores) | `inv_001` |
| `INST_ID` | ✅ Agregar (FK a Instituciones) | `INST-001` |

### 2. Proyectos.csv
| Campo | Acción | Ejemplo |
|-------|--------|---------|
| `PROY_ID` | ✅ Mantener (PK) | `TRATXX15TE01` |
| `INV_ID` | ✅ Agregar (FK a Investigadores) | `inv_001` |
| `INST_ID` | ✅ Agregar (FK a Instituciones) | `INST-001` |

### 3. Investigadores.csv
| Campo | Acción | Ejemplo |
|-------|--------|---------|
| `INV_ID` | ✅ Normalizar (PK único) | `inv_001`, `inv_002` |

### 4. Instituciones.csv
| Campo | Acción | Ejemplo |
|-------|--------|---------|
| `INST_ID` | ✅ Crear (PK único) | `INST-001`, `INST-002` |

### 5. Legal PI.csv
| Campo | Acción | Ejemplo |
|-------|--------|---------|
| `LGL_ID` | ✅ Crear si no existe | `PI-001`, `PI-002` |
| `TECN_ID` o nombre | ✅ Mantener referencia a tecnología | (por nombre o ID) |

---

## Estrategia de ID Normalizados

### Formato Recomendado por Tabla

**Investigadores:**
```
inv_001, inv_002, inv_003
o
david-rosenberg, maria-garcia, jose-martinez
```

**Instituciones:**
```
inst_001, inst_002
o
inst-uandes, inst-externa-a
```

**Proyectos:**
```
(Mantener actual si único)
TRATXX15TE01, OTRO_PROJ_ID
o normalizar
proj_001, proj_002
```

**Tecnologías:**
```
tecn_001, tecn_002
o
tech-periodontal, tech-nanoparticulas
```

**Propiedad Intelectual:**
```
pi_001, pi_002
o
pat-estatinas, marca-dental
```

---

## Cómo Actualizar Manualmente en Excel/Power BI

### Paso 1: Crear columnas FK en Excel

En `tecnologias.csv`:
1. Agregar columna `PROY_ID` después de `TECN_NombreProyecto`
2. Usar VLOOKUP/INDEX-MATCH para traer ID del proyecto basado en nombre:
   ```excel
   =VLOOKUP(TECN_NombreProyecto, Proyectos!$A$2:$B$100, 1, FALSE)
   ```

### Paso 2: Normalizar IDs

En `Investigadores.csv`:
1. Si existe `INV_ID`, validation que sea único
2. Si no existe, crear con patrón:
   ```excel
   =CONCATENATE("inv_", ROW()-1)
   ```

### Paso 3: Exportar como CSV

1. En Excel → Guardar como → `CSV (delimitadores por punto y coma)`
2. Codificación: UTF-8
3. Reemplazar archivo en `/data/*.csv`

---

## Script Automatizado (Power Query)

Si quieres automatizar en Power BI:

```powerquery
// Para Tecnologías con FK a Proyectos
let
    Fuente = Excel.CurrentWorkbook(){[Name="Tecnologias"]}[Content],
    MergeConProyectos = Table.NestedJoin(
        Fuente,
        {"TECN_NombreProyecto"},
        Excel.CurrentWorkbook(){[Name="Proyectos"]}[Content],
        {"PROY_NombreProyecto"},
        "Proyectos"
    ),
    #"Expanded Proyectos" = Table.ExpandTableColumn(MergeConProyectos, "Proyectos", {"PROY_ID"}, {"PROY_ID"}),
    #"Added TECN_ID" = Table.AddColumn(#"Expanded Proyectos", "TECN_ID", each "TECN-"&Text.PadStart(Text.From(Number.From(Text.BetweenDelimiters([TECN_N],"",""))+1), 3, "0"))
in
    #"Added TECN_ID"
```

---

## Validación Post-Actualización

Después de actualizar los CSVs, valida:

1. **IDs únicos por tabla**
   ```sql
   SELECT TECN_ID, COUNT(*) FROM tecnologias GROUP BY TECN_ID HAVING COUNT(*) > 1
   -- Debe retornar 0 filas
   ```

2. **FKs válidas**
   ```sql
   SELECT DISTINCT PROY_ID FROM tecnologias 
   WHERE PROY_ID NOT IN (SELECT PROY_ID FROM Proyectos)
   -- Debe retornar 0 filas
   ```

3. **No nulls en FKs críticas**
   ```sql
   SELECT COUNT(*) FROM tecnologias WHERE PROY_ID IS NULL AND TECN_NombreProyecto IS NOT NULL
   -- Puede haber algunos, esos se vincularán por nombre
   ```

---

## Migración Paso a Paso

1. **Backup** de CSVs actuales ✅
2. **Agregar columnas FK** en Excel/Power BI ✅
3. **Validar relaciones** (sin duplicados, sin nulls innecesarios) ✅
4. **Exportar como CSV** con delimitador `;` y UTF-8 ✅
5. **Reemplazar files** en `/data/` ✅
6. **Rebuild proyecto**: `npm run build` ✅
7. **Testear vinculaciones** en localhost:3000 ✅

---

## Próxima Fase: Código

Una vez actualizado s los CSVs, actualizar:
- `lib/entityLinks.ts` → `matchAgainstIndex()` ahora recibe `valueId`
- `lib/tecnologias.ts` → Extraer y usar TECN_ID directamente
- `lib/proyectos.ts` → Extraer y usar PROY_ID directamente
- `lib/investigadores.ts` → Extraer y usar INV_ID directamente
- `lib/instituciones.ts` → Extraer y usar INST_ID directamente
