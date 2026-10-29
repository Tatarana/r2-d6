// views/mesa.js - modo mesa: round, pontos, ferimentos, municao, calculadora, rolador e historico.
import { h, stepper, toast, clear } from '../util.js';
import { parse, format, roll, rollFromValues, rollCP, validWildSeq, defaultRng, add, toPips, fromPips } from '../dice.js';
import * as R from '../rules.js';
import { toDie } from '../store.js';
import { activeChar, mutate, pushHistory, prefs, setPref } from '../state.js';
import { D, skillName, pageText } from '../data.js';
import { houseSeal } from '../seals.js';
import { openRef } from '../layout.js';
import { ruleSectionNode } from './reference.js';

// ------------------------------------------------------------------ estado local da UI (nao persistido)
const ui = {
  target: null,           // {key,label,base,rollType}
  rollType: null,
  mode: 'digital',        // digital | physical
  result: null,           // {roll, hid, choice}
  cp: { total: 0, count: 0, dice: [] },
  bonus: '',
  difficulty: '',
  phys: { normals: '', wild: '', pips: '' },
  cpPhys: '',
  woundNote: '',
  woundStun: false,
  mortal: null,
  calc: { damage: '', resist: '', armor: '', dtype: 'energy', atk: 'character', tgt: 'character', rollTotal: null },
  wake: null,
};

