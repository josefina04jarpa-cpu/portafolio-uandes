# Portafolio UANDES

Aplicación web institucional para explorar el portafolio de Innovación UANDES.

## Qué hace la app hoy

- Catálogo de **tecnologías**, **proyectos**, **investigadores** e **instituciones**.
- Sección de **indicadores** con contenido público (Metas de Rectoría) y contenido privado (indicadores internos).
- **Mi perfil** para ejecutivos del equipo, con datos cargados desde CSV y proyectos asignados.
- Fichas de detalle con asociaciones entre entidades (proyecto ↔ tecnología ↔ investigador ↔ institución).

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- `csv-parse` para lectura de CSV

<<<<<<< HEAD
## Ejecución
=======
## Imágenes en OneDrive (para aliviar Vercel)

El proyecto ya está preparado para consumir imágenes remotas desde OneDrive y evitar la optimización de imágenes en Vercel.
- `csv-parse` para lectura de CSV

## Imágenes en OneDrive (para aliviar Vercel)

El proyecto ya está preparado para consumir imágenes remotas desde OneDrive y evitar la optimización de imágenes en Vercel.

### 1) Subir imágenes a OneDrive

- Sube tus imágenes a una carpeta compartida de OneDrive.
- Comparte cada archivo con permiso de lectura pública ("Cualquier persona con el vínculo").

### 2) Usar links en los datos

- En columnas de imágenes (por ejemplo miniaturas en comunicaciones), pega el link compartido de OneDrive (`1drv.ms` o `onedrive.live.com`).
- La app convierte automáticamente ese link a una URL directa descargable (`api.onedrive.com`) para que renderice correctamente.

### 3) (Opcional) Reemplazar imágenes locales por una base remota

Si quieres mover también imágenes que hoy están en `public/` (logo, banners, fotos por nombre), define:

```bash
NEXT_PUBLIC_ONEDRIVE_IMAGES_BASE_URL=https://TU_BASE_REMOTA
```

Con esa variable, cualquier ruta local tipo `/logo-innovacion.png` se resolverá contra esa base remota.

> Nota: para fotos por nombre (equipo/investigadores), conserva nombres de archivo consistentes para que el matching siga funcionando.

## Ejecución

```bash
npm install
npm run dev
```

Producción:

```bash
npm run build
npm run start
```

## Importar CSV desde Excel

Cuando recibas un archivo Excel (con múltiples hojas), puedes convertirlo a CSV para alimentar `data/`.

1. Instala dependencia (solo si no está instalada):

```bash
npm install -D xlsx
```

2. Ejecuta el conversor:

```bash
npm run tools:excel-to-csv -- "C:\ruta\archivo.xlsx"
```

3. Resultado:

- Se generan archivos `data/<NombreHoja>.csv`.
- Delimitador de salida: `;`.
- Si existe una tabla Excel con el mismo nombre que la hoja, se exporta ese rango (evita ruido fuera de tabla).

Notas:

- El script ignora hojas `Codebook`, `Inicio` y hojas que comienzan con `tbl_`.
- Antes de reemplazar datos productivos, valida nombres de hoja y encabezados esperados por los módulos en `lib/`.

## Secciones de la aplicación

### Inicio (`/`)

- Landing con accesos a **Portafolio** e **Indicadores**.

### Portafolio (`/portafolio`)

Panel de entrada al catálogo con conteos de:

- Investigadores
- Tecnologías
- Instituciones
- Proyectos

Subsecciones principales:

- **Investigadores** (`/portafolio/investigadores`): directorio por nombre, facultad/unidad y correo.
- **Proyectos** (`/portafolio/proyectos`): listado por título, disciplina, investigador y estado de adjudicación.
- **Tecnologías** (`/portafolio/tecnologias`): dashboard con distribución por facultad, TRL y liderazgo.
- **Instituciones** (`/instituciones`): catálogo por tipo, industria y región.

Fichas de detalle:

- **Tecnología** (`/portafolio/tecnologias/[id]`): resumen, TRL histórico, PI relacionada, asociaciones y exportación PDF.
- **Proyecto** (`/portafolio/proyectos/[id]`): resumen, tecnologías/investigadores/instituciones asociadas, apariciones en comunicaciones, ejecutivos responsables.
- **Investigador** (`/portafolio/investigadores/[id]`): resumen, proyectos/tecnologías asociadas, apariciones y PI vinculada.
- **Institución** (`/instituciones/[id]`): resumen y asociaciones por proyectos/tecnologías.

