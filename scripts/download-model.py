"""Optional HTTPS setup when QVAC's peer-to-peer registry is unavailable."""
import hashlib
from pathlib import Path
import urllib.request

URL = 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/50968a4468ef4233ed78cd7c3de230dd1d61a56b/Qwen3-0.6B-Q4_0.gguf'
SHA256 = '33bcc57074ec7b6eada5a90651ee546ec0c2b271002c22baf9f1b2dd1e8f75cb'
target = Path(__file__).resolve().parent.parent / '.qvac/models/Qwen3-0.6B-Q4_0.gguf'
target.parent.mkdir(parents=True,exist_ok=True)
def digest(path):
    checksum = hashlib.sha256()
    with path.open('rb') as f:
        while chunk := f.read(1024*1024):
            checksum.update(chunk)
    return checksum.hexdigest()
if target.exists() and digest(target) == SHA256:
    print(f'Verified model already present: {target}')
else:
    partial = target.with_suffix('.download')
    try:
        print('Downloading the pinned Qwen3 0.6B model (382 MB)…',flush=True)
        with urllib.request.urlopen(URL,timeout=180) as response, partial.open('wb') as out:
            while chunk := response.read(1024*1024):
                out.write(chunk)
        if digest(partial) != SHA256:
            raise RuntimeError('Model checksum mismatch; download rejected.')
        partial.replace(target)
        print(f'Model verified: {target}')
    finally:
        partial.unlink(missing_ok=True)
