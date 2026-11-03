"""Builds src/data/valuation-sources.json (V-series evidence register) from the extension workbook extract
(src/data/valuation.json). Anything not stated in the supplied materials is null ("Not established"). Titles are
derived from URLs where the page was not read, and flagged titleBasis="url". Run: python3 -I scripts/extract_valuation_sources.py"""
import json, re
from urllib.parse import urlparse
d = json.load(open('src/data/valuation.json'))
AGG = "S&P Global Market Intelligence data distributed by StockAnalysis"
FIX = {'Crowdstrike': 'CrowdStrike', 'wiz': 'Wiz', '32b': '32B'}
def slug_title(u):
    seg = [x for x in urlparse(u).path.split('/') if x and x != 'default.aspx'][-1]
    t = re.sub(r'\s+', ' ', seg.replace('-', ' ')).strip().capitalize()
    return ' '.join(FIX.get(w, w) for w in t.split(' '))
def fname(u): return urlparse(u).path.split('/')[-1]
# facts readable from the URL / workbook only
OP = {
 'RPD':  dict(title=slug_title(d['peers'][0]['operatingUrl']), period='Q2 2026 (per URL title)', org='Rapid7 (investor relations)', cls='Company earnings release',
              extra=" Per the review brief supplied with this update, the release reports ARR of $824M and ARR growth of -2.0% year over year; the comparable dataset's +0.1% is TTM revenue growth. This application did not read the page."),
 'TENB': dict(title=slug_title(d['peers'][1]['operatingUrl']), period='Q2 2026 (per URL title)', org='Tenable (investor relations)', cls='Company earnings release'),
 'S':    dict(title='SentinelOne quarterly results page (investor relations)', period=None, org='SentinelOne (investor relations)', cls='Company investor-relations page'),
 'VRNS': dict(title='SEC filing document ' + fname(d['peers'][3]['operatingUrl']) + ' (issuer: Varonis per workbook; title not read)', period=None, org='U.S. SEC EDGAR (issuer filing)', cls='SEC filing exhibit'),
 'QLYS': dict(title='SEC filing document ' + fname(d['peers'][4]['operatingUrl']) + ' (issuer: Qualys per workbook; title not read)', period=None, org='U.S. SEC EDGAR (issuer filing)', cls='SEC filing exhibit'),
 'OKTA': dict(title=slug_title(d['peers'][5]['operatingUrl']), period='Second quarter 2027 (per URL title; fiscal-year basis not confirmed)', org='Okta (newsroom)', cls='Company earnings release'),
 'ZS':   dict(title='SEC filing document ' + fname(d['peers'][6]['operatingUrl']) + ' (issuer: Zscaler per workbook; title not read)', period=None, org='U.S. SEC EDGAR (issuer filing)', cls='SEC filing exhibit'),
 'CRWD': dict(title=slug_title(d['peers'][7]['operatingUrl']), period='Second quarter fiscal year 2027 (per URL title)', org='CrowdStrike (investor relations)', cls='Company earnings release'),
}
recs = []
n = 0
def add(**k):
    global n; n += 1; k['id'] = f'V{n:02d}'; recs.append(k)
for p in d['peers']:
    t = p['ticker']; o = OP[t]
    add(company=p['company'], ticker=t, role='market-data', title=f"StockAnalysis statistics page: {p['company']} ({t})", titleBasis='url',
        metric=f"Enterprise value (${p['ev']:,}M) and TTM revenue (${p['ttmRevenue']:,}M) inputs for {p['company']}",
        organization=AGG, reportingPeriod=None, publicationDate=None, observationDate=p['date'], url=p['quoteUrl'],
        classification='Third-party market data (aggregator)',
        limitations=f"Aggregator figures as of the 2 Nov 2026 market close; EV definitions vary by provider and were not re-derived from filings. {p['caveat']}.")
    add(company=p['company'], ticker=t, role='operating-evidence', title=o['title'], titleBasis='url' if o['title'][0].isupper() and 'SEC filing' not in o['title'] and 'page' not in o['title'] else 'description',
        metric=f"Operating context for {p['company']} TTM revenue and growth ({p['yoy']*100:.1f}% TTM sales YoY recorded in the comparable dataset)",
        organization=o['org'], reportingPeriod=o['period'], publicationDate=None, observationDate=None, url=p['operatingUrl'],
        classification=o['cls'],
        limitations="Reporting period differs from the 2 Nov 2026 market observation; publication date not established; document content not independently reviewed by this application." + o.get('extra', ''))
g = next(x for x in d['deals'] if x['target'] == 'Wiz')
add(company='Wiz (acquirer: Google)', ticker=None, role='deal-price', title='SEC filing goog-20260630 (document title not established)', titleBasis='description',
    metric=f"Google purchase price, adjusted, 2026 (${g['price']:,}M) recorded in Private Deal Signals", organization='U.S. SEC EDGAR (issuer filing)', reportingPeriod=None,
    publicationDate=None, observationDate=None, url=g['priceUrl'], classification='SEC filing',
    limitations="M&A price including strategic synergies; an upper-bound signal only, not an EV/ARR multiple. Filing period and publication date not established from the supplied materials.")
add(company='Wiz (acquirer: Google)', ticker=None, role='deal-arr', title=slug_title(g['arrUrl']), titleBasis='url',
    metric="Completion of Google's acquisition of Wiz (2026-03-11 is the price date recorded in Private Deal Signals); ARR above $1B in 2025 as listed in the workbook",
    organization='TechCrunch', reportingPeriod='2025 ARR reference (per workbook)', publicationDate='2026-03-11', publicationDateBasis='URL path', observationDate=None, url=g['arrUrl'],
    classification='Press report',
    limitations="Press report; the ARR reference is a bound, not an exact figure. Publication date taken from the URL path, not read from the page.")
json.dump(recs, open('src/data/valuation-sources.json', 'w'), indent=1)
print(n, 'records'); [print(r['id'], r['title'][:70], '|', r['titleBasis']) for r in recs]
