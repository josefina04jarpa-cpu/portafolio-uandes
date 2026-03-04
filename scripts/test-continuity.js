const fs = require('fs');
const path = require('path');

// Cargar y parsear CSV
function loadCSV(filename) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(';').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(';');
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx]?.trim() || '';
    });
    return record;
  });
}

// Normalizar para matching
function normalizeRelationLabel(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Cargar datos
const proyectos = loadCSV('Proyectos.csv');

// Crear índice de proyectos por nombre
const nameToProjects = new Map();
const normalizedNameToProjects = new Map();

proyectos.forEach(p => {
  const nombre = p.PROY_NombreProyecto?.trim();
  if (!nombre) return;
  
  nameToProjects.set(nombre, p);
  
  const normalized = normalizeRelationLabel(nombre);
  if (normalized) {
    if (!normalizedNameToProjects.has(normalized)) {
      normalizedNameToProjects.set(normalized, []);
    }
    normalizedNameToProjects.get(normalized).push(p);
  }
});

console.log('=== TEST DE CONTINUIDAD DE PROYECTOS ===\n');

// Buscar proyectos con continuidad
const proyectosConContinuidad = proyectos.filter(p => {
  const anterior = p.PROY_ProyectoAnteriorContinuidad?.trim();
  return anterior && anterior !== 'N/A' && anterior !== '';
});

console.log(`Total proyectos: ${proyectos.length}`);
console.log(`Proyectos con continuidad definida: ${proyectosConContinuidad.length}\n`);

console.log('=== PROYECTOS CON CONTINUIDAD (primeros 20) ===\n');

let matchCount = 0;
let noMatchCount = 0;

proyectosConContinuidad.slice(0, 20).forEach((p, idx) => {
  const nombreActual = p.PROY_NombreProyecto?.substring(0, 50);
  const nombreAnterior = p.PROY_ProyectoAnteriorContinuidad;
  
  // Intentar resolver el nombre anterior
  let match = null;
  
  // Exact match
  if (nameToProjects.has(nombreAnterior)) {
    match = nameToProjects.get(nombreAnterior);
  } else {
    // Normalized match
    const normalized = normalizeRelationLabel(nombreAnterior);
    if (normalizedNameToProjects.has(normalized)) {
      const candidates = normalizedNameToProjects.get(normalized);
      if (candidates.length > 0) {
        match = candidates[0];
      }
    }
  }
  
  if (match) {
    matchCount++;
    console.log(`${idx + 1}. ✓ "${nombreActual}..."`);
    console.log(`   Código: ${p.PROY_CodigoProyecto || 'N/A'}`);
    console.log(`   →→→ Anterior: "${nombreAnterior}"`);
    console.log(`   ✓ Match encontrado: "${match.PROY_NombreProyecto}"`);
    console.log(`   ID Anterior: ${match.PROY_N || 'N/A'}`);
  } else {
    noMatchCount++;
    console.log(`${idx + 1}. ✗ "${nombreActual}..."`);
    console.log(`   →→→ Anterior: "${nombreAnterior}"`);
    console.log(`   ✗ NO SE ENCONTRÓ MATCH`);
  }
  console.log('');
});

console.log('=== RESUMEN ===');
console.log(`Matches exitosos: ${matchCount}`);
console.log(`Sin match: ${noMatchCount}`);

// Buscar cadenas de continuidad
console.log('\n=== CADENAS DE CONTINUIDAD (ejemplos) ===\n');

const cadenas = new Map();

proyectosConContinuidad.forEach(p => {
  const nombreAnterior = normalizeRelationLabel(p.PROY_ProyectoAnteriorContinuidad);
  const nombreActual = normalizeRelationLabel(p.PROY_NombreProyecto);
  
  // Identificar proyectos de la misma familia (mismo nombre base)
  const baseNameMatch = nombreActual.match(/^[\w\s]+/);
  if (baseNameMatch) {
    const baseName = baseNameMatch[0].trim();
    if (!cadenas.has(baseName)) {
      cadenas.set(baseName, []);
    }
    cadenas.get(baseName).push({
      nombre: p.PROY_NombreProyecto,
      año: p.PROY_AnoConvocatoria,
      anterior: p.PROY_ProyectoAnteriorContinuidad
    });
  }
});

let count = 0;
for (const [baseName, proyectos] of cadenas.entries()) {
  if (proyectos.length >= 2 && count < 5) {
    console.log(`Cadena: "${baseName}"`);
    proyectos.sort((a, b) => (a.año || '0') - (b.año || '0'));
    proyectos.forEach(proj => {
      console.log(`  - ${proj.nombre} (${proj.año || 'N/A'}) ← ${proj.anterior}`);
    });
    console.log('');
    count++;
  }
}
