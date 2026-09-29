# Paged source capture

`get_message` keeps its existing default text preview. A collector can request:

```json
{"messageId": "the-message-id", "bodyFormat": "source", "bodyOffset": 0, "bodyLimit": 16000}
```

Source mode returns the selected plain-text MIME body, or original HTML when no
plain-text part exists. HTML hrefs and complete query strings are retained. The
selection excludes attached/enclosed messages as before. Externalized body parts
use the existing authenticated attachment read and size limit.

Save each `body` exactly. Request the same message and format with the returned
`bodyPage.nextOffset` until it is null. Offsets and `totalChars` use UTF-16 code
units. Page boundaries never split a surrogate pair. `sha256` is SHA-256 of the
entire selected body encoded as UTF-8; verify it after concatenating the pages.
The checksum and message ID must remain stable across pages.

Each response is limited to 50,000 body characters. Missing or oversized source
parts return an error, never a complete placeholder. This does not fetch every
MIME alternative, bypass authentication, or alter labels. Other tools and the
default `get_message` preview retain their existing behavior.
