const ABILITIES = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
const MAX_CHARS = 4;
const NUM_WEAPONS = 3;
const NUM_GEAR_SLOTS = 20;
const NUM_FREE_SLOTS = 6;
const TAB_NAMES = [
  "1/4 · Combate y Atributos",
  "2/4 · Info y Trasfondo",
  "3/4 · Equipo y Monedas",
  "4/4 · Magias y Talentos"
];

// Estado global
let charactersData = [];
let activeTabs = [0, 0, 0, 0];
let diceHistory = [];
let oracleHistory = [];
let isRolling = false;

// Estado del Temporizador de Antorcha
let torchTotalSeconds = 0;
let torchRemainingSeconds = 0;
let torchInterval = null;
let isTorchPaused = false;

// Estructura de personaje por defecto
function createDefaultCharacter(name = "Personaje") {
  const stats = {};
  ABILITIES.forEach(stat => stats[stat] = 10);
  
  return {
    name: name,
    hp_curr: 10,
    hp_max: 10,
    ac: 10,
    luck: 1,
    stats: stats,
    weapons: Array.from({ length: NUM_WEAPONS }, () => ({ name: '', atk: '' })),
    level: 1,
    xp_curr: 0,
    xp_next: 10,
    ancestry: '',
    char_class: '',
    title: '',
    alignment: '',
    deity: '',
    background: '',
    coins: { gp: '', sp: '', cp: '' },
    ammo: 0,
    gear: Array(NUM_GEAR_SLOTS).fill(''),
    free_gear: Array(NUM_FREE_SLOTS).fill(''),
    talentsList: [],
    spellsList: []
  };
}

