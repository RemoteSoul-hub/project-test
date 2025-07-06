# VNC Modal Component

This directory contains components for displaying a VNC console in a modal window. The implementation uses an iframe to load a VNC client that connects to a remote VNC server.

## Components

### VncModal.js

A React component that displays a modal with an iframe for the VNC client. It takes the following props:

- `isOpen`: Whether the modal is open
- `onClose`: Function to call when the modal is closed
- `vncData`: VNC connection data object containing:
  - `socket_hash`: Socket hash for VNC connection
  - `socket_password`: Socket password for VNC connection

### ServerActions.js

This component has been updated to use the VNC modal when the "VNC Console" button is clicked. It fetches the VNC connection data from the API and passes it to the VNC modal.

## VNC Client

The VNC client is implemented in the following file:

- `/public/vnc-client.html`: The HTML page that loads in the iframe and handles the VNC connection using noVNC

## How It Works

1. When a user clicks the "VNC Console" button in ServerActions, it fetches the VNC connection data from the API
2. If the data is in the expected format (socket_hash, socket_password), it opens the VNC modal
3. The modal loads the vnc-client.html in an iframe, passing the connection parameters
4. The vnc-client.html connects to the VNC server using the noVNC library

## Production Setup

The VNC client is already set up for production use. It uses the noVNC library to connect to the VNC server through a WebSocket connection. The WebSocket URL is configured to use:

```
wss://solus2.t-h.cloud/vnc?url=${socketHash}
```

Where `socketHash` is the value of the `socket_hash` parameter from the API response.

## Required noVNC Files

Make sure the following noVNC files are available in your public directory:

- `/novnc/core/rfb.js` - The main noVNC library file

## API Response Format

The VNC modal expects the API response to be in the following format:

```json
{
  "socket_hash": "unique-hash-value",
  "socket_password": "password-for-vnc"
}
```

The implementation also supports the `vnc_ip` and `vnc_port` parameters for backward compatibility, but they are not used in the current implementation.

## Fallback to URL-based Approach

The implementation includes a fallback to the old URL-based approach if the API returns a URL instead of the VNC connection data:

```javascript
// Check if we have the VNC data in the expected format
if (response?.data?.socket_hash && 
    response?.data?.socket_password) {
  
  setVncData(response.data);
  setVncModalOpen(true);
  
} 
// Fallback to the old URL-based approach if that's what the API returns
else if (response?.data?.url) {
  window.open(response.data.url, '_blank');
} 
```

This ensures backward compatibility with existing API implementations.
