/*
 * Boomi Data Process shape > Custom Scripting (Groovy 2.4)
 * Generates an AWS S3 SigV4 presigned URL without the AWS SDK.
 *
 * Inputs (Dynamic Process Properties, set them before this shape):
 *   DPP_S3_BUCKET    e.g. sdec-upload-dev
 *   DPP_S3_KEY       e.g. inbound/CASE-1234/evidence.pdf
 *   DPP_S3_REGION    e.g. eu-west-2
 *   DPP_S3_METHOD    GET (download) or PUT (upload)
 *   DPP_S3_EXPIRES   seconds, 1..604800 (keep short, 300 to 900 is typical)
 *   DPP_S3_AK / DPP_S3_SK   access key / secret key. Source these from an
 *                    encrypted environment extension or the secrets store,
 *                    never hard-code them in the process.
 *   DPP_S3_TOKEN     optional session token when using temporary (STS) creds
 * Output:
 *   DPP_PRESIGNED_URL  the signed URL. Documents pass through unchanged.
 * Never write DPP_S3_SK or the full URL to process logs.
 */
import com.boomi.execution.ExecutionUtil
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.security.MessageDigest
import java.text.SimpleDateFormat

// BEGIN-SIGV4
static byte[] hmac(byte[] key, String msg) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(key, "HmacSHA256"));
    return mac.doFinal(msg.getBytes("UTF-8"));
}

static String hex(byte[] b) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < b.length; i++) { sb.append(String.format("%02x", b[i] & 0xff)); }
    return sb.toString();
}

// RFC 3986 encoding as SigV4 requires; keepSlash=true for the object key path
static String enc(String s, boolean keepSlash) throws Exception {
    byte[] bytes = s.getBytes("UTF-8");
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < bytes.length; i++) {
        int c = bytes[i] & 0xff;
        boolean unreserved = (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57)
            || c == 45 || c == 46 || c == 95 || c == 126 || (keepSlash && c == 47);
        if (unreserved) { sb.append((char) c); } else { sb.append(String.format("%%%02X", c)); }
    }
    return sb.toString();
}

static String presign(String ak, String sk, String token, String region, String bucket,
                      String key, String method, int expires, Date now) throws Exception {
    SimpleDateFormat f1 = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'");
    SimpleDateFormat f2 = new SimpleDateFormat("yyyyMMdd");
    TimeZone utc = TimeZone.getTimeZone("UTC");
    f1.setTimeZone(utc); f2.setTimeZone(utc);
    String amzDate = f1.format(now);
    String date = f2.format(now);
    String host = bucket + ".s3." + region + ".amazonaws.com";
    String scope = date + "/" + region + "/s3/aws4_request";
    String uri = "/" + enc(key, true);

    TreeMap<String, String> q = new TreeMap<String, String>();
    q.put("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    q.put("X-Amz-Credential", ak + "/" + scope);
    q.put("X-Amz-Date", amzDate);
    q.put("X-Amz-Expires", String.valueOf(expires));
    q.put("X-Amz-SignedHeaders", "host");
    if (token != null && token.length() > 0) { q.put("X-Amz-Security-Token", token); }

    StringBuilder cq = new StringBuilder();
    for (Map.Entry<String, String> e : q.entrySet()) {
        if (cq.length() > 0) { cq.append("&"); }
        cq.append(enc(e.getKey(), false)).append("=").append(enc(e.getValue(), false));
    }
    String creq = method + "\n" + uri + "\n" + cq.toString() + "\n" + "host:" + host + "\n\n"
        + "host\n" + "UNSIGNED-PAYLOAD";
    String sts = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n"
        + hex(MessageDigest.getInstance("SHA-256").digest(creq.getBytes("UTF-8")));
    byte[] k = hmac(("AWS4" + sk).getBytes("UTF-8"), date);
    k = hmac(k, region); k = hmac(k, "s3"); k = hmac(k, "aws4_request");
    return "https://" + host + uri + "?" + cq.toString() + "&X-Amz-Signature=" + hex(hmac(k, sts));
}
// END-SIGV4

String p(String name) { return ExecutionUtil.getDynamicProcessProperty(name) }

int expires = (p("DPP_S3_EXPIRES") ?: "300") as int
if (expires < 1 || expires > 604800) { throw new IllegalArgumentException("DPP_S3_EXPIRES must be 1..604800") }
String method = (p("DPP_S3_METHOD") ?: "GET").toUpperCase()

String url = presign(p("DPP_S3_AK"), p("DPP_S3_SK"), p("DPP_S3_TOKEN"), p("DPP_S3_REGION") ?: "eu-west-2",
                     p("DPP_S3_BUCKET"), p("DPP_S3_KEY"), method, expires, new Date())
ExecutionUtil.setDynamicProcessProperty("DPP_PRESIGNED_URL", url, false)
ExecutionUtil.getBaseLogger().info("Presigned " + method + " URL created for key " + p("DPP_S3_KEY") + ", expires in " + expires + "s")

for (int i = 0; i < dataContext.getDataCount(); i++) {
    dataContext.storeStream(dataContext.getStream(i), dataContext.getProperties(i))
}
