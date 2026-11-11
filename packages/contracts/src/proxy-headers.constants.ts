/** Sent by the web server on every call it makes for a visitor; the API trusts `VISITOR_IP_HEADER` only next to a matching `API_PROXY_SECRET`. */
export const PROXY_SECRET_HEADER = 'x-soonlane-proxy-secret'
export const VISITOR_IP_HEADER = 'x-soonlane-visitor-ip'
