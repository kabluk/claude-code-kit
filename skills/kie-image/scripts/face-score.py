#!/usr/bin/env python3
"""Likeness of generated sheets to reference photos: ArcFace (InsightFace buffalo_l).

    python3 face-score.py --refs refs/ out/*.png [--faces 4] [--json]
    python3 face-score.py --selftest        # checks the install on InsightFace's bundled photo

For every face found on a sheet: cosine similarity to the centroid of the reference embeddings.
The ceiling is the same number for the real photos (each ref against the centroid of the others):
a sheet scoring above it is suspect, not better. A sheet with more faces than the template draws
(--faces) has a broken layout; fewer usually means profiles the detector missed.

Needs: pip install insightface onnxruntime opencv-python-headless (the model, ~280 MB, downloads once
into ~/.insightface).
"""
import argparse
import json
import os
import sys
import warnings

import numpy as np

# scikit-image inside insightface warns on every face; the numbers are unaffected
warnings.filterwarnings("ignore", category=FutureWarning)

IMG = (".jpg", ".jpeg", ".png", ".webp")


def load_app():
    from insightface.app import FaceAnalysis

    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    return app


def read(path):
    import cv2

    img = cv2.imread(path)
    if img is None:
        sys.exit(f"cannot read image: {path}")
    return img


def faces(app, img):
    return sorted(app.get(img), key=lambda f: f.bbox[0])


def unit(v):
    return v / np.linalg.norm(v)


def ref_embeddings(app, imgs):
    """One embedding per ref: the largest face. Refs without a face are skipped with a warning."""
    out = []
    for name, img in imgs:
        fs = app.get(img)
        if not fs:
            print(f"warning: no face in ref {name}, skipped", file=sys.stderr)
            continue
        big = max(fs, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        out.append(unit(big.normed_embedding))
    if not out:
        sys.exit("no face found in any reference")
    return np.array(out)


def ceiling(refs):
    """Leave-one-out: each ref against the centroid of the others. None with a single ref."""
    if len(refs) < 2:
        return None
    sims = [float(refs[i] @ unit(np.delete(refs, i, 0).mean(0))) for i in range(len(refs))]
    return round(float(np.mean(sims)), 3)


def score(app, centroid, img, expect):
    fs = faces(app, img)
    sims = [round(float(unit(f.normed_embedding) @ centroid), 3) for f in fs]
    flag = "ok"
    if not fs:
        flag = "no faces"
    elif expect and len(fs) > expect:
        flag = f"broken layout: {len(fs)} faces, template draws {expect}"
    return {
        "faces": len(fs),
        "sims": sims,
        "mean": round(float(np.mean(sims)), 3) if sims else None,
        "max": max(sims) if sims else None,
        "flag": flag,
    }


def list_images(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            out += [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.lower().endswith(IMG)]
        else:
            out.append(p)
    return out


def selftest():
    """Refs: one face of the bundled group photo, cropped and mirrored. Sheet: the whole photo.
    Expect that face to score high, the five strangers low, and six faces flagged against --faces 5."""
    import cv2
    from insightface.data import get_image

    app = load_app()
    group = get_image("t1")
    fs = faces(app, group)
    assert len(fs) == 6, f"expected 6 faces in t1.jpg, found {len(fs)}"
    x0, y0, x1, y1 = fs[0].bbox.astype(int)
    m = (x1 - x0) // 2
    crop = group[max(0, y0 - m) : y1 + m, max(0, x0 - m) : x1 + m]
    refs = [("crop", crop), ("mirror", cv2.flip(crop, 1)), ("big", cv2.resize(crop, None, fx=1.5, fy=1.5))]
    r = ref_embeddings(app, refs)
    s = score(app, unit(r.mean(0)), group, 5)
    print(json.dumps({"ceiling": ceiling(r), **s}))
    assert s["sims"][0] > 0.6, f"the reference face scored {s['sims'][0]}"
    assert max(s["sims"][1:]) < 0.35, f"a stranger scored {max(s['sims'][1:])}"
    assert s["flag"].startswith("broken layout"), s["flag"]
    print("selftest OK")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--refs", help="folder or files with reference photos")
    ap.add_argument("--faces", type=int, default=4, help="faces the template draws (default 4: templates/character-sheet.txt has front, three-quarter, profile, full-body front; the back view shows none); 0 = no check")
    ap.add_argument("--json", action="store_true", help="one JSON object per sheet")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("sheets", nargs="*")
    a = ap.parse_args()

    if a.selftest:
        return selftest()
    if not a.refs or not a.sheets:
        ap.print_help()
        return 2

    app = load_app()
    refs = ref_embeddings(app, [(p, read(p)) for p in list_images([a.refs])])
    centroid = unit(refs.mean(0))
    top = ceiling(refs)
    print(f"refs: {len(refs)} faces, ceiling (real photos vs. each other): {top}", file=sys.stderr)
    for p in list_images(a.sheets):
        s = score(app, centroid, read(p), a.faces)
        if a.json:
            print(json.dumps({"sheet": p, "ceiling": top, **s}))
        else:
            print(f"{p}\tfaces {s['faces']}\tmean {s['mean']}\tmax {s['max']}\t{s['sims']}\t{s['flag']}")


if __name__ == "__main__":
    sys.exit(main())
