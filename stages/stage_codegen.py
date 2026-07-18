"""Stage 3: CODEGEN
Hands the chosen doodle skeleton + game_design.json + sprite manifest to a code-gen
LLM (given up to ~5 minutes) and asks it to author the final, self-contained, playable
index.html: themed objects/characters/sprites/copy from the launch, gameplay following
the doodle archetype.

Safeguards:
  - We always inject window.GAME_DESIGN + window.SPRITE_MANIFEST so a data-driven skeleton
    works even if the model leaves logic untouched.
  - A basic sanity check + one repair pass catches obviously broken output.
  - If code-gen fails entirely, we fall back to the raw skeleton (still playable).

Time budget: the model call uses a 300s (5 min) timeout by design.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from llm import chat, strip_code_fences  # noqa: E402

with open("generated_game/config.json", encoding="utf-8") as f:
    config = json.load(f)
with open("generated_game/game_design.json", encoding="utf-8") as f:
    design = json.load(f)
with open("generated_game/sprites/manifest.json", encoding="utf-8") as f:
    manifest = json.load(f)

models = config.get("models", {})
codegen_models = models.get("codegen", ["gpt-5.3-codex", "gpt-5.5", "gpt-4o"])

archetype = design["chosen_archetype"]
skeleton_path = Path(f"engines/doodles/skeletons/{archetype}.html")
skeleton = skeleton_path.read_text(encoding="utf-8")

# Self-contained end-screen "About this Ramp feature" card. It watches the game-over
# overlay (#msg) and injects a content panel built from GAME_DESIGN.feature_explainer.
# This works for both the code-gen output and the raw-skeleton fallback (both use #msg).
FEATURE_CARD_JS = """
(function(){
  function build(fe){
    var wrap=document.createElement('div');
    wrap.id='ramp-feature-card';
    wrap.style.cssText='margin:16px auto 4px;padding:16px 20px;max-width:560px;text-align:left;'+
      'background:#ffffff;color:#111;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.35);font-size:15px;line-height:1.5;';
    var h='<div style="font-size:18px;font-weight:800;margin-bottom:8px;color:#1a7f37">'+
      (fe.headline||'About this Ramp launch')+'</div>';
    if(fe.bullets&&fe.bullets.length){ h+='<ul style="margin:0 0 10px 18px;padding:0">';
      fe.bullets.forEach(function(b){ h+='<li style="margin:3px 0">'+b+'</li>'; }); h+='</ul>'; }
    if(fe.learn_more_url){ h+='<a href="'+fe.learn_more_url+'" target="_blank" rel="noopener" '+
      'style="display:inline-block;margin-top:4px;padding:8px 16px;background:#1a7f37;color:#fff;'+
      'border-radius:20px;text-decoration:none;font-weight:700">'+(fe.cta_text||'Learn more')+' \u2192</a>'; }
    wrap.innerHTML=h; return wrap;
  }
  function inject(){
    var fe=(window.GAME_DESIGN||{}).feature_explainer; if(!fe) return;
    var m=document.getElementById('msg'); if(!m) return;
    var visible=getComputedStyle(m).display!=='none';
    if(visible && !document.getElementById('ramp-feature-card')){
      var btn=m.querySelector('button'); var card=build(fe);
      if(btn) m.insertBefore(card,btn); else m.appendChild(card);
    }
  }
  function start(){
    var m=document.getElementById('msg');
    if(m){ new MutationObserver(inject).observe(m,{attributes:true,attributeFilter:['style','class']}); }
    // Fallback poll in case the overlay is toggled by other means.
    setInterval(inject,600);
  }
  if(document.readyState!=='loading') start(); else document.addEventListener('DOMContentLoaded',start);
})();
"""

INJECTION = (
    "<script>\n"
    f"window.GAME_DESIGN = {json.dumps(design)};\n"
    f"window.SPRITE_MANIFEST = {json.dumps(manifest)};\n"
    f"{FEATURE_CARD_JS}\n"
    "</script>"
)


def inject_params(html):
    if "<!-- PARAMS_INJECTION_POINT -->" in html:
        return html.replace("<!-- PARAMS_INJECTION_POINT -->", INJECTION)
    # Fallback: put it right before the first <script> tag, else before </head>.
    lower = html.lower()
    idx = lower.find("<script")
    if idx != -1:
        return html[:idx] + INJECTION + "\n" + html[idx:]
    idx = lower.find("</head>")
    if idx != -1:
        return html[:idx] + INJECTION + "\n" + html[idx:]
    return INJECTION + "\n" + html


def looks_valid(html):
    if not html:
        return False
    low = html.lower()
    if "<canvas" not in low and "<svg" not in low:
        return False
    if "<script" not in low:
        return False
    if "requestanimationframe" not in low and "addeventlistener" not in low:
        return False
    if not (low.lstrip().startswith("<!doctype") or low.lstrip().startswith("<html")):
        return False
    return True


available_sprites = list(manifest.get("sprites", {}).keys())

system_prompt = """You are a senior HTML5 canvas game developer. You are given a WORKING game
skeleton for a specific Google Doodle archetype, plus a themed game design. Produce the FINAL,
polished, self-contained index.html.

