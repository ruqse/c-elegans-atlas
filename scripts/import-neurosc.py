"""Snapshot public NeuroSC meshes without geometry conversion or simplification."""
import concurrent.futures, datetime, hashlib, json, pathlib, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1] / 'public' / 'neurosc'
ROOT.mkdir(parents=True, exist_ok=True)
BASE = 'https://neurosc.net'

def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2: raise
            time.sleep(attempt + 1)

def mesh(job):
    stage, point, row = job
    assert pathlib.Path(row['filename']).name == row['filename'] and row['filename'].endswith('.gltf')
    url = f'{BASE}/files/neuroscan/{stage}/{point}/neurons/{row["filename"]}'
    path = ROOT / str(point) / row['filename']
    raw = path.read_bytes() if path.exists() else get(url)
    data = json.loads(raw)
    assert data['asset']['version'] == '2.0'
    assert all(b['uri'].startswith('data:') for b in data.get('buffers', [])), 'External buffer'
    assert not data.get('images'), 'Unexpected image dependency'
    path.write_bytes(raw)
    return dict(row, url=url, local=f'./neurosc/{point}/{row["filename"]}',
                bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())

datasets = []
for stage, point in [('L1', 0), ('Adult', 45)]:
    url = f'{BASE}/neurons?timepoint={point}&limit=1000&sort=uid:ASC'
    raw = get(url)
    rows = json.loads(raw)
    assert rows and len(rows) < 1000
    assert len({r['uid'] for r in rows}) == len(rows)
    (ROOT / str(point)).mkdir(exist_ok=True)
    (ROOT / str(point) / 'source-api.json').write_bytes(raw)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        objects = list(pool.map(mesh, [(stage, point, r) for r in rows]))
    datasets.append(dict(id=f'neurosc-{point}', stage=stage, timepoint=point,
        label=f'{stage} · {point} h (NeuroSC label)', sourceYear=2021,
        platformYear=2025, scope='Segmented EM reconstruction; nerve-ring region. Not a whole-body or complete-cell reconstruction.',
        catalogUrl=url, objects=objects))
    print(stage, point, len(objects), 'objects;', sum(r['bytes'] for r in objects), 'bytes', flush=True)

catalog = dict(retrieved=datetime.date.today().isoformat(), source='NeuroSC',
    paper='https://doi.org/10.7554/eLife.103977.3',
    originalStudy='https://doi.org/10.1038/s41586-021-03778-8',
    note='Original downloaded Draco-compressed glTF files. No mesh simplification or coordinate registration applied here. Source endpoint names do not independently establish cell identity. Source colors retained.',
    datasets=datasets)
(ROOT / 'catalog.json').write_text(json.dumps(catalog, indent=2) + '\n')
