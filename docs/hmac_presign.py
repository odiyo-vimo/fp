#!/usr/bin/env python3
"""
hmac_presign.py - reference signer and verifier for Boomi-issued presigned upload URLs
(design IDD-FT-002). Mirrors boomi_hmac_presign.groovy exactly.

Canonical string (UTF-8, lines joined with \\n, no trailing newline):
  FTUP1
  PUT
  <path>                     e.g. /file-transfer/v1/uploads/f-...
  <externalDocumentId>
  <fileSizeBytes>
  <checksumSha256, base64>
  <expires, epoch seconds>
  <kid>
sig = base64url( HMAC-SHA256( key[kid], canonical ) ) without padding

Usage:
  python3 hmac_presign.py --selftest
  python3 hmac_presign.py sign   --path P --doc ID --size N --sha B64 --ttl 900 --kid K   (key in env FTUP_KEY)
  python3 hmac_presign.py verify --url URL --doc ID --size N --sha B64                     (key in env FTUP_KEY)
"""
import argparse, base64, hashlib, hmac, os, sys, time, urllib.parse

def canonical(path, doc, size, sha, expires, kid):
    return "\n".join(["FTUP1", "PUT", path, doc, str(size), sha, str(expires), kid])

def sign(key: bytes, path, doc, size, sha, expires, kid):
    mac = hmac.new(key, canonical(path, doc, size, sha, expires, kid).encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(mac).rstrip(b"=").decode()

def make_url(base_host, key, path, doc, size, sha, expires, kid):
    q = urllib.parse.urlencode({"expires": expires, "kid": kid, "sig": sign(key, path, doc, size, sha, expires, kid)})
    return f"{base_host}{path}?{q}"

def verify(key, url, doc, size, sha, now=None):
    u = urllib.parse.urlsplit(url); q = dict(urllib.parse.parse_qsl(u.query))
    now = int(now if now is not None else time.time())
    if int(q["expires"]) < now: return "URL_EXPIRED"
    exp = sign(key, u.path, doc, size, sha, q["expires"], q["kid"])
    return "OK" if hmac.compare_digest(exp, q["sig"]) else "SIGNATURE_INVALID"

KEY = b"documentation-only-signing-key-k2026-10-do-not-use"
def selftest():
    path = "/file-transfer/v1/uploads/f-9a1e4c7b-2d58-4e03-b6f1-0c3a8d27e5b9"
    sha = "yvQRE13JUl2vqF8HHg/Y1yGKHuHAnWY5KHxmPNIS9HA="
    url = make_url("https://api.hip.example", KEY, path, "DOC-1001", 2483011, sha, 1791109800, "k2026-10")
    ok = verify(KEY, url, "DOC-1001", 2483011, sha, now=1791109000) == "OK"
    wrong_doc = verify(KEY, url, "DOC-9999", 2483011, sha, now=1791109000) == "SIGNATURE_INVALID"
    expired = verify(KEY, url, "DOC-1001", 2483011, sha, now=1791109801) == "URL_EXPIRED"
    print(url); print("PASS" if ok and wrong_doc and expired else "FAIL")
    return ok and wrong_doc and expired

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("mode", nargs="?", default="")
    for a in ("--path", "--doc", "--sha", "--kid", "--url"): ap.add_argument(a)
    ap.add_argument("--size", type=int); ap.add_argument("--ttl", type=int, default=900)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest: sys.exit(0 if selftest() else 1)
    key = os.environ.get("FTUP_KEY", "").encode()
    if not key: ap.error("set FTUP_KEY")
    if a.mode == "sign":
        print(make_url("https://api.hip.example", key, a.path, a.doc, a.size, a.sha, int(time.time()) + a.ttl, a.kid))
    elif a.mode == "verify":
        print(verify(key, a.url, a.doc, a.size, a.sha))
    else: ap.error("mode must be sign or verify")
