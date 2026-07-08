import sys, json, glob
from pathlib import Path
from graphify.cache import save_semantic_cache

# Step B3: Merge semantic chunks
chunks = sorted(glob.glob('graphify-out/.graphify_chunk_*.json'))
all_nodes, all_edges, all_hyperedges = [], [], []
total_in, total_out = 0, 0
for c in chunks:
    try:
        d = json.loads(Path(c).read_text(encoding="utf-8"))
        all_nodes += d.get('nodes', [])
        all_edges += d.get('edges', [])
        all_hyperedges += d.get('hyperedges', [])
        total_in += d.get('input_tokens', 0)
        total_out += d.get('output_tokens', 0)
    except Exception as e:
        print(f"Error loading {c}: {e}")

Path('graphify-out/.graphify_semantic_new.json').write_text(json.dumps({
    'nodes': all_nodes, 'edges': all_edges, 'hyperedges': all_hyperedges,
    'input_tokens': total_in, 'output_tokens': total_out,
}, indent=2, ensure_ascii=False), encoding="utf-8")
print(f'Merged {len(chunks)} chunks: {total_in:,} in / {total_out:,} out tokens')

# Cache new semantic results
new = {
    'nodes': all_nodes, 'edges': all_edges, 'hyperedges': all_hyperedges,
    'input_tokens': total_in, 'output_tokens': total_out
}
saved = save_semantic_cache(new.get('nodes', []), new.get('edges', []), new.get('hyperedges', []))
print(f'Cached {saved} files')

# Merge cached and new semantic results
cached = json.loads(Path('graphify-out/.graphify_cached.json').read_text(encoding="utf-8")) if Path('graphify-out/.graphify_cached.json').exists() else {'nodes':[],'edges':[],'hyperedges':[]}
all_nodes = cached['nodes'] + new.get('nodes', [])
all_edges = cached['edges'] + new.get('edges', [])
all_hyperedges = cached.get('hyperedges', []) + new.get('hyperedges', [])
seen = set()
deduped = []
for n in all_nodes:
    if n['id'] not in seen:
        seen.add(n['id'])
        deduped.append(n)

merged_semantic = {
    'nodes': deduped,
    'edges': all_edges,
    'hyperedges': all_hyperedges,
    'input_tokens': new.get('input_tokens', 0),
    'output_tokens': new.get('output_tokens', 0),
}
Path('graphify-out/.graphify_semantic.json').write_text(json.dumps(merged_semantic, indent=2, ensure_ascii=False), encoding="utf-8")
print(f'Extraction complete - {len(deduped)} nodes, {len(all_edges)} edges ({len(cached["nodes"])} from cache, {len(new.get("nodes",[]))} new)')

# Clean up temp files
for p in ['graphify-out/.graphify_cached.json', 'graphify-out/.graphify_uncached.txt', 'graphify-out/.graphify_semantic_new.json']:
    if Path(p).exists(): Path(p).unlink()

# Part C: Merge AST + semantic
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding="utf-8"))
sem = json.loads(Path('graphify-out/.graphify_semantic.json').read_text(encoding="utf-8"))

seen_ast = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for n in sem['nodes']:
    if n['id'] not in seen_ast:
        merged_nodes.append(n)
        seen_ast.add(n['id'])

merged_edges = ast['edges'] + sem['edges']
merged_hyperedges = sem.get('hyperedges', [])
merged_extract = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': merged_hyperedges,
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged_extract, indent=2, ensure_ascii=False), encoding="utf-8")
print(f'Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges ({len(ast["nodes"])} AST + {len(sem["nodes"])} semantic)')

# --update specific merge
from graphify.build import build_merge
from graphify.detect import save_manifest
import networkx as nx

incremental = json.loads(Path('graphify-out/.graphify_incremental.json').read_text(encoding="utf-8"))
deleted = list(incremental.get('deleted_files', []))

# Backup old graph
old_graph_path = None
if Path('graphify-out/graph.json').exists():
    if Path('graphify-out/.graphify_old.json').exists():
        Path('graphify-out/.graphify_old.json').unlink()
    Path('graphify-out/graph.json').rename('graphify-out/.graphify_old.json')
    old_graph_path = 'graphify-out/.graphify_old.json'

G = build_merge(
    [merged_extract],
    graph_path=old_graph_path,
    prune_sources=deleted or None,
)
print(f'[graphify update] Merged: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

merged_out = {
    'nodes': [{'id': n, **d} for n, d in G.nodes(data=True)],
    'edges': [
        {**{k: val for k, val in d.items() if k not in ('_src', '_tgt', 'source', 'target')},
         'source': d.get('_src', u), 'target': d.get('_tgt', v)}
        for u, v, d in G.edges(data=True)
    ],
    'hyperedges': list(G.graph.get('hyperedges', [])),
    'input_tokens': merged_extract.get('input_tokens', 0),
    'output_tokens': merged_extract.get('output_tokens', 0),
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged_out, ensure_ascii=False), encoding="utf-8")
print(f'[graphify update] Merged extraction written ({len(merged_out["nodes"])} nodes, {len(merged_out["edges"])} edges)')

save_manifest(incremental['files'])
print('[graphify update] Manifest saved.')

# Step 4: Build, cluster, analyze
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json

extraction = merged_out
detection = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding="utf-8"))

G_new = build_from_json(extraction)
communities = cluster(G_new)
cohesion = score_all(G_new, communities)
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
gods = god_nodes(G_new)
surprises = surprising_connections(G_new, communities)
labels = {cid: 'Community ' + str(cid) for cid in communities}
questions = suggest_questions(G_new, communities, labels)

report = generate(G_new, communities, cohesion, labels, gods, surprises, detection, tokens, '.', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding="utf-8")
to_json(G_new, communities, 'graphify-out/graph.json')

analysis = {
    'communities': {str(k): v for k, v in communities.items()},
    'cohesion': {str(k): v for k, v in cohesion.items()},
    'gods': gods,
    'surprises': surprises,
    'questions': questions,
}
Path('graphify-out/.graphify_analysis.json').write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8")
if G_new.number_of_nodes() == 0:
    print('ERROR: Graph is empty - extraction produced no nodes.')
    sys.exit(1)
print(f'Graph: {G_new.number_of_nodes()} nodes, {G_new.number_of_edges()} edges, {len(communities)} communities')

# Show diff
from graphify.analyze import graph_diff

old_data = json.loads(Path('graphify-out/.graphify_old.json').read_text(encoding="utf-8")) if Path('graphify-out/.graphify_old.json').exists() else None
if old_data:
    G_old = build_from_json(old_data)
    diff = graph_diff(G_old, G_new)
    print(diff['summary'])
    if diff['new_nodes']:
        print('New nodes:', ', '.join(n['label'] for n in diff['new_nodes'][:5]))
    if diff['new_edges']:
        print('New edges:', len(diff['new_edges']))

if Path('graphify-out/.graphify_old.json').exists():
    Path('graphify-out/.graphify_old.json').unlink()
