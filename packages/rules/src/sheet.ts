// sheet.ts - ficha v2: documento conforme data/character-sheet.schema.json (sem x_app; o estado de mesa fica em play_state).
import Ajv2020 from 'ajv/dist/2020';
import { parse, format } from './dice';
import { ATTRS, WOUND_STATES } from './rules';

/** {dice,pips,text} conforme $defs/die. */
export function toDie(code: any) {
  const c = parse(code);
  return { dice: c.dice, pips: c.pips, text: format(c) };
}

export type Sheet = Record<string, any>;

/** Ficha vazia valida. */
export function blankSheet(name = 'Novo personagem'): Sheet {
  const attributes: Record<string, any> = {};
  for (const a of ATTRS) attributes[a] = { value: toDie('2D'), skills: [] };
  return {
    name, type: '', species: '', gender: '', age: '', height: '', weight: '', physical_description: '',
    attributes, force_attributes: {}, force_powers: [], advantages: [], disadvantages: [],
    special_abilities: '', move: 10, force_sensitive: false, force_points: 1, dark_side_points: 0,
    character_points: 5, credits: 0, wound_status: 'healthy',
    armor: [], weapons: [], other_equipment: [],
    background: '', personality: '', objectives: '', languages: '', contacts_and_enemies: '',
    connection_with_characters: '', quote: '',
  };
}

const isDie = (d: any) => d && typeof d === 'object' && Number.isInteger(d.dice) && d.dice >= 0
  && Number.isInteger(d.pips) && d.pips >= 0 && d.pips <= 2;
const isNonNegInt = (n: any) => Number.isInteger(n) && n >= 0;

/** Valida os campos obrigatorios do schema (checagem leve, em portugues). Lista vazia = ok. */
export function validateSheet(obj: any): string[] {
  const errs: string[] = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return ['O arquivo não é uma ficha (esperado um objeto JSON).'];
  if (typeof obj.name !== 'string' || !obj.name.trim()) errs.push('Campo obrigatório ausente ou vazio: name');
  if (!obj.attributes || typeof obj.attributes !== 'object') {
    errs.push('Campo obrigatório ausente: attributes');
  } else {
    for (const a of ATTRS) {
      const at = obj.attributes[a];
      if (!at) errs.push(`Atributo obrigatório ausente: attributes.${a}`);
      else if (!isDie(at.value)) errs.push(`Atributo inválido: attributes.${a}.value deve ser {dice, pips} (pips 0 a 2)`);
      else if (at.skills !== undefined) {
        if (!Array.isArray(at.skills)) errs.push(`attributes.${a}.skills deve ser uma lista`);
        else at.skills.forEach((s: any, i: number) => {
          if (!s || typeof s.skill !== 'string' || !isDie(s.value)) errs.push(`attributes.${a}.skills[${i}] inválida (skill e value são obrigatórios)`);
        });
      }
    }
  }
  if (typeof obj.force_sensitive !== 'boolean') errs.push('Campo obrigatório ausente ou inválido: force_sensitive (true/false)');
  if (!isNonNegInt(obj.force_points)) errs.push('Campo obrigatório ausente ou inválido: force_points (inteiro >= 0)');
  if (!isNonNegInt(obj.character_points)) errs.push('Campo obrigatório ausente ou inválido: character_points (inteiro >= 0)');
  if (!WOUND_STATES.includes(obj.wound_status)) errs.push(`Campo obrigatório ausente ou inválido: wound_status (um de ${WOUND_STATES.join(', ')})`);
  return errs;
}

export type SheetValidator = (sheet: unknown) => { ok: boolean; errors: { path: string; message: string }[] };

/** Validador completo pelo JSON Schema (Ajv 2020-12). Usado no servidor a cada gravacao. */
export function createSheetValidator(schema: any): SheetValidator {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const { $schema, $id, ...rest } = schema;
  const validate = ajv.compile(rest);
  return (sheet) => {
    const ok = validate(sheet) as boolean;
    return { ok, errors: ok ? [] : (validate.errors || []).map((e) => ({ path: e.instancePath || '/', message: e.message || 'inválido' })) };
  };
}

/** Valor (codigo) de uma pericia na ficha: nivel da pericia ou do atributo. skillsById: Map id -> skill. */
export function skillCode(char: Sheet, skillId: string, skillsById: Map<string, any>) {
  const sk = skillsById.get(skillId);
  if (!sk) return null;
  const attr = char.attributes[sk.attribute];
  const found = (attr.skills || []).find((s: any) => s.skill === skillId);
  return found ? parse(found.value) : (sk.advanced ? null : parse(attr.value));
}

export const weaponEntry = (w: any) => ({ type: w.name, item: w.id, damage: w.damage || '', range: w.range || '',
  ammo_max: Number((String(w.ammo || '').match(/\d+/) || [0])[0]), ammo_used: 0 });
export const armorEntry = (a: any) => ({ type: a.name, item: a.id, av: a.protection ? `${a.protection.physical || '-'} fís. / ${a.protection.energy || '-'} en.` : '', notes: '' });
export const gearEntry = (g: any) => ({ type: g.name, item: g.id, notes: g.cost || '' });
