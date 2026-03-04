# Modelo Relacional - Power BI ↔ App Next.js
## Diagrama Relacional

Diagrama de flujo relacional (proceso seguido en las imágenes):

```
Inicio -> Investigadores
       │
       │ (si no existe: crear `Investigadores` con PK: INV_ID / INV_N)
       |
       -> Instituciones
       │
       │ (si no existe: crear `Instituciones` con PK: INST_ID / INST_N)
       |
       ▼
    Proyectos (PK: PROY_ID / PROY_N)
       │
       ├─> Proy_Involucrados (PK: PROI_N)  // vincula PROI_NombreProyecto -> Proyectos.PROY_NombreProyecto
       ├─> Proy_Financiamiento (PK: PROF_N) // PROF_NombreProyecto -> Proyectos.PROY_NombreProyecto
       ├─> Proy_Reuniones (PK: PRR_N) // registro de reuniones por proyecto
       │
       ▼
   ¿Genera tecnología?
       ├─ Sí -> Tecnologia (PK: TECN_N / TECN_ID)
       │          │
       │          ├─> Tecn-MadurezTecnol (PK: TECT_N) // TRL/BRL/FRL
       │          ├─> PI / Legal (PK: LGL_N) // LGL_NombreProdAsoc -> TECN_NombreTecnologia / PROY_NombreProyecto
       │          ├─> Documentos (DOC_ID)
       │          ├─> Comunicaciones (COM_N)
       │          └─> Sustent (PK: SUST_N)
       │
       └─ No -> ├─> Documentos (DOC_ID)
                ├─> Comunicaciones (COM_N)
                |
                └─   Fin del proceso 

Adicionales:
- Com_Redes (PK: COM_N) para calcular indicadores de difusión, vinculación, etc. 
- EquipoInnovacion (PK: EQIN_N) // para vincular responsables de seguimiento técnico
- Indicadores-2025 (PK: IND_N) // para almacenar indicadores calculados
- Metas rectoria (PK: META_N) // para vincular indicadores con metas institucionales
- Incubadora-Aceleradora (PK: INC_N) // para vincular proyectos con incubadoras
```

---

## Columnas Clave por Tabla

### Investigadores
- **PK**: `INV_ID` (preferible)  ó `INV_N` (fallback)
- **Unique key / display**: `INV_NombreCompleto`
- **Datos**: `INV_Genero`, `INV_Facultad_Unidad`, `INV_Categoria`, `INV_EmailPrincipal`, `INV_EmailSecundario`

### Instituciones
- **PK**: `INST_ID` (preferible) ó `INST_N` (fallback)
- **Display / match**: `INST_NombreFantasia`
- **Datos**: `INST_Tipo`, `INST_Industria`, `INST_Region`

### Proyectos
- **PK**: `PROY_ID` (preferible) ó `PROY_N` (fallback)
- **Display**: `PROY_NombreProyecto`
- **FKs importantes**:
  - `PROY_InvestigadorLiderUANDES` → `Investigadores.INV_NombreCompleto`  
  - `PROY_Institucion` → `Instituciones.INST_NombreFantasia`
  - `PROY_NombreTecnologia` → `Tecnologia.TECN_NombreTecnologia`
- **Datos**: `PROY_AnoConvocatoria`, `PROY_Descripcion`, `PROY_Disciplina`, `PROY_Adjudicado`, `PROY_CodigoProyecto`

### Tecnologias
- **PK**: `TECN_ID` (recomendado) ó `TECN_N` (fallback)
- **Display**: `TECN_NombreTecnologia`
- **FKs**:
  - `TECN_NombreProyecto` -> `Proyectos.PROY_NombreProyecto`
- **Datos**: `TECN_Descripcion`, `TECN_Industria`, `TECN_ODS`, `TECN_ProdCateg`, `TECN_ProdSubcateg`

### Tecn-MadurezTecnol
- **PK**: `TECT_N`
- **FK**: `TECT_NombreTecnologia` -> `Tecnologia.TECN_NombreTecnologia`
- **Datos**: `TECT_Periodo`, `TECT_CRL`, `TECT_TRL`, `TECT_BRL`, `TECT_IPRL`, `TECT_TmRL`, `TECT_FRL`

### Legal_PI
- **PK**: `LGL_N`
- **FK**: `LGL_NombreProdAsoc` → `Tecnologia.TECN_NombreTecnologia`
- **FK**: `LGL_NombreProdAsoc` → `Proyectos.PROY_NombreProyecto`
- **Datos**: `LGL_NombrePI`, `LGL_CategPI`, `LGL_SubcatPI`, `LGL_NumSolicitud`, `LGL_FechaSolicitud`, `LGL_Estado`

### Legal_Doc
- **PK**: `DOC_ID`
- **FK**: `DOC_NombreProdAsoc` → `Tecnologia.TECN_NombreTecnologia`
- **FK**: `DOC_NombreProdAsoc` → `Proyectos.PROY_NombreProyecto`
- **Datos**: `DOC_Categ`, `DOC_Subcateg`, `DOC_TipoContrato`

### Proy_Involucrados
- **PK**: `PROI_N`
- **FKs**: `PROI_NombreProyecto` → `Proyectos.PROY_NombreProyecto`, `PROI_NombreInvolucrado` → `Investigadores.INV_NombreCompleto`, `PROI_InstInvolucrada` → `Instituciones.INST_nombreFantasia`
- **Datos**: `PROI_Rol_Invol`, `PROI_EsExterno`, `PROI_HrsAsignadas`, `PROI_NombreContacto`

### Proy_Financiamiento
- **PK**: `PROF_N`
- **FKs**: `PROF_NombreProyecto` → `Proyectos.PROY_NombreProyecto`, `PROF_InstitucReceptora` → `Instituciones.INST_nombreFantasia`
- **Datos**: `PROF_TipoFinanciamiento`, `PROF_InstitucionOtorgadoraFinanciamiento`, `PROF_FondoObtenido`, `PROF_DetalleFondo`

### Sustent
- **PK**: `SUST_N`
- **FK**: `SUST_NombreTecnologia` → `Tecnologia.TECN_NombreTecnologia`
- **Datos**: `SUST_FechaEvaluacion`, `SUST_TipoBien`, `SUST_TRLEstimado`, `SUST_EstrategPI`, `SUST_Estrategia`, `SUST_PresupNeces`

### Comunicaciones
- **PK**: `COM_N`
- **FKs**: `COM_NombreProdAsoc` → `Tecnologia.TECN_NombreTecnologia` / `Proyectos.PROY_NombreProyecto`, `COM_Vocero` → `Investigadores.INV_NombreCompleto`
- **Datos**: `COM_Titular`, `COM_TipoComun`, `COM_Fecha`, `COM_Link`
