"""Processa a arte gerada: art-inbox/<id>.<ext> -> apps/web/public/art/<id>.webp e atualiza docs/image-manifest.json.

Uso:
  python tools/process_art.py --status approved --tool gemini --model "Gemini Auto" hero.login bg.mesa
  python tools/process_art.py --status draft --tool bing            # todos os arquivos da caixa de entrada

O id do arquivo precisa existir no manifesto. A imagem e so reduzida (lado maior <= --max) e convertida; o recorte
fica com o app (object-position pelo focal_point). Os originais continuam em art-inbox/ (fora do Git).
"""
import argparse, datetime, glob, json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(ROOT, "art-inbox")
OUT_DIR = os.path.join(ROOT, "apps", "web", "public", "art")
MANIFEST = os.path.join(ROOT, "docs", "image-manifest.json")
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", help="ids a processar (padrao: todos os arquivos de art-inbox)")
    ap.add_argument("--status", default="draft", choices=["draft", "approved", "rejected"])
    ap.add_argument("--tool", required=True, help="ferramenta usada (gemini, bing, leonardo, firefly, local...)")
    ap.add_argument("--model", default="", help="modelo informado pela ferramenta")
    ap.add_argument("--max", type=int, default=2560, help="lado maior maximo em px")
    ap.add_argument("--quality", type=int, default=82)
    a = ap.parse_args()

    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)
    by_id = {i["id"]: i for i in manifest["items"]}

    files = {}
    for p in glob.glob(os.path.join(INBOX, "*")):
        name, ext = os.path.splitext(os.path.basename(p))
        if ext.lower() in EXTS:
            files[name] = p
    ids = a.ids or sorted(files)
    os.makedirs(OUT_DIR, exist_ok=True)
    today = datetime.date.today().isoformat()
    done = 0
    for id_ in ids:
        if id_ not in by_id:
            print(f"ignorado (fora do manifesto): {id_}", file=sys.stderr); continue
        if id_ not in files:
            print(f"ignorado (sem arquivo em art-inbox): {id_}", file=sys.stderr); continue
        im = Image.open(files[id_]).convert("RGB")
        if max(im.size) > a.max:
            im.thumbnail((a.max, a.max), Image.LANCZOS)
        out = os.path.join(OUT_DIR, f"{id_}.webp")
        im.save(out, "WEBP", quality=a.quality, method=6)  # sem EXIF/metadados
        it = by_id[id_]
        it["file"] = f"art/{id_}.webp"
        it["status"] = a.status
        it["provenance"] = {"tool": a.tool, "model": a.model or None, "date": today, "source_size": list(Image.open(files[id_]).size)}
        print(f"{id_}: {im.size[0]}x{im.size[1]} -> {os.path.relpath(out, ROOT)} ({os.path.getsize(out) // 1024} KB) [{a.status}]")
        done += 1

    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"{done} imagem(ns) processada(s); manifesto atualizado.")


if __name__ == "__main__":
    main()