const rnd = () => `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const roundOf = (c) => c.x_app.round;
const WOUND_LABEL = { healthy: 'Healthy', stunned: 'Stunned', wounded: 'Wounded', 'wounded-twice': 'Wounded twice', incapacitated: 'Incapacitated', 'mortally-wounded': 'Mortally Wounded', killed: 'Killed' };
const penaltyOf = (c) => {
  const r = roundOf(c);
  return { actions: Math.max(0, r.actions - 1), wound: R.woundPenaltyDice(c.wound_status), stuns: R.stunPenaltyCount(r.stuns, r.n) };
};

// ------------------------------------------------------------------ alvos de rolagem
function targetsOf(c) {
  const groups = [];
  groups.push({ title: 'Atributos', items: R.ATTRS.map((a) => ({ key: `a:${a}`, label: `${R.ATTR_ABBR[a]} ${a}`, base: parse(c.attributes[a].value), rollType: 'attribute' })) });
  const skills = [], specs = [];
  for (const a of R.ATTRS) for (const s of c.attributes[a].skills || []) {
    const sk = D.maps.skills.get(s.skill);
    const isReaction = sk && (sk.tags || []).includes('reaction');
    skills.push({ key: `s:${s.skill}`, label: sk ? sk.name + (sk.advanced ? ' (A)' : '') : s.skill, base: parse(s.value), rollType: isReaction ? 'reaction' : 'skill', skillId: s.skill });
    for (const sp of s.specializations || []) specs.push({ key: `p:${s.skill}:${sp.name}`, label: `${sk ? sk.name : s.skill}: ${sp.name}`, base: parse(sp.value), rollType: 'specialization', skillId: s.skill });
  }
  if (skills.length) groups.push({ title: 'Perícias', items: skills });
  if (specs.length) groups.push({ title: 'Especializações', items: specs });
  const fa = c.force_attributes || {};
  const force = R.FORCE_SKILLS.filter((f) => fa[f] && (fa[f].dice || fa[f].pips)).map((f) => ({ key: `f:${f}`, label: `Force: ${f}`, base: parse(fa[f]), rollType: 'skill' }));
  if (force.length) groups.push({ title: 'Força', items: force });
  groups.push({ title: 'Atalhos', items: [
    { key: 'i', label: 'Iniciativa (PER)', base: parse(c.attributes.perception.value), rollType: 'initiative' },
    { key: 'r', label: 'Resistir dano (STR)', base: parse(c.attributes.strength.value), rollType: 'resist' },
    { key: 'd', label: 'Dano (STR + arma)', base: parse(c.attributes.strength.value), rollType: 'damage' },
  ] });
  return groups;
}

/** Dano de arma: "STR+1D" soma Strength; "4D" (blaster) e dano fixo da arma, sem Strength (US-06). */
export function parseWeaponDamage(text) {
  const t = String(text || '').trim();
  const m = t.match(/^STR(?:\s*\+\s*(\d+D(?:\s*\+\s*\d+)?|\d+))?/i);
  if (m) return { str: true, bonus: m[1] ? (/D/i.test(m[1]) ? m[1].replace(/\s+/g, '') : `+${m[1]}`) : '' };
  if (/^\d+D(\s*\+\s*\d+)?$/i.test(t)) return { str: false, bonus: t.replace(/\s+/g, '') };
  return null;
}

function poolFor(c, target, rollType, bonus) {
  const r = roundOf(c);
  if (rollType === 'damage' && ui.dmgNoStr) target = { ...target, base: { dice: 0, pips: 0 } };
  return R.effectivePool({ base: target.base, actionsDeclared: r.actions, woundState: c.wound_status,
    activeStuns: R.stunPenaltyCount(r.stuns, r.n), forcePoint: r.fpUsed, rollType, bonus: rollType === 'damage' && bonus ? bonus : null });
}

// ------------------------------------------------------------------ acoes (tambem usadas por atalhos de teclado)
export function spendFP(c) {
  const r = roundOf(c);
  const chk = R.canSpendFP(r, c.force_points);
  if (!chk.ok) { toast(`${chk.reason} (${chk.cite})`, 'err'); return false; }
  mutate((x) => { x.force_points -= 1; x.x_app.round.fpUsed = true; pushHistory(x, { kind: 'fp', label: 'Force Point gasto', detail: 'Dobra os códigos do personagem até o fim do round (p.85).' }); });
  return true;
}
export function undoFP() {
  mutate((x) => { if (x.x_app.round.fpUsed) { x.x_app.round.fpUsed = false; x.force_points += 1; pushHistory(x, { kind: 'fp', label: 'Force Point devolvido (desfeito)' }); } });
}
export function goNextRound() {
  const c = activeChar(); if (!c) return;
  mutate((x) => {
    const mortal = x.wound_status === 'mortally-wounded';
    x.x_app.round = R.nextRound(x.x_app.round);
    if (mortal) x.x_app.round.mortalRounds = (x.x_app.round.mortalRounds || 0) + 1; // RD-25
    pushHistory(x, { kind: 'round', label: `Round ${x.x_app.round.n}`, detail: 'CP e FP liberados; ações = 1.' });
  });
  ui.result = null; ui.cp = { total: 0, count: 0, dice: [] };
}
export function setActions(n) { mutate((x) => { x.x_app.round.actions = Math.max(1, Math.min(9, n)); }); }
export function triggerRoll() { const b = document.getElementById('btn-roll'); if (b && !b.disabled) b.click(); }

function doRoll(c, pool, valuesOverride) {
  let r;
  try {
    r = valuesOverride || roll(pool.code, defaultRng);
  } catch (e) { toast(e.message, 'err'); return; }
  const hid = rnd();
  ui.result = { roll: r, hid, choice: r.wildOne ? null : 'normal', label: ui.target.label, poolText: pool.text, rollType: ui.rollType || ui.target.rollType, mode: ui.mode };
  ui.cp = { total: 0, count: 0, dice: [] };
  mutate((x) => pushHistory(x, { kind: 'roll', hid, label: ui.target.label, pool: pool.text, total: r.totals.normal, detail: describe(r, 'normal', 0), mode: ui.mode }));
}

const finalTotal = () => {
  const res = ui.result;
  return res.roll.totals[res.choice || 'normal'] + ui.cp.total;
};

function describe(r, choice, cp) {
  const w = r.wild.join('→');
  return `dados ${r.normals.join(',') || '-'} | wild ${w}${r.pips ? ` | +${r.pips}` : ''}${r.wildOne ? ` | Wild 1 (${choice || 'pendente'})` : ''}${cp ? ` | CP +${cp}` : ''}`;
}

function updateHistory(c) {
  if (!ui.result) return;
  const res = ui.result;
  mutate((x) => {
    const e = (x.x_app.history || []).find((i) => i.hid === res.hid);
    if (e) { e.total = finalTotal(); e.detail = describe(res.roll, res.choice, ui.cp.total) + (res.choice === 'complication' ? ' | COMPLICAÇÃO' : ''); }
  });
}

// ------------------------------------------------------------------ componentes: dados
function die(n, kind, extra) {
  const label = kind === 'wild' ? `Wild Die ${n}` : kind === 'cp' ? `dado de CP ${n}` : `dado ${n}`;
  return h('span', { class: `die ${kind || ''} ${extra || ''}`, role: 'img', 'aria-label': label, title: label }, kind === 'wild' ? h('span', { class: 'wl' }, 'W') : null, String(n));
}

function resultCard(c) {
  const res = ui.result;
  if (!res) return null;
  const r = res.roll;
  const chosen = res.choice;
  const total = chosen || !r.wildOne ? finalTotal() : null;
  const diff = parseInt(ui.difficulty, 10);
  const choiceBtn = (id, label, hint) => h('button', { class: 'btn big', type: 'button', onclick: () => { res.choice = id; updateHistory(c); } }, h('strong', null, label), h('small', null, hint));
  return h('section', { class: 'card result', 'aria-live': 'polite' },
    h('div', { class: 'dicerow' },
      r.normals.map((n) => die(n)),
      h('span', { class: 'wildseq', 'aria-label': 'Sequência do Wild Die' }, r.wild.map((n, i) => [i ? h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→') : null, die(n, 'wild', n === 6 ? 'explode' : (i === 0 && n === 1 ? 'one' : ''))])),
      r.pips ? h('span', { class: 'pipsbadge' }, `+${r.pips}`) : null,
      ui.cp.dice.map((seq) => h('span', { class: 'cpseq' }, seq.map((n, i) => [i ? h('span', { class: 'arrow' }, '→') : null, die(n, 'cp')])))),
    r.wildOne && !chosen ? h('div', { class: 'gm-choice' },
      h('p', null, h('strong', null, 'Wild Die = 1.'), ` Total normal ${r.totals.normal}. O mestre decide (p.73):`),
      h('div', { class: 'row wrapr' },
        choiceBtn('normal', `(a) Somar normal: ${r.totals.normal}`, 'sem consequência'),
        choiceBtn('complication', `(b) Normal + complicação: ${r.totals.complication}`, 'algo dá errado'),
        choiceBtn('subtract', `(c) Subtrair o 1 e o maior: ${r.totals.subtract}`, r.normals.length ? '' : 'parada 1D: só tira o 1')),
      !r.normals.length ? houseSeal('RD-04') : null) : null,
    total != null ? h('div', { class: 'total' }, h('span', { class: 'tnum' }, String(total)),
      h('span', { class: 'tlab' }, `${res.label} · parada ${res.poolText}${ui.cp.total ? ` · CP +${ui.cp.total}` : ''}`),
      chosen === 'complication' ? h('span', { class: 'seal warn' }, 'complicação') : null,
      chosen === 'subtract' ? h('span', { class: 'seal' }, 'subtraído (c)') : null) : null,
    total != null && Number.isFinite(diff) && diff > 0 ? (() => {
      const ok = total >= diff;
      const lvl = R.difficultyLevel(diff, D.bundle.tables['difficulty-numbers'].levels);
      return h('p', { class: ok ? 'ok' : 'bad' }, `${ok ? 'Sucesso' : 'Falha'}: ${total} ${ok ? '>=' : '<'} ${diff}${lvl ? ` (${lvl.name})` : ''}. `,
        h('a', { href: '#/regras/errata/E-023' }, 'E-023'), ' (ataques: >=, p.89)');
    })() : null);
}

// ------------------------------------------------------------------ painel de rolagem
function rollPanel(c) {
  if (!ui.target) return h('section', { class: 'card roller empty' }, h('h3', null, 'Rolador'), h('p', { class: 'muted' }, 'Toque numa perícia, atributo ou atalho para ver a parada efetiva e rolar.'));
  const t = ui.target;
  const rollType = ui.rollType || t.rollType;
  const pool = poolFor(c, t, rollType, ui.bonus);
  const r = roundOf(c);
  const fpChk = R.canSpendFP(r, c.force_points, rollType);
  const cpSpentHere = ui.cp.count;
  const cpChk = R.canSpendCP(r, rollType, cpSpentHere, c.character_points);
  const limit = R.cpLimit(rollType);
  const phys = ui.mode === 'physical';
  const nNormals = Math.max(0, pool.code.dice - 1);

  const typeSel = h('select', { 'aria-label': 'Tipo de rolagem', onchange: (e) => { ui.rollType = e.target.value; mutate(() => {}); } },
    [['skill', 'Perícia'], ['attribute', 'Atributo'], ['specialization', 'Especialização'], ['reaction', 'Reação (esquiva/aparar)'], ['damage', 'Dano'], ['resist', 'Resistir dano'], ['initiative', 'Iniciativa']]
      .map(([v, l]) => h('option', { value: v, selected: v === rollType }, l)));

  const physInputs = phys ? h('div', { class: 'phys' },
    h('label', { class: 'fld' }, h('span', null, `Dados normais (${nNormals}), separados por vírgula`), h('input', { id: 'phys-normals', inputMode: 'numeric', placeholder: nNormals ? '3,4,2' : '(nenhum)', value: ui.phys.normals, oninput: (e) => { ui.phys.normals = e.target.value; } })),
    h('label', { class: 'fld' }, h('span', null, 'Wild Die (sequência: 6,6,3)'), h('input', { id: 'phys-wild', inputMode: 'numeric', placeholder: '2', value: ui.phys.wild, oninput: (e) => { ui.phys.wild = e.target.value; } })),
    h('button', { class: 'btn primary big', id: 'btn-roll', type: 'button', disabled: !pool.usable, onclick: () => {
      const nums = (s) => s.split(/[\s,;.]+/).filter(Boolean).map(Number);
      const normals = nNormals ? nums(ui.phys.normals) : [];
      const wild = nums(ui.phys.wild);
      if (normals.length !== nNormals || normals.some((v) => !Number.isInteger(v) || v < 1 || v > 6)) { toast(`Informe ${nNormals} dado(s) normal(is) entre 1 e 6.`, 'err'); return; }
      if (!validWildSeq(wild)) { toast('Wild Die: sequência inválida (6 repete; termina em 1-5).', 'err'); return; }
      doRoll(c, pool, rollFromValues(normals, wild, pool.code.pips));
    } }, 'Calcular (dados físicos)')) : null;

  return h('section', { class: 'card roller' },
    h('div', { class: 'row between wrapr' }, h('h3', null, t.label), typeSel),
    h('div', { class: `pool ${pool.usable ? '' : 'blocked'}` }, h('span', { class: 'pnum' }, pool.text), h('span', { class: 'plab' }, pool.usable ? 'parada efetiva' : 'não pode ser usada')),
    h('div', { class: 'row wrapr' },
      r.fpUsed && r.actions > 1 ? houseSeal('RD-14') : null,
      pool.lines.some((l) => l.includes('RD-08')) ? houseSeal('RD-08') : null,
      R.stunPenaltyCount(r.stuns, r.n) && R.woundPenaltyDice(c.wound_status) ? houseSeal('RD-21') : null),
    h('details', { class: 'explain' }, h('summary', null, 'Como chegou a essa parada'), h('ul', null, pool.lines.map((l) => h('li', null, l)))),
    rollType === 'damage' ? h('div', { class: 'card' },
      h('label', { class: 'fld' }, h('span', null, 'Arma da ficha'), h('select', { 'aria-label': 'Arma da ficha', onchange: (e) => {
        const w = c.weapons[Number(e.target.value)]; const p = w && parseWeaponDamage(w.damage);
        if (p) { ui.bonus = p.bonus; ui.dmgNoStr = !p.str; } else if (w) toast('Dano da arma não reconhecido; digite abaixo.', 'err');
        mutate(() => {}); } }, h('option', { value: '' }, '(escolha)'), c.weapons.map((w, i) => h('option', { value: i }, `${w.type} ${w.damage || ''}`)))),
      h('label', { class: 'fld' }, h('span', null, 'Dano da arma (somado sem dobrar com FP, RD-13)'), h('input', { value: ui.bonus, placeholder: '2D', oninput: (e) => { ui.bonus = e.target.value; }, onchange: () => mutate(() => {}) })),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!ui.dmgNoStr, onchange: (e) => { ui.dmgNoStr = e.target.checked; mutate(() => {}); } }), ' Arma de dano fixo (blaster): não soma a Strength')) : null,
    h('div', { class: 'row wrapr' },
      r.fpUsed
        ? h('button', { class: 'btn on', type: 'button', onclick: undoFP, title: 'Desfazer o Force Point deste round' }, 'FP ativo (desfazer)')
        : h('button', { class: 'btn', type: 'button', disabled: !fpChk.ok, title: fpChk.ok ? '' : `${fpChk.reason} (${fpChk.cite})`, onclick: () => spendFP(c) }, `Force Point (${c.force_points})`),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Modo' },
        h('button', { class: `btn${!phys ? ' on' : ''}`, type: 'button', onclick: () => { ui.mode = 'digital'; mutate(() => {}); } }, 'Digital'),
        h('button', { class: `btn${phys ? ' on' : ''}`, type: 'button', onclick: () => { ui.mode = 'physical'; mutate(() => {}); } }, 'Dados físicos'))),
    !fpChk.ok && !r.fpUsed ? h('p', { class: 'hint' }, `${fpChk.reason} (${fpChk.cite})`) : null,
    phys ? physInputs : h('button', { class: 'btn primary big', id: 'btn-roll', type: 'button', disabled: !pool.usable, onclick: () => doRoll(c, pool) }, pool.usable ? `Rolar ${pool.text}` : 'Sem dados para rolar'),
    h('label', { class: 'fld inline' }, h('span', null, 'Dificuldade (opcional)'), h('input', { type: 'number', min: 1, inputMode: 'numeric', value: ui.difficulty, oninput: (e) => { ui.difficulty = e.target.value; }, onchange: () => mutate(() => {}) })),
    resultCard(c),
    ui.result ? cpControls(c, rollType, limit, cpChk) : null);
}

function cpControls(c, rollType, limit, cpChk) {
  const r = roundOf(c);
  if (limit === 0) return h('p', { class: 'hint' }, 'Iniciativa não aceita CP nem FP (p.78).');
  const spend = (seq) => {
    const check = R.canSpendCP(r, rollType, ui.cp.count, c.character_points);
    if (!check.ok) { toast(`${check.reason} (${check.cite})`, 'err'); return; }
    ui.cp.dice.push(seq); ui.cp.count += 1; ui.cp.total += seq.reduce((a, b) => a + b, 0);
    mutate((x) => { x.character_points -= 1; x.x_app.round.cpSpent += 1; });
    updateHistory(c);
  };
  const phys = ui.mode === 'physical';
  return h('div', { class: 'cp' },
    h('div', { class: 'row between wrapr' },
      h('strong', null, `Character Points: ${ui.cp.count}/${limit} nesta rolagem`),
      h('span', { class: 'muted' }, `saldo ${c.character_points}`)),
    phys
      ? h('div', { class: 'row wrapr' }, h('input', { 'aria-label': 'Dado de CP (ex.: 6,3)', placeholder: 'dado de CP: 6,3', value: ui.cpPhys, oninput: (e) => { ui.cpPhys = e.target.value; } }),
        h('button', { class: 'btn', type: 'button', disabled: !cpChk.ok, onclick: () => {
          const seq = ui.cpPhys.split(/[\s,;.]+/).filter(Boolean).map(Number);
          if (!seq.length || !seq.every((v) => v >= 1 && v <= 6) || seq.slice(0, -1).some((v) => v !== 6) || seq[seq.length - 1] === 6) { toast('Dado de CP: 6 repete; termina em 1-5.', 'err'); return; }
          ui.cpPhys = ''; spend(seq);
        } }, '+ somar CP'))
      : h('button', { class: 'btn', type: 'button', disabled: !cpChk.ok, onclick: () => spend(rollCP(1, defaultRng).dice[0]) }, '+1 CP (rolar dado)'),
    !cpChk.ok ? h('p', { class: 'hint' }, `${cpChk.reason} (${cpChk.cite || ''})`) : null,
    h('p', { class: 'muted small' }, 'Dado de CP: 6 explode; um 1 vale 1, sem complicação ', h('a', { href: '#/regras/errata/E-009' }, 'E-009'), ' (leitura provisória).'));
}

function targetList(c) {
  const hit = (t) => h('button', { class: `tbtn${ui.target && ui.target.key === t.key ? ' on' : ''}`, type: 'button', onclick: () => {
    ui.target = t; ui.rollType = null; ui.result = null; ui.cp = { total: 0, count: 0, dice: [] };
    mutate(() => {});
    document.getElementById('roller-anchor')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } }, h('span', { class: 'tl' }, t.label), h('span', { class: 'tv' }, poolFor(c, t, t.rollType, '').usable ? poolFor(c, t, t.rollType, '').text : '—'));
  return h('div', { class: 'targets' }, targetsOf(c).map((g) => h('section', null, h('h4', null, g.title), h('div', { class: 'tgrid' }, g.items.map(hit)))));
}

function historyCard(c) {
  const hist = c.x_app.history || [];
  return h('section', { class: 'card' }, h('h3', null, 'Histórico (últimas 20)'),
    hist.length ? h('ol', { class: 'hist' }, hist.map((e) => h('li', null, h('span', { class: 'hr' }, `R${e.round}`), ' ', h('strong', null, e.label), e.pool ? ` ${e.pool}` : '', e.total != null ? h('span', { class: 'ht' }, ` = ${e.total}`) : '', e.detail ? h('div', { class: 'muted small' }, e.detail) : null)))
      : h('p', { class: 'muted' }, 'Sem rolagens ainda.'));
}

// ------------------------------------------------------------------ cartoes de estado
function roundCard(c) {
  const r = roundOf(c), p = penaltyOf(c);
  return h('section', { class: 'card' },
    h('div', { class: 'row between wrapr' }, h('h3', null, `Round ${r.n}`),
      h('button', { class: 'btn primary', type: 'button', onclick: goNextRound, title: 'Atalho: N' }, 'Próximo round')),
    h('div', { class: 'row between wrapr' }, h('span', null, 'Ações declaradas'), stepper(r.actions, setActions, { min: 1, max: 9, label: 'ações declaradas' })),
    h('p', { class: 'penalty' }, r.actions > 1 ? `-${p.actions}D em toda perícia e atributo (não vale em dano, resistência nem iniciativa) (p.78)` : 'Sem penalidade de ações.'),
    h('p', { class: 'muted small' }, r.fpUsed ? 'Force Point ativo: CP bloqueado até o próximo round (p.78, p.84).' : r.cpSpent ? `CP gastos no round: ${r.cpSpent}. Force Point bloqueado até o próximo round.` : 'CP e FP livres neste round (não se usa os dois no mesmo round).'));
}

function pointsCard(c) {
  const adj = (key, label, min = 0) => h('div', { class: 'row between wrapr' }, h('span', null, label),
    stepper(c[key], (v) => {
      if (key === 'force_points' && v > c[key]) { const chk = R.canAddFP(c[key], c.force_sensitive); if (!chk.ok) { toast(`${chk.reason} (${chk.cite})`, 'err'); return; } }
      mutate((x) => { x[key] = Math.max(min, v); });
    }, { min, label }));
  return h('section', { class: 'card' }, h('h3', null, 'Pontos'),
    adj('character_points', 'Character Points'), adj('force_points', 'Force Points'), adj('dark_side_points', 'Dark Side Points'),
    h('p', { class: 'muted small' }, c.force_sensitive ? 'Sensível à Força: sem limite de FP.' : 'Não sensível: máximo de 5 FP (p.85).'));
}

const RESULTS = [['stunned', 'Stunned'], ['wounded', 'Wounded'], ['incapacitated', 'Incapacitated'], ['mortally-wounded', 'Mortally Wounded'], ['killed', 'Killed']];
const HEAL = { killed: 'killed', 'mortally-wounded': 'incapacitated', incapacitated: 'wounded-twice', 'wounded-twice': 'wounded', wounded: 'healthy', healthy: 'healthy' };

function woundCard(c) {
  const r = roundOf(c), p = penaltyOf(c);
  const strDice = parse(c.attributes.strength.value).dice;
  const affecting = c.x_app.stunsAffecting || 0;
  const unc = R.stunUnconscious(affecting, strDice);
  const total = p.wound + p.stuns;
  const apply = (res) => {
    const out = R.applyWound(c.wound_status, res, { stunWeapon: ui.woundStun });
    ui.woundNote = out.note || '';
    mutate((x) => {
      x.wound_status = out.status;
      if (out.addStun) { x.x_app.round.stuns = [...(x.x_app.round.stuns || []), x.x_app.round.n]; x.x_app.stunsAffecting = (x.x_app.stunsAffecting || 0) + 1; }
      if (out.status === 'mortally-wounded' && c.wound_status !== 'mortally-wounded') x.x_app.round.mortalRounds = 0;
      pushHistory(x, { kind: 'wound', label: `Resultado: ${WOUND_LABEL[res]}`, detail: `${out.status}${out.unconscious2D ? ' | inconsciente 2D minutos' : ''}${out.house ? ' | regra da casa RD-19' : ''}` });
    });
    if (out.unconscious2D) toast('Arma em stun: inconsciente por 2D minutos, sem ferimento (p.101).');
    if (out.house) toast('Regra da casa RD-19 aplicada.');
  };
  return h('section', { class: 'card' }, h('h3', null, 'Ferimentos'),
    h('div', { class: `status-chip ${c.wound_status}` }, WOUND_LABEL[c.wound_status], total ? h('small', null, ` · -${total}D`) : null),
    R.cannotAct(c.wound_status) ? h('p', { class: 'bad' }, c.wound_status === 'killed' ? 'Personagem morto.' : 'Não pode agir (RD-20).') : null,
    h('p', { class: 'muted small' }, `Ferimento: -${p.wound}D · Stuns ativos: ${p.stuns} (-${p.stuns}D). Resistência a dano usa Strength cheia (p.80).`),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: ui.woundStun, onchange: (e) => { ui.woundStun = e.target.checked; mutate(() => {}); } }), ' Arma em stun (RD-26)'),
    h('div', { class: 'row wrapr' }, RESULTS.map(([id, lab]) => h('button', { class: 'btn', type: 'button', onclick: () => apply(id) }, lab))),
    c.wound_status === 'mortally-wounded' ? h('p', { class: 'hint' }, 'Mortally Wounded + Wounded = Killed é regra da casa. ', houseSeal('RD-19')) : null,
    ui.woundNote ? h('p', { class: 'hint' }, ui.woundNote) : null,
    h('div', { class: 'row wrapr' },
      h('button', { class: 'btn', type: 'button', onclick: () => mutate((x) => { x.wound_status = HEAL[x.wound_status]; }) }, 'Curar 1 nível'),
      h('button', { class: 'btn', type: 'button', onclick: () => mutate((x) => { x.wound_status = 'healthy'; x.x_app.round.stuns = []; x.x_app.stunsAffecting = 0; x.x_app.round.mortalRounds = 0; }) }, 'Healthy')),
    h('h4', null, 'Stuns'),
    h('div', { class: 'row between wrapr' }, h('span', null, `Afetando: ${affecting}`),
      h('span', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => apply('stunned') }, '+1 stun'),
        h('button', { class: 'btn', type: 'button', onclick: () => mutate((x) => { x.x_app.stunsAffecting = 0; x.x_app.round.stuns = []; }) }, 'Descansou 1 min'))),
    unc.unconscious ? h('p', { class: 'bad' }, `Inconsciente por ${unc.minutes} (stuns ${affecting} >= ${unc.threshold} da Strength) (p.100).`) : h('p', { class: 'muted small' }, `Inconsciente com ${strDice} stuns afetando (Strength ${c.attributes.strength.value.text}) (p.100).`),
    h('p', { class: 'muted small' }, houseSeal('RD-21'), ' stuns e ferimento somam penalidades.'));
}

function mortalCard(c) {
  if (c.wound_status !== 'mortally-wounded') return null;
  const r = roundOf(c);
  const rounds = r.mortalRounds || 0;
  const check = (v) => {
    const res = R.mortalCheck(v, Math.max(1, rounds));
    ui.mortal = res;
    mutate((x) => { if (res.dies) x.wound_status = 'killed'; pushHistory(x, { kind: 'mortal', label: 'Mortally Wounded: 2D', total: v, detail: res.dies ? `${v} < ${rounds}: morre` : `${v} >= ${rounds}: sobrevive` }); });
  };
  return h('section', { class: 'card danger-card' }, h('h3', null, 'Mortally Wounded'),
    h('div', { class: 'row between wrapr' }, h('span', null, 'Rounds nesse estado'), stepper(rounds, (v) => mutate((x) => { x.x_app.round.mortalRounds = Math.max(0, v); }), { min: 0, label: 'rounds em Mortally Wounded' })),
    h('p', { class: 'muted small' }, 'Ao fim de cada round role 2D: se for menor que o número de rounds, morre (p.101). O contador sobe em “Próximo round”.'),
    h('div', { class: 'row wrapr' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => check(roll('2D', defaultRng).totals.normal) }, 'Rolar 2D'),
      h('input', { id: 'mortal-in', type: 'number', min: 2, max: 12, placeholder: 'dados físicos', 'aria-label': 'Resultado de 2D físico', inputMode: 'numeric' }),
      h('button', { class: 'btn', type: 'button', onclick: () => { const v = parseInt(document.getElementById('mortal-in').value, 10); if (v >= 2 && v <= 12) check(v); else toast('Informe 2 a 12.', 'err'); } }, 'Usar valor')),
    ui.mortal ? h('p', { class: ui.mortal.dies ? 'bad' : 'ok' }, `2D = ${ui.mortal.roll} contra ${ui.mortal.rounds} round(s): ${ui.mortal.dies ? 'MORRE' : 'sobrevive'}.`) : null);
}

function ammoCard(c) {
  const ws = c.weapons.filter((w) => w.type);
  if (!ws.length) return h('section', { class: 'card' }, h('h3', null, 'Munição'), h('p', { class: 'muted' }, 'Nenhuma arma na ficha.'));
  return h('section', { class: 'card' }, h('h3', null, 'Munição'), ws.map((w) => {
    const max = w.ammo_max || 0, used = w.ammo_used || 0, left = Math.max(0, max - used);
    let timer = null, longPress = false;
    const fire = () => { if (max && used >= max) { toast('Sem munição: recarregue.', 'err'); return; } mutate(() => { w.ammo_used = used + 1; }); };
    const reload = () => mutate(() => { w.ammo_used = 0; toast(`${w.type} recarregada.`); });
    return h('div', { class: 'ammo-row' },
      h('div', null, h('strong', null, w.type), ' ', h('span', { class: 'muted' }, `${w.damage || ''} ${w.range || ''}`)),
      h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': left, 'aria-label': `Munição de ${w.type}` }, h('i', { style: `width:${max ? (left / max) * 100 : 0}%` })),
      h('div', { class: 'row between wrapr' }, h('span', null, max ? `${left}/${max} restantes` : `${used} tiros`),
        h('span', { class: 'row' },
          h('button', { class: 'btn big', type: 'button', title: 'Toque: 1 tiro. Segure: recarregar.',
            onpointerdown: () => { longPress = false; timer = setTimeout(() => { longPress = true; reload(); }, 700); },
            onpointerup: () => { clearTimeout(timer); }, onpointerleave: () => clearTimeout(timer), onpointercancel: () => clearTimeout(timer),
            onclick: (ev) => { if (longPress) { ev.preventDefault(); return; } fire(); },
            onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fire(); } } }, '+1 tiro'),
          h('button', { class: 'btn', type: 'button', onclick: () => mutate(() => { w.ammo_used = Math.max(0, used - 1); }) }, '−1'),
          h('button', { class: 'btn', type: 'button', onclick: reload }, 'Recarregar'))));
  }));
}

// ------------------------------------------------------------------ calculadora dano x resistencia
function armorBonus(c, itemId, dtype) {
  const a = D.maps.armor.get(itemId);
  const v = a && a.protection && a.protection[dtype];
  return v ? parse(v) : { dice: 0, pips: 0 };
}

function calcCard(c) {
  const k = ui.calc;
  const scales = D.bundle.tables['combat-modifiers'].scale;
  const adj = R.scaleAdjust(k.atk, k.tgt, scales);
  const armorItems = c.armor.filter((a) => a.item);
  const strCode = parse(c.attributes.strength.value);
  const bonus = k.armor ? armorBonus(c, k.armor, k.dtype) : { dice: 0, pips: 0 };
  let resistCode = { dice: strCode.dice + bonus.dice, pips: strCode.pips + bonus.pips };
  if (adj.resistBonus) resistCode = { dice: resistCode.dice + adj.resistBonus.dice, pips: resistCode.pips + adj.resistBonus.pips };
  const resistPool = R.effectivePool({ base: strCode, forcePoint: roundOf(c).fpUsed, rollType: 'resist', bonus: (toPips(bonus) + (adj.resistBonus ? toPips(adj.resistBonus) : 0)) > 0 ? fromPips(toPips(bonus) + (adj.resistBonus ? toPips(adj.resistBonus) : 0)) : null });
  const dmg = parseInt(k.damage, 10), res = parseInt(k.resist, 10);
  const diff = Number.isFinite(dmg) && Number.isFinite(res) ? dmg - res : null;
  const outcome = diff == null ? null : R.damageResult(diff);
  const sel = (key, opts, labelText) => h('label', { class: 'fld' }, h('span', null, labelText),
    h('select', { onchange: (e) => { k[key] = e.target.value; mutate(() => {}); } }, opts.map(([v, l]) => h('option', { value: v, selected: v === k[key] }, l))));
  const scaleOpts = scales.order.map((s) => [s, s]);
  return h('section', { class: 'card' }, h('h3', null, 'Dano × resistência'),
    h('div', { class: 'grid2' },
      sel('atk', scaleOpts, 'Escala do atacante'), sel('tgt', scaleOpts, 'Escala do alvo'),
      sel('dtype', [['energy', 'Energia'], ['physical', 'Física']], 'Tipo de ataque'),
      sel('armor', [['', '(sem armadura)'], ...armorItems.map((a) => [a.item, a.type])], 'Armadura')),
    h('p', { class: 'muted small' }, adj.direction === 'same' ? 'Mesma escala: sem ajuste.' :
      `Ajuste de escala ${adj.adjustText}: ${adj.direction === 'higher-attacks-lower' ? `maior ataca menor; alvo soma ${adj.adjustText} na esquiva; atacante soma ${adj.adjustText} no dano` : `menor ataca maior; atacante soma ${adj.adjustText} no ataque; alvo soma ${adj.adjustText} na resistência`} (p.95).`),
    h('p', null, `Resistência: Strength cheia ${format(strCode)} + armadura ${format(bonus)}${adj.resistBonus ? ` + escala ${adj.adjustText}` : ''} = `, h('strong', null, resistPool.text)),
    h('div', { class: 'row wrapr' },
      h('button', { class: 'btn', type: 'button', onclick: () => { const rr = roll(resistPool.code, defaultRng); k.resist = String(rr.totals.normal); ui.calcNote = `Wild Die: ${rr.wild.join('→')}${rr.wildOne ? ' (1: decisão do mestre; total normal usado)' : ''}`; mutate(() => {}); } }, `Rolar resistência (${resistPool.text})`),
      h('label', { class: 'fld inline' }, h('span', null, 'Dano'), h('input', { type: 'number', inputMode: 'numeric', value: k.damage, oninput: (e) => { k.damage = e.target.value; }, onchange: () => mutate(() => {}) })),
      h('label', { class: 'fld inline' }, h('span', null, 'Resistência'), h('input', { type: 'number', inputMode: 'numeric', value: k.resist, oninput: (e) => { k.resist = e.target.value; }, onchange: () => mutate(() => {}) }))),
    ui.calcNote ? h('p', { class: 'muted small' }, ui.calcNote) : null,
    diff != null ? h('div', { class: 'row between wrapr' },
      h('p', null, `Diferença ${diff}: `, h('strong', null, outcome === 'none' ? 'sem efeito' : WOUND_LABEL[outcome]), ' (p.100)'),
      outcome !== 'none' ? h('button', { class: 'btn primary', type: 'button', onclick: () => {
        const out = R.applyWound(c.wound_status, outcome, { stunWeapon: ui.woundStun });
        ui.woundNote = out.note || '';
        mutate((x) => {
          x.wound_status = out.status;
          if (out.addStun) { x.x_app.round.stuns = [...(x.x_app.round.stuns || []), x.x_app.round.n]; x.x_app.stunsAffecting = (x.x_app.stunsAffecting || 0) + 1; }
          pushHistory(x, { kind: 'wound', label: `Dano ${dmg} vs ${res}: ${WOUND_LABEL[outcome]}`, detail: out.status });
        });
      } }, 'Aplicar à ficha') : null) : null);
}

function referenceCard() {
  const lv = D.bundle.tables['difficulty-numbers'].levels;
  return h('section', { class: 'card' }, h('h3', null, 'Referência rápida'),
    h('table', { class: 'mini' }, h('tbody', null, lv.map((l) => h('tr', null, h('th', null, l.name), h('td', null, l.max ? `${l.min}-${l.max}` : `${l.min}+`))))),
    h('p', { class: 'muted small' }, 'Sucesso: total >= dificuldade (p.75). Reação normal substitui a dificuldade; reação total soma (p.91).'),
    h('div', { class: 'row wrapr' },
      h('button', { class: 'linkbtn', type: 'button', onclick: () => openRef('rules', 'combat-injuries/attack-steps') }, 'Ataque em 4 passos'),
      h('button', { class: 'linkbtn', type: 'button', onclick: () => openRef('rules', 'combat-injuries/reactions') }, 'Reações'),
      h('button', { class: 'linkbtn', type: 'button', onclick: () => openRef('rules', 'core-mechanics/multiple-actions') }, 'Ações múltiplas'),
      h('button', { class: 'linkbtn', type: 'button', onclick: () => openRef('rules', 'combat-injuries/damage') }, 'Dano e ferimentos')));
}

function wakeToggle() {
  if (!('wakeLock' in navigator)) return null;
  const on = !!prefs().wake;
  return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: on, onchange: async (e) => {
    setPref('wake', e.target.checked);
    await applyWake(e.target.checked);
  } }), ' Manter a tela ligada');
}
export async function applyWake(on) {
  try {
    if (on && !ui.wake) { ui.wake = await navigator.wakeLock.request('screen'); ui.wake.addEventListener('release', () => { ui.wake = null; }); }
    if (!on && ui.wake) { await ui.wake.release(); ui.wake = null; }
  } catch { toast('Não foi possível manter a tela ligada.', 'err'); }
}

// ------------------------------------------------------------------ view
export function mesaView(root, focus = 'mesa') {
  const c = activeChar();
  if (!c) {
    root.append(h('div', { class: 'view' }, h('div', { class: 'empty' }, h('h2', null, 'Modo mesa'), h('p', null, 'Escolha ou crie um personagem para usar o modo mesa.'),
      h('a', { class: 'btn primary', href: '#/criar' }, 'Criar personagem'), ' ', h('a', { class: 'btn', href: '#/personagens' }, 'Meus personagens'))));
    return;
  }
  const stateCol = h('div', { class: 'col state' },
    h('div', { class: 'row between wrapr' }, h('h2', null, c.name), wakeToggle()),
    roundCard(c), woundCard(c), mortalCard(c), pointsCard(c), ammoCard(c), calcCard(c), referenceCard());
  const rollCol = h('div', { class: 'col roll' },
    targetList(c), h('div', { id: 'roller-anchor' }), rollPanel(c), historyCard(c));
  root.append(h('div', { class: `view mesa focus-${focus}` },
    focus === 'rolar' ? h('div', { class: 'row between wrapr' }, h('h2', null, c.name), h('span', { class: 'muted' }, `Round ${roundOf(c).n} · ${roundOf(c).actions} ação(ões)`)) : null,
    h('div', { class: 'mesa-grid' }, stateCol, rollCol)));
}
export { pageText, skillName, clear, add, toDie, ruleSectionNode };
