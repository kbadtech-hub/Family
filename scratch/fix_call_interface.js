const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'dashboard', 'CallInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the duplicate block that starts at line 39 and ends before the clean second copy
// The bad block starts with:  `  const [localStream, setLocalStream] = useState<MediaStream | null>(null);\n'use client';`
// and ends right before `  const [remoteStream...`

const dupBlock = `  const [localStream, setLocalStream] = useState<MediaStream | null>(null);\n'use client';\n\nimport React, { useState, useEffect, useRef } from 'react';\nimport Image from 'next/image';\nimport { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall, Heart, ShieldCheck, Loader2, Phone, Users, AlertTriangle, ShieldAlert, X } from 'lucide-react';\nimport { supabase } from '@/lib/supabase';\nimport { getIceServers } from '@/lib/turn';\nimport { getUserTier, getTierLimits } from '@/lib/tiers';\n\ninterface CallInterfaceProps {\n  matchProfile: any;\n  onEndCall: () => void;\n  isIncoming?: boolean;\n  isVideo?: boolean;\n  isPremium?: boolean;\n}\n\nexport default function CallInterface({ \n  matchProfile, \n  onEndCall, \n  isIncoming = false,\n  isVideo = false,\n  isPremium = false\n}: CallInterfaceProps) {\n  const [callState, setCallState] = useState<'incoming' | 'ringing' | 'connecting' | 'connected' | 'ended'>(\n    isIncoming ? 'incoming' : 'ringing'\n  );\n  const [isMuted, setIsMuted] = useState(false);\n  const [isVideoOff, setIsVideoOff] = useState(false);\n  const [callDuration, setCallDuration] = useState(0);\n  const callDurationRef = useRef(0);\n\n  const [currentUser, setCurrentUser] = useState<any>(null);\n  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);\n  const [hasVouched, setHasVouched] = useState(false);\n  const [callerLimits, setCallerLimits] = useState<any>(null);\n  \n  const [localStream, setLocalStream] = useState<MediaStream | null>(null);\n  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);\n\n  const localVideoRef = useRef<HTMLVideoElement>(null);\n  const remoteVideoRef = useRef<HTMLVideoElement>(null);\n  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);\n  const channelRef = useRef<any>(null);\n  const localStreamRef = useRef<MediaStream | null>(null);\n  const ringAudioRef = useRef<AudioContext | null>(null);\n\n  // Sync ref\n  useEffect(() => {\n    callDurationRef.current = callDuration;\n  }, [callDuration]);`;

const cleanBlock = `  const [localStream, setLocalStream] = useState<MediaStream | null>(null);\n  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);\n\n  const localVideoRef = useRef<HTMLVideoElement>(null);\n  const remoteVideoRef = useRef<HTMLVideoElement>(null);\n  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);\n  const channelRef = useRef<any>(null);\n  const localStreamRef = useRef<MediaStream | null>(null);\n  const ringAudioRef = useRef<AudioContext | null>(null);\n\n  // Sync ref\n  useEffect(() => {\n    callDurationRef.current = callDuration;\n  }, [callDuration]);`;

if (content.includes("'use client';\n\nimport React, { useState, useEffect, useRef } from 'react';\nimport Image from 'next/image';\nimport { PhoneOff")) {
  // Replace from the second 'use client' onward to just after the sync ref block
  content = content.replace(dupBlock, cleanBlock);
  console.log("Duplicate block removed.");
} else {
  // Alternative: use a regex to remove everything between the two export default declarations
  const regex = /const \[localStream, setLocalStream\] = useState<MediaStream \| null>\(null\);\r?\n'use client';[\s\S]*?const ringAudioRef = useRef<AudioContext \| null>\(null\);\r?\n\r?\n  \/\/ Sync ref\r?\n  useEffect\(\(\) => \{\r?\n    callDurationRef\.current = callDuration;\r?\n  \}, \[callDuration\]\);/;
  
  content = content.replace(regex, cleanBlock);
  console.log("Duplicate block removed via regex.");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("CallInterface.tsx cleaned successfully.");
