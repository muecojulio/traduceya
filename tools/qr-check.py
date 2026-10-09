#!/usr/bin/env python3
"""Compara lib/qr.js contra la librería de referencia `qrcode` de Python.

    python3 tools/qr-check.py            # con un intérprete que tenga `qrcode`
    .venv/bin/python tools/qr-check.py

Compara todas las combinaciones texto × nivel × máscara (0-7) forzando la
misma máscara en los dos lados: si un solo módulo difiere, el generador
propio produce códigos que un lector no entendería. Sale con código 1 en ese
caso. También informa de la máscara que cada lado elige por su cuenta.
"""
import json
import subprocess
import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H

ROOT = Path(__file__).resolve().parent.parent
EC = {"L": ERROR_CORRECT_L, "M": ERROR_CORRECT_M, "Q": ERROR_CORRECT_Q, "H": ERROR_CORRECT_H}


def byte_data(text):
    """QRData en modo byte explícito: sin `mode`, la referencia optimiza a
    numérico/alfanumérico cuando puede y el resultado deja de ser comparable."""
    return qrcode.util.QRData(text.encode("utf-8"), mode=qrcode.util.MODE_8BIT_BYTE)


def reference(text, ec, version, mask):
    qr = qrcode.QRCode(
        version=version, error_correction=EC[ec], box_size=1, border=0, mask_pattern=mask
    )
    qr.add_data(byte_data(text))
    qr.make(fit=False)
    return ["".join("1" if c else "0" for c in row) for row in qr.get_matrix()]


def reference_mask(text, ec, version):
    qr = qrcode.QRCode(
        version=version, error_correction=EC[ec], box_size=1, border=0, mask_pattern=None
    )
    qr.add_data(byte_data(text))
    qr.make(fit=False)
    return qr.best_mask_pattern()


def main():
    out = subprocess.run(
        ["node", str(ROOT / "tools" / "qr-check.mjs"), "--json"],
        capture_output=True,
        text=True,
        check=True,
        cwd=ROOT,
    ).stdout
    cases = json.loads(out)

    checked = failed = 0
    mask_agree = mask_total = 0
    for case in cases:
        if case["mask"] == "auto":
            mask_total += 1
            if reference_mask(case["text"], case["ec"], case["version"]) == case["chosen"]:
                mask_agree += 1
            continue
        ref = reference(case["text"], case["ec"], case["version"], case["mask"])
        checked += 1
        if ref != case["modules"]:
            diffs = sum(
                1 for a, b in zip(ref, case["modules"]) for x, y in zip(a, b) if x != y
            )
            print(
                f"FAIL {case['text']!r} ec={case['ec']} v{case['version']} "
                f"mask={case['mask']}: {diffs} módulos distintos"
            )
            failed += 1

    print(f"{checked - failed}/{checked} matrices idénticas a la referencia")
    print(f"máscara elegida coincide en {mask_agree}/{mask_total} casos (informativo)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
