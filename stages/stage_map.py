"""Stage 1: MAP
Reads the launch blurb (generated_game/input.txt) and the Google Doodle archetype
library, then asks an LLM to:
  1. Pick the doodle archetype whose mechanic best dramatizes the launch.
  2. Design a themed game on top of that archetype (title, objects, sprites, tuning).

Output: generated_game/game_design.json  (consumed by ASSETS + CODEGEN).

Includes a retry loop that recovers from malformed JSON / missing fields.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from llm import chat, strip_code_fences  # noqa: E402

with open("generated_game/config.json", encoding="utf-8") as f:
    config = json.load(f)
with open("generated_game/input.txt", encoding="utf-8") as f:
    launch_text = f.read().strip()
with open("engines/doodles/library.json", encoding="utf-8") as f:
    library = json.load(f)

models = config.get("models", {})
map_models = models.get("map", ["gpt-5.5", "gpt-4o"])
valid_ids = [a["id"] for a in library["archetypes"]]

lib_summary = "\n".join(
    f"- id: {a['id']} | {a['name']}\n    mechanic: {a['mechanic']}\n    good_for: {a['good_for']}\n    art: {a['art_style']}"
    for a in library["archetypes"]
)

system_prompt = f"""You are a game designer. You map a product launch onto a Google Doodle-style
minigame and output STRICTLY valid JSON (no markdown, no prose).

Pick exactly ONE archetype id from this library whose MECHANIC best dramatizes the launch:
{lib_summary}

Rules:
- The GAMEPLAY/STRUCTURE must follow the chosen archetype's mechanic closely.
- The OBJECTS, characters, sprites, title, and copy must be themed to the launch.
- Every sprite referenced by player/good_items/bad_items/enemy_types/tile_types MUST also
  appear in the top-level "sprites" list (matching "name").
- Keep the game winnable in about 45-70 seconds.
- art_style must describe the chosen doodle's INDIE look (flat cartoon, bold outlines, etc.),
  themed lightly to the launch.

OUTPUT FORMAT (fill all relevant fields; omit archetype-specific ones that don't apply):
{{
  "chosen_archetype": "<one of: {', '.join(valid_ids)}>",
  "why": "1 sentence: why this mechanic fits the launch",
  "title": "short game title",
  "subtitle": "one-line hook",
  "hud_label": "score noun (e.g. Invoices, Runs, Cleared)",
  "duration_seconds": 60,
  "target_score": 1500,
  "moves": 15,
  "closing_stat": "shareable end-screen stat; you may use {{score}} as a placeholder",
  "feature_explainer": {{
    "headline": "the real Ramp feature name",
    "bullets": ["2 to 4 short factual takeaways about the feature, drawn ONLY from the launch blurb", "..."],
    "cta_text": "short call to action, e.g. 'See Ramp Bill Pay'"
  }},
  "art_style": "doodle indie art style, themed to the launch",
  "player": {{"name": "...", "sprite": "player"}},
  "good_items": [{{"name": "...", "sprite": "good_1", "points": 100}}],
  "bad_items": [{{"name": "...", "sprite": "bad_1"}}],
  "enemy_types": [{{"name": "...", "sprite": "enemy_1"}}],
  "tile_types": [{{"name": "...", "sprite": "tile_1"}}],
  "sprites": [
    {{"name": "player", "role": "player", "prompt": "subject-only image prompt, no style words"}},
    {{"name": "good_1", "role": "good", "prompt": "..."}},
    {{"name": "background", "role": "bg", "prompt": "..."}}
  ]
}}"""

user_prompt = f"""LAUNCH BLURB:
\"\"\"{launch_text}\"\"\"

Design the game now. Output ONLY the JSON object."""

messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": user_prompt},
]


def validate(design):
    arch = design.get("chosen_archetype")
    if arch not in valid_ids:
        raise ValueError(f"chosen_archetype '{arch}' not in {valid_ids}")
    sprites = design.get("sprites")
    if not isinstance(sprites, list) or not sprites:
        raise ValueError("sprites must be a non-empty list")
    names = {s.get("name") for s in sprites}
    for s in sprites:
        if not s.get("name") or not s.get("prompt"):
            raise ValueError("each sprite needs name + prompt")
    # Ensure referenced sprites exist in the sprites list.
    refs = []
    if design.get("player"):
        refs.append(design["player"].get("sprite"))
    for grp in ("good_items", "bad_items", "enemy_types", "tile_types"):
        for it in design.get(grp, []) or []:
            refs.append(it.get("sprite"))
    missing = [r for r in refs if r and r not in names]
    if missing:
        raise ValueError(f"referenced sprites missing from sprites list: {missing}")


print("MAP: choosing a Google Doodle archetype and designing the game...")
start = time.time()
design = None
last_content = ""
for attempt in range(3):
    print(f"  Attempt {attempt + 1}/3 (models: {map_models})...")
    try:
        content = chat(map_models, messages, temperature=0.8, timeout=300)
        last_content = content
        design = json.loads(strip_code_fences(content))
        validate(design)
        break
    except (json.JSONDecodeError, ValueError) as e:
        print(f"  Validation failed: {e}")
        if attempt == 2:
            raise RuntimeError("MAP failed to produce valid game_design.json after 3 attempts.")
        messages.append({"role": "assistant", "content": last_content})
        messages.append({"role": "user", "content": f"That failed: {e}. Output ONLY corrected valid JSON."})

# Ensure a feature explainer exists and attach the learn-more URL from config
# (config isn't available in the browser, so we bake the URL into the design).
fe = design.get("feature_explainer")
if not isinstance(fe, dict):
    fe = {"headline": design.get("title", "This Ramp launch"), "bullets": [launch_text[:180]]}
fe.setdefault("cta_text", "Learn more about this Ramp launch")
if not fe.get("learn_more_url"):
    fe["learn_more_url"] = config.get("feature_url", "https://ramp.com")
design["feature_explainer"] = fe

with open("generated_game/game_design.json", "w", encoding="utf-8") as f:
    json.dump(design, f, indent=2)

print(f"[OK] MAP done in {time.time() - start:.1f}s")
print(f"     Archetype: {design['chosen_archetype']}  |  Title: {design.get('title')}")
print(f"     Why: {design.get('why')}")
print(f"     Sprites to generate: {len(design['sprites'])}")