// Modificador OSR / Shadowdark
function getMod(val) {
  if (isNaN(val) || val === '') return '+0';
  const num = parseInt(val, 10);
  const mod = Math.floor((num - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function updateMod(charIdx, stat) {
  const input = document.getElementById(`stat-${charIdx}-${stat}`);
  const modSpan = document.getElementById(`mod-${charIdx}-${stat}`);
  if (input && modSpan) {
    modSpan.textContent = getMod(input.value);
  }
}

function changeVal(id, delta, isStat = false, charIdx = null, stat = null) {
  const el = document.getElementById(id);
  if (!el) return;
  let val = parseInt(el.value, 10);
  if (isNaN(val)) val = 0;
  val += delta;
  el.value = val;

  if (isStat && charIdx !== null && stat !== null) {
    updateMod(charIdx, stat);
  }

  if (charIdx !== null && id === `hp-curr-${charIdx}`) {
    checkHpDeath(charIdx, val);
  }
}

function checkHpDeath(charIdx, currentHp) {
  const hpBox = document.getElementById(`hp-box-${charIdx}`);
  if (hpBox) {
    if (currentHp <= 0) {
      hpBox.classList.add('dead-state');
    } else {
      hpBox.classList.remove('dead-state');
    }
  }
}

// Navegación de pestañas con carrusel
function navigateTab(charIdx, direction) {
  activeTabs[charIdx] = (activeTabs[charIdx] + direction + 4) % 4;
  updateTabPosition(charIdx);
}

function updateTabPosition(charIdx) {
  const slider = document.getElementById(`tabs-slider-${charIdx}`);
  const indicator = document.getElementById(`tab-indicator-${charIdx}`);
  const targetIndex = activeTabs[charIdx];

  if (slider) {
    slider.classList.remove('no-transition');
    slider.style.transform = `translateX(-${targetIndex * 25}%)`;
  }

  if (indicator) {
    indicator.textContent = TAB_NAMES[targetIndex];
  }

  setTimeout(() => {
    document.querySelectorAll(`#tab-${charIdx}-${targetIndex} textarea`).forEach(autoResize);
  }, 100);
}

function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}

// Guardar datos actuales en memoria antes de re-renderizar
function snapshotCurrentInputs() {
  charactersData = charactersData.map((char, i) => {
    const nameEl = document.getElementById(`name-${i}`);
    if (!nameEl) return char;

    const stats = {};
    ABILITIES.forEach(stat => {
      const el = document.getElementById(`stat-${i}-${stat}`);
      stats[stat] = el ? el.value : (char.stats[stat] || 10);
    });

    const weapons = [];
    for (let w = 0; w < NUM_WEAPONS; w++) {
      weapons.push({
        name: document.getElementById(`w-name-${i}-${w}`)?.value || '',
        atk: document.getElementById(`w-atk-${i}-${w}`)?.value || ''
      });
    }

    const gear = [];
    for (let g = 0; g < NUM_GEAR_SLOTS; g++) {
      gear.push(document.getElementById(`gear-${i}-${g}`)?.value || '');
    }

    const free_gear = [];
    for (let f = 0; f < NUM_FREE_SLOTS; f++) {
      free_gear.push(document.getElementById(`free-gear-${i}-${f}`)?.value || '');
    }

    const talentsList = (char.talentsList || []).map(t => ({
      id: t.id,
      name: document.getElementById(`talent-name-${i}-${t.id}`)?.value || '',
      desc: document.getElementById(`talent-desc-${i}-${t.id}`)?.value || ''
    }));

    const spellsList = (char.spellsList || []).map(s => ({
      id: s.id,
      name: document.getElementById(`spell-name-${i}-${s.id}`)?.value || '',
      desc: document.getElementById(`spell-desc-${i}-${s.id}`)?.value || '',
      spent: s.spent || false
    }));

    return {
      name: nameEl.value,
      hp_curr: parseInt(document.getElementById(`hp-curr-${i}`)?.value || '0', 10),
      hp_max: document.getElementById(`hp-max-${i}`)?.value || '10',
      ac: document.getElementById(`ac-${i}`)?.value || '10',
      luck: document.getElementById(`luck-${i}`)?.value || '1',
      stats: stats,
      weapons: weapons,
      level: document.getElementById(`level-${i}`)?.value || '1',
      xp_curr: document.getElementById(`xp-curr-${i}`)?.value || '0',
      xp_next: document.getElementById(`xp-next-${i}`)?.value || '10',
      ancestry: document.getElementById(`ancestry-${i}`)?.value || '',
      char_class: document.getElementById(`class-${i}`)?.value || '',
      title: document.getElementById(`title-${i}`)?.value || '',
      alignment: document.getElementById(`alignment-${i}`)?.value || '',
      deity: document.getElementById(`deity-${i}`)?.value || '',
      background: document.getElementById(`background-${i}`)?.value || '',
      coins: {
        gp: document.getElementById(`coin-gp-${i}`)?.value || '',
        sp: document.getElementById(`coin-sp-${i}`)?.value || '',
        cp: document.getElementById(`coin-cp-${i}`)?.value || ''
      },
      ammo: document.getElementById(`ammo-${i}`)?.value || '0',
      gear: gear,
      free_gear: free_gear,
      talentsList: talentsList,
      spellsList: spellsList
    };
  });
}

// Talentos
function addTalent(charIdx) {
  snapshotCurrentInputs();
  const newId = Date.now();
  if (!charactersData[charIdx].talentsList) charactersData[charIdx].talentsList = [];
  charactersData[charIdx].talentsList.push({ id: newId, name: '', desc: '' });
  renderParty();
}

function removeTalent(charIdx, talentId) {
  snapshotCurrentInputs();
  charactersData[charIdx].talentsList = charactersData[charIdx].talentsList.filter(t => t.id !== talentId);
  renderParty();
}

// Hechizos
function addSpell(charIdx) {
  snapshotCurrentInputs();
  const newId = Date.now();
  if (!charactersData[charIdx].spellsList) charactersData[charIdx].spellsList = [];
  charactersData[charIdx].spellsList.push({ id: newId, name: '', desc: '', spent: false });
  renderParty();
}

function removeSpell(charIdx, spellId) {
  snapshotCurrentInputs();
  charactersData[charIdx].spellsList = charactersData[charIdx].spellsList.filter(s => s.id !== spellId);
  renderParty();
}

function toggleSpellSpent(charIdx, spellId) {
  snapshotCurrentInputs();
  const spell = charactersData[charIdx].spellsList.find(s => s.id === spellId);
  if (spell) {
    spell.spent = !spell.spent;
  }
  renderParty();
}

// Personajes
function addCharacter() {
  if (charactersData.length >= MAX_CHARS) {
    alert("Máximo 4 personajes simultáneos.");
    return;
  }
  snapshotCurrentInputs();
  charactersData.push(createDefaultCharacter(`PJ ${charactersData.length + 1}`));
  renderParty();
}

function removeCharacter(index) {
  if (charactersData.length <= 1) {
    alert("Debe haber al menos 1 personaje en pantalla.");
    return;
  }
  if (!confirm(`¿Eliminar la ficha de "${charactersData[index].name || 'este personaje'}"?`)) return;
  snapshotCurrentInputs();
  charactersData.splice(index, 1);
  renderParty();
}

// GESTOS TÁCTILES CON ARRASTRE REAL
function attachSwipeListeners(viewportElement, charIdx) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;

  viewportElement.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
  }, { passive: true });

  viewportElement.addEventListener('touchmove', (e) => {
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const diffX = touchCurrentX - touchStartX;
    const diffY = touchCurrentY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
      isDragging = true;
      const slider = document.getElementById(`tabs-slider-${charIdx}`);
      if (slider) {
        slider.classList.add('no-transition');
        const basePercent = -(activeTabs[charIdx] * 25);
        const containerWidth = viewportElement.offsetWidth || 300;
        const dragPercent = (diffX / containerWidth) * 25;
        slider.style.transform = `translateX(${basePercent + dragPercent}%)`;
      }
    }
  }, { passive: true });

  viewportElement.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;

    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX;
    const containerWidth = viewportElement.offsetWidth || 300;
    const threshold = containerWidth * 0.18;

    if (diffX < -threshold) {
      navigateTab(charIdx, 1);
    } else if (diffX > threshold) {
      navigateTab(charIdx, -1);
    } else {
      updateTabPosition(charIdx);
    }
  }, { passive: true });
}

