# Barcode Dispatch PWA

## Architecture

This application is completely client-side.

No backend.
No database.
No shared application state.

Every browser/device has its own:

- barcode history
- WhatsApp number
- Discord Webhook
- theme preference

All persistent application data is stored using `localStorage`.

## Local Network

From the project root:

### Python

```bash
python -m http.server 8080 --bind 0.0.0.0