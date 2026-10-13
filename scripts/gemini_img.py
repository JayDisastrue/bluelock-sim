"""Minimal Gemini image generate/edit client. The key comes from $GEMINI_API_KEY and is never printed or logged.

  from gemini_img import generate
  png_bytes = generate(prompt, images=[Path|bytes, ...], aspect='3:4')

Model: $GEMINI_IMAGE_MODEL (default gemini-3.1-flash-image). Retries on 429/5xx with backoff.
"""
import base64, json, os, time, urllib.request, urllib.error
from pathlib import Path

MODEL = os.environ.get('GEMINI_IMAGE_MODEL', 'gemini-3.1-flash-image')
URL = 'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent'


class GeminiError(RuntimeError):
    pass


def generate(prompt: str, images=(), aspect: str | None = '3:4', model: str | None = None, retries: int = 3) -> bytes:
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise GeminiError('GEMINI_API_KEY is not set')
    parts = [{'text': prompt}]
    for im in images:
        data = im if isinstance(im, (bytes, bytearray)) else Path(im).read_bytes()
        parts.append({'inline_data': {'mime_type': 'image/png', 'data': base64.b64encode(data).decode()}})
    cfg = {'responseModalities': ['IMAGE']}
    if aspect:
        cfg['imageConfig'] = {'aspectRatio': aspect}
    body = json.dumps({'contents': [{'parts': parts}], 'generationConfig': cfg}).encode()
    req = urllib.request.Request(URL.format(m=model or MODEL), data=body, headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    last = ''
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.load(r)
            for c in d.get('candidates', []):
                for p in c.get('content', {}).get('parts', []):
                    inl = p.get('inlineData') or p.get('inline_data')
                    if inl:
                        return base64.b64decode(inl['data'])
            last = 'no image in response: ' + str(d.get('candidates', [{}])[0].get('finishReason', d.get('promptFeedback', '')))[:200]
        except urllib.error.HTTPError as e:
            last = f'HTTP {e.code}: ' + e.read().decode('utf8', 'replace')[:200].replace(key, '***')
            if e.code not in (429, 500, 502, 503, 504):
                raise GeminiError(last)
        except (urllib.error.URLError, TimeoutError) as e:
            last = f'network: {e}'
        time.sleep(2 ** (attempt + 1))
    raise GeminiError(last)
