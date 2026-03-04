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

// Normalizar texto
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

// Crear mapa de miembros del equipo
const membersByName = new Map();
equipo.forEach(member => {
  const normalized = normalizeText(member.Nombre);
  if (normalized) {
    membersByName.set(normalized, member);
  }
});

const karenNormalized = normalizeText("Karen Andrea Márquez Escalona");

console.log('=== ANÁLISIS DE FALSOS POSITIVOS ===');
console.log(`\nNombre normalizado de Karen: "${karenNormalized}"`);

// Buscar proyectos donde NO está Karen pero el fuzzy match lo incluye
const problematicos = [];

proyectos.forEach(p => {
  const tech = normalizeText(p.PROY_ResponsableSeguimientoTecnico);
  const post = normalizeText(p.PROY_ResponsablePostulacion);
  
  // Karen NO está directamente en tech ni post
  const karenDirectTech = tech === karenNormalized;
  const karenDirectPost = post === karenNormalized;
  
  if (!karenDirectTech && !karenDirectPost) {
    // Pero veamos si el fuzzy match incluye a Karen
    let fuzzyMatch = false;
    
    // Check if tech or post would fuzzy match Karen
    if (tech && (tech.includes(karenNormalized) || karenNormalized.includes(tech))) {
      fuzzyMatch = true;
    }
    if (post && (post.includes(karenNormalized) || karenNormalized.includes(post))) {
      fuzzyMatch = true;
    }
    
    // Check if tech or post directly match any team member
    const techDirectMatch = membersByName.has(tech);
    const postDirectMatch = membersByName.has(post);
    
    if (fuzzyMatch || !techDirectMatch ||!postDirectMatch) {
      problematicos.push({
        nombre: p.PROY_NombreProyecto,
        tech: p.PROY_ResponsableSeguimientoTecnico,
        post: p.PROY_ResponsablePostulacion,
        techNorm: tech,
        postNorm: post,
        techDirectMatch,
        postDirectMatch,
        fuzzyMatch
      });
    }
  }
});

console.log(`\n=== PROYECTOS PROBLEMÁTICOS (primeros 30) ===`);
problematicos.slice(0, 30).forEach((p, idx) => {
  console.log(`\n${idx + 1}. ${p.nombre?.substring(0, 60)}...`);
  console.log(`   Tech: "${p.tech}" [${p.techNorm}] - Direct: ${p.techDirectMatch}`);
  console.log(`   Post: "${p.post}" [${p.postNorm}] - Direct: ${p.postDirectMatch}`);
  console.log(`   Fuzzy match con Karen: ${p.fuzzyMatch}`);
});

console.log(`\n=== RESUMEN ===`);
console.log(`Total proyectos problemáticos: ${problematicos.length}`);

// Analizar valores que NO hacen match con nadie
const valoresNoMatch = new Set();
proyectos.forEach(p => {
  const tech = normalizeText(p.PROY_ResponsableSeguimientoTecnico);
  const post = normalizeText(p.PROY_ResponsablePostulacion);
  
  if (tech && !membersByName.has(tech)) {
    valoresNoMatch.add(p.PROY_ResponsableSeguimientoTecnico);
  }
  if (post && !membersByName.has(post)) {
    valoresNoMatch.add(p.PROY_ResponsablePostulacion);
  }
});

console.log(`\n=== VALORES QUE NO HACEN MATCH CON EQUIPO ===`);
Array.from(valoresNoMatch).sort().forEach(val => {
  const normalized = normalizeText(val);
  console.log(`  "${val}" → "${normalized}"`);
});
