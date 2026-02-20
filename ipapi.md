#GET JS example
// npm i axios
const axios = require('axios');

(async () => {
  const ip = '89.123.155.136';
  const apiKey = '3346e292c6d0772430ee';
  const url = `https://api.ipapi.is?q=${ip}&key=${apiKey}`;

  const response = await axios.get(url);
  console.log(response.data);
})();

example api return from ipapi
{
  "ip": "33.247.82.174",
  "rir": "ARIN",
  "is_bogon": false,
  "is_mobile": false,
  "is_satellite": false,
  "is_crawler": false,
  "is_datacenter": false,
  "is_tor": false,
  "is_proxy": false,
  "is_vpn": false,
  "is_abuser": false,
  "company": {
    "name": "DoD Network Information Center",
    "abuser_score": "0 (Very Low)",
    "domain": "www.defense.gov",
    "type": "government",
    "network": "33.0.0.0 - 33.255.255.255",
    "whois": "https://api.ipapi.is/?whois=33.0.0.0"
  },
  "abuse": {
    "name": "DoD Network Information Center",
    "address": "3990 E. Broad Street, Columbus, OH, 43218, US",
    "email": "disa.columbus.ns.mbx.arin-registrations@mail.mil",
    "phone": "+1-844-347-2457"
  },
  "asn": {
    "asn": 749,
    "abuser_score": "0 (Very Low)",
    "route": "33.0.0.0/8",
    "descr": "DNIC-AS-00749 - United States Department of Defense DoD, US",
    "country": "us",
    "active": true,
    "org": "United States Department of Defense (DoD)",
    "domain": "defense.gov",
    "abuse": "disa.columbus.ns.mbx.hostmaster-dod-nic@mail.mil",
    "type": "government",
    "updated": "2025-09-12",
    "rir": "ARIN",
    "whois": "https://api.ipapi.is/?whois=AS749"
  },
  "location": {
    "is_eu_member": false,
    "calling_code": "1",
    "currency_code": "USD",
    "continent": "NA",
    "country": "United States",
    "country_code": "US",
    "state": "Ohio",
    "city": "Whitehall",
    "latitude": 39.9819,
    "longitude": -82.9048,
    "zip": "43227",
    "timezone": "America/New_York",
    "local_time": "2026-02-20T09:32:28-05:00",
    "local_time_unix": 1771597948,
    "is_dst": false
  },
  "elapsed_ms": 0.37
}


# Breakdown
## New submission ip analysis
- Would like IP flags for tor, proxy, vpn, abuser (can colour them all purple) and also give the country the ip is from. these should be visible on the main admin review queue page.
- I need a new button and page called ip breakdown, if i click i can see all of the important details (vpn yes/no, location (place name, country, lat and longitude), abuser and abuser score, local time, domain etc.) 
- button appears on all submissions, not just those flagged
## All ips accessing site 
- i also want to record all ip addresses visiting the site. make a new link in the admin section which shows all ipaddresses which have accessed the site
- list them on a seperate admin page (not the submit queue) and also allow me to click on them to make an api request of the ip and get the breakdown that i get from ipapi 
- similar information as the flagged page. these do not all need an api call - only make call after i click the button