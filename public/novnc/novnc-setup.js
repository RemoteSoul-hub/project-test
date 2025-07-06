// This script sets up the noVNC client
// It assumes that the noVNC library files are in the /novnc directory

// Load the required noVNC scripts
function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = src;
  script.onload = callback;
  document.head.appendChild(script);
}

// Initialize noVNC
function initNoVNC(options) {
  const { host, port, password, path, container, onConnect, onDisconnect, onError } = options;
  
  // Create WebSocket URL
  // For a production environment, you would typically use a WebSocket proxy like websockify
  // The URL format would be: ws(s)://[host]:[port]/websockify
  const wsUrl = `ws://${host}:${port}/websockify`;
  
  // Create RFB object
  const rfb = new RFB(
    container,
    wsUrl,
    {
      credentials: { password },
      path: path || '',
      shared: true,
      repeaterID: '',
    }
  );
  
  // Set up event handlers
  rfb.addEventListener('connect', () => {
    
    if (onConnect) onConnect();
  });
  
  rfb.addEventListener('disconnect', (e) => {
    
    if (onDisconnect) onDisconnect(e.detail.reason);
  });
  
  rfb.addEventListener('credentialsrequired', () => {
    
    rfb.sendCredentials({ password });
  });
  
  // Add error handling
  window.addEventListener('error', (evt) => {
    console.error('noVNC error:', evt);
    if (onError) onError(evt);
  });
  
  return rfb;
}

// Load noVNC core library and dependencies
function loadNoVNC(callback) {
  // Load core libraries in sequence
  loadScript('/novnc/core/util.js', () => {
    loadScript('/novnc/core/rfb.js', () => {
      // Load input devices
      loadScript('/novnc/core/input/devices.js', () => {
        loadScript('/novnc/core/input/keysymdef.js', () => {
          loadScript('/novnc/core/input/keysym.js', () => {
            loadScript('/novnc/core/input/keyboard.js', () => {
              loadScript('/novnc/core/input/mouse.js', () => {
                loadScript('/novnc/core/input/gesturehandler.js', () => {
                  // Load encodings
                  loadScript('/novnc/core/encodings.js', () => {
                    loadScript('/novnc/core/decoders/raw.js', () => {
                      loadScript('/novnc/core/decoders/copyrect.js', () => {
                        loadScript('/novnc/core/decoders/rre.js', () => {
                          loadScript('/novnc/core/decoders/hextile.js', () => {
                            loadScript('/novnc/core/decoders/tight.js', () => {
                              loadScript('/novnc/core/decoders/tightpng.js', () => {
                                loadScript('/novnc/core/display.js', () => {
                                  // All scripts loaded
                                  if (callback) callback();
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Export the functions
window.NoVNC = {
  loadNoVNC,
  initNoVNC
};
