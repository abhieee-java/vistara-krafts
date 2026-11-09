export default async function handler(req, res) {
  // CORS & Methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET or HEAD.' });
  }

  try {
    const { bucket = 'product-images', file, name, download } = req.query;

    if (!file) {
      return res.status(400).json({ success: false, error: 'File path parameter is required.' });
    }

    // Sanitize path against directory traversal
    const cleanFile = String(file).replace(/\.\./g, '').replace(/^\/+/, '');
    const cleanBucket = String(bucket).replace(/[^a-zA-Z0-9_-]/g, '');

    const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL || 'https://niamxrskqhjvzwxomxrx.supabase.co';
    const remoteUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${cleanBucket}/${cleanFile}`;

    const upstreamResponse = await fetch(remoteUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'VistaraKrafts-Proxy/1.0'
      }
    });

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        success: false,
        error: `Asset could not be fetched (${upstreamResponse.statusText})`
      });
    }

    // Forward relevant headers
    const contentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstreamResponse.headers.get('content-length');
    const etag = upstreamResponse.headers.get('etag');

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (etag) res.setHeader('ETag', etag);

    // Cache at edge for 1 year, immutable for performance
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Force browser download with a clean native filename if requested or if download flag is set
    const downloadFilename = name || cleanFile.split('/').pop() || 'vistara-krafts-asset';
    const dispositionType = (download === 'true' || download === '1' || name) ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${downloadFilename}"`);

    // Stream the body directly to client
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('[Download Proxy Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Internal Download Proxy Error' });
  }
}
