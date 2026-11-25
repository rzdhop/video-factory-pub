"""Where the Chrome / Chromium used by the tools is: the same rule as remotion.config.ts.

VF_CHROME (environment) wins; else the first common install path that exists; else whatever `chromium`,
`google-chrome` or `chrome` is on the PATH; else None (the caller says how to set VF_CHROME)."""
import os, shutil

PATHS = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]


def find():
    env = os.environ.get("VF_CHROME")
    if env:
        return env
    for p in PATHS:
        if os.path.isfile(p):
            return p
    for name in ("google-chrome", "chromium", "chromium-browser", "chrome"):
        hit = shutil.which(name)
        if hit:
            return hit
    return None
