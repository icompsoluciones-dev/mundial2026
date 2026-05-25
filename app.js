// Global variables
let worldCupData = null;
let selectedTeam = null;
let currentView = 'timeline'; // 'timeline' or 'bracket'
let simulationMode = 'favorites';

// Popular teams for quick tags
const POPULAR_TEAMS = ["FRANCIA", "ARGENTINA", "BRASIL", "ESPAÑA", "ALEMANIA", "INGLATERRA", "PORTUGAL", "PAÍSES BAJOS", "BÉLGICA"];

// DOM elements cache
const elSearch = document.getElementById('team-search');
const elClearSearch = document.getElementById('clear-search-btn');
const elSuggestions = document.getElementById('autocomplete-list');
const elPopularTags = document.getElementById('popular-tags-container');
const elDashboard = document.getElementById('dashboard-wrapper');
const elSelectedFlag = document.getElementById('selected-team-flag');
const elSelectedName = document.getElementById('selected-team-name');
const elSelectedGroup = document.getElementById('selected-team-group-letter');
const elSelectedStanding = document.getElementById('selected-team-standing');
const elSelectedRank = document.getElementById('selected-team-rank-val');
const elLogicSelect = document.getElementById('simulation-logic');

const elTimelineView = document.getElementById('view-content-timeline');
const elBracketView = document.getElementById('view-content-bracket');
const elTimelineSteps = document.getElementById('timeline-steps');
const elBracketStructure = document.getElementById('bracket-structure');

const elGroupsHeader = document.getElementById('groups-header');
const elGroupsContent = document.getElementById('groups-content');
const elGroupsGrid = document.getElementById('groups-grid-container');
const elThirdsTbody = document.getElementById('thirds-tbody');
const elFourthTbody = document.getElementById('fourth-tbody');

// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
  fetchData();
  setupEventListeners();
  setupAnalyticsTracking();
});

// Fetch pre-calculated data JSON
async function fetchData() {
  try {
    const response = await fetch('mundial2026-data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    worldCupData = await response.json();

    // Populate static widgets
    populatePopularTags();
    populateGroupsUI();

    // Select default team on load (or show nothing, let's load FRANCIA as default highlight to show off)
    selectTeam("FRANCIA");
  } catch (error) {
    console.error("Failed to fetch world cup data:", error);
    // Display error message to user
    document.querySelector('.main-content').innerHTML = `
      <div class="Card" style="text-align: center; border-color: #ef4444;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
        <h2 style="color: #fff; margin-bottom: 10px;">Error al cargar datos</h2>
        <p style="color: #9ca3af;">No se pudo cargar el archivo mundial2026-data.json. Por favor, asegúrate de que el servidor local está activo.</p>
      </div>
    `;
  }
}

// Setup listeners
function setupEventListeners() {
  // Autocomplete search input
  elSearch.addEventListener('input', handleSearchInput);
  elSearch.addEventListener('focus', () => {
    if (elSearch.value.trim().length > 0) {
      elSuggestions.classList.remove('hidden');
    }
  });

  // Clear search button
  elClearSearch.addEventListener('click', () => {
    elSearch.value = '';
    elSuggestions.classList.add('hidden');
    elClearSearch.style.display = 'none';
    elSearch.focus();
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      elSuggestions.classList.add('hidden');
    }
  });

  // Keyboard navigation for suggestions
  elSearch.addEventListener('keydown', handleSearchKeys);

  // Accordion for groups summary
  elGroupsHeader.addEventListener('click', () => {
    const isHidden = elGroupsContent.classList.contains('hidden');
    if (isHidden) {
      elGroupsContent.classList.remove('hidden');
      elGroupsHeader.classList.add('open');
    } else {
      elGroupsContent.classList.add('hidden');
      elGroupsHeader.classList.remove('open');
    }
  });

  // Logic mode selector
  elLogicSelect.addEventListener('change', (e) => {
    simulationMode = e.target.value;
    if (selectedTeam) selectTeam(selectedTeam);
  });
}

// Track contact clicks for conversions
function setupAnalyticsTracking() {
  // Seleccionamos los enlaces de contacto
  const contactLinks = document.querySelectorAll('a[href*="icompsoluciones-dev.github.io"]');

  contactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Determinamos si es el link del footer o el botón principal
      const location = link.classList.contains('btn-glow') ? 'cta_main_button' : 'footer_link';

      // Enviamos el evento a Google Analytics
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          'event_category': 'engagement',
          'event_label': 'Contact Click',
          'contact_location': location,
          'method': 'outbound_link'
        });
        console.log('Conversion event sent: generate_lead from ' + location);
      }
    });
  });
}

