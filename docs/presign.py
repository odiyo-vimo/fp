#!/usr/bin/env python3
"""
presign.py - generate an AWS S3 SigV4 presigned URL with no SDK.

Usage:
  python3 presign.py --bucket my-bucket --key inbound/test.txt --region eu-west-2 \
      --method GET --expires 300
  Credentials are read from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  (and AWS_SESSION_TOKEN if present). Nothing is sent over the network.

  python3 presign.py --selftest   # reproduces the AWS documentation example
"""
import argparse, datetime, hashlib, hmac, os, sys, urllib.parse

def _h(key, msg):
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

def _enc(s, safe="-_.~"):
    return urllib.parse.quote(s, safe=safe)

def presign(access_key, secret_key, region, bucket, key, method="GET",
            expires=300, now=None, session_token=None, host=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date = now.strftime("%Y%m%d")
    host = host or f"{bucket}.s3.{region}.amazonaws.com"
    scope = f"{date}/{region}/s3/aws4_request"
    canonical_uri = "/" + _enc(key, safe="-_.~/")
    q = {
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": f"{access_key}/{scope}",
        "X-Amz-Date": amz_date,
        "X-Amz-Expires": str(expires),
        "X-Amz-SignedHeaders": "host",
    }
    if session_token:
        q["X-Amz-Security-Token"] = session_token
    cq = "&".join(f"{_enc(k)}={_enc(v)}" for k, v in sorted(q.items()))
    creq = "\n".join([method, canonical_uri, cq, f"host:{host}\n", "host", "UNSIGNED-PAYLOAD"])
    sts = "\n".join(["AWS4-HMAC-SHA256", amz_date, scope,
                     hashlib.sha256(creq.encode()).hexdigest()])
    k = _h(("AWS4" + secret_key).encode(), date)
    k = _h(k, region); k = _h(k, "s3"); k = _h(k, "aws4_request")
    sig = hmac.new(k, sts.encode(), hashlib.sha256).hexdigest()
    return f"https://{host}{canonical_uri}?{cq}&X-Amz-Signature={sig}", sig

def selftest():
    url, sig = presign("AKIAIOSFODNN7EXAMPLE",
                       "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                       "us-east-1", "examplebucket", "test.txt", "GET", 86400, host="examplebucket.s3.amazonaws.com",
                       now=datetime.datetime(2013, 5, 24, tzinfo=datetime.timezone.utc))
    expected = "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"
    print(url)
    print("PASS" if sig == expected else f"FAIL got {sig}")
    return sig == expected

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--bucket"); p.add_argument("--key"); p.add_argument("--region", default="eu-west-2")
    p.add_argument("--method", default="GET", choices=["GET", "PUT", "HEAD", "DELETE"])
    p.add_argument("--expires", type=int, default=300)
    p.add_argument("--selftest", action="store_true")
    a = p.parse_args()
    if a.selftest:
        sys.exit(0 if selftest() else 1)
    ak, sk = os.environ.get("AWS_ACCESS_KEY_ID"), os.environ.get("AWS_SECRET_ACCESS_KEY")
    if not (ak and sk and a.bucket and a.key):
        p.error("need --bucket, --key and AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in env")
    if not 1 <= a.expires <= 604800:
        p.error("--expires must be 1..604800 seconds (SigV4 max is 7 days)")
    print(presign(ak, sk, a.region, a.bucket, a.key, a.method, a.expires,
                  session_token=os.environ.get("AWS_SESSION_TOKEN"))[0])
