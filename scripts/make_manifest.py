"""Writes src/data/downloads.json (size + SHA-256 of each shipped original). Run: python3 -I scripts/make_manifest.py"""
import hashlib, json, os
D = 'source-documents'
meta = [
 ('Frontier_Trust_Executive_Investment_Brief.pdf', 'Executive investment brief', 'PDF, 2 pages', False),
 ('Frontier_Trust_Investment_Committee_Memorandum.pdf', 'Investment committee memorandum', 'PDF, 8 pages', False),
 ('Frontier_Trust_Formula_Driven_Underwriting.xlsx', 'Formula-driven underwriting model', 'Excel workbook, 12 sheets (original computational specification)', False),
 ('Frontier_Trust_Investment_Committee_Presentation.pptx', 'Investment committee presentation', 'PowerPoint, 10 slides', False),
 ('Frontier_Trust_Underwriting_With_Market_Comparables.xlsx', 'Underwriting model with market comparables (research extension)', 'Excel workbook, 15 sheets: the original 12 plus Public Market Comps, Exit Multiple Review and Private Deal Signals', True),
]
out = []
for f, t, d, ext in meta:
    b = open(os.path.join(D, f), 'rb').read()
    out.append(dict(file=f, title=t, description=d, bytes=len(b), sha256=hashlib.sha256(b).hexdigest(), extension=ext))
json.dump(out, open('src/data/downloads.json', 'w'), indent=1)
