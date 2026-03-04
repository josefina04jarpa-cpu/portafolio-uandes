# Portafolio UANDES

Plataforma web de gestión y visualización de portafolio de tecnologías, proyectos, investigadores e instituciones de la Universidad de los Andes. Construida con **Next.js 16** y **React 19**, utiliza **TypeScript** y **Tailwind CSS** para una experiencia moderna y responsiva.

## Descripción General

La aplicación permite:
- Visualizar un catálogo completo de **tecnologías**, **proyectos**, **investigadores** e **instituciones**
- Ver detalles específicos de cada entidad con información relacionada
- Gestionar y actualizar datos mediante archivos CSV
- Acceso restringido a indicadores y datos sensibles mediante autenticación
- Exportar información en PDF
- Visualizar datos en gráficos (radar, heatmaps, etc.)

## Stack Tecnológico

- **Framework**: Next.js 16.1.6 (App Router con Server Components)
- **Runtime**: React 19.2.3
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 3.4.17
- **Procesamiento de datos**: csv-parse 6.1.0
- **Gráficos**: Recharts 2.15.4
- **Linting**: ESLint 9

## Cómo Funciona la Aplicación

### Flujo de Carga de Datos

1. **Lectura de CSV**: Los archivos CSV en `/data` se leen de forma **síncrona** durante el build y renderizado del servidor usando `csv-parse/sync`
2. **Normalización**: Los datos se procesan con utilidades en `/lib` para limpiar, validar y estructurar la información
3. **Vinculación de Entidades**: Se establecen relaciones entre entidades (tecnologías ↔ proyectos ↔ investigadores ↔ instituciones)
4. **Generación Estática**: Las páginas dinámicas se pre-renderizan en build-time con `generateStaticParams`
5. **Renderizado Servidor**: Las páginas utilizan Server Components para procesar datos en servidor antes de enviar HTML al cliente

### Archivos CSV y Su Estructura

#### 1. **tecnologias.csv**
Contiene información de tecnologías desarrolladas.

**Campos principales:**
- `TECN_ID` / `TECN_N`: Identificador único
- `TECN_NombreTecnologia`: Nombre de la tecnología
- `TECN_NombreProyecto`: Proyecto asociado
- `TECN_Descripcion`: Descripción técnica
- `TECN_Industria`: Área/facultad (ej: "Salud y Bienestar")
- `TECN_Investigadores`: Nombre del investigador/PI
- `TECN_ProdCateg`: Categoría de producto
- `TECN_ProdSubcateg`: Subcategoría
- `TECN_Comentario`: Notas adicionales
- `TECN_Activo`: Estado (Si/No)
- `TECN_Transferido`: Si ha sido transferida

#### 2. **Proyectos.csv**
Registro de proyectos de investigación.

**Campos principales:**
- `PROY_ID` / `PROY_CodigoProyecto`: Identificador único
- `PROY_NombreProyecto`: Nombre del proyecto
- `PROY_Descripcion`: Descripción del proyecto
- `PROY_InvestigadorLiderUANDES`: PI o director del proyecto
- `PROY_Facultad`: Facultad responsable
- `PROY_Disciplina`: Disciplina principal

#### 3. **Investigadores.csv**
Base de datos de investigadores.

**Campos principales:**
- `INV_ID` / `INV_N`: Identificador único
- `INV_NombreCompleto`: Nombre completo
- `INV_Facultad_Unidad`: Facultad o unidad
- `INV_EmailPrincipal` / `INV_EmailSecundario`: Email
- `INV_Cargo`: Posición/cargo

#### 4. **Instituciones.csv**
Datos de instituciones colaboradoras.

**Campos principales:**
- `INST_ID` / `INST_N`: Identificador único
- `INST_NombreFantasia` / `INST_RazonSocial`: Nombre
- `INST_Tipo`: Tipo de institución
- `INST_Industria`: Sector/industria
- `INST_Region`: Región geográfica

#### 5. **Legal_PI.csv**
Registro de propiedad intelectual (patentes, marcas, derechos de autor).

**Campos principales:**
- `LGL_N`: ID
- `LGL_NombrePI`: Nombre de la PI
- `LGL_CategPI`: Categoría (Patente, Marca, etc.)
- `LGL_SubcatPI`: Subcategoría
- `LGL_NumSolicitud`: Número de solicitud
- `LGL_FechaSolicitud`: Fecha de presentación
- `LGL_NumeroRegistro`: Número de registro concedido
- `LGL_FechaConcesion`: Fecha de concesión
- `LGL_TipoProdAsoc`: Tipo de producto asociado
- `LGL_NombreProdAsoc`: Nombre del producto (ej: nombre de tecnología)
- `LGL_Estado`: Estado (Concedida, En trámite, Abandonada, etc.)