### Indicadores (`/indicadores`, `/indicadores/2024`)

- **Público**: tabla de Metas de Rectoría desde `Metas Rectoria 2026.csv`.
- **Privado** (requiere sesión): dashboard de indicadores internos desde `indicadores-<año>.csv`.
- Submenú de **Subdirecciones** (`/indicadores/subdirecciones`) con vistas por área:
  - Subdirección de Proyectos
  - Desarrollo Tecnológico y Comercialización
  - Asuntos Jurídicos
  - Comunicaciones
  - Emprendimiento
  - Proyecto BiCI

### Mi perfil (`/mi-perfil`)

- Requiere sesión.
- Muestra nombre, cargo, área, correo y foto del integrante del equipo.
- Lista proyectos donde la persona aparece como:
  - `PROY_ResponsablePostulacion`
  - `PROY_ResponsableSeguimientoTecnico`

### Ingreso (`/ingresar`)

- Login por correo autorizado + contraseña de equipo.
- Cookie firmada (`uandes_indicadores_session`) para acceso a contenido privado.

## Fuente de datos (CSV)

La app lee archivos CSV desde `data/` en servidor (build/render).

### CSV usados por la aplicación

1. `tecnologias.csv`
   - Catálogo base de tecnologías.
   - Campos usados: `TECN_ID`/`TECN_N`, `TECN_NombreTecnologia`, `TECN_NombreProyecto`, `TECN_Descripcion`, `TECN_Investigadores`, categorías de producto.

2. `Proyectos.csv`
   - Catálogo base de proyectos.
   - Campos usados: `PROY_ID`/`PROY_N`/`PROY_CodigoProyecto`, `PROY_NombreProyecto`, `PROY_Descripcion`, `PROY_InvestigadorLiderUANDES`, `PROY_Adjudicado`, responsables, continuidad.

3. `Investigadores.csv`
   - Directorio de investigadores.
   - Campos usados: `INV_ID`/`INV_N`, `INV_NombreCompleto`, `INV_Facultad_Unidad`, correos.

4. `Instituciones.csv`
   - Catálogo de instituciones colaboradoras.
   - Campos usados: `INST_ID`/`INST_N`, `INST_NombreFantasia`/`INST_RazonSocial`, `INST_Tipo`, `INST_Industria`, `INST_Region`.

5. `EquipoInnovación.csv`
   - Base del equipo interno para autenticación/perfil/subdirecciones.
   - Campos usados: `Nombre`, `Cargo`, `Area`, `AreaEstrategica`, `Correo`, `JerarquiaArea`.

6. `Comunicaciones.csv`
   - Apariciones, publicaciones y métricas de difusión.
   - Campos usados: `COM_Titular`, `COM_TipoComun`, `COM_TipoMedio`, `COM_Medio`, `COM_Fecha`, `COM_Vocero`, `COM_NombreProdAsoc`, métricas (`COM_Impresiones`, `COM_Alcance`, etc.).

7. `Tecn-MadurezTecnol.csv`
   - Historial de madurez por tecnología.
   - Campos usados: `TECT_NombreTecnologia`, `TECT_Periodo`, `TECT_TRL`, `TECT_CRL`, `TECT_BRL`, `TECT_IPRL`, `TECT_TmRL`, `TECT_FRL`.

8. `Legal_PI.csv`
   - Propiedad intelectual asociada a tecnologías/proyectos.
   - Campos usados: `LGL_NombrePI`, `LGL_TipoProdAsoc`, `LGL_NombreProdAsoc`, `LGL_CreadoresUANDES`, `LGL_Estado`, fechas y datos de solicitud/registro.

9. `Legal_Doc.csv`
   - Documentación legal asociada a productos/proyectos.
   - Campos usados: `DOC_AsocProducto`, `DOC_NombreProdAsoc`, tipo/categoría de contrato, estado y montos.

10. `Proy-Financiamiento.csv`
    - Financiamiento por proyecto e institución receptora.
    - Campos usados: `PROF_NombreProyecto`, `PROF_InstitucReceptora`, tipo de financiamiento, montos.

11. `Proy-Involucrados.csv`
    - Participantes vinculados a proyectos.
    - Campos usados: `PROI_NombreProyecto`, `PROI_NombreInvolucrado`, `PROI_InstInvolucrada`, rol/horas/fechas.