// Generate unique deterministic color gradients for team placeholders
function getTeamGradient(teamName) {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 75%, 42%) 0%, hsl(${h2}, 85%, 26%) 100%)`;
}

// Populate popular tags UI
function populatePopularTags() {
  elPopularTags.innerHTML = '';
  POPULAR_TEAMS.forEach(team => {
    if (worldCupData.teams[team]) {
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.innerHTML = `
        <span class="flag-placeholder" style="background: ${getTeamGradient(team)}">${team.substring(0, 2)}</span>
        <span>${team}</span>
      `;
      tag.addEventListener('click', () => {
        elSearch.value = team;
        selectTeam(team);
      });
      elPopularTags.appendChild(tag);
    }
  });
}

// Dynamic group stage simulation based on criteria and plot armor
function applyGroupStageSimulation() {
  if (!worldCupData) return;

  // 1. Sort teams in each group based on simulation mode
  Object.keys(worldCupData.groups).forEach(groupLetter => {
    let teams = [...worldCupData.groups[groupLetter]];

    if (simulationMode === 'favorites') {
      teams.sort((a, b) => a.rank - b.rank);
    } else if (simulationMode === 'underdogs') {
      // Ordenamos por favoritos (1ro a 4to por ranking)
      teams.sort((a, b) => a.rank - b.rank);
      // Aplicamos la "Sorpresa" intercambiando el 3ero y 4to puesto
      [teams[2], teams[3]] = [teams[3], teams[2]];
    } else if (simulationMode === 'random') {
      // Para evitar resultados absurdos (como España/Portugal eliminados siendo 4tos),
      // ordenamos por ranking y barajamos solo los 3 primeros puestos.
      // El 4to equipo (el más débil) permanece al fondo.
      teams.sort((a, b) => a.rank - b.rank);
      const top3 = teams.slice(0, 3).sort(() => Math.random() - 0.5);
      teams = [...top3, teams[3]];
    } else if (simulationMode === 'realistic') {
      // Agregamos un factor de "suerte" de +/- 10 puntos al ranking.
      // Esto permite que equipos cercanos en nivel roten posiciones.
      teams.sort((a, b) => (a.rank + (Math.random() * 20 - 10)) - (b.rank + (Math.random() * 20 - 10)));
    }

    // Plot Armor: Ensure selected team always qualifies (Top 2 for bracket logic)
    if (selectedTeam) {
      const sIdx = teams.findIndex(t => t.name === selectedTeam);
      if (sIdx > 1) {
        const [team] = teams.splice(sIdx, 1);
        teams.splice(1, 0, team); // Move to 2nd place
      }
    }

    // Update simulated standings
    teams.forEach((t, i) => t.standing = i + 1);
    worldCupData.groups[groupLetter] = teams;
  });

  // 2. Recalculate Third Place Rankings for the summary UI
  const allThirds = [];
  Object.keys(worldCupData.groups).forEach(g => {
    allThirds.push({ group: g, team: worldCupData.groups[g][2] });
  });

  if (simulationMode === 'favorites') {
    allThirds.sort((a, b) => a.team.rank - b.team.rank);
  } else if (simulationMode === 'underdogs') {
    allThirds.sort((a, b) => b.team.rank - a.team.rank);
  } else if (simulationMode === 'realistic') {
    // En modo realista, una vez definidos los 3eros, clasifican los de mejor ranking puro
    allThirds.sort((a, b) => a.team.rank - b.team.rank);
  } else {
    allThirds.sort(() => Math.random() - 0.5);
  }

  allThirds.forEach((item, i) => {
    item.overallOrder = i + 1;
    item.qualified = i < 8;
  });

  worldCupData.thirdPlaceRankings = allThirds;
}

// Populate collapsible group standings and thirds table
function populateGroupsUI() {
  // 1. Group cards
  elGroupsGrid.innerHTML = '';
  const sortedGroupKeys = Object.keys(worldCupData.groups).sort();

  // Calcular resumen de eliminados para claridad del usuario
  let count4thPlaced = 0;
  Object.values(worldCupData.groups).forEach(group => {
    if (group.some(t => t.standing === 4)) count4thPlaced++;
  });

  const eliminated3rd = worldCupData.thirdPlaceRankings.filter(t => !t.qualified).length;
  const totalEliminated = count4thPlaced + eliminated3rd;

  const elSummaryText = document.getElementById('summary-elimination-text');
  if (elSummaryText) {
    elSummaryText.innerHTML = `
      Según el reglamento, avanzan los dos mejores de cada grupo y los 8 mejores terceros. 
      <br><span style="color: var(--accent-gold); font-weight: 600;">Resumen de eliminación:</span> Quedan fuera <strong>${totalEliminated} selecciones</strong> en total (${count4thPlaced} colistas de grupo + ${eliminated3rd} peores terceros).
    `;
  }

  sortedGroupKeys.forEach(groupLetter => {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';

    let html = `<h5>Grupo ${groupLetter}</h5>`;
    worldCupData.groups[groupLetter].forEach(team => {
      const isQualified = team.standing <= 2 || isThirdQualified(team.name);
      const isSelected = selectedTeam === team.name;

      html += `
        <div class="group-card-team ${isSelected ? 'selected-highlight' : ''}">
          <div class="group-team-info">
            <span class="standing-num">${team.standing}</span>
            <span class="flag-placeholder" style="background: ${getTeamGradient(team.name)}">${team.name.substring(0, 2)}</span>
            <span class="group-team-name" style="color: ${isQualified ? '#fff' : 'var(--text-muted)'}">${team.name}</span>
          </div>
          <span class="group-team-rank-meta">#${team.rank}</span>
        </div>
      `;
    });

    groupCard.innerHTML = html;
    elGroupsGrid.appendChild(groupCard);
  });

  // 2. Third-placed standings table
  elThirdsTbody.innerHTML = '';
  worldCupData.thirdPlaceRankings.forEach(item => {
    const tr = document.createElement('tr');
    if (selectedTeam === item.team.name) {
      tr.style.background = 'rgba(16, 185, 129, 0.08)';
    }
    tr.innerHTML = `
      <td>${item.overallOrder}</td>
      <td style="font-weight: 600;">Grupo ${item.group}</td>
      <td style="display: flex; align-items: center; gap: 8px;">
        <span class="flag-placeholder" style="background: ${getTeamGradient(item.team.name)}">${item.team.name.substring(0, 2)}</span>
        <span style="color: #fff; font-weight: 500;">${item.team.name}</span>
      </td>
      <td>#${item.team.rank}</td>
      <td>
        <span class="status-badge ${item.qualified ? 'qualified' : 'eliminated'}">
          ${item.qualified ? 'Clasificado' : 'Eliminado'}
        </span>
      </td>
    `;
    elThirdsTbody.appendChild(tr);
  });

  // 3. Fourth-placed eliminated teams table
  if (elFourthTbody) {
    elFourthTbody.innerHTML = '';
    const fourthPlacedTeams = [];
    Object.keys(worldCupData.groups).forEach(g => {
      const team4 = worldCupData.groups[g].find(t => t.standing === 4);
      if (team4) fourthPlacedTeams.push({ group: g, ...team4 });
    });

    fourthPlacedTeams.sort((a, b) => a.group.localeCompare(b.group)).forEach(item => {
      const tr = document.createElement('tr');
      if (selectedTeam === item.name) tr.style.background = 'rgba(239, 68, 68, 0.08)';
      tr.innerHTML = `
        <td style="font-weight: 600;">Grupo ${item.group}</td>
        <td style="display: flex; align-items: center; gap: 8px;">
          <span class="flag-placeholder" style="background: ${getTeamGradient(item.name)}">${item.name.substring(0, 2)}</span>
          <span style="color: #fff; font-weight: 500;">${item.name}</span>
        </td>
        <td>#${item.rank}</td>
        <td><span class="status-badge eliminated">Eliminado</span></td>
      `;
      elFourthTbody.appendChild(tr);
    });
  }
}
function isThirdQualified(teamName) {
  const found = worldCupData.thirdPlaceRankings.find(item => item.team.name === teamName);
  return found ? found.qualified : false;
}

// Handle real-time input in autocomplete search
function handleSearchInput() {
  const val = elSearch.value.trim().toUpperCase();
  if (val.length === 0) {
    elSuggestions.classList.add('hidden');
    elClearSearch.style.display = 'none';
    return;
  }

  elClearSearch.style.display = 'block';

  // Filter matches
  const matches = Object.keys(worldCupData.teams).filter(t => t.includes(val) || worldCupData.teams[t].mappedName.toUpperCase().includes(val));

  if (matches.length === 0) {
    elSuggestions.innerHTML = '<div style="padding: 12px 18px; color: var(--text-muted); font-size: 0.9rem;">No se encontraron selecciones</div>';
    elSuggestions.classList.remove('hidden');
    return;
  }

  elSuggestions.innerHTML = '';
  matches.forEach(match => {
    const info = worldCupData.teams[match];
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.innerHTML = `
      <div class="suggestion-left">
        <span class="flag-placeholder" style="background: ${getTeamGradient(match)}">${match.substring(0, 2)}</span>
        <span class="suggestion-name">${match}</span>
        <span class="suggestion-group">Grupo ${info.group}</span>
      </div>
      <span class="suggestion-rank">Rank: #${info.rank}</span>
    `;

    div.addEventListener('click', () => {
      elSearch.value = match;
      selectTeam(match);
      elSuggestions.classList.add('hidden');
    });

    elSuggestions.appendChild(div);
  });

  elSuggestions.classList.remove('hidden');
}

// Handle suggestion keys
let activeSuggestionIdx = -1;
function handleSearchKeys(e) {
  const items = elSuggestions.querySelectorAll('.suggestion-item');
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeSuggestionIdx = (activeSuggestionIdx + 1) % items.length;
    highlightSuggestion(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeSuggestionIdx = (activeSuggestionIdx - 1 + items.length) % items.length;
    highlightSuggestion(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeSuggestionIdx > -1 && activeSuggestionIdx < items.length) {
      items[activeSuggestionIdx].click();
    } else if (items.length > 0) {
      items[0].click();
    }
  } else if (e.key === 'Escape') {
    elSuggestions.classList.add('hidden');
  }
}

function highlightSuggestion(items) {
  items.forEach((item, idx) => {
    if (idx === activeSuggestionIdx) {
      item.style.background = 'rgba(255, 255, 255, 0.08)';
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.style.background = '';
    }
  });
}

// Select team and refresh views
function selectTeam(teamName) {
  if (!worldCupData || !worldCupData.teams[teamName]) return;

  selectedTeam = teamName;
  activeSuggestionIdx = -1;

  // Recalculate group standings based on simulation criteria
  applyGroupStageSimulation();

  const info = worldCupData.teams[teamName];

  // Find initial standing in group
  const groupTeams = worldCupData.groups[info.group];
  const standingObj = groupTeams.find(t => t.name === teamName);
  const standingStr = standingObj ? `${standingObj.standing}°` : '3°';

  // Update header info
  elSelectedFlag.style.background = getTeamGradient(teamName);
  elSelectedFlag.innerText = teamName.substring(0, 2);
  elSelectedName.innerText = teamName;
  elSelectedGroup.innerText = info.group;
  elSelectedStanding.innerText = standingStr;
  elSelectedRank.innerText = `#${info.rank}`;

  elDashboard.classList.remove('hidden');

  // Refresh UI panels
  renderTimeline();
  renderBracket();
  populateGroupsUI(); // To highlight in the group table
}