Requirements:
- Keep the archetype's core MECHANIC and control scheme from the skeleton.
- Theme everything to the launch: title, labels, colors, on-screen copy, object names, and wire
  up the provided sprite names. Add juice (simple animations, particles, screen-shake) if quick.
- The game MUST be immediately playable, winnable in ~45-70s, with a clear win/lose end screen
  showing the closing stat, and a "Play again" restart.
- Load sprites from the 'sprites/<name>.png' folder via window.SPRITE_MANIFEST.sprites (name->file).
  For any sprite that fails to load, fall back to drawn shapes (never crash).
- KEEP the exact comment marker `<!-- PARAMS_INJECTION_POINT -->` where params get injected, and
  keep reading window.GAME_DESIGN / window.SPRITE_MANIFEST (do not hardcode data that exists there).
- KEEP the game-over overlay as an element with id="msg" that becomes visible on win/lose and
  contains a restart <button>. (An external script injects a Ramp feature info card into it.)
- Output ONE complete HTML document ONLY. No markdown fences, no commentary before or after."""

user_prompt = f"""GAME DESIGN (JSON):
{json.dumps(design, indent=2)}

AVAILABLE SPRITE NAMES (already generated into sprites/): {available_sprites}

SKELETON TO CUSTOMIZE (archetype: {archetype}):
--- BEGIN SKELETON ---
{skeleton}
--- END SKELETON ---

Return the final complete index.html now."""

messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": user_prompt},
]

print(f"CODEGEN: authoring the game with {codegen_models} (up to 5 min)...")
start = time.time()
html = None
try:
    raw = chat(codegen_models, messages, temperature=0.4, timeout=300)
    html = strip_code_fences(raw)
    if not looks_valid(html):
        print("  Output failed sanity check; requesting one repair pass...")
        messages.append({"role": "assistant", "content": raw})
        messages.append({"role": "user", "content": (
            "That output was not a valid complete HTML game document. Return ONE complete, valid "
            "HTML file (starting with <!DOCTYPE html>), self-contained and playable, no markdown fences."
        )})
        raw = chat(codegen_models, messages, temperature=0.3, timeout=300)
        html = strip_code_fences(raw)
except Exception as e:
    print(f"  [!] Code-gen failed ({e}).")
    html = None

if not html or not looks_valid(html):
    print("  [fallback] Using the raw doodle skeleton (still playable).")
    html = skeleton

html = inject_params(html)
Path("generated_game/index.html").write_text(html, encoding="utf-8")

print(f"[OK] CODEGEN done in {time.time() - start:.1f}s")
print(f"     Archetype: {archetype}  |  Sprites wired: {len(available_sprites)}")
print("     Output: generated_game/index.html")