#### 6. **Tecn-MadurezTecnol.csv**
Technology Readiness Level y otros niveles de madurez tecnológica.

**Campos principales:**
- `TECT_N`: ID único
- `TECT_NombreTecnologia`: Nombre de la tecnología (vinculado a Tecnologias)
- `TECT_Periodo`: Período o año de evaluación
- `TECT_CRL`: Commercial Readiness Level
- `TECT_TRL`: Technology Readiness Level
- `TECT_BRL`: Business Readiness Level
- `TECT_IPRL`: Intellectual Property Readiness Level
- `TECT_TmRL`: Team Readiness Level
- `TECT_FRL`: Financial Readiness Level
- `TECT_Comentario`: Comentarios adicionales
- **Relación**: `TECT_NombreTecnologia` → `Tecnologias.TECN_NombreTecnologia`

#### 7. **Comunicaciones.csv**
Registro de comunicaciones y publicaciones.

#### 8. **Metas Rectoria 2026.csv**
Objetivos institucionales para el año 2026.

#### 9. **indicadores-2025.csv**
Indicadores de desempeño y KPIs.

---

## Sistema de Vinculación de Entidades (Entity Links)

El archivo `lib/entityLinks.ts` implementa un sistema de vinculación exacta entre entidades.
**No existe coincidencia por similitud, patterns, fuzzy matching o normalización**: solo se vinculan
valores que coinciden **exactamente** tras trim().

### Las 17 Relaciones Aplicadas

1. **Proyectos.PROY_InvestigadorLiderUANDES** → Investigadores.INV_NombreCompleto
2. **Proyectos.PROY_NombreTecnologia** → Tecnologias.TECN_NombreProyecto
3. **Proyectos.PROY_ResponsableSeguimientoTecnico** → EquipoInnovacion.Nombre
4. **Tecnologias.TECN_NombreProyecto** → Proyectos.PROY_NombreProyecto
5. **Tecn-MadurezTecnol.TECT_NombreTecnologia** → Tecnologias.TECN_NombreTecnologia
6. **Legal_PI.LGL_NombreProdAsoc** → Tecnologias.TECN_NombreTecnologia (validación)
7. **Legal_PI.LGL_NombreProdAsoc** → Proyectos.PROY_NombreProyecto (validación)
8. **Legal_Doc.DOC_NombreProdAsoc** → Tecnologias.TECN_NombreTecnologia (validación)
9. **Legal_Doc.DOC_NombreProdAsoc** → Proyectos.PROY_NombreProyecto (validación)
10. **Proy-Financiamiento.PROF_NombreProyecto** → Proyectos.PROY_NombreProyecto (validación)
11. **Proy-Financiamiento.PROF_InstitucReceptora** → Instituciones.INST_NombreFantasia (validación)
12. **Proy-Involucrados.PROI_NombreProyecto** → Proyectos.PROY_NombreProyecto (validación)
13. **Proy-Involucrados.PROI_NombreInvolucrado** → Investigadores.INV_NombreCompleto (validación)
14. **Proy-Involucrados.PROI_InstInvolucrada** → Instituciones.INST_NombreFantasia (validación)
15. **Comunicaciones.COM_NombreProdAsoc** → Tecnologias.TECN_NombreTecnologia (validación)
16. **Comunicaciones.COM_NombreProdAsoc** → Proyectos.PROY_NombreProyecto (validación)
17. **Comunicaciones.COM_Vocero** → Investigadores.INV_NombreCompleto (validación)

### Tipos de Relaciones

- **Bidireccionales en associations UI** (relaciones 1-4): Se almacenan en memoria y se muestran como asociaciones navegables
- **Validación de integridad referencial** (relaciones 5-17): Se validan pero los datos se leen directamente desde los CSVs auxiliares

### Cómo Funciona

Para cada relación, si el valor de la columna origen coincide exactamente (case-sensitive, sin trim extra) con el valor
de la columna destino, se establece el vínculo automáticamente. Ejemplo:

```
Si: Proyectos.PROY_NombreTecnologia = "Plataforma de datos clínicos"
ENTONCES: busca Tecnologias. donde TECN_NombreProyecto = "Plataforma de datos clínicos"
SI EXISTE: crea vínculo bidireccional automáticamente
```

No hay suposiciones ni búsquedas aproximadas.

### Estructura de Asociaciones Retornadas

