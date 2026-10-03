/*
 * Boomi Data Process shape > Custom Scripting (Groovy 2.4)
 * Design IDD-FT-002: Boomi-issued presigned upload URLs for files held on the Boomi MFT SFTP server.
 * One script, two modes, chosen by DPP_FTUP_MODE:
 *
 *   SIGN   (process P01, once per accepted document)
 *     in : DPP_FTUP_PATH  /file-transfer/v1/uploads/{fileId}
 *          DPP_FTUP_DOC   externalDocumentId
 *          DPP_FTUP_SIZE  fileSizeBytes
 *          DPP_FTUP_SHA   checksumSha256 (base64)
 *          DPP_FTUP_TTL   seconds, default 900
 *          DPP_FTUP_KID   active key id, DPP_FTUP_KEY_<kid> the key (encrypted environment extension)
 *     out: DPP_FTUP_URL, DPP_FTUP_EXPIRES
 *
 *   VERIFY (process P02, on PUT /uploads/{fileId})
 *     in : DPP_FTUP_PATH, DPP_FTUP_DOC (from X-External-Document-ID header), DPP_FTUP_SIZE and DPP_FTUP_SHA
 *          (from the registry row), DPP_FTUP_EXPIRES, DPP_FTUP_KIDQ, DPP_FTUP_SIG (from the query string)
 *     out: DPP_FTUP_RESULT = OK | URL_EXPIRED | SIGNATURE_INVALID | UNKNOWN_KEY
 *
 * Never log keys, signatures or full URLs. Documents pass through unchanged.
 */
import com.boomi.execution.ExecutionUtil
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

// BEGIN-CORE
static String canonical(String path, String doc, String size, String sha, String expires, String kid) {
    return "FTUP1\nPUT\n" + path + "\n" + doc + "\n" + size + "\n" + sha + "\n" + expires + "\n" + kid;
}
static String sign(byte[] key, String canon) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(key, "HmacSHA256"));
    byte[] raw = mac.doFinal(canon.getBytes("UTF-8"));
    return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
}
static boolean same(String a, String b) throws Exception {
    return java.security.MessageDigest.isEqual(a.getBytes("UTF-8"), b.getBytes("UTF-8"));
}
// END-CORE

String p(String n) { return ExecutionUtil.getDynamicProcessProperty(n) }
void set(String n, String v) { ExecutionUtil.setDynamicProcessProperty(n, v, false) }
byte[] keyFor(String kid) {
    String k = p("DPP_FTUP_KEY_" + kid)
    return k ? k.getBytes("UTF-8") : null
}

String mode = (p("DPP_FTUP_MODE") ?: "SIGN").toUpperCase()
if (mode == "SIGN") {
    String kid = p("DPP_FTUP_KID")
    byte[] key = keyFor(kid)
    if (key == null) { throw new IllegalStateException("No signing key for kid " + kid) }
    long ttl = (p("DPP_FTUP_TTL") ?: "900") as long
    String expires = String.valueOf((long) (System.currentTimeMillis() / 1000L) + ttl)
    String sig = sign(key, canonical(p("DPP_FTUP_PATH"), p("DPP_FTUP_DOC"), p("DPP_FTUP_SIZE"), p("DPP_FTUP_SHA"), expires, kid))
    String url = p("DPP_FTUP_HOST") + p("DPP_FTUP_PATH") + "?expires=" + expires + "&kid=" + URLEncoder.encode(kid, "UTF-8") + "&sig=" + sig
    set("DPP_FTUP_URL", url); set("DPP_FTUP_EXPIRES", expires)
} else {
    String result
    long now = (long) (System.currentTimeMillis() / 1000L)
    byte[] key = keyFor(p("DPP_FTUP_KIDQ"))
    if (key == null) { result = "UNKNOWN_KEY" }
    else if (Long.parseLong(p("DPP_FTUP_EXPIRES")) < now) { result = "URL_EXPIRED" }
    else {
        String expected = sign(key, canonical(p("DPP_FTUP_PATH"), p("DPP_FTUP_DOC"), p("DPP_FTUP_SIZE"), p("DPP_FTUP_SHA"), p("DPP_FTUP_EXPIRES"), p("DPP_FTUP_KIDQ")))
        result = same(expected, p("DPP_FTUP_SIG") ?: "") ? "OK" : "SIGNATURE_INVALID"
    }
    set("DPP_FTUP_RESULT", result)
}
for (int i = 0; i < dataContext.getDataCount(); i++) {
    dataContext.storeStream(dataContext.getStream(i), dataContext.getProperties(i))
}
