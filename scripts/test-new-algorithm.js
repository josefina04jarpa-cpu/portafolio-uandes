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

function splitExecutiveCandidates(value) {
  return String(value || '')
    .split(/[\/|,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((candidate) => candidate.replace(/^\*+/, "").trim())
    .filter(Boolean);
}

// NEW IMPROVED ALGORITHM - EXACT MATCH ONLY
function resolveTeamMemberByCandidate(candidate, membersByName) {
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedCandidate) return [];

  // Only exact match - no fuzzy matching
  const direct = membersByName.get(normalizedCandidate);
  return direct ? [direct] : [];
}

function getExecutivesForProject(project, membersByName) {
  const technicalResponsible = String(project.PROY_ResponsableSeguimientoTecnico || "").trim();
  const postulationResponsible = String(project.PROY_ResponsablePostulacion || "").trim();
  
  const allCandidates = [
    ...splitExecutiveCandidates(technicalResponsible),
    ...splitExecutiveCandidates(postulationResponsible),
  ];

  const resolved = allCandidates
    .flatMap((candidate) => resolveTeamMemberByCandidate(candidate, membersByName));

  const uniqueByEmail = new Map();
  for (const member of resolved) {
    uniqueByEmail.set(member.Correo.toLowerCase(), member);
  }

  return Array.from(uniqueByEmail.values());
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

// Test con email específico
const testEmail = "kmarquez@uandes.cl";
const targetMember = equipo.find(m => m.Correo.toLowerCase() === testEmail.toLowerCase());

console.log('=== TEST FILTER CON NUEVO ALGORITMO ===');
console.log(`\nEmail de prueba: ${testEmail}`);
console.log(`Miembro encontrado: ${targetMember ? targetMember.Nombre : 'NO ENCONTRADO'}`);

// Filtrar proyectos para este ejecutivo
const filteredProjects = proyectos.filter(project => {
  const executives = getExecutivesForProject(project, membersByName);
  return executives.some(exec => exec.Correo.toLowerCase() === testEmail.toLowerCase());
});

console.log(`\n=== RESULTADO ===`);
console.log(`Total proyectos en CSV: ${proyectos.length}`);
console.log(`Proyectos para ${testEmail}: ${filteredProjects.length}`);

console.log(`\n=== TODOS LOS PROYECTOS DE KAREN ===`);
filteredProjects.forEach((p, idx) => {
  const tech = p.PROY_ResponsableSeguimientoTecnico;
  const post = p.PROY_ResponsablePostulacion;
  console.log(`${idx + 1}. ${p.PROY_NombreProyecto?.substring(0, 50)}...`);
  console.log(`   Código: ${p.PROY_CodigoProyecto || 'N/A'} | Año: ${p.PROY_AnoConvocatoria || 'N/A'}`);
  if (tech && tech !== 'N/A') console.log(`   ✓ Tech Resp: ${tech}`);
  if (post && post !== 'N/A') console.log(`   ✓ Post Resp: ${post}`);
  console.log('');
});

// Test con otros emails
console.log('\n=== TEST OTROS EJECUTIVOS ===');
const testEmails = [
  'rcacciuttolo@uandes.cl',
  'migonzalezm@uandes.cl',
  'cadonisr@uandes.cl',
  'sbecerra@uandes.cl'
];

testEmails.forEach(email => {
  const member = equipo.find(m => m.Correo.toLowerCase() === email.toLowerCase());
  const projects = proyectos.filter(project => {
    const executives = getExecutivesForProject(project, membersByName);
    return executives.some(exec => exec.Correo.toLowerCase() === email.toLowerCase());
  });
  
  console.log(`${email}: ${member ? member.Nombre : 'NO ENCONTRADO'} → ${projects.length} proyectos`);
});

// Test casos problemáticos
console.log('\n=== TEST CASOS PROBLEMÁTICOS ===');
const testCases = [
  'N/A',
  'Subdir. de Proyectos de Innovación',
  'Karen Andrea Márquez Escalona',
  'Ricardo Nicolás Cacciuttolo Núñez',
  'PROGAPSKINN2400'
];

testCases.forEach(testCase => {
  const matches = resolveTeamMemberByCandidate(testCase, membersByName);
  console.log(`"${testCase}" → ${matches.length} matches: ${matches.map(m => m.Nombre).join(', ') || 'NINGUNO'}`);
});
