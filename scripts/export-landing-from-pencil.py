#!/usr/bin/env python3
"""Export Kitland Landing frames from Pencil Desktop via MCP, then convert to React.

Requires Pen.app open with design.pen loaded.
"""
from __future__ import annotations

import json
import os
import pathlib
import re
import select
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design" / "design.pen"
OUT = ROOT / "design" / "export"
MCP = pathlib.Path.home() / ".pencil/mcp/antigravity_ide/out/mcp-server-darwin-arm64"
PAGES = ROOT / "apps/web/src/pages"

FRAMES = {
    "wxqRk": ("landing-desktop.html", "LandingDesktop", 1440),
    "kVGWD": ("landing-tablet.html", "LandingTablet", 768),
    "IST6A": ("landing-mobile.html", "LandingMobile", 390),
}


def mcp_call():
    proc = subprocess.Popen(
        [str(MCP), "--app", "desktop", "--agent", "grok-export"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    rid = 0

    def send(msg):
        proc.stdin.write(json.dumps(msg) + "\n")
        proc.stdin.flush()

    def read_until_id(want, timeout=180):
        start = time.time()
        while time.time() - start < timeout:
            if proc.poll() is not None:
                raise RuntimeError(proc.stderr.read())
            r, _, _ = select.select([proc.stdout], [], [], 0.3)
            if not r:
                continue
            line = proc.stdout.readline()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except json.JSONDecodeError:
                continue
            if msg.get("id") == want:
                return msg
        raise TimeoutError(want)

    send(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "kitland-export", "version": "1.0"},
            },
        }
    )
    read_until_id(1, 20)
    send({"jsonrpc": "2.0", "method": "notifications/initialized"})
    time.sleep(0.2)

    OUT.mkdir(parents=True, exist_ok=True)
    for node_id, (filename, _, _) in FRAMES.items():
        rid += 1
        path = str(OUT / filename)
        send(
            {
                "jsonrpc": "2.0",
                "id": rid + 1,
                "method": "tools/call",
                "params": {
                    "name": "export_html",
                    "arguments": {
                        "filePath": str(DESIGN),
                        "nodeIds": [node_id],
                        "outputPath": path,
                        "format": "html-tailwind",
                        "includeHtmlScaffold": True,
                        "includeLayerNames": True,
                        "includeLayerIds": True,
                    },
                },
            }
        )
        res = read_until_id(rid + 1, 180)
        print(node_id, res.get("result") or res.get("error"))

    proc.kill()


def html_to_tsx(src: pathlib.Path, component: str, maxw: int) -> str:
    raw = src.read_text()
    body = re.search(r"<body>\s*(.*)\s*</body>", raw, re.S).group(1).strip()
    body = body.replace("class=", "className=")
    for a, b in [
        ("stroke-width=", "strokeWidth="),
        ("stroke-linecap=", "strokeLinecap="),
        ("stroke-linejoin=", "strokeLinejoin="),
        ("fill-rule=", "fillRule="),
        ("clip-rule=", "clipRule="),
        ("clip-path=", "clipPath="),
        ("stop-color=", "stopColor="),
        ("stop-opacity=", "stopOpacity="),
        ("xlink:href=", "xlinkHref="),
        ("xmlns:xlink=", "xmlnsXlink="),
    ]:
        body = body.replace(a, b)
    nbsp = "\u00a0"

    def escape_text(m: re.Match[str]) -> str:
        t = m.group(0)
        if t and t.strip() == "":
            return t.replace(" ", nbsp)
        return t.replace("{", "&#123;").replace("}", "&#125;")

    body = re.sub(r"(?<=>)[^<]+(?=<)", escape_text, body)
    body = re.sub(
        r'(data-pencil-name="Run"[^>]*>)(\s*)(</div>)',
        lambda m: (m.group(1) + nbsp * 2 + m.group(3))
        if not m.group(2).strip()
        else m.group(0),
        body,
    )
    body = re.sub(r"(>\s*\n\s*):\s*\n(\s*</div>)", rf"\1:{nbsp}\n\2", body)
    body = re.sub(r"(>\s*\n\s*interface)\s*\n(\s*</div>)", rf"\1{nbsp}\n\2", body)
    body = re.sub(
        r'className="box-border w-\[[0-9]+px\] h-fit flex flex-col gap-0 justify-start items-start bg-\[#0B0C10\] overflow-hidden"',
        'className="box-border w-full min-w-0 h-fit flex flex-col gap-0 justify-start items-stretch bg-[#0B0C10] overflow-x-hidden"',
        body,
        count=1,
    )
    # Desktop artboard was 1440px; in browser sections must full-bleed. Expand catalog grid past fixed 1184.
    if component == "LandingDesktop":
        body = body.replace(
            'className="box-border w-[1184px] h-fit shrink-0 flex flex-col gap-[12px] justify-start items-start"',
            'className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] justify-start items-start"',
        )
        body = body.replace(
            'className="box-border w-[1184px] h-fit shrink-0 flex flex-col gap-[16px] justify-start items-start"',
            'className="box-border w-full h-fit shrink-0 flex flex-col gap-[16px] justify-start items-start"',
        )
        body = body.replace(
            'p-[96px_48px_72px_48px] justify-start items-center bg-[#0B0C10]"',
            'p-[96px_48px_72px_48px] justify-start items-stretch bg-[#0B0C10]"',
        )
    return f"""/* Generated from Pencil MCP export: {src.name} — do not hand-edit */
export function {component}() {{
  return (
{body}
  );
}}
"""


def write_components():
    for _, (filename, component, maxw) in FRAMES.items():
        src = OUT / filename
        tsx = html_to_tsx(src, component, maxw)
        (PAGES / f"{component}.tsx").write_text(tsx)
        print("wrote", component)
    (PAGES / "LandingFromExport.tsx").write_text(
        """/* Responsive landing from Pencil MCP exports */
import { LandingDesktop } from "./LandingDesktop";
import { LandingMobile } from "./LandingMobile";
import { LandingTablet } from "./LandingTablet";

export function LandingFromExport() {
  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#EDEFF3]">
      <div className="hidden lg:block">
        <LandingDesktop />
      </div>
      <div className="hidden md:block lg:hidden">
        <LandingTablet />
      </div>
      <div className="block md:hidden">
        <LandingMobile />
      </div>
    </div>
  );
}
"""
    )


if __name__ == "__main__":
    import sys

    if "--convert-only" in sys.argv:
        write_components()
    else:
        mcp_call()
        write_components()
