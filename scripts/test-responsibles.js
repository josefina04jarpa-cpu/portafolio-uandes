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

console.log('=== TEST DE RESPONSABLES POR TIPO ===\n');

// Buscar proyectos con responsables diferenciados
let countBoth = 0;
let countOnlyPost = 0;
let countOnlyTech = 0;
let countNone = 0;

const examples = [];

proyectos.forEach(p => {
  const techResp = p.PROY_ResponsableSeguimientoTecnico || '';
  const postResp = p.PROY_ResponsablePostulacion || '';
  
  const techNorm = normalizeText(techResp);
  const postNorm = normalizeText(postResp);
  
  const hasTech = membersByName.has(techNorm);
  const hasPost = membersByName.has(postNorm);
  
  if (hasTech && hasPost) {
    countBoth++;
    if (examples.length < 10) {
      examples.push({
        nombre: p.PROY_NombreProyecto?.substring(0, 50),
        codigo: p.PROY_CodigoProyecto,
        techResp: techResp,
        postResp: postResp,
        type: 'both'
      });
    }
  } else if (hasTech) {
    countOnlyTech++;
  } else if (hasPost) {
    countOnlyPost++;
  } else {
    countNone++;
  }
});

console.log('=== RESUMEN ESTADÍSTICO ===');
console.log(`Total proyectos: ${proyectos.length}`);
console.log(`Con ambos responsables: ${countBoth}`);
console.log(`Solo con responsable técnico: ${countOnlyTech}`);
console.log(`Solo con responsable postulación: ${countOnlyPost}`);
console.log(`Sin responsables: ${countNone}`);

console.log('\n=== EJEMPLOS DE PROYECTOS CON AMBOS RESPONSABLES ===');
examples.forEach((ex, idx) => {
  console.log(`\n${idx + 1}. ${ex.nombre}...`);
  console.log(`   Código: ${ex.codigo || 'N/A'}`);
  console.log(`   Resp. Postulación: ${ex.postResp}`);
  console.log(`   Resp. Seguimiento Técnico: ${ex.techResp}`);
});

// Buscar casos donde el mismo ejecutivo está en ambos roles
console.log('\n=== EJECUTIVOS EN AMBOS ROLES (mismo proyecto) ===');
let countSamePerson = 0;

proyectos.forEach(p => {
  const techResp = p.PROY_ResponsableSeguimientoTecnico || '';
  const postResp = p.PROY_ResponsablePostulacion || '';
  
  const techNorm = normalizeText(techResp);
  const postNorm = normalizeText(postResp);
  
  if (techNorm && postNorm && techNorm === postNorm) {
    countSamePerson++;
    if (countSamePerson <= 5) {
      console.log(`\n${countSamePerson}. ${p.PROY_NombreProyecto?.substring(0, 50)}...`);
      console.log(`   Ejecutivo: ${techResp}`);
      console.log(`   (En ambos roles)`);
    }
  }
});

console.log(`\nTotal proyectos con misma persona en ambos roles: ${countSamePerson}`);