12. `Metas Rectoria 2026.csv`
    - Metas y cumplimiento por ámbito/concepto para indicadores públicos.

13. `Empren-Incubadora.csv`
    - Iniciativas de incubación/emprendimiento para tarjetas y métricas de subdirección.

14. `indicadores-2024.csv`, `indicadores-2025.csv`, etc. (patrón `indicadores-<año>.csv`)
    - Indicadores internos por año.
    - Se consumen solo para usuarios autenticados.
    - Si el archivo no existe, la app devuelve lista vacía (sin romper).

### CSV presentes pero no consumidos por la app (actualmente)

- `Com-Seguidores.csv`
- `Pagos_PI.csv`
- `Proy-Controlling.csv`
- `Proy-Reuniones.csv`
- `Sustentabilidad.csv`

## Relaciones entre CSV (implementadas en código)

### Relaciones principales usadas para asociaciones automáticas

1. **Proyecto → Investigador**
   - `Proyectos.PROY_InvestigadorLiderUANDES` ↔ `Investigadores.INV_NombreCompleto`

2. **Proyecto → Tecnología**
   - `Proyectos.PROY_NombreTecnologia` ↔ `tecnologias.TECN_NombreTecnologia`

3. **Tecnología → Proyecto**
   - `tecnologias.TECN_NombreProyecto` ↔ `Proyectos.PROY_NombreProyecto`

4. **Proyecto ↔ Proyecto (continuidad)**
   - `Proyectos.PROY_ProyectoAnteriorContinuidad` ↔ `Proyectos.PROY_NombreProyecto`
   - La relación se guarda bidireccional (actual y anterior se conectan entre sí).

### Relaciones auxiliares usadas en vistas de detalle/validación

5. **TRL por tecnología**
   - `Tecn-MadurezTecnol.TECT_NombreTecnologia` ↔ `tecnologias.TECN_NombreTecnologia`

6. **Legal PI por tecnología/proyecto**
   - `Legal_PI.LGL_NombreProdAsoc` ↔ nombres de `tecnologias` o `Proyectos`

7. **Legal Doc por tecnología/proyecto**
   - `Legal_Doc.DOC_NombreProdAsoc` ↔ nombres de `tecnologias` o `Proyectos`

8. **Financiamiento por proyecto/institución**
   - `Proy-Financiamiento.PROF_NombreProyecto` ↔ `Proyectos.PROY_NombreProyecto`
   - `Proy-Financiamiento.PROF_InstitucReceptora` ↔ `Instituciones.INST_NombreFantasia`

9. **Involucrados por proyecto/investigador/institución**
   - `Proy-Involucrados.PROI_NombreProyecto` ↔ `Proyectos.PROY_NombreProyecto`
   - `Proy-Involucrados.PROI_NombreInvolucrado` ↔ `Investigadores.INV_NombreCompleto`
   - `Proy-Involucrados.PROI_InstInvolucrada` ↔ `Instituciones.INST_NombreFantasia`

10. **Comunicaciones por vocero/producto**
    - `Comunicaciones.COM_Vocero` ↔ investigadores
    - `Comunicaciones.COM_NombreProdAsoc` ↔ proyectos o tecnologías

11. **Perfil ejecutivo (Mi perfil)**
    - `EquipoInnovación.Nombre/Correo` ↔ responsables en `Proyectos`:
      - `PROY_ResponsablePostulacion`
      - `PROY_ResponsableSeguimientoTecnico`

> Las coincidencias de nombres se hacen con normalización de texto (acentos, mayúsculas/minúsculas y puntuación), y en perfiles ejecutivos se exige coincidencia exacta normalizada para evitar falsos positivos.

## Autenticación y variables de entorno

Variables soportadas:

- `AUTH_SECRET` o `NEXTAUTH_SECRET`: firma de sesión.
- `INDICADORES_TEAM_PASSWORD` o `INDICADORES_PASSWORD`: contraseña del formulario de ingreso.

Si no se configuran, existen valores por defecto de desarrollo definidos en código.

## Notas de implementación

- La app usa Server Components para carga de datos en servidor.
- Los CSV se leen desde `data/` y se normalizan en módulos de `lib/`.
- La disponibilidad de indicadores internos depende del archivo `indicadores-<año>.csv` y de sesión activa.