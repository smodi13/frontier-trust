"""Reads the market-comparables extension workbook (never modified) and writes
src/data/valuation.json (sourced inputs + text) and src/engine/valuation-cache.json (Excel cached
results, used ONLY as test oracles). Run: python3 -I scripts/extract_valuation.py"""
import json, openpyxl
P = 'source-documents/Frontier_Trust_Underwriting_With_Market_Comparables.xlsx'
v = openpyxl.load_workbook(P, data_only=True)
M, X, D = v['Public Market Comps'], v['Exit Multiple Review'], v['Private Deal Signals']
peers = []
for r in range(7, 15):
    peers.append(dict(company=M[f'A{r}'].value, ticker=M[f'B{r}'].value, ev=M[f'C{r}'].value, ttmRevenue=M[f'D{r}'].value,
        yoy=M[f'F{r}'].value, role=M[f'G{r}'].value, date=M[f'H{r}'].value, quoteUrl=M[f'I{r}'].value, operatingUrl=M[f'J{r}'].value,
        definition=M[f'K{r}'].value, caveat=M[f'L{r}'].value,
        # workbook E20 = MEDIAN(E8:E13): "core non-distressed (ex RPD, CRWD)"
        core=8 <= r <= 13,
        # workbook E19 = MEDIAN(E7:E13): excludes only the last row, labeled "Premium security outlier"
        outlier=(r == 14)))
deals = [dict(target=D[f'A{r}'].value, transaction=D[f'B{r}'].value, price=D[f'C{r}'].value, arr=D[f'D{r}'].value, arrDate=D[f'E{r}'].value,
              priceDate=D[f'F{r}'].value, validity=D[f'H{r}'].value, priceUrl=D[f'I{r}'].value, arrUrl=D[f'J{r}'].value) for r in range(5, 9)]
out = dict(peers=peers, deals=deals,
    notes=dict(compsTitle=M['A1'].value, compsSubtitle=M['A2'].value, interpretation=[M['A25'].value, M['A26'].value], inputSource=M['A27'].value,
               coreLabel=M['A20'].value, medianLabels={k: M[f'A{r}'].value for k, r in dict(all=18, exCrwd=19, core=20, low=21, high=22, mean=23).items()},
               reverseTitle=X['A1'].value, reverseSubtitle=X['A2'].value, reverseNotes=[X[f'A{r}'].value for r in (33, 34, 35, 36, 37)],
               dealsTitle=D['A1'].value, dealsSubtitle=D['A2'].value, dealCautions=[D[f'A{r}'].value for r in (10, 11, 12)]))
json.dump(out, open('src/data/valuation.json', 'w'), indent=1)
rows = {7:'arr0',8:'exitArr',9:'exitMultiple',10:'peerMedian',11:'peerLessModeled',12:'preMoney',13:'check',14:'stake',15:'netDebt',16:'targetMoic',17:'reqExitEquity',18:'reqExitEv',19:'reqEvArr',20:'reqArr',21:'addArr',22:'peerExitEquity',23:'peerMoic',24:'peerIrr',25:'peerMaxPre',26:'baseIrr',27:'origMaxPre',28:'fcf',29:'fcfMargin'}
cache = dict(reverse={co: {n: X[f'{c}{r}'].value for r, n in rows.items()} for co, c in (('vanta','B'),('chainguard','C'))},
             comps=[M[f'E{r}'].value for r in range(7, 15)],
             stats={k: M[f'E{r}'].value for k, r in dict(all=18, exCrwd=19, core=20, low=21, high=22, mean=23).items()},
             deals=[D[f'G{r}'].value for r in range(5, 9)])
json.dump(cache, open('src/engine/valuation-cache.json', 'w'), indent=1)
print(len(peers), 'peers', len(deals), 'deals', cache['stats'])
