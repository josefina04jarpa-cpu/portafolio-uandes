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

// Normalizar texto (similar a normalize.ts)
function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cargar datos
const proyectos = loadCSV('Proyectos.csv');
const equipo = loadCSV('EquipoInnovación.csv');

console.log('=== EQUIPO INNOVACIÓN ===');
console.log('\nNombres del equipo (normalizados):');
equipo.forEach(m => {
  console.log(`  "${m.Nombre}" → "${normalizeText(m.Nombre)}"`);
});

console.log('\n=== VALORES EN PROYECTOS ===');
console.log('\nValores únicos en PROY_ResponsableSeguimientoTecnico:');
const uniqueTech = [...new Set(proyectos.map(p => p.PROY_ResponsableSeguimientoTecnico).filter(Boolean))];
uniqueTech.forEach(val => {
  console.log(`  "${val}" → "${normalizeText(val)}"`);
});

console.log('\nValores únicos en PROY_ResponsablePostulacion:');
const uniquePost = [...new Set(proyectos.map(p => p.PROY_ResponsablePostulacion).filter(Boolean))];
uniquePost.forEach(val => {
  console.log(`  "${val}" → "${normalizeText(val)}"`);
});

// Crear mapa de nombres del equipo
const equipoMap = new Map();
equipo.forEach(m => {
  const normalized = normalizeText(m.Nombre);
  if (normalized) {
    equipoMap.set(normalized, m);
  }
});

console.log('\n=== MATCHING TEST ===');
console.log('\nProyectos con responsables que hacen match:');
let matchCount = 0;
let noMatchCount = 0;

proyectos.slice(0, 50).forEach(p => {
  const tech = normalizeText(p.PROY_ResponsableSeguimientoTecnico);
  const post = normalizeText(p.PROY_ResponsablePostulacion);
  
  const techMatch = equipoMap.has(tech);
  const postMatch = equipoMap.has(post);
  
  if (techMatch || postMatch) {
    matchCount++;
    console.log(`  ✓ "${p.PROY_NombreProyecto?.substring(0, 50)}..."`);
    if (techMatch) console.log(`    - Tech: "${p.PROY_ResponsableSeguimientoTecnico}"`);
    if (postMatch) console.log(`    - Post: "${p.PROY_ResponsablePostulacion}"`);
  } else {
    noMatchCount++;
    if (tech || post) {
      console.log(`  ✗ "${p.PROY_NombreProyecto?.substring(0, 50)}..."`);
      if (tech) console.log(`    - Tech: "${p.PROY_ResponsableSeguimientoTecnico}" → NO MATCH`);
      if (post) console.log(`    - Post: "${p.PROY_ResponsablePostulacion}" → NO MATCH`);
    }
  }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Proyectos con match: ${matchCount}`);
console.log(`Proyectos sin match: ${noMatchCount}`);
