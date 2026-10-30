"""Gera uma imagem pela API do Gemini (Nano Banana) e grava em art-inbox/<id>.png. Sem navegador, sem dialogo.

A chave vem de GEMINI_API_KEY (variavel de ambiente ou .env na raiz). Nunca grave a chave em codigo ou no Git.
Uso:
  python tools/gen_image_gemini.py <slot-id> --aspect 16:9 --prompt "..."
  python tools/gen_image_gemini.py --check          # so confere se a chave e o modelo respondem (1 imagem pequena)
As cotas do plano gratis sao por projeto e aparecem em https://aistudio.google.com (Rate limits).
"""
import argparse, base64, json, os, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")


def api_key():
    key = os.environ.get("GEMINI_API_KEY")
    env = os.path.join(ROOT, ".env")
    if not key and os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            if line.startswith("GEMINI_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"')
    if not key:
        sys.exit("GEMINI_API_KEY ausente (defina no .env).")
    return key


def generate(prompt, aspect):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": api_key()})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode(errors='replace')[:600]}")
    for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        if "inlineData" in part:
            return base64.b64decode(part["inlineData"]["data"])
    sys.exit("Sem imagem na resposta: " + json.dumps(data)[:600])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id", nargs="?")
    ap.add_argument("--prompt")
    ap.add_argument("--aspect", default="1:1", help="1:1, 3:2, 2:3, 3:4, 4:3, 16:9, 9:16, 21:9")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if a.check:
        img = generate("A small glowing cyan hexagon on a dark navy background, minimal.", "1:1")
        print(f"OK: modelo {MODEL} respondeu ({len(img) // 1024} KB).")
        return
    if not (a.id and a.prompt):
        sys.exit("Informe o id e --prompt.")
    out = os.path.join(ROOT, "art-inbox", f"{a.id}.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "wb") as f:
        f.write(generate(a.prompt, a.aspect))
    print(f"{a.id}: gravado em {os.path.relpath(out, ROOT)}")


if __name__ == "__main__":
    main()
