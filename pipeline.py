"""Pipeline orchestrator (Google Doodle edition).
Run: python pipeline.py --config config.json --input input.txt

Flow:
  input.txt (a few lines about a Ramp launch)
     -> MAP     (LLM picks a Google Doodle archetype + designs a themed game)
     -> ASSETS  (Pollinations generates sprites in the doodle's indie style)
     -> CODEGEN (code-gen LLM authors the final playable index.html, ~5 min budget)

Output: generated_game/index.html
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path


def run_stage(script_name, stage_name):
    print(f"\n{'=' * 54}")
    print(f"STAGE: {stage_name}")
    print(f"{'=' * 54}")
    start = time.time()
    result = subprocess.run(
        [sys.executable, script_name],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    print(result.stdout)
    if result.returncode != 0:
        print(f"ERROR in {stage_name}:\n{result.stderr}")
        raise RuntimeError(f"{stage_name} failed")
    print(f"{stage_name} completed in {time.time() - start:.1f}s")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.json")
    parser.add_argument("--input", default="input.txt")
    args = parser.parse_args()

    with open(args.config, encoding="utf-8") as f:
        config = json.load(f)

    output_dir = Path(config["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(output_dir / "config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    launch_text = Path(args.input).read_text(encoding="utf-8")
    (output_dir / "input.txt").write_text(launch_text, encoding="utf-8")

    print("LAUNCH BLURB:")
    print(launch_text.strip())

    run_stage("stages/stage_map.py", "MAP (pick doodle + design game)")
    run_stage("stages/stage_assets.py", "ASSETS (image generation)")
    run_stage("stages/stage_codegen.py", "CODEGEN (author playable game)")

    print(f"\n[OK] Game generated at: {output_dir / 'index.html'}")


if __name__ == "__main__":
    main()
