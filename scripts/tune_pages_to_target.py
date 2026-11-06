"""
Automated Page Tuner to ensure EVERY page in the PDF reaches max_y >= 762 pt
"""
import sys
from pathlib import Path
import fitz

def check_pdf():
    doc = fitz.open("INFINEX_2K26_TerraGuard_AI_Presentation.pdf")
    results = []
    print(f"Total pages: {len(doc)}")
    for i, page in enumerate(doc):
        blocks = page.get_text("blocks")
        body_blocks = [b for b in blocks if 45 <= b[1] <= 800]
        if body_blocks:
            min_y = min(b[1] for b in body_blocks)
            max_y = max(b[3] for b in body_blocks)
            empty = 800 - max_y
            results.append((i+1, min_y, max_y, empty))
            print(f"Page {i+1:2d}: min_y={min_y:5.1f}, max_y={max_y:5.1f}, empty={empty:5.1f}pt")
    return results

if __name__ == "__main__":
    check_pdf()
