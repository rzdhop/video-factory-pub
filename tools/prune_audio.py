#!/usr/bin/env python3
"""Delete the intermediate audio of finished episodes, so the repo stays light.

  prune_audio.py <episode_id> [<episode_id> ...]      dry run: lists what would go
  prune_audio.py <episode_id> [...] --apply           deletes the files

Kept, always: voice.wav and sfx.wav (the render reads them), every source take of the real voice (*.mp3), episode.json,
episode_pre_retime.json, plan.json, script.md.
Deleted: the files every step of the voice chain leaves behind (raw concat, tightened, polished, espeak reference,
pre-retime copy, superseded takes). All of them can be rebuilt from the .mp3 takes without spending a credit.

Run it once an episode is published and no more change is asked (about 7 days after its slot). Do NOT run it on an
episode that may still be re-cut: retime.py restarts from voice_pre_retime.wav and refuses to run without it.
To re-cut a pruned episode: keep voice.wav aside, then redo the voice chain from the .mp3 take
(build_episode.py, concat, tighten_voice.py, polish_voice.sh, align_audio.py, then the post-alignment chain).
"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PATTERNS = ("voice_full*.wav", "voice_tight.wav", "voice_human.wav", "voice_pre_retime.wav",
            "voice_ref_espeak.wav", "voice_before_rerun.wav")


def main():
    args = [a for a in sys.argv[1:] if a != "--apply"]
    apply = "--apply" in sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    total = 0
    for ep_id in args:
        d = ROOT / "episodes" / ep_id
        if not (d / "voice.wav").is_file():
            sys.exit(f"{ep_id}: no voice.wav in {d}, nothing pruned (is the id right?)")
        files = sorted({f for p in PATTERNS for f in d.glob(p)})
        size = sum(f.stat().st_size for f in files)
        total += size
        print(f"{ep_id}: {len(files)} file(s), {size / 1e6:.1f} MB" + ("" if files else " (already clean)"))
        for f in files:
            print(f"  {'deleted' if apply else 'would delete'} {f.name}")
            if apply:
                f.unlink()
    print(f"{'freed' if apply else 'would free'} {total / 1e6:.1f} MB" + ("" if apply else " (add --apply to delete)"))


if __name__ == "__main__":
    main()
