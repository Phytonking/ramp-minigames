"""Shared OpenAI helper.

Handles differences between model families so stages don't have to:
  - Older chat models (gpt-4o, gpt-4.1, gpt-3.5) accept `temperature`.
  - Newer reasoning / codex models (gpt-5*, o1/o3/o4) only allow the default
    temperature, so we omit it for them.
It also supports a fallback chain: if the primary model errors (e.g. a model that
isn't reachable via chat.completions on this key), it retries with the next model.
"""
import time
from openai import OpenAI

_client = None


def client():
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def _accepts_temperature(model: str) -> bool:
    m = model.lower()
    return m.startswith("gpt-4") or m.startswith("gpt-3.5") or m.startswith("chatgpt")


def chat(models, messages, temperature=0.7, timeout=300, max_attempts_per_model=2):
    """Call the first working model in `models` (str or list) and return text content.

    Retries transient failures per model, then falls back to the next model.
    Raises RuntimeError if every model fails.
    """
    if isinstance(models, str):
        models = [models]

    last_err = None
    for model in models:
        for attempt in range(max_attempts_per_model):
            try:
                kwargs = {"model": model, "messages": messages, "timeout": timeout}
                if _accepts_temperature(model):
                    kwargs["temperature"] = temperature
                resp = client().chat.completions.create(**kwargs)
                content = resp.choices[0].message.content
                if not content or not content.strip():
                    raise ValueError("empty response content")
                return content.strip()
            except Exception as e:
                last_err = e
                msg = str(e)
                # Parameter-incompatibility errors won't fix on retry -> skip to next model.
                if "temperature" in msg or "unsupported" in msg.lower() or "not exist" in msg.lower():
                    print(f"    [llm] {model} rejected call ({msg[:120]}); trying next model...")
                    break
                wait = 3 * (attempt + 1)
                print(f"    [llm] {model} attempt {attempt + 1} failed ({msg[:120]}); retry in {wait}s...")
                time.sleep(wait)
        else:
            continue
    raise RuntimeError(f"All models failed. Last error: {last_err}")


def strip_code_fences(text: str) -> str:
    """Remove a leading ```lang fence and trailing ``` if present."""
    t = text.strip()
    if t.startswith("```"):
        first_newline = t.find("\n")
        if first_newline != -1:
            t = t[first_newline + 1:]
        if t.rstrip().endswith("```"):
            t = t.rstrip()[:-3]
    return t.strip()