// Switch between Timeline and Bracket views
function switchView(viewName) {
  currentView = viewName;

  const btnTimeline = document.getElementById('tab-timeline');
  const btnBracket = document.getElementById('tab-bracket');

  if (viewName === 'timeline') {
    btnTimeline.classList.add('active');
    btnBracket.classList.remove('active');
    elTimelineView.classList.remove('hidden');
    elBracketView.classList.add('hidden');
  } else {
    btnTimeline.classList.remove('active');
    btnBracket.classList.add('active');
    elTimelineView.classList.add('hidden');
    elBracketView.classList.remove('hidden');
  }
}

// Helper to extract the dynamic path of the selected team from the simulation
function getDynamicPathFromSim(sim) {
  const path = [];
  const rounds = [
    { key: 'R32', label: 'Dieciseisavos de Final' },
    { key: 'O', label: 'Octavos de Final' },
    { key: 'C', label: 'Cuartos de Final' },
    { key: 'S', label: 'Semifinal' },
    { key: 'F', label: 'Final' }
  ];

  rounds.forEach(r => {
    const matches = r.key === 'F' ? { "F": sim.F } : sim[r.key];
    for (const key in matches) {
      const match = matches[key];
      if (match.t1.name === selectedTeam || match.t2.name === selectedTeam) {
        const opponent = match.t1.name === selectedTeam ? match.t2 : match.t1;
        path.push({
          round: r.label,
          matchLabel: match.label || r.label,
          opponent: opponent.name,
          opponentRank: opponent.rank,
          opponentGroup: opponent.group,
          date: match.date,
          time: match.time || "20:00 hs",
          day: match.day || "SÁBADO"
        });
      }
    }
  });
  return { path };
}

