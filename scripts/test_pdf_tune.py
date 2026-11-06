"""
PDF Page Height Calibrator for TerraGuard AI Hackathon Dossier
"""
import sys
from pathlib import Path
import fitz

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from scripts.generate_hackathon_assets_v2 import generate_pdf, PDF_OUTPUT

generate_pdf()

doc = fitz.open(str(PDF_OUTPUT))
print(f"Total pages: {len(doc)}")
for i, page in enumerate(doc):
    blocks = page.get_text("blocks")
    body_blocks = [b for b in blocks if 45 <= b[1] <= 800]
    if body_blocks:
        min_y = min(b[1] for b in body_blocks)
        max_y = max(b[3] for b in body_blocks)
        bottom_empty = 800 - max_y
        status = "PERFECT" if bottom_empty <= 35 else f"NEEDS +{bottom_empty-30:.0f}pt"
        print(f"Page {i+1:2d}: min_y={min_y:5.1f}, max_y={max_y:5.1f}, empty={bottom_empty:5.1f}pt -> {status}")
    else:
        print(f"Page {i+1:2d}: NO BODY BLOCKS FOUND")