```typescript
type EntityAssociations = {
  investigators: { auto: EntityRef[]; suggested: [] },  // solo automáticas, sin sugerencias
  technologies:  { auto: EntityRef[]; suggested: [] },
  projects:      { auto: EntityRef[]; suggested: [] },
  institutions:  { auto: EntityRef[]; suggested: [] }
}
```

---

## Actualización de Datos

### Modelo Relacional y Flujo de Datos

El conjunto de CSVs actúa como la **fuente de verdad**; Power BI o cualquier otro proceso de ETL consume
estas tablas para construir indicadores y dashboards. El siguiente diagrama describe el orden en el que
se crean o actualizan entidades cuando se ingresa nueva información:

```
Inicio -> Investigadores
       │
       │ (si no existe: crear `Investigadores` con PK: INV_ID / INV_N)
       |
       -> Instituciones
       │
       │ (si no existe: crear `Instituciones` con PK: INST_ID / INST_N)
       │
       ▼
    Proyectos (PK: PROY_ID / PROY_N)
       │
       ├─> Proy_Involucrados (PK: PROI_N)  // vincula PROI_NombreProyecto -> Proyectos.PROY_NombreProyecto
       ├─> Proy_Financiamiento (PK: PROF_N) // PROF_NombreProyecto -> Proyectos.PROY_NombreProyecto
       ├─> Proy_Reuniones (PK: PRR_N) // registro de reuniones por proyecto
       ├─> Empren-Incubadora (Proyecto -> Proyectos.PROY_NombreProyecto; Responsable -> Investigadores.INV_NombreCompleto)
       │
       ▼
   ¿Genera tecnología?
       ├─ Sí -> Tecnologia (PK: TECN_N / TECN_ID)
       │          │
       │          ├─> Tecn-MadurezTecnol (PK: TECT_N) // TECT_NombreTecnologia -> Tecnologias.TECN_NombreTecnologia
       │          ├─> PI / Legal_PI (PK: LGL_N) // LGL_NombreProdAsoc -> TECN_NombreTecnologia / PROY_NombreProyecto
       │          ├─> Documentos (DOC_ID)
       │          ├─> Comunicaciones (COM_N)
       │          └─> Sustent (PK: SUST_N)
       │
       └─ No -> ├─> Documentos (DOC_ID)
                ├─> Comunicaciones (COM_N)
                |
                └─   Fin del proceso 
```

A partir de ahí se derivan tablas auxiliares para indicadores, metas rectoría, redes sociales, etc.

### Recomendaciones de Claves Primarias y Foráneas

Se espera que cada tabla incluya identificadores estables. El patrón general es usar `*_ID` cuando exista;
si no, se acepta `*_N` (nombre) como respaldo.

| Tabla | PK preferido | FKs útiles |
|-------|--------------|------------|
| Investigadores | `INV_ID` | N/A |
| Instituciones | `INST_ID` | N/A |
| Proyectos | `PROY_ID` | `INV_ID`, `INST_ID` |
| Tecnologias | `TECN_ID` | `PROY_ID`, `INV_ID`, `INST_ID` |
| Tecn-MadurezTecnol | `TECT_N` | `TECN_ID` (via TECT_NombreTecnologia) |
| Legal_PI | `LGL_N` | `TECN_ID`/`PROY_ID` (via LGL_NombreProdAsoc) |
| Legal Doc | `DOC_ID` | `TECN_ID`/`PROY_ID` |
| Proy_Involucrados | `PROI_N` | `PROY_ID`, `INV_ID`, `INST_ID` |
| Proy_Financiamiento | `PROF_N` | `PROY_ID`, `INST_ID` |
| Sustent | `SUST_N` | `TECN_ID` |
| Comunicaciones | `COM_N` | `TECN_ID`/`PROY_ID`, `INV_ID` |

> Para otras tablas mirar el diagrama y repetir el mismo principio: si la hoja del workbook es
> una tabla de Excel, asegúrate de que tenga una columna de ID primaria y de referenciar a las
> tablas padre mediante su clave.

### Pasos y Comandos para Actualizar los CSVs

1. **Obtener el archivo maestro Excel** (por ejemplo, la versión compartida en OneDrive/SharePoint).
   - Puedes arrastrarlo a una carpeta sincronizada o descargarlo manualmente.
   - Alternativa programática: usar el script de exemplo `scripts/download-sharepoint.js` o
     un flujo de Power Automate para bajarlo automáticamente.

