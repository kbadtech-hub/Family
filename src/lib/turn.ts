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
    // Provide a fallback public TURN configuration for testing purposes.
    // In production, these should be resolved dynamically or from secure turn server.
    console.warn("NEXT_PUBLIC_TURN_SERVER env configs not set. Using STUN-only WebRTC fallback.");
  }

  return servers;
}
