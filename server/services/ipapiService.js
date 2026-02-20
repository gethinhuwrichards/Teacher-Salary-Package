const IPAPI_API_KEY = process.env.IPAPI_API_KEY;
const IPAPI_BASE = 'https://api.ipapi.is';

/**
 * Check an IP address against ipapi.is.
 * Returns an object with flags and country info.
 * Fail-open: returns defaults on any error so legitimate users aren't blocked.
 */
async function checkIp(ipAddress) {
  const defaults = {
    flagged: false,
    is_vpn: false,
    is_tor: false,
    is_proxy: false,
    is_abuser: false,
    ip_country: null,
  };

  if (!IPAPI_API_KEY || !ipAddress) return defaults;

  try {
    const url = `${IPAPI_BASE}?q=${ipAddress}&key=${IPAPI_API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`ipapi.is API error: ${res.status}`);
      return defaults;
    }

    const data = await res.json();

    const is_vpn = !!data.is_vpn;
    const is_tor = !!data.is_tor;
    const is_proxy = !!data.is_proxy;
    const is_abuser = !!data.is_abuser;
    const ip_country = data.location?.country || null;
    const flagged = is_vpn || is_tor || is_proxy || is_abuser;

    return { flagged, is_vpn, is_tor, is_proxy, is_abuser, ip_country };
  } catch (err) {
    console.error('ipapi.is check failed:', err.message);
    return defaults;
  }
}

/**
 * Full IP lookup via ipapi.is — returns the complete API response.
 * Used for on-demand detailed breakdown.
 */
async function lookupIp(ipAddress) {
  if (!IPAPI_API_KEY || !ipAddress) return null;

  try {
    const url = `${IPAPI_BASE}?q=${ipAddress}&key=${IPAPI_API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`ipapi.is lookup error: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('ipapi.is lookup failed:', err.message);
    return null;
  }
}

module.exports = { checkIp, lookupIp };