2. **Ejecutar el convertidor**

   ```bash
   npm install xlsx --save-dev           # solo la primera vez
   node scripts/excel-to-csv.js \
     "C:\ruta\a\INGRESO DE DATOS - Proyectos y Tecnologias Innovacion.xlsm"
   ```

   El comando genera un CSV por hoja en `data/`, recortando filas y columnas vacías y aprovechando
   rangos de tabla cuando existan. Los archivos viejos serán sobrescritos.

3. **Inspeccionar y completar claves**
   - Abra los CSVs en Excel, LibreOffice o un editor de texto.
   - Verifique que cada fila tenga su ID (`PROY_ID`, `INV_ID`, etc.) y que los FKs referencien
     a filas existentes. Si falta alguna, rellenar manualmente o mediante `VLOOKUP`/`INDEX-MATCH`.
   - Puede usar Power Query en Excel/Power BI para automatizar estos cruces; un ejemplo ya está
     incluido en el documento original (ver sección "Script Automatizado (Power Query)").

4. **Validación rápida (opcional)**
   - Con una base de datos SQLite/CSV o directamente en Power BI/Excel, ejecutar consultas como:
     ```sql
     -- IDs duplicados
     SELECT PROY_ID, COUNT(*) FROM Proyectos GROUP BY PROY_ID HAVING COUNT(*) > 1;

     -- FKs inválidas
     SELECT DISTINCT PROY_ID FROM Tecnologias
     WHERE PROY_ID NOT IN (SELECT PROY_ID FROM Proyectos);

     -- nulls donde no debe haberlos
     SELECT COUNT(*) FROM Tecnologias WHERE PROY_ID IS NULL;
     ```
   - No deberían aparecer filas en ninguno de los casos.

5. **Copiar los CSVs al repositorio**
   - Reemplace los archivos existentes en `/data` con las versiones actualizadas.
   - Confirme que los nombres de archivo coincidan y que el delimitador siga siendo `;`.

6. **Reconstruir la aplicación**

   ```bash
   npm run build
   npm run start   # o npm run dev para desarrollo
   ```

   Durante el build, las utilidades en `/lib` procesarán los CSVs y resolverán las
   asociaciones entre entidades usando heurísticas exactas. Los cambios de IDs
   se reflejarán automáticamente en las rutas y relaciones.

### Notas de Implementación en el Código

- `lib/entityLinks.ts` ahora tiene funciones como `tryMatchById()` y `extractIds()` para
  dar preferencia a las columnas `*_ID` cuando estén presentes.
- Los cargadores en `lib/tecnologias.ts`, `lib/proyectos.ts`, `lib/investigadores.ts` y
  `lib/instituciones.ts` priorizan los identificadores `*_ID` y exponen la propiedad `id`
  correspondiente.

### Validación Post-Actualización

Ejecuta los mismos checks SQL que en el paso 4. Adicionalmente, avanza por la GUI de la
aplicación y busca enlaces rotos o entidades no vinculadas; el panel de sugerencias mostrará
cualquier coincidencia pendiente.

---

Con estos pasos podrás mantener los datos sincronizados entre el workbook de entrada, los
CSV consumidos por la aplicación y el modelo Power BI. Guardar este README como la única
referencia documentada para la actualización de datos.


3. **Reprocessamiento Automático**
   - Los CSVs se leen nuevamente
   - Se normalizan nombres e IDs
   - Se ejecutan todas las vinculaciones
   - Se regeneran páginas estáticas

### Entidades Que se Actualizan

| Entidad | Archivo | Trigger | Actualización |
|---------|---------|---------|---------------|
| **Tecnologías** | `tecnologias.csv` | Build | Catálogo, detalles, vinculaciones |
| **Proyectos** | `Proyectos.csv` | Build | Catálogo, detalles, vinculaciones |
| **Investigadores** | `Investigadores.csv` | Build | Perfil, affiliación, catálogo |
| **Instituciones** | `Instituciones.csv` | Build | Catálogo, detalles |
| **Emprendimiento** | `Empren-Incubadora.csv` | Build | Proyectos de incubación, responsables |
| **Propiedad Intelectual** | `Legal_PI.csv` | Build | Timeline, estado, detalles PI |
| **Madurez Tecnológica** | `Tecn-MadurezTecnol.csv`, `indicadores-*.csv` | Build | Gráficos, dashboards |
| **Comunicaciones** | `Comunicaciones.csv` | Build | Sección de comunicaciones |
| **Metas** | `Metas Rectoria 2026.csv` | Build | Dashboard de metas |

### Campos Que Se Mantienen en Sincronía