// Renderizado General
function renderParty() {
  const container = document.getElementById('partyContainer');
  container.innerHTML = '';
  container.setAttribute('data-cols', charactersData.length);

  charactersData.forEach((char, i) => {
    const currentTab = activeTabs[i] || 0;
    const isDead = (parseInt(char.hp_curr, 10) <= 0);

    const card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.index = i;

    card.innerHTML = `
      <div class="char-header">
        <button type="button" class="nav-tab-btn" onclick="navigateTab(${i}, -1)" title="Pestaña Anterior">◀</button>
        <input type="text" class="char-name" id="name-${i}" value="${char.name || ''}" placeholder="Nombre PJ ${i + 1}">
        <button type="button" class="nav-tab-btn" onclick="navigateTab(${i}, 1)" title="Siguiente Pestaña">▶</button>
        ${charactersData.length > 1 ? `<button type="button" class="delete-char-btn" onclick="removeCharacter(${i})" title="Eliminar este PJ">✖</button>` : ''}
      </div>
      <div class="tab-indicator" id="tab-indicator-${i}">${TAB_NAMES[currentTab]}</div>

      <div class="tabs-viewport" id="tabs-viewport-${i}">
        <div class="tabs-slider" id="tabs-slider-${i}" style="transform: translateX(-${currentTab * 25}%);">
          
          <div class="tab-slide" id="tab-${i}-0">
            <div class="vital-stats">
              <div class="hp-box ${isDead ? 'dead-state' : ''}" id="hp-box-${i}">
                <span class="box-label">Puntos de Vida</span>
                <span class="skull-death-indicator">💀 ¡CAÍDO / MURIENDO! 💀</span>
                <div class="hp-controls">
                  <button type="button" class="hp-stepper-btn" onclick="changeVal('hp-curr-${i}', -1, false, ${i})">−</button>
                  <div class="hp-inputs">
                    <input type="number" class="hp-curr" id="hp-curr-${i}" value="${char.hp_curr}" placeholder="0" 
                      oninput="checkHpDeath(${i}, parseInt(this.value, 10))" title="Vida Actual">
                    <span class="hp-divider">/</span>
                    <input type="number" class="hp-max" id="hp-max-${i}" value="${char.hp_max}" placeholder="0" title="Vida Total">
                  </div>
                  <button type="button" class="hp-stepper-btn" onclick="changeVal('hp-curr-${i}', 1, false, ${i})">+</button>
                </div>
              </div>
              <div class="side-vitals">
                <div class="stat-small-box">
                  <span class="box-label">CA</span>
                  <div class="small-stat-controls">
                    <button type="button" class="small-stepper-btn ac-btn" onclick="changeVal('ac-${i}', -1)">−</button>
                    <input type="number" class="ac-input" id="ac-${i}" value="${char.ac || '10'}">
                    <button type="button" class="small-stepper-btn ac-btn" onclick="changeVal('ac-${i}', 1)">+</button>
                  </div>
                </div>
                <div class="stat-small-box">
                  <span class="box-label">Destino</span>
                  <div class="small-stat-controls">
                    <button type="button" class="small-stepper-btn destiny-btn" onclick="changeVal('luck-${i}', -1)">−</button>
                    <input type="number" class="luck-input" id="luck-${i}" value="${char.luck ?? 1}">
                    <button type="button" class="small-stepper-btn destiny-btn" onclick="changeVal('luck-${i}', 1)">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="ability-grid">
              ${ABILITIES.map(stat => {
                const val = char.stats?.[stat] ?? 10;
                return `
                  <div class="ability-box">
                    <span class="box-label ability-clickable-label" onclick="rollAbilityCheck(${i}, '${stat}')" title="Tirar 1d20 + mod de ${stat}">🎲 ${stat}</span>
                    <div class="mod-tag-large" id="mod-${i}-${stat}">${getMod(val)}</div>
                    <div class="ability-row">
                      <button type="button" class="step-btn" onclick="changeVal('stat-${i}-${stat}', -1, true, ${i}, '${stat}')">−</button>
                      <div class="ability-values">
                        <input type="number" id="stat-${i}-${stat}" value="${val}" oninput="updateMod(${i}, '${stat}')">
                      </div>
                      <button type="button" class="step-btn" onclick="changeVal('stat-${i}-${stat}', 1, true, ${i}, '${stat}')">+</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="combat-section">
              <span class="box-label">Armas y Ataques</span>
              ${Array.from({ length: NUM_WEAPONS }).map((_, wIdx) => `
                <div class="weapon-row">
                  <input type="text" id="w-name-${i}-${wIdx}" value="${char.weapons?.[wIdx]?.name || ''}" placeholder="Arma / Hechizo">
                  <input type="text" id="w-atk-${i}-${wIdx}" value="${char.weapons?.[wIdx]?.atk || ''}" placeholder="Atq: +2 (1d8)">
                </div>
              `).join('')}
            </div>
          </div>

          <div class="tab-slide" id="tab-${i}-1">
            <div class="section-box">
              <div class="info-grid-2">
                <div class="info-row">
                  <span class="box-label">Nivel</span>
                  <input type="number" id="level-${i}" value="${char.level || '1'}">
                </div>
                <div class="info-row">
                  <span class="box-label">XP (Act / Sig)</span>
                  <div class="xp-input-group">
                    <input type="number" id="xp-curr-${i}" value="${char.xp_curr || '0'}" placeholder="0">
                    <span style="color:var(--text-muted)">/</span>
                    <input type="number" id="xp-next-${i}" value="${char.xp_next || '10'}" placeholder="10">
                  </div>
                </div>
                <div class="info-row"><span class="box-label">Clase</span><input type="text" id="class-${i}" value="${char.char_class || ''}" placeholder="Guerrero..."></div>
                <div class="info-row"><span class="box-label">Linaje</span><input type="text" id="ancestry-${i}" value="${char.ancestry || ''}" placeholder="Humano..."></div>
                <div class="info-row"><span class="box-label">Título</span><input type="text" id="title-${i}" value="${char.title || ''}" placeholder="Valiente..."></div>
                <div class="info-row"><span class="box-label">Alineamiento</span><input type="text" id="alignment-${i}" value="${char.alignment || ''}" placeholder="Legal..."></div>
                <div class="info-row"><span class="box-label">Deidad</span><input type="text" id="deity-${i}" value="${char.deity || ''}" placeholder="Ghaele..."></div>
                <div class="info-row"><span class="box-label">Trasfondo</span><textarea class="background-textarea" id="background-${i}" placeholder="Historia, origen...">${char.background || ''}</textarea></div>
              </div>
            </div>
          </div>

          <div class="tab-slide" id="tab-${i}-2">
            <div class="section-box">
              <span class="box-label">Monedas</span>
              <div class="coins-grid">
                <div class="coin-box"><span class="box-label gold-text">ORO</span><input type="number" class="gold-text" id="coin-gp-${i}" value="${char.coins?.gp || ''}" placeholder="0"></div>
                <div class="coin-box"><span class="box-label silver-text">PLATA</span><input type="number" class="silver-text" id="coin-sp-${i}" value="${char.coins?.sp || ''}" placeholder="0"></div>
                <div class="coin-box"><span class="box-label copper-text">COBRE</span><input type="number" class="copper-text" id="coin-cp-${i}" value="${char.coins?.cp || ''}" placeholder="0"></div>
              </div>
              <div class="ammo-box">
                <span class="box-label">Munición</span>
                <div class="ammo-controls">
                  <button type="button" class="small-stepper-btn" onclick="changeVal('ammo-${i}', -1)">−</button>
                  <input type="number" id="ammo-${i}" value="${char.ammo || '0'}">
                  <button type="button" class="small-stepper-btn" onclick="changeVal('ammo-${i}', 1)">+</button>
                </div>
              </div>
              <span class="box-label" style="margin-top: 4px;">Inventario (20 Espacios)</span>
              <div class="gear-slots-grid">
                ${Array.from({ length: NUM_GEAR_SLOTS }).map((_, gIdx) => `
                  <div class="gear-slot-item">
                    <span class="slot-num">${gIdx + 1}.</span>
                    <input type="text" id="gear-${i}-${gIdx}" value="${char.gear?.[gIdx] || ''}" placeholder="Vacío">
                  </div>
                `).join('')}
              </div>
              <span class="box-label" style="margin-top: 8px;">Equipo Sin Peso (6 Espacios)</span>
              <div class="gear-slots-grid">
                ${Array.from({ length: NUM_FREE_SLOTS }).map((_, fIdx) => `
                  <div class="gear-slot-item">
                    <span class="slot-num">✦</span>
                    <input type="text" id="free-gear-${i}-${fIdx}" value="${char.free_gear?.[fIdx] || ''}" placeholder="Objeto pequeño...">
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="tab-slide" id="tab-${i}-3">
            <div class="section-box">
              <div class="dynamic-header-btns">
                <button type="button" class="add-talent-btn" onclick="addTalent(${i})">➕ Añadir Talento</button>
                <button type="button" class="add-spell-btn" onclick="addSpell(${i})">➕ Añadir Hechizo</button>
              </div>

              <span class="box-label" style="color:var(--talent-color)">Talentos y Rasgos</span>
              <div class="dynamic-list" id="talents-container-${i}">
                ${(char.talentsList || []).length === 0 ? '<div style="color:var(--text-muted);font-size:0.72rem;font-style:italic;">Sin talentos registrados</div>' : ''}
                ${(char.talentsList || []).map(talent => `
                  <div class="dynamic-item-card talent-item">
                    <div class="item-top-bar">
                      <input type="text" class="item-title-input" id="talent-name-${i}-${talent.id}" value="${talent.name || ''}" placeholder="Nombre del Talento...">
                      <button type="button" class="item-delete-btn" onclick="removeTalent(${i}, ${talent.id})" title="Eliminar talento">✖</button>
                    </div>
                    <textarea class="auto-expand-text" id="talent-desc-${i}-${talent.id}" placeholder="Descripción y efectos..." oninput="autoResize(this)">${talent.desc || ''}</textarea>
                  </div>
                `).join('')}
              </div>

              <span class="box-label" style="color:var(--magic-color); margin-top:8px;">Hechizos y Conjuros</span>
              <div class="dynamic-list" id="spells-container-${i}">
                ${(char.spellsList || []).length === 0 ? '<div style="color:var(--text-muted);font-size:0.72rem;font-style:italic;">Sin hechizos memorizados</div>' : ''}
                ${(char.spellsList || []).map(spell => `
                  <div class="dynamic-item-card spell-item ${spell.spent ? 'spent-spell' : ''}">
                    <div class="item-top-bar">
                      <input type="text" class="item-title-input" id="spell-name-${i}-${spell.id}" value="${spell.name || ''}" placeholder="Nombre del Hechizo...">
                      <button type="button" class="spell-toggle-btn ${spell.spent ? 'spent' : ''}" onclick="toggleSpellSpent(${i}, ${spell.id})" title="Alternar si está disponible o agotado">
                        ${spell.spent ? '💀 Agotado' : '⚡ Listo'}
                      </button>
                      <button type="button" class="item-delete-btn" onclick="removeSpell(${i}, ${spell.id})" title="Eliminar hechizo">✖</button>
                    </div>
                    <textarea class="auto-expand-text" id="spell-desc-${i}-${spell.id}" placeholder="Efecto, dificultad y duración..." oninput="autoResize(this)">${spell.desc || ''}</textarea>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
    container.appendChild(card);
    const viewport = card.querySelector(`#tabs-viewport-${i}`);
    if (viewport) {
      attachSwipeListeners(viewport, i);
    }
  });

  document.querySelectorAll('textarea').forEach(autoResize);
}

// ================= MODALES =================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Tirada directa al pulsar sobre una habilidad (FUE, DES, etc.)
function rollAbilityCheck(charIdx, stat) {
  const statInput = document.getElementById(`stat-${charIdx}-${stat}`);
  const val = statInput ? parseInt(statInput.value, 10) : 10;
  const mod = Math.floor(((isNaN(val) ? 10 : val) - 10) / 2);
  const charName = document.getElementById(`name-${charIdx}`)?.value || `PJ ${charIdx + 1}`;

  openModal('diceModal');
  rollDie(20, mod, stat, charName);
}

// ================= LANZADOR DE DADOS CON MODIFICADOR =================
function rollDie(sides, mod = 0, statLabel = '', charName = '') {
  if (isRolling) return;
  isRolling = true;

  const resultEl = document.getElementById('currentDieResult');
  const labelEl = document.getElementById('currentDieLabel');
  const bannerEl = document.getElementById('critBanner');

  if (statLabel) {
    const sign = mod >= 0 ? `+${mod}` : `${mod}`;
    labelEl.textContent = `${charName} · Prueba de ${statLabel} (1d20 ${sign})`;
  } else {
    labelEl.textContent = `Lanzando 1d${sides}...`;
  }

  bannerEl.textContent = '';
  resultEl.className = 'die-result die-rolling';

  let counter = 0;
  const rollInterval = setInterval(() => {
    resultEl.textContent = Math.floor(Math.random() * sides) + 1;
    counter++;
    if (counter > 12) {
      clearInterval(rollInterval);
      finalizeRoll(sides, mod, statLabel, charName);
    }
  }, 50);
}

function finalizeRoll(sides, mod = 0, statLabel = '', charName = '') {
  const resultEl = document.getElementById('currentDieResult');
  const labelEl = document.getElementById('currentDieLabel');
  const bannerEl = document.getElementById('critBanner');
  
  const naturalRoll = Math.floor(Math.random() * sides) + 1;
  const total = naturalRoll + mod;
  
  resultEl.textContent = total;
  resultEl.className = 'die-result';

  if (statLabel) {
    const sign = mod >= 0 ? `+${mod}` : `${mod}`;
    labelEl.textContent = `Dado [${naturalRoll}] ${sign} ${statLabel} = ${total}`;
  } else {
    labelEl.textContent = `Resultado 1d${sides}`;
  }

  let critClass = '';
  if (sides === 20) {
    if (naturalRoll === 20) {
      resultEl.classList.add('crit-success-anim');
      bannerEl.textContent = '★ ¡CRÍTICO (20 NATURAL)! ★';
      bannerEl.style.color = '#ffd700';
      critClass = 'crit-20';
    } else if (naturalRoll === 1) {
      resultEl.classList.add('crit-fail-anim');
      bannerEl.textContent = '☠ ¡PIFIA (1 NATURAL)! ☠';
      bannerEl.style.color = '#ff3333';
      critClass = 'crit-1';
    }
  }

  const histEntry = statLabel 
    ? { die: `1d20${mod >= 0 ? '+' : ''}${mod} (${statLabel})`, val: total, critClass: critClass }
    : { die: `1d${sides}`, val: naturalRoll, critClass: critClass };

  diceHistory.unshift(histEntry);
  if (diceHistory.length > 10) diceHistory.pop();
  renderDiceHistory();

  isRolling = false;
}

function renderDiceHistory() {
  const historyContainer = document.getElementById('diceHistoryList');
  if (diceHistory.length === 0) {
    historyContainer.innerHTML = '<div class="history-empty">Sin tiradas recientes</div>';
    return;
  }
  historyContainer.innerHTML = diceHistory.map(item => `
    <div class="history-item ${item.critClass}">
      ${item.die}: <strong>${item.val}</strong>
    </div>
  `).join('');
}

// ================= ORÁCULO =================
function getOracleAnswer(roll) {
  switch(roll) {
    case 1:  return { text: "¡NO! Y ADEMÁS...!", type: "red-crit" };
    case 2:  return { text: "NO", type: "standard" };
    case 3:  return { text: "NO, PERO...", type: "standard" };
    case 4:  return { text: "NO", type: "standard" };
    case 5:  return { text: "NO, PERO...", type: "standard" };
    case 6:  return { text: "NO", type: "standard" };
    case 7:  return { text: "NO, PERO...", type: "standard" };
    case 8:  return { text: "NO", type: "standard" };
    case 9:  return { text: "NO, PERO...", type: "standard" };
    case 10: return { text: "¡GIRO INESPERADO!", type: "twist" };
    case 11: return { text: "SÍ", type: "standard" };
    case 12: return { text: "SÍ, PERO...", type: "standard" };
    case 13: return { text: "SÍ", type: "standard" };
    case 14: return { text: "SÍ, PERO...", type: "standard" };
    case 15: return { text: "SÍ", type: "standard" };
    case 16: return { text: "SÍ, PERO...", type: "standard" };
    case 17: return { text: "SÍ", type: "standard" };
    case 18: return { text: "SÍ, PERO...", type: "standard" };
    case 19: return { text: "SÍ", type: "standard" };
    case 20: return { text: "¡SÍ, Y ADEMÁS...!", type: "gold-crit" };
    default: return { text: "-", type: "standard" };
  }
}

function askOracle(mode) {
  if (isRolling) return;
  isRolling = true;

  const detailsEl = document.getElementById('oracleDiceDetails');
  const numEl = document.getElementById('oracleResultNum');
  const answerEl = document.getElementById('oracleAnswerText');

  numEl.className = 'oracle-result-number die-rolling';
  answerEl.className = 'oracle-answer-text';
  answerEl.textContent = 'Consultando el destino...';
  answerEl.style.color = 'var(--text-muted)';

  let d1, d2, finalRoll, modeLabel;

  if (mode === 'unlikely') {
    modeLabel = "Poco Probable (Menor de 2d20)";
  } else if (mode === 'likely') {
    modeLabel = "Casi Seguro (Mayor de 2d20)";
  } else {
    modeLabel = "50% (1d20)";
  }

  detailsEl.textContent = modeLabel;

  let counter = 0;
  const oracleInterval = setInterval(() => {
    numEl.textContent = Math.floor(Math.random() * 20) + 1;
    counter++;
    if (counter > 12) {
      clearInterval(oracleInterval);

      if (mode === 'unlikely') {
        d1 = Math.floor(Math.random() * 20) + 1;
        d2 = Math.floor(Math.random() * 20) + 1;
        finalRoll = Math.min(d1, d2);
        detailsEl.textContent = `Tiradas: [${d1}, ${d2}] ➔ Elegido: ${finalRoll}`;
      } else if (mode === 'likely') {
        d1 = Math.floor(Math.random() * 20) + 1;
        d2 = Math.floor(Math.random() * 20) + 1;
        finalRoll = Math.max(d1, d2);
        detailsEl.textContent = `Tiradas: [${d1}, ${d2}] ➔ Elegido: ${finalRoll}`;
      } else {
        finalRoll = Math.floor(Math.random() * 20) + 1;
        detailsEl.textContent = `Tirada: [${finalRoll}]`;
      }

      numEl.textContent = finalRoll;
      numEl.className = 'oracle-result-number';

      const outcome = getOracleAnswer(finalRoll);
      answerEl.textContent = outcome.text;

      let histCrit = '';
      if (outcome.type === 'red-crit') {
        answerEl.classList.add('oracle-red-crit');
        histCrit = 'crit-1';
      } else if (outcome.type === 'gold-crit') {
        answerEl.classList.add('oracle-gold-crit');
        histCrit = 'crit-20';
      } else if (outcome.type === 'twist') {
        answerEl.classList.add('oracle-twist');
        histCrit = 'oracle-twist-hist';
      } else {
        answerEl.style.color = '#fff';
      }

      oracleHistory.unshift({ roll: finalRoll, text: outcome.text, critClass: histCrit });
      if (oracleHistory.length > 10) oracleHistory.pop();
      renderOracleHistory();

      isRolling = false;
    }
  }, 50);
}

function renderOracleHistory() {
  const historyContainer = document.getElementById('oracleHistoryList');
  if (oracleHistory.length === 0) {
    historyContainer.innerHTML = '<div class="history-empty">Sin respuestas previas</div>';
    return;
  }
  historyContainer.innerHTML = oracleHistory.map(item => `
    <div class="history-item ${item.critClass}">
      (${item.roll}) <strong>${item.text}</strong>
    </div>
  `).join('');
}

// ================= TEMPORIZADOR DE ANTORCHA (LÓGICA Y EFECTOS) =================
function startTorch(minutes) {
  clearInterval(torchInterval);
  torchTotalSeconds = minutes * 60;
  torchRemainingSeconds = torchTotalSeconds;
  isTorchPaused = false;
  
  const pauseBtn = document.getElementById('torchPauseBtn');
  if (pauseBtn) pauseBtn.textContent = '⏸ Pausar';
  updateTorchDisplay();

  torchInterval = setInterval(() => {
    if (!isTorchPaused) {
      torchRemainingSeconds--;
      if (torchRemainingSeconds <= 0) {
        torchRemainingSeconds = 0;
        extinguishTorch(false);
      }
      updateTorchDisplay();
    }
  }, 1000);
}

function togglePauseTorch() {
  if (torchRemainingSeconds <= 0) return;
  isTorchPaused = !isTorchPaused;
  const btn = document.getElementById('torchPauseBtn');
  if (btn) btn.textContent = isTorchPaused ? '▶ Reanudar' : '⏸ Pausar';
  
  const statusBanner = document.getElementById('torchStatusBanner');
  if (statusBanner) {
    if (isTorchPaused) {
      statusBanner.textContent = '⏸ En Pausa';
    } else {
      updateTorchDisplay();
    }
  }
}

function extinguishTorch(manual = false) {
  clearInterval(torchInterval);
  torchInterval = null;
  torchRemainingSeconds = 0;
  isTorchPaused = false;

  updateTorchDisplay();

  if (!manual) {
    triggerBlackoutScreen();
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTorchDisplay() {
  const headerBtn = document.getElementById('openTorchBtn');
  const headerText = document.getElementById('headerTorchText');
  const displayArea = document.getElementById('torchDisplayArea');
  const fireGraphic = document.getElementById('torchFireGraphic');
  const timerText = document.getElementById('torchTimerText');
  const statusBanner = document.getElementById('torchStatusBanner');
  const progressFill = document.getElementById('torchProgressFill');

  if (!timerText || !displayArea) return;

  timerText.textContent = formatTime(torchRemainingSeconds);
  displayArea.className = 'torch-display-area';
  
  if (torchRemainingSeconds <= 0) {
    if (headerBtn) headerBtn.classList.remove('burning');
    if (headerText) headerText.textContent = 'Antorcha';
    if (fireGraphic) fireGraphic.textContent = '🪵';
    if (statusBanner) {
      statusBanner.textContent = 'Apagada (En la Oscuridad)';
      statusBanner.style.color = 'var(--text-muted)';
    }
    if (progressFill) progressFill.style.width = '0%';
    return;
  }

  if (headerBtn) headerBtn.classList.add('burning');
  if (headerText) headerText.textContent = formatTime(torchRemainingSeconds);
  displayArea.classList.add('torch-burning');
  if (fireGraphic) fireGraphic.textContent = '🔥';

  const percent = (torchRemainingSeconds / torchTotalSeconds) * 100;
  if (progressFill) progressFill.style.width = `${percent}%`;

  if (torchRemainingSeconds <= 60) {
    displayArea.classList.add('torch-critical-1min');
    if (statusBanner) {
      statusBanner.textContent = '⚠️ ¡A PUNTO DE EXTINGUIRSE! ⚠️';
      statusBanner.style.color = '#ff3333';
    }
  } else if (torchRemainingSeconds <= 300) {
    displayArea.classList.add('torch-warning-5min');
    if (statusBanner) {
      statusBanner.textContent = '🔥 ¡La llama parpadea y vacila!';
      statusBanner.style.color = '#ff8800';
    }
  } else {
    if (statusBanner) {
      statusBanner.textContent = 'Llama brillante y estable';
      statusBanner.style.color = '#ffaa44';
    }
  }
}

function triggerBlackoutScreen() {
  closeModal('torchModal');
  const blackout = document.getElementById('blackoutScreen');
  if (blackout) {
    blackout.classList.add('active');
  }
}

function dismissBlackout() {
  const blackout = document.getElementById('blackoutScreen');
  if (blackout) {
    blackout.classList.remove('active');
  }
}

// ================= EXPORTAR / GUARDAR =================
async function exportJSON() {
  snapshotCurrentInputs();
  const jsonString = JSON.stringify(charactersData, null, 2);
  const fileName = `shadowdark_party_${new Date().toISOString().slice(0, 10)}.json`;

  const blob = new Blob([jsonString], { type: "application/json" });

  if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: "application/json" })] })) {
    try {
      const file = new File([blob], fileName, { type: "application/json" });
      await navigator.share({
        files: [file],
        title: "Shadowdark Sheet",
        text: "Copia de seguridad de personajes Shadowdark"
      });
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn("Fallback a descarga directa");
      } else {
        return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = fileName;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();

  setTimeout(() => {
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  }, 150);
}

// ================= IMPORTAR / CARGAR =================
function importJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const partyData = JSON.parse(e.target.result);
      if (!Array.isArray(partyData)) throw new Error("El archivo no contiene una lista válida de personajes.");

      charactersData = partyData.slice(0, MAX_CHARS);
      renderParty();
      alert("¡Grupo cargado con éxito!");
    } catch (err) {
      alert('Error al leer el archivo JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ================= AUTO-HIDE HEADER EN SCROLL =================
let lastScrollPosition = 0;

window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (!header) return;
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  if (window.innerWidth <= 820) {
    if (currentScroll > lastScrollPosition && currentScroll > 60) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }
  } else {
    header.classList.remove('header-hidden');
  }

  lastScrollPosition = currentScroll <= 0 ? 0 : currentScroll;
}, { passive: true });

// ================= INICIALIZACIÓN =================
document.addEventListener('DOMContentLoaded', () => {
  charactersData = [createDefaultCharacter("PJ 1")];
  renderParty();

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
    }
  });
});
