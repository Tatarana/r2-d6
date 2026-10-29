#!/usr/bin/env python3
"""Gera app/data/bundle.json a partir de data/ (so stdlib).

Uso: python tools/build_app_data.py [--out caminho/bundle.json]
(sem --out grava app/data/bundle.json, usado pelo v1; a v2 usa --out packages/data/generated/bundle.json)

Le data/*.json, data/tables/*.json, data/rules/*.md, data/glossary.md e a
tabela "Register" de data/errata.md. Nada em data/ e alterado.
Ao final imprime um relatorio do que nao foi possivel mapear.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "app" / "data" / "bundle.json"

REPORT = []  # linhas do relatorio de pendencias


def report(msg):
    REPORT.append(msg)


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


# ---------------------------------------------------------------- normalizacao
def norm(text):
    """minusculas, sem pontuacao, espacos colapsados."""
    t = text.lower().replace("’", "'")
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return t.strip()


def singular(words):
    return " ".join(w[:-1] if len(w) > 3 and w.endswith("s") else w for w in words.split())


def name_keys(text):
    n = norm(text)
    return {n, singular(n)}


# ------------------------------------------------------------------ entidades
ENTITY_FILES = {
    "skills": ("skills.json", "skills"),
    "force_powers": ("force-powers.json", "powers"),
    "species": ("species.json", "species"),
    "weapons": ("weapons.json", "items"),
    "armor": ("armor.json", "items"),
    "gear": ("gear.json", "items"),
    "vehicles": ("vehicles.json", "items"),
    "starships": ("starships.json", "items"),
    "templates": ("templates.json", "templates"),
}


def build_entities():
    ent = {}
    for key, (fname, field) in ENTITY_FILES.items():
        ent[key] = load(DATA / fname)[field]
    ent["ship_upgrades"] = load(DATA / "ship-upgrades.json")
    ent["martial_arts"] = load(DATA / "martial-arts.json")
    return ent


def build_tables():
    tables = {}
    for p in sorted((DATA / "tables").glob("*.json")):
        tables[p.stem] = load(p)
    return tables


# ---------------------------------------------------------------------- regras
ANCHOR_RE = re.compile(r"\s*\{#([\w-]+)\}\s*$")
PAGE_RE = re.compile(r"\bp\.\s*(\d+)(?:\s*[-–]\s*(\d+))?")
ERR_RE = re.compile(r"\bE-0\d\d\b")


def slug(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def pages_in(text):
    pages = set()
    for m in PAGE_RE.finditer(text):
        a = int(m.group(1))
        b = int(m.group(2)) if m.group(2) else a
        if b < a or b - a > 30:
            b = a
        pages.update(range(a, b + 1))
    return sorted(pages)


def strip_front_matter(text):
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:].lstrip("\n")
    return text


def split_rules(path):
    raw = path.read_text(encoding="utf-8")
    body = strip_front_matter(raw)
    file_id = path.stem
    file_title = file_id
    sections = []
    cur = {"level": 1, "title": None, "anchor": "intro", "lines": []}
    parent_h2 = None
    used = set()
    in_code = False
    for line in body.splitlines():
        if line.startswith("```"):
            in_code = not in_code
        m = None if in_code else re.match(r"^(#{1,3})\s+(.*\S)\s*$", line)
        if m:
            level = len(m.group(1))
            heading = m.group(2)
            if level == 1:
                file_title = ANCHOR_RE.sub("", heading)
                continue
            sections.append(cur)
            am = ANCHOR_RE.search(heading)
            title = ANCHOR_RE.sub("", heading).strip()
            anchor = am.group(1) if am else None
            if level == 2:
                parent_h2 = anchor or slug(title)
            if not anchor:
                anchor = slug(title)
                if level == 3 and parent_h2:
                    anchor = f"{parent_h2}-{anchor}"
            base, i = anchor, 2
            while anchor in used:
                anchor = f"{base}-{i}"
                i += 1
            used.add(anchor)
            cur = {"level": level, "title": title, "anchor": anchor, "lines": [],
                   "parent": parent_h2 if level == 3 else None}
        else:
            cur["lines"].append(line)
    sections.append(cur)
    out = []
    for s in sections:
        text = "\n".join(s["lines"]).strip()
        if s["title"] is None:
            if not text:
                continue
            s["title"] = file_title
        out.append({
            "id": f"{file_id}#{s['anchor']}",
            "anchor": s["anchor"],
            "level": s["level"],
            "parent": s.get("parent"),
            "title": s["title"],
            "text": text,
            "pages": pages_in(s["title"] + "\n" + text),
            "errata": sorted(set(ERR_RE.findall(text))),
        })
    return {"id": file_id, "title": file_title, "sections": out}


def build_rules():
    return [split_rules(p) for p in sorted((DATA / "rules").glob("*.md"))]


# ----------------------------------------------------- glossario e errata
def table_rows(md_text, header_start):
    """linhas de dados da primeira tabela cujo cabecalho comeca com header_start."""
    rows, found = [], False
    for line in md_text.splitlines():
        if not found:
            if line.startswith("|") and line.replace(" ", "").lower().startswith(header_start):
                found = True
            continue
        if not line.startswith("|"):
            if rows:
                break
            continue
        if re.match(r"^\|[\s:|-]+\|?\s*$", line):
            continue
        rows.append(line)
    return rows


def split_cells(line):
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip() for c in s.split(" | ")] if " | " in s else [c.strip() for c in s.split("|")]


def build_glossary():
    text = (DATA / "glossary.md").read_text(encoding="utf-8")
    out = []
    for line in table_rows(text, "|term|"):
        c = split_cells(line)
        if len(c) < 3:
            report(f"glossario: linha ignorada: {line[:80]}")
            continue
        out.append({"term": c[0], "meaning": c[1], "where": c[2]})
    return out


def build_errata():
    text = (DATA / "errata.md").read_text(encoding="utf-8")
    out = []
    for line in table_rows(text, "|id|kind|"):
        c = split_cells(line)
        if len(c) < 7:
            report(f"errata: linha ignorada: {line[:80]}")
            continue
        if len(c) > 7:
            # uma celula continha ' | ': mantem 4 primeiras e 2 ultimas, junta o meio
            report(f"errata {c[0]}: celula com '|' remontada")
            c = c[:4] + [" | ".join(c[4:-2])] + c[-2:]
        out.append({"id": c[0], "kind": c[1], "where": c[2], "problem": c[3],
                    "provisional": c[4], "status": c[5], "human_action": c[6]})
    return out


# ------------------------------------------------------------------ derivados
# RD-35 / E-061: apelidos explicitos (chave normalizada -> id da pericia)
TEMPLATE_ALIASES = {
    "droid prgrm": "droid-programming",
    "droid prgm": "droid-programming",
    "computer prgm repair": "computer-programming-repair",
    "computer prgrm repair": "computer-programming-repair",
    "demolition": "demolitions",
    "archaic weapons": "archaic-guns",
    "space transport repair": "space-transports-repair",
    "culture": "cultures",
}
SPECIES_SPECIAL_SKILLS = {"glider", "primitive construction"}


def build_skill_index(skills):
    idx = {}
    for s in skills:
        for k in name_keys(s["name"]):
            idx.setdefault(k, s["id"])
    return idx


def derive_template_skill_map(templates, skills):
    """RD-35: nome impresso no template -> id da pericia."""
    idx = build_skill_index(skills)
    result, unmapped = {}, []
    for t in templates:
        entries = []
        for attr, names in t["listed_skills"].items():
            for name in names:
                key = norm(name)
                entry = {"name": name, "attribute": attr, "skill_id": None,
                         "alias": False, "species_special_skill": False}
                if key in SPECIES_SPECIAL_SKILLS:
                    entry["species_special_skill"] = True
                elif key in TEMPLATE_ALIASES:
                    entry["skill_id"] = TEMPLATE_ALIASES[key]
                    entry["alias"] = True
                else:
                    sid = idx.get(key) or idx.get(singular(key))
                    entry["skill_id"] = sid
                    if sid is None:
                        unmapped.append(f"{t['id']}: '{name}'")
                entries.append(entry)
        result[t["id"]] = entries
    ids = {s["id"] for s in skills}
    for t, entries in result.items():
        for e in entries:
            if e["skill_id"] and e["skill_id"] not in ids:
                unmapped.append(f"{t}: alias aponta para id inexistente {e['skill_id']}")
    for u in unmapped:
        report(f"template_skill_map: nao mapeado: {u}")
    return result


def derive_template_species(templates, species):
    """RD-34."""
    special = {"ewok": "ewok", "wookiee": "wookiees", "mon-calamari": "mon-calamari",
               "protocol-droid": None, "alien-student-of-the-force": None}
    sp_ids = {s["id"] for s in species}
    out = {}
    for t in templates:
        sid = special.get(t["id"], "humans")
        if sid and sid not in sp_ids:
            report(f"template_species: especie {sid} inexistente ({t['id']})")
        out[t["id"]] = sid
    return out


DICE_RE = r"(\d+)\s*D"
PREREQ_MANUAL_HINTS = re.compile(r"\bor\b|\bany\b|\bone of\b|\bthe following\b", re.I)


def derive_advanced_prereqs(skills):
    """RD-31: prerequisitos simples -> [{skill_id, dice}]; senao manual=true."""
    idx = build_skill_index(skills)
    out = {}
    for s in skills:
        if not s.get("advanced"):
            continue
        text = s.get("prerequisites_text") or ""
        item = {"text": text, "requirements": [], "manual": True}
        out[s["id"]] = item
        m = re.search(r"requires\s+(?:requires\s+)?(.*?)(?:\.\s|\.$|$)", text, re.I)
        m2 = re.search(r"first aid of at least\s+(\d+)\s*D", text, re.I)
        if m2:
            item["requirements"] = [{"skill_id": "first-aid", "dice": int(m2.group(1))}]
            item["manual"] = False
            continue
        if not m:
            report(f"advanced_prereqs: {s['id']}: sem 'Requires' no texto")
            continue
        clause = re.sub(r",?\s+and allows.*$", "", m.group(1), flags=re.I).strip()
        if PREREQ_MANUAL_HINTS.search(clause) or len(re.findall(DICE_RE, clause)) != 1 \
                or " and " in clause or "," in clause:
            continue  # composto: manual
        mm = re.match(r"(\d+)\s*D\s+(?:in\s+)?(.+)$", clause)
        if not mm:
            report(f"advanced_prereqs: {s['id']}: nao casou: {clause[:60]}")
            continue
        sid = idx.get(norm(mm.group(2))) or idx.get(singular(norm(mm.group(2))))
        if not sid:
            report(f"advanced_prereqs: {s['id']}: pericia desconhecida '{mm.group(2)}'")
            continue
        item["requirements"] = [{"skill_id": sid, "dice": int(mm.group(1))}]
        item["manual"] = False
    return out


def derive_force_required(powers):
    """nomes em required_powers -> ids."""
    idx = {}
    for p in powers:
        idx[norm(p["name"])] = p["id"]
    out = {}
    for p in powers:
        names = p.get("required_powers") or []
        ids = []
        for n in names:
            pid = idx.get(norm(n))
            if pid is None:
                report(f"force_power_required_ids: {p['id']}: '{n}' sem poder correspondente")
            else:
                ids.append(pid)
        if names:
            out[p["id"]] = ids
    return out


def derive_species_move(species):
    """RD-42: primeiro inteiro do campo move."""
    out = {}
    for s in species:
        blocks = []
        for b in s["stat_blocks"]:
            text = str(b.get("move", ""))
            m = re.search(r"\d+", text)
            if not m:
                report(f"species_move_start: {s['id']}: sem numero em '{text}'")
            blocks.append({"stat_block": b.get("stat_block"), "move_text": text,
                           "move_start": int(m.group()) if m else None,
                           "irregular": not re.fullmatch(r"\d+/\d+", text.strip())})
        out[s["id"]] = blocks
    return out


# data/ nao cita E-0xx nas entidades; o cruzamento abaixo vem da coluna "Where" do
# registro (ux-platforms: E-027 martial arts, E-036 pilotagem, E-053 Aqualish, E-054 lightsaber).
ENTITY_ERRATA_HINTS = {
    "species:aqualish": ["E-053"],
    "skills:lightsaber": ["E-054"],
    "weapons:lightsaber": ["E-054"],
    "weapons:double-bladed-lightsaber": ["E-054"],
    "weapons:short-lightsaber": ["E-054"],
    "skills:starfighter-piloting": ["E-036"],
    "skills:capital-ship-piloting": ["E-036"],
    "skills:space-transports": ["E-036"],
}


def derive_entity_errata(entities, tables, errata):
    """Entidades cujo texto cita um E-0xx, mais as dicas acima (para o selo)."""
    out = {}
    ids = {f"{k}:{it['id']}" for k, v in entities.items() if isinstance(v, list) for it in v}
    for key, eids in ENTITY_ERRATA_HINTS.items():
        if key in ids:
            out[key] = list(eids)
        else:
            report(f"entity_errata: dica {key} sem entidade correspondente")
    for key, items in entities.items():
        if isinstance(items, list):
            for it in items:
                found = sorted(set(ERR_RE.findall(json.dumps(it, ensure_ascii=False))))
                if found:
                    out[f"{key}:{it['id']}"] = sorted(set(found + out.get(f"{key}:{it['id']}", [])))
    known = {e["id"] for e in errata}
    for ids in out.values():
        for i in ids:
            if i not in known:
                report(f"entity_errata: {i} nao esta no registro")
    return out


# ------------------------------------------------------------------------ main
def main():
    global OUT
    ap = argparse.ArgumentParser(description="Gera o bundle de dados a partir de data/.")
    ap.add_argument("--out", help="caminho do bundle.json (padrao: app/data/bundle.json, usado pelo v1)")
    args = ap.parse_args()
    if args.out:
        OUT = Path(args.out).resolve()
    entities = build_entities()
    tables = build_tables()
    rules = build_rules()
    glossary = build_glossary()
    errata = build_errata()

    known = {e["id"] for e in errata}
    for f in rules:
        for s in f["sections"]:
            for i in s["errata"]:
                if i not in known:
                    report(f"rules {s['id']}: {i} nao esta no registro do errata")

    derived = {
        "template_skill_map": derive_template_skill_map(entities["templates"], entities["skills"]),
        "template_species": derive_template_species(entities["templates"], entities["species"]),
        "advanced_prereqs": derive_advanced_prereqs(entities["skills"]),
        "force_power_required_ids": derive_force_required(entities["force_powers"]),
        "species_move_start": derive_species_move(entities["species"]),
        "entity_errata": derive_entity_errata(entities, tables, errata),
    }
    bundle = {
        "meta": {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                 "source": "data/", "version": 1},
        "entities": entities, "tables": tables, "rules": rules,
        "glossary": glossary, "errata": errata, "derived": derived,
        "schema": load(DATA / "character-sheet.schema.json"),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    n_sec = sum(len(f["sections"]) for f in rules)
    print(f"bundle: {OUT} ({OUT.stat().st_size / 1024:.0f} KiB)")
    print(f"  entidades: " + ", ".join(f"{k}={len(v) if isinstance(v, list) else 'obj'}" for k, v in entities.items()))
    print(f"  tabelas={len(tables)} regras: {len(rules)} arquivos / {n_sec} secoes; glossario={len(glossary)}; errata={len(errata)}")
    d = derived
    flat = [e for v in d["template_skill_map"].values() for e in v]
    print(f"  template_skill_map: {len(flat)} nomes; alias E-061={sum(e['alias'] for e in flat)}; "
          f"especiais de especie={sum(e['species_special_skill'] for e in flat)}; "
          f"sem id={sum(1 for e in flat if not e['skill_id'] and not e['species_special_skill'])}")
    ap = d["advanced_prereqs"]
    print(f"  advanced_prereqs: {len(ap)} (simples={sum(1 for v in ap.values() if not v['manual'])}, manual={sum(1 for v in ap.values() if v['manual'])})")
    print(f"  force_power_required_ids: {len(d['force_power_required_ids'])} poderes com exigencias")
    print(f"  entity_errata: {len(d['entity_errata'])} entidades com E-0xx")
    print("\nPendencias de mapeamento:" if REPORT else "\nNenhuma pendencia de mapeamento.")
    for line in REPORT:
        print("  - " + line)
    return 0


if __name__ == "__main__":
    sys.exit(main())