Al actualizar un CSV, los siguientes campos se actualizan automáticamente en toda la aplicación:

**Para Tecnologías:**
- Nombre, descripción, categorías
- Investigadores asociados
- Proyectos relacionados
- Estado (activa/transferida)
- Información de PI vinculada

**Para Proyectos:**
- Nombre, descripción
- Director/investigador principal
- Tecnologías asociadas
- Disciplina, facultad
- Estado de adjudicación

**Para Investigadores:**
- Nombre completo, email
- Unidad/facultad
- Proyectos y tecnologías asociadas
- Información de contacto

---

## Setup y Ejecución

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd portafolio-uandes

# Instalar dependencias
npm install
```

### Desarrollo

```bash
npm run dev
```

El servidor estará en `http://localhost:3000` y se actualizará en tiempo real conforme hagas cambios en los archivos.

### Producción (Build + Start)

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

---

## Configuración de Autenticación

### Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```bash
# Acceso a indicadores y datos sensibles
INDICADORES_TEAM_PASSWORD=tu_contraseña_de_equipo
AUTH_SECRET=una_clave_larga_y_segura_de_al_menos_32_caracteres
```

**Valores por defecto:**
- `INDICADORES_TEAM_PASSWORD`: `Innovacion2026` (si no se define)
- `AUTH_SECRET`: Debe definirse para sesiones seguras

---

## Estructura del Proyecto

```
portafolio-uandes/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx             # Home
│   ├── api/                 # API routes (auth, etc)
│   └── portafolio/
│       ├── page.tsx         # Catálogo principal
│       ├── tecnologias/
│       │   ├── page.tsx     # Listado
│       │   └── [id]/page.tsx # Detalle (SSG)
│       ├── proyectos/       # Similar estructura
│       ├── investigadores/
│       └── instituciones/
├── components/              # Componentes React reutilizables
│   ├── TechnologyTabs.tsx
│   ├── TechnologySidebar.tsx
│   ├── IndicadoresDashboard.tsx
│   └── ... (otros componentes)
├── lib/                     # Utilidades y lógica de datos
│   ├── dataPath.ts         # Resolución de rutas CSV
│   ├── normalize.ts        # Normalización de texto
│   ├── entityLinks.ts      # Vinculación de entidades
│   ├── tecnologias.ts      # Carga de tecnologías
│   ├── proyectos.ts        # Carga de proyectos
│   ├── investigadores.ts   # Carga de investigadores
│   ├── instituciones.ts    # Carga de instituciones
│   ├── legal.ts            # Carga de PI
│   ├── trl.ts              # Carga de TRL
│   └── ... (otros datos)
├── data/                    # Archivos CSV
│   ├── tecnologias.csv
│   ├── Proyectos.csv
│   ├── Investigadores.csv
│   ├── Instituciones.csv
│   ├── Legal PI.csv
│   ├── TRL.csv
│   └── ... (otros CSVs)
├── public/                  # Archivos estáticos
├── tailwind.config.js       # Configuración de Tailwind
├── tsconfig.json           # Configuración de TypeScript
└── package.json            # Dependencias y scripts
```

---

## Notas de Desarrollo

### Páginas Generadas Estáticamente

Las siguientes rutas se pre-generan en build-time:

- `/portafolio/tecnologias/[id]` → Una página por cada tecnología en CSV
- `/portafolio/proyectos/[id]` → Una página por cada proyecto
- `/portafolio/investigadores/[id]` → Una página por cada investigador
- `/portafolio/instituciones/[id]` → Una página por cada institución

Esto asegura **cero latencia** y máxima **compatibilidad SEO**.

### Caché y Performance

- Los datos CSV se leen y cachean durante el build
- No hay consultas a base de datos en tiempo de ejecución
- Las páginas son completamente estáticas
- Las vinculaciones se calculan una sola vez

---

## Troubleshooting

### El servidor de desarrollo no ve cambios en CSV

**Solución**: Tras editar un CSV, debes reiniciar el servidor (`npm run dev` nuevamente).

### Entidades no se vinculan

Revisa que:
1. Los nombres sean similares (≥85% de similitud)
2. Los campos de vinculación estén rellenos (no sean N/A o vacíos)
3. Los caracteres especiales se manejen correctamente (diacríticos, etc)

### Puerto 3000 en uso

```bash
# En Windows
netstat -ano | findstr :3000
taskkill /PID <ID> /F

# En macOS/Linux
lsof -i :3000
kill -9 <PID>
```

---

## Contacto y Soporte

Para reportar bugs o sugerencias, contacta al equipo de Innovación en UANDES.
