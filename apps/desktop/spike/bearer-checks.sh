#!/usr/bin/env bash
# SPIKE SOON-141: bearer next to the cookie session. Reads the token from the Keychain; prints statuses and CORS headers only.
API=${SPIKE_API:-http://localhost:4141}
TOKEN=$(security find-generic-password -s soonlane-spike -a desktop-session -w)
UNSIGNED=${TOKEN%%.*}
FORGED="$UNSIGNED.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
COOKIE=$(sed -n 's/^name: //p' /tmp/soon141-secrets/dev-session.txt)=$(sed -n 's/^value: //p' /tmp/soon141-secrets/dev-session.txt)
me() { curl -s -o /tmp/soon141-evidence/body -w '%{http_code}' -X POST "$API/api/rpc/identity/me" -H 'content-type: application/json' "$@" -d '{}'; printf ' %s\n' "$(head -c 120 /tmp/soon141-evidence/body | sed -E 's/"email":"[^"]*"/"email":"…"/')"; }
cors() { curl -s -D - -o /dev/null "$@" | grep -i -E '^(HTTP|access-control)' | tr -d '\r' | sed 's/^/    /'; }

echo "1 identity.me, signed bearer, no Origin:    $(me -H "authorization: Bearer $TOKEN")"
echo "2 identity.me, unsigned bearer:             $(me -H "authorization: Bearer $UNSIGNED")"
echo "3 identity.me, forged signature:            $(me -H "authorization: Bearer $FORGED")"
echo "4 identity.me, no credentials:              $(me)"
echo "5 identity.me, cookie, Origin localhost:3000: $(me -H "cookie: $COOKIE" -H 'origin: http://localhost:3000')"
echo "6 get-session, signed bearer:               $(curl -s -X GET "$API/api/auth/get-session" -H "authorization: Bearer $TOKEN" | head -c 60 | sed -E 's/"[0-9a-f-]{36}"/"<uuid>"/g')"
echo "7 preflight from views://app:"
cors -X OPTIONS "$API/api/rpc/identity/me" -H 'origin: views://app' -H 'access-control-request-method: POST' -H 'access-control-request-headers: authorization,content-type'
echo "8 POST from views://app with bearer:"
cors -X POST "$API/api/rpc/identity/me" -H 'origin: views://app' -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{}'
echo "9 POST from https://evil.example with bearer:"
cors -X POST "$API/api/rpc/identity/me" -H 'origin: https://evil.example' -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{}'
echo "10 cookie path still answers with credentials:"
cors -X OPTIONS "$API/api/rpc/identity/me" -H 'origin: http://localhost:3000' -H 'access-control-request-method: POST' -H 'access-control-request-headers: content-type'
