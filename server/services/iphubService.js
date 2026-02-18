const IPHUB_API_KEY = process.env.IPHUB_API_KEY;
const IPHUB_BASE = 'https://v2.api.iphub.info/ip';

/**
 * Check an IP address against IPHub.
 * Returns true if the IP is flagged as VPN/proxy (block === 1).
 * Fail-open: returns false on any error so legitimate users aren't blocked.
 */
async function checkVpn(ipAddress) {
  if (!IPHUB_API_KEY || !ipAddress) return false;

  try {
    const res = await fetch(`${IPHUB_BASE}/${ipAddress}`, {
      headers: { 'X-Key': IPHUB_API_KEY },
    });

    if (!res.ok) {
      console.error(`IPHub API error: ${res.status}`);
      return false;
    }

    const data = await res.json();
    // block: 0 = residential, 1 = ISP/data center (VPN/proxy), 2 = undetermined
    return data.block === 1;
  } catch (err) {
    console.error('IPHub check failed:', err.message);
    return false;
  }
}

module.exports = { checkVpn };
