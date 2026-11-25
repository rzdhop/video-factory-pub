"""Tiny audio I/O helpers shared by the tools: decode anything through ffmpeg, write 16-bit WAV with the
standard library. Keeps the new tools free of librosa / soundfile."""
import subprocess, wave
import numpy as np


def load(path, sr=44100, channels=1):
    """Decode `path` to float32 in [-1, 1]. Returns (samples, sr); shape (n,) for mono, (n, channels) otherwise."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(channels), "-ar", str(sr), "-"],
        check=True, capture_output=True,
    ).stdout
    y = np.frombuffer(raw, dtype=np.float32).copy()
    return (y if channels == 1 else y.reshape(-1, channels)), sr


def save(path, y, sr=44100):
    """Write float samples (mono (n,) or stereo (n, 2)) as 16-bit PCM WAV."""
    y = np.clip(np.asarray(y, dtype=np.float64), -1.0, 1.0)
    ch = 1 if y.ndim == 1 else y.shape[1]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((y * 32767.0).astype("<i2").tobytes())


def source_rate(path, default=44100):
    """Sample rate of the first audio stream (so a tool can keep the source rate)."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate",
         "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True,
    ).stdout.strip()
    return int(out) if out.isdigit() else default