// Render the timeline (path) view
function renderTimeline() {
  elTimelineSteps.innerHTML = '';
  const simulation = getDynamicPathFromSim(runDynamicSimulation());
  const hasQualified = simulation.path.length > 0;

  // 1. Group Stage Card
  const groupCard = document.createElement('div');
  groupCard.className = 'timeline-step animate-slide-up';
  groupCard.innerHTML = `
    <div class="timeline-marker"><i class="fa-solid fa-flag"></i></div>
    <div class="timeline-content">
      <div class="timeline-header">
        <span class="timeline-round">Fase de Grupos</span>
        <span class="timeline-date"><i class="fa-regular fa-calendar"></i> 11 de Junio al 27 de Junio</span>
      </div>
      <p style="margin-bottom: 12px; color: var(--text-secondary);">
        Tu selección formó parte del <strong>Grupo ${worldCupData.teams[selectedTeam].group}</strong>. Finalizó en la posición <strong>${elSelectedStanding.innerText}</strong> ${hasQualified ? 'y avanzó a la fase de eliminación directa' : 'y lamentablemente quedó eliminada en esta fase'}.
      </p>
      <div class="match-box" style="background: rgba(0,0,0,0.15)">
        <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
          <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; letter-spacing:0.05em;">Integrantes del Grupo</span>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:4px;">
            ${worldCupData.groups[worldCupData.teams[selectedTeam].group].map(t => `
                <span class="tag" style="cursor:default; background: ${t.name === selectedTeam ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.2)'}; border-color: ${t.name === selectedTeam ? 'var(--accent-green)' : 'var(--border-color)'}; color: ${t.name === selectedTeam ? 'var(--accent-green)' : 'var(--text-secondary)'}">
                  <span class="flag-placeholder" style="width:20px; height:14px; font-size:0.5rem; background:${getTeamGradient(t.name)}">${t.name.substring(0, 2)}</span>
                  ${t.name}
                </span>
              `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  elTimelineSteps.appendChild(groupCard);

  if (!hasQualified) return;

  // 2. Knockout Cards
  const icons = {
    "Dieciseisavos de Final": "fa-dice",
    "Octavos de Final": "fa-shield-halved",
    "Cuartos de Final": "fa-cube",
    "Semifinal": "fa-code-branch",
    "Final": "fa-crown"
  };

  simulation.path.forEach((step, idx) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'timeline-step animate-slide-up';
    stepDiv.style.animationDelay = `${(idx + 1) * 0.1}s`;

    const icon = icons[step.round] || "fa-futbol";

    stepDiv.innerHTML = `
      <div class="timeline-marker"><i class="fa-solid ${icon}"></i></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-round">${step.round}</span>
          <span class="timeline-date"><i class="fa-regular fa-calendar-days"></i> ${step.day}, ${step.date} a las ${step.time}</span>
        </div>
        <p style="margin-bottom: 12px; color: var(--text-secondary);">
          Partido correspondiente a la llave <strong>${step.matchLabel}</strong>. <strong>${selectedTeam}</strong> se impone al rival para avanzar de ronda.
        </p>
        <div class="match-box">
          <div class="match-team selected-fav">
            <span class="flag-placeholder" style="background: ${getTeamGradient(selectedTeam)}">${selectedTeam.substring(0, 2)}</span>
            <span class="team-name">${selectedTeam}</span>
          </div>
          <span class="match-vs">VS</span>
          <div class="match-team opponent-team" style="justify-content: flex-end; text-align: right;">
            <div>
              <span class="team-name" style="font-weight:600;">${step.opponent}</span>
              <div class="opponent-meta">Ranking FIFA: <span>#${step.opponentRank}</span> • Grupo: <span>${step.opponentGroup}</span></div>
            </div>
            <span class="flag-placeholder" style="background: ${getTeamGradient(step.opponent)}">${step.opponent.substring(0, 2)}</span>
          </div>
        </div>
      </div>
  `;
    elTimelineSteps.appendChild(stepDiv);
  });

  // 3. Trophy Celebration Card (End)
  const celebrationStep = document.createElement('div');
  celebrationStep.className = 'timeline-step animate-slide-up';
  celebrationStep.style.animationDelay = `${(simulation.path.length + 1) * 0.1}s`;
  celebrationStep.innerHTML = `
    <div class="timeline-marker" style="border-color: var(--accent-gold); background: var(--bg-primary);"><i class="fa-solid fa-trophy" style="color: var(--accent-gold); font-size: 0.7rem;"></i></div>
    <div class="champion-celebration" style="margin: 0;">
        <div class="celebration-trophy animate-gold"><i class="fa-solid fa-trophy"></i></div>
        <h3 class="celebration-title">${selectedTeam} Campeón Mundial 2026</h3>
        <p class="celebration-desc">
          ¡Felicitaciones! Tras vencer a <strong>${simulation.path[simulation.path.length - 1].opponent}</strong> en la Final, <strong>${selectedTeam}</strong> se consagra como campeón indiscutido del mundo.
        </p>
      </div>
  `;
  elTimelineSteps.appendChild(celebrationStep);
}

// Resolve matches dynamically for the selected team
function runDynamicSimulation() {
  const r32 = {
    "L1": { t1: getGroupTeam("E", 1), t2: getGroupTeam("D", 3), label: "Llave 1", date: "29-6-2026", time: "16:30 hs", day: "LUNES" },
    "L2": { t1: getGroupTeam("I", 1), t2: getGroupTeam("F", 3), label: "Llave 2", date: "30-6-2026", time: "17:00 hs", day: "MARTES" },
    "L3": { t1: getGroupTeam("A", 2), t2: getGroupTeam("B", 2), label: "Llave 3", date: "28-6-2026", time: "15:00 hs", day: "DOMINGO" },
    "L4": { t1: getGroupTeam("F", 1), t2: getGroupTeam("C", 2), label: "Llave 4", date: "29-6-2026", time: "21:00 hs", day: "LUNES" },
    "L5": { t1: getGroupTeam("K", 2), t2: getGroupTeam("L", 2), label: "Llave 5", date: "2-7-2026", time: "19:00 hs", day: "JUEVES" },
    "L6": { t1: getGroupTeam("H", 1), t2: getGroupTeam("J", 2), label: "Llave 6", date: "2-7-2026", time: "15:00 hs", day: "JUEVES" },
    "L7": { t1: getGroupTeam("D", 1), t2: getGroupTeam("J", 3), label: "Llave 7", date: "1-7-2026", time: "20:00 hs", day: "MIÉRCOLES" },
    "L8": { t1: getGroupTeam("G", 1), t2: getGroupTeam("A", 3), label: "Llave 8", date: "1-7-2026", time: "16:00 hs", day: "MIÉRCOLES" },
    "L9": { t1: getGroupTeam("C", 1), t2: getGroupTeam("F", 2), label: "Llave 9", date: "29-6-2026", time: "13:00 hs", day: "LUNES" },
    "L10": { t1: getGroupTeam("E", 2), t2: getGroupTeam("I", 2), label: "Llave 10", date: "30-6-2026", time: "13:00 hs", day: "MARTES" },
    "L11": { t1: getGroupTeam("A", 1), t2: getGroupTeam("E", 3), label: "Llave 11", date: "30-6-2026", time: "21:00 hs", day: "MARTES" },
    "L12": { t1: getGroupTeam("L", 1), t2: getGroupTeam("I", 3), label: "Llave 12", date: "1-7-2026", time: "12:00 hs", day: "MIÉRCOLES" },
    "L13": { t1: getGroupTeam("J", 1), t2: getGroupTeam("H", 2), label: "Llave 13", date: "3-7-2026", time: "18:00 hs", day: "VIERNES" },
    "L14": { t1: getGroupTeam("D", 2), t2: getGroupTeam("G", 2), label: "Llave 14", date: "3-7-2026", time: "14:00 hs", day: "VIERNES" },
    "L15": { t1: getGroupTeam("B", 1), t2: getGroupTeam("G", 3), label: "Llave 15", date: "2-7-2026", time: "23:00 hs", day: "JUEVES" },
    "L16": { t1: getGroupTeam("K", 1), t2: getGroupTeam("L", 3), label: "Llave 16", date: "3-7-2026", time: "21:30 hs", day: "VIERNES" }
  };

  const carriesSelected = (teamObj) => {
    if (!teamObj) return false;
    if (teamObj.name === selectedTeam) return true;
    if (teamObj.left && carriesSelected(teamObj.left)) return true;
    if (teamObj.right && carriesSelected(teamObj.right)) return true;
    return false;
  };

  const playMatch = (t1, t2, forceFavorites = false) => {
    const isT1Selected = carriesSelected(t1);
    const isT2Selected = carriesSelected(t2);
    let winner;

    // Selected team always has "plot armor" for the Champion Path view
    if (isT1Selected) {
      winner = t1;
    } else if (isT2Selected) {
      winner = t2;
    } else if (forceFavorites || simulationMode === 'favorites') {
      winner = t1.rank < t2.rank ? t1 : t2;
    } else if (simulationMode === 'underdogs') {
      // Le damos una ventaja al underdog (70%) pero no es absoluta para evitar resultados absurdos
      const underdog = t1.rank > t2.rank ? t1 : t2;
      const favorite = t1.rank < t2.rank ? t1 : t2;
      winner = Math.random() < 0.7 ? underdog : favorite;
    } else if (simulationMode === 'realistic') {
      // P(t1 wins) = t2.rank / (t1.rank + t2.rank)
      const probT1Wins = t2.rank / (t1.rank + t2.rank);
      winner = Math.random() < probT1Wins ? t1 : t2;
    } else { // Random mode
      winner = Math.random() > 0.5 ? t1 : t2;
    }

    return {
      name: winner.name,
      rank: winner.rank,
      group: winner.group,
      left: t1, // Store for bracket visualization
      right: t2  // Store for bracket visualization
    };
  };

  // Resolve rounds
  const r32W = {};
  for (const [k, v] of Object.entries(r32)) {
    r32W[k] = playMatch(v.t1, v.t2);
  }

  const o = {
    "O1": { label: "Octavos 1", t1: r32W["L2"], t2: r32W["L5"], date: "4-7-2026", time: "17:00 hs", day: "SÁBADO" },
    "O2": { label: "Octavos 2", t1: r32W["L1"], t2: r32W["L3"], date: "4-7-2026", time: "13:00 hs", day: "SÁBADO" },
    "O3": { label: "Octavos 3", t1: r32W["L11"], t2: r32W["L12"], date: "6-7-2026", time: "15:00 hs", day: "LUNES" },
    "O4": { label: "Octavos 4", t1: r32W["L9"], t2: r32W["L10"], date: "6-7-2026", time: "20:00 hs", day: "LUNES" },
    "O5": { label: "Octavos 5", t1: r32W["L4"], t2: r32W["L6"], date: "5-7-2026", time: "16:00 hs", day: "DOMINGO" },
    "O6": { label: "Octavos 6", t1: r32W["L7"], t2: r32W["L8"], date: "5-7-2026", time: "20:00 hs", day: "DOMINGO" },
    "O7": { label: "Octavos 7", t1: r32W["L14"], t2: r32W["L16"], date: "7-7-2026", time: "12:00 hs", day: "MARTES" },
    "O8": { label: "Octavos 8", t1: r32W["L13"], t2: r32W["L15"], date: "7-7-2026", time: "16:00 hs", day: "MARTES" }
  };
  const oW = {};
  for (const [k, v] of Object.entries(o)) {
    oW[k] = playMatch(v.t1, v.t2);
  }

  const c = {
    "C1": { label: "Cuartos 1", t1: oW["O1"], t2: oW["O2"], date: "9-7-2026", time: "16:00 hs", day: "JUEVES" },
    "C2": { label: "Cuartos 2", t1: oW["O5"], t2: oW["O6"], date: "10-7-2026", time: "15:00 hs", day: "VIERNES" },
    "C3": { label: "Cuartos 3", t1: oW["O3"], t2: oW["O4"], date: "11-7-2026", time: "17:00 hs", day: "SÁBADO" },
    "C4": { label: "Cuartos 4", t1: oW["O7"], t2: oW["O8"], date: "11-7-2026", time: "21:00 hs", day: "SÁBADO" }
  };
  const cW = {};
  for (const [k, v] of Object.entries(c)) {
    cW[k] = playMatch(v.t1, v.t2, true); // Cuartos en adelante usa Ranking
  }

  const s = {
    "S1": { label: "Semi 1", t1: cW["C1"], t2: cW["C2"], date: "14-7-2026", time: "15:00 hs", day: "MARTES" },
    "S2": { label: "Semi 2", t1: cW["C3"], t2: cW["C4"], date: "15-7-2026", time: "15:00 hs", day: "MIÉRCOLES" }
  };
  const sW = {};
  for (const [k, v] of Object.entries(s)) {
    sW[k] = playMatch(v.t1, v.t2, true); // Semis usa Ranking
  }

  const f = { label: "Final", t1: sW["S1"], t2: sW["S2"], date: "19-7-2026", time: "15:00 hs", day: "DOMINGO" };
  const champion = playMatch(f.t1, f.t2, true); // Final usa Ranking

  return {
    "R32": r32,
    "O": o,
    "C": c,
    "S": s,
    "F": f,
    "R32_Winners": r32W,
    "O_Winners": oW,
    "C_Winners": cW,
    "S_Winners": sW,
    "Champion": champion
  };
}

function getGroupTeam(group, pos) {
  return worldCupData.groups[group][pos - 1];
}

// Render the bracket view
function renderBracket() {
  elBracketStructure.innerHTML = '';

  // Calculate dynamic bracket simulation based on selected team
  const sim = runDynamicSimulation();

  // Define bracket columns structure
  const columns = [
    { title: "Dieciseisavos de Final", type: "R32", list: sim.R32, winners: sim.R32_Winners },
    { title: "Octavos de Final", type: "O", list: sim.O, winners: sim.O_Winners },
    { title: "Cuartos de Final", type: "C", list: sim.C, winners: sim.C_Winners },
    { title: "Semifinal", type: "S", list: sim.S, winners: sim.S_Winners },
    { title: "Final", type: "F", list: { "F": sim.F }, winners: { "F": sim.Champion } }
  ];

  columns.forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.className = 'bracket-column';

    colDiv.innerHTML = `<div class="bracket-column-title">${col.title}</div>`;

    const listDiv = document.createElement('div');
    listDiv.className = 'bracket-matches-list';

    Object.keys(col.list).forEach(key => {
      const match = col.list[key];
      const winner = col.winners[key];

      const t1 = match.t1;
      const t2 = match.t2;

      const isT1Winner = winner.name === t1.name;

      // Determine if this match card is part of selected team's path
      const carriesSelected = (teamObj) => {
        if (!teamObj) return false;
        if (teamObj.name === selectedTeam) return true;
        if (teamObj.left && carriesSelected(teamObj.left)) return true;
        if (teamObj.right && carriesSelected(teamObj.right)) return true;
        return false;
      };
      const isPath = carriesSelected(t1) || carriesSelected(t2);

      const matchCard = document.createElement('div');
      matchCard.className = `bracket-match ${isPath ? 'highlight-path' : ''}`;

      matchCard.innerHTML = `
        <div class="bracket-match-header">
          <span>${match.label || 'Match'}</span>
          <span>${match.date}</span>
        </div>
        
        <div class="bracket-match-team ${isT1Winner ? 'winner' : 'loser'} ${t1.name === selectedTeam ? 'selected-highlight' : ''}">
          <div class="bracket-team-left">
            <span class="flag-placeholder" style="width:20px; height:14px; font-size:0.5rem; background: ${getTeamGradient(t1.name)}">${t1.name.substring(0, 2)}</span>
            <span class="bracket-team-name">${t1.name}</span>
            <span class="bracket-team-rank">#${t1.rank}</span>
          </div>
          <span class="bracket-team-score">${isT1Winner ? '✓' : ''}</span>
        </div>
        
        <div class="bracket-match-team ${!isT1Winner ? 'winner' : 'loser'} ${t2.name === selectedTeam ? 'selected-highlight' : ''}">
          <div class="bracket-team-left">
            <span class="flag-placeholder" style="width:20px; height:14px; font-size:0.5rem; background: ${getTeamGradient(t2.name)}">${t2.name.substring(0, 2)}</span>
            <span class="bracket-team-name">${t2.name}</span>
            <span class="bracket-team-rank">#${t2.rank}</span>
          </div>
          <span class="bracket-team-score">${!isT1Winner ? '✓' : ''}</span>
        </div>
  `;
      listDiv.appendChild(matchCard);
    });

    colDiv.appendChild(listDiv);
    elBracketStructure.appendChild(colDiv);
  });
}
