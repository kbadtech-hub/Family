// =========================================================================
// WebRTC ICE SERVERS Traversal Configuration Helper
// =========================================================================

export function getIceServers(): RTCIceServer[] {
  const turnUrl = process.env.NEXT_PUBLIC_TURN_SERVER_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_SERVER_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_SERVER_CREDENTIAL;

  const servers: RTCIceServer[] = [
    // Standard STUN servers (always default)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  // If a TURN server configuration is provided via environment variables, inject it.
  // This ensures fallback relay traversal works across strict mobile carriers.
  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential
    });
  } else {
    // Provide Open Relay Project free public TURN server configuration as fallback.
    // This allows peer-to-peer calling on strict mobile carrier NATs without any cost.
    console.log("Using Open Relay Project public TURN fallback configuration.");
    servers.push({
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelay',
      credential: 'openrelay'
    });
  }

  return servers;
}
