"""Monta o pacote de prompts de uma onda a partir do manifesto: docs/prompts/<onda>.json.

Cada entrada traz o id, o prefixo de estilo em ingles, a proporcao para o Bing (1:1, 3:2 ou 2:3), o ponto focal e a
descricao em portugues; o agente traduz a descricao e monta o prompt final. Ignora espacos que ja tem arquivo.
Uso: python tools/build_prompts.py onda-1
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WAVES = {
    "onda-1": {"weapon-cat", "armor-cat", "gear-cat", "vehicle-cat", "starship-scale", "skill-attr", "power-skill",
               "auth", "hangar", "campaign", "creation", "error", "state", "mesa", "reference", "account", "marketing", "holocron"},
    "onda-2": {"species", "template", "weapon", "vehicle", "starship"},
    "onda-3": {"armor", "gear"},
}
SKIP_STYLES = {"icon-glyph", "material"}
END = "No text, no letters, no logos. Filling the entire frame, no black bars."
STYLES = {
    "holo-cinematic": "Cinematic digital painting, high contrast, near-black deep sky or space, cyan key light (#4FD1FF) and amber rim light (#FFB020), subtle film grain, atmospheric depth. Leave a calm empty area for interface text where the focal point indicates.",
    "holo-craft": "Cinematic digital painting, high contrast, near-black deep sky, cyan key light (#4FD1FF) and amber backlight (#FFB020), subtle film grain, atmospheric depth. The vehicle or ship of original design in motion in its natural environment, whole craft in frame with margin.",
    "portrait-card": "Semi-realistic digital painting, bust portrait in 3/4 view, dark background with blue haze and a thin glowing cyan holographic ring behind the head; panel lighting: cyan from below, amber rim light. Character looking slightly off-frame.",
    "blueprint": "Holographic technical blueprint illustration: glowing cyan line art on midnight blue, dimension lines, fine grid and scanline noise, one central object in 3/4 perspective. Labels only as abstract glyphs.",
    "blueprint-item": "Holographic technical blueprint illustration: glowing cyan line art on midnight blue, dimension lines, fine grid and scanline noise. Object(s) of original design in 3/4 perspective, isolated and centered, soft shadow and a thin amber rim glow on one edge; must read well as a small square thumbnail. Labels only as abstract glyphs. Sci-fi technology, not real-world equipment.",
    "scene-spot": "Small symbolic scene illustration, dark vignetted background, simplified painterly style, cyan light and a single amber accent, one clear readable action at small size.",
    "spot-illustration": "Small centered spot illustration on a plain very dark navy background, glowing cyan holographic line-art with a single amber detail, simple clear silhouette, light gentle humor, readable at 160 pixels.",
    "ambient-bg": "Low-contrast ambient background to sit behind a user interface: very dark (average luminance under 12%), soft details, no bright spots in the center, slightly vignetted corners, works when cropped to different ratios.",
}


def bing_ratio(aspect):
    a = aspect.split("(")[0].split("/")[0].split(" e ")[0].strip()
    if a in ("1:1",):
        return "1:1"
    if a in ("3:4", "2:3", "9:16"):
        return "2:3"
    return "3:2"


def main():
    wave = sys.argv[1] if len(sys.argv) > 1 else "onda-1"
    m = json.load(open(os.path.join(ROOT, "docs", "image-manifest.json"), encoding="utf-8"))
    out = []
    for i in m["items"]:
        if i["group"] in WAVES[wave] and not i.get("file") and i["style"] not in SKIP_STYLES:
            out.append({"id": i["id"], "style": i["style"], "style_prompt": STYLES.get(i["style"], ""), "end": END,
                        "bing_ratio": bing_ratio(i["aspect"]), "focal_point": i["focal_point"], "description_pt": i["description"]})
    path = os.path.join(ROOT, "docs", "prompts", f"{wave}.json")
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{len(out)} espacos -> {os.path.relpath(path, ROOT)}")


if __name__ == "__main__":
    main()
