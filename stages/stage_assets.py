"""Stage 2: ASSETS
Reads generated_game/game_design.json, generates each declared sprite via the free
Pollinations API (no key) in the chosen doodle's indie art style, and writes them to
generated_game/sprites/.

Manifest format (consumed by CODEGEN + skeletons):
    { "sprites": { "<sprite name>": "<filename>", ... } }

Reliability: each image is retried with exponential backoff (Pollinations' free tier
rate-limits / times out). Failed sprites are simply omitted, and the game engine falls
back to primitive colored shapes for them.
"""
import json
import time
import urllib.parse
from pathlib import Path
import requests

with open("generated_game/config.json", encoding="utf-8") as f:
    config = json.load(f)
with open("generated_game/game_design.json", encoding="utf-8") as f:
    design = json.load(f)

art_style = design.get("art_style") or config.get("art_style", {}).get("wrapper", "flat cartoon game sprite")
sprites_spec = design.get("sprites", [])
output_dir = Path("generated_game/sprites")
output_dir.mkdir(parents=True, exist_ok=True)

MAX_ATTEMPTS = 4
BACKOFF_SECONDS = [3, 8, 15]
DELAY_BETWEEN_JOBS = 2


def build_prompt(spec):
    role = spec.get("role", "")
    role_hint = {
        "player": "main player character, centered, full body",
        "good": "friendly collectible item",
        "bad": "hazard / enemy",
        "enemy": "enemy character",
        "bg": "seamless background scene, no characters",
        "tile": "single game tile icon",
    }.get(role, "game sprite")
    return f"{spec['prompt']}, {role_hint}, {art_style}, centered, transparent or clean background, no text, no watermark"


def generate_image(spec):
    filename = f"{spec['name']}.png"
    full_prompt = build_prompt(spec)
    print(f"  Generating: {filename} ...")
    safe = urllib.parse.quote(full_prompt)
    url = f"https://image.pollinations.ai/prompt/{safe}?width=512&height=512&nologo=true"
    for attempt in range(MAX_ATTEMPTS):
        try:
            r = requests.get(url, timeout=45)
            r.raise_for_status()
            if not r.content or len(r.content) < 512:
                raise ValueError(f"suspiciously small response ({len(r.content)} bytes)")
            (output_dir / filename).write_bytes(r.content)
            return spec["name"], filename
        except Exception as e:
            if attempt < MAX_ATTEMPTS - 1:
                wait = BACKOFF_SECONDS[min(attempt, len(BACKOFF_SECONDS) - 1)]
                print(f"    attempt {attempt + 1}/{MAX_ATTEMPTS} failed ({str(e)[:90]}); retry in {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [!] Failed {filename} after {MAX_ATTEMPTS} attempts; skipping (engine will use a shape fallback).")
                return None


print(f"ASSETS: generating {len(sprites_spec)} sprites in style: {art_style[:70]}...")
start = time.time()
manifest_sprites = {}
for idx, spec in enumerate(sprites_spec):
    result = generate_image(spec)
    if result:
        name, filename = result
        manifest_sprites[name] = filename
    if idx < len(sprites_spec) - 1:
        time.sleep(DELAY_BETWEEN_JOBS)

print(f"[OK] {len(manifest_sprites)}/{len(sprites_spec)} sprites generated in {time.time() - start:.1f}s")

with open(output_dir / "manifest.json", "w", encoding="utf-8") as f:
    json.dump({"sprites": manifest_sprites}, f, indent=2)
