"""One-off extractor: reads the original workbook (never modifies it) and writes
src/data/workbook.json (static inputs/records) and src/engine/workbook-cache.json (cached
Excel results used ONLY as test oracles). Run: python3 -I scripts/extract_workbook.py"""
import json, sys, openpyxl
P = 'source-documents/Frontier_Trust_Formula_Driven_Underwriting.xlsx'
v = openpyxl.load_workbook(P, data_only=True)

def rows(ws, r0, r1, cols):
    out = []
    for r in range(r0, r1 + 1):
        rec = {k: ws[f'{c}{r}'].value for k, c in cols.items()}
        if any(x is not None for x in rec.values()): out.append(rec)
    return out

S = v['Sources']
sources = rows(S, 5, 22, dict(id='A', entity='B', evidence='C', classification='D', establishes='E', date='F', url='G'))
H = v['Historical Inputs']
hist = rows(H, 5, 15, dict(company='A', measure='B', dataType='C', value='D', units='E', date='F', sourceId='G', quality='H', interpretation='I', url='J'))
A = v['Assumptions']
g = lambda c: A[c].value
def company(base):
    names = ['entryPreMoney','dilution','revenueRecognition','grossMargin','smStart','rdStart','gaStart','smStep','rdStep','gaStep','daPct','capexPct','nwcPct','taxRate']
    rs = [13,14,15,16,17,18,19,20,21,22,23,24,25,26] if base == 'Vanta' else [29,30,31,32,33,34,35,36,37,38,39,40,41,42]
    return {n: A[f'B{r}'].value for n, r in zip(names, rs)}
scen = {}
for r in range(46, 52):
    scen.setdefault(A[f'A{r}'].value, {})[A[f'B{r}'].value.lower()] = dict(growth2027=A[f'C{r}'].value, decay=A[f'D{r}'].value, exitMultiple=A[f'E{r}'].value, exitNetDebt=A[f'F{r}'].value)
glob = dict(checkSize=g('B5'), hurdle=g('B6'), holdYears=g('B7'), probabilities=dict(bear=g('B8'), base=g('B9'), bull=g('B10')))
O = v['Opportunity Screen']
opps = rows(O, 5, 20, dict(name='A', region='B', segment='C', url='D', priority='E', limitation='F'))
R = v['Risk Register']
risks = rows(R, 5, 19, dict(company='A', domain='B', failure='C', evidence='D', requirement='E', consequence='F', sourceId='G'))
Q = v['QA Checks']
out = dict(sources=sources, historical=hist, globals=glob, companies=dict(Vanta=company('Vanta'), Chainguard=company('Chainguard')), scenarios=scen, opportunities=opps, risks=risks,
           notes=dict(readme=[(v['README'][f'A{r}'].value, v['README'][f'B{r}'].value) for r in range(5, 22)],
                      historicalCautions=[H['A18'].value, H['A19'].value],
                      assumptionNotes=[A['A54'].value, A['A55'].value],
                      returnsNotes=[v['Returns'][f'A{r}'].value for r in (32,33,34)],
                      dashboardNarrative=[(v['Committee Dashboard'][f'A{r}'].value, v['Committee Dashboard'][f'B{r}'].value) for r in range(23, 29)],
                      disclaimer=v['Committee Dashboard']['A31'].value, oppNote=O['A23'].value, oppHeader=[O['A1'].value, O['A2'].value]))
json.dump(out, open('src/data/workbook.json', 'w'), indent=1, default=str)

# --- cached oracle values
R_ = v['Returns']; D = v['Committee Dashboard']; M = v['Valuation Matrix']
cols = dict(vanta=['B','C','D'], chainguard=['F','G','H'])
cache = dict(returns={}, forecast={}, dashboard={}, matrix={})
labels = {5:'prob',10:'ownPrimary',11:'ownSecondary',13:'arr2031',15:'exitEV',17:'exitEquity',18:'proceedsPrimary',19:'moicPrimary',20:'irrPrimary',21:'proceedsSecondary',22:'moicSecondary',23:'irrSecondary',24:'maxPrePrimary',25:'maxEntrySecondary',26:'discount',27:'pwProceeds',28:'targetMoic',29:'pass'}
for co, cs in cols.items():
    for case, c in zip(['bear','base','bull'], cs):
        cache['returns'][f'{co}.{case}'] = {n: R_[f'{c}{r}'].value for r, n in labels.items()}
for co, sheet in (('vanta','Vanta Forecast'),('chainguard','Chainguard Forecast')):
    ws = v[sheet]
    for case, r0 in (('bear',6),('base',24),('bull',42)):
        names = ['arr','growth','revenue','grossProfit','sm','rd','ga','ebitda','da','ebit','tax','capex','nwc','fcf','fcfMargin']
        cache['forecast'][f'{co}.{case}'] = {n: [ws[f'{c}{r0+i}'].value for c in 'BCDEFG'] for i, n in enumerate(names)}
cache['dashboard'] = {f'{k}.{r}': D[f'{k}{r}'].value for k in 'BC' for r in range(6, 20)}
def grid(r0, r1): return [[M[f'{c}{r}'].value for c in 'ABCDEF'] for r in range(r0, r1 + 1)]
cache['matrix'] = dict(vantaIrr=grid(5,10), chainguardIrr=grid(14,19), vantaMax=grid(23,28), chainguardMax=grid(32,37))
json.dump(cache, open('src/engine/workbook-cache.json', 'w'), indent=1, default=str)
print(len(sources), 'sources', len(opps), 'opps', len(risks), 'risks')
