"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, PhoneIncoming } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import type { CallSignalRecord } from "@/lib/types";

const ICE_SERVERS: RTCConfiguration = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };

type CallState = "idle" | "calling" | "ringing" | "connecting" | "in-call" | "ended";

/**
 * A real 1:1 WebRTC video call between the two swap participants. Signaling
 * (the SDP offer/answer and ICE candidates) is relayed through our own
 * backend by polling — there's no third-party calling service involved.
 * Media never touches our server; it flows peer-to-peer once connected.
 */
export function VideoCall({ exchangeId, peerName }: { exchangeId: string; peerName: string }) {
  const [state, setState] = useState<CallState>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const lastSignalIdRef = useRef<string | undefined>(undefined);
  const stateRef = useRef<CallState>("idle");
  stateRef.current = state;

  function cleanup() {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  async function sendSignal(type: CallSignalRecord["type"], payload: unknown) {
    await api(`/api/exchanges/${exchangeId}/call`, "POST", { type, payload: JSON.stringify(payload) });
  }

  function newPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal("ice-candidate", e.candidate.toJSON());
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setState("in-call");
      if (["failed", "disconnected", "closed"].includes(pc.connectionState) && stateRef.current !== "idle" && stateRef.current !== "ended") {
        endCall(false);
      }
    };
    pcRef.current = pc;
    return pc;
  }

  async function getLocalStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  async function startCall() {
    setError(null);
    try {
      const stream = await getLocalStream();
      const pc = newPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setState("calling");
      await sendSignal("offer", offer);
    } catch {
      setError("Couldn't access your camera/microphone. Check your browser permissions.");
      cleanup();
      setState("idle");
    }
  }

  async function answerCall() {
    const offer = pendingOfferRef.current;
    if (!offer) return;
    setError(null);
    try {
      const stream = await getLocalStream();
      const pc = newPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(offer);
      for (const c of pendingCandidatesRef.current) await pc.addIceCandidate(c);
      pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setState("connecting");
      await sendSignal("answer", answer);
    } catch {
      setError("Couldn't access your camera/microphone. Check your browser permissions.");
      cleanup();
      setState("idle");
    }
  }

  function declineCall() {
    sendSignal("hangup", {});
    pendingOfferRef.current = null;
    setState("idle");
  }

  function endCall(notifyPeer = true) {
    if (notifyPeer) sendSignal("hangup", {});
    cleanup();
    setState("idle");
  }

  // Poll for signaling messages from the other participant.
  useEffect(() => {
    let cancelled = false;
    const iv = setInterval(async () => {
      const qs = lastSignalIdRef.current ? `?after=${lastSignalIdRef.current}` : "";
      const res = await api<{ signals: CallSignalRecord[] }>(`/api/exchanges/${exchangeId}/call${qs}`, "GET");
      if (cancelled || !res.ok) return;
      for (const sig of res.data.signals) {
        lastSignalIdRef.current = sig.id;
        await handleSignal(sig);
      }
    }, 1200);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeId]);

  async function handleSignal(sig: CallSignalRecord) {
    const payload = JSON.parse(sig.payload);
    if (sig.type === "offer") {
      if (stateRef.current === "calling") {
        // Glare: both sides called at once. Drop our own offer and answer theirs.
        cleanup();
      }
      pendingOfferRef.current = payload;
      setState("ringing");
      return;
    }
    if (sig.type === "answer") {
      if (pcRef.current && stateRef.current === "calling") {
        setState("connecting");
        await pcRef.current.setRemoteDescription(payload);
      }
      return;
    }
    if (sig.type === "ice-candidate") {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(payload).catch(() => {});
      } else {
        pendingCandidatesRef.current.push(payload);
      }
      return;
    }
    if (sig.type === "hangup") {
      cleanup();
      setState("idle");
    }
  }

  useEffect(() => () => cleanup(), []);

  function toggleMic() {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((v) => !v);
  }
  function toggleCam() {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn((v) => !v);
  }

  const live = state === "connecting" || state === "in-call";

  return (
    <Card className="flex h-[520px] flex-col p-0">
      <div className="relative flex-1 overflow-hidden rounded-t-2xl bg-slate-900">
        {live ? (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-3 right-3 h-28 w-20 rounded-lg border border-white/20 object-cover shadow-lift sm:h-36 sm:w-24" />
            {state === "connecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-sm text-white">Connecting…</div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
            <Avatar initials={peerName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()} size="lg" />
            {state === "idle" && <p className="text-sm text-slate-300">Start a video call with {peerName.split(" ")[0]}</p>}
            {state === "calling" && <p className="animate-pulse text-sm text-slate-300">Calling {peerName.split(" ")[0]}…</p>}
            {state === "ringing" && <p className="text-sm text-slate-300">{peerName.split(" ")[0]} is calling</p>}
          </div>
        )}
      </div>

      {error && <p className="px-4 pt-2 text-xs text-rose-700">{error}</p>}

      <div className="flex items-center justify-center gap-3 border-t border-line p-3.5">
        {state === "idle" && (
          <Button onClick={startCall}><Phone size={16} aria-hidden /> Start video call</Button>
        )}
        {state === "calling" && (
          <Button variant="outline" onClick={() => endCall(true)}><PhoneOff size={16} aria-hidden /> Cancel</Button>
        )}
        {state === "ringing" && (
          <>
            <Button onClick={answerCall}><PhoneIncoming size={16} aria-hidden /> Answer</Button>
            <Button variant="outline" onClick={declineCall}><PhoneOff size={16} aria-hidden /> Decline</Button>
          </>
        )}
        {live && (
          <>
            <Button variant="outline" onClick={toggleMic}>{micOn ? <Mic size={16} aria-hidden /> : <MicOff size={16} aria-hidden />}</Button>
            <Button variant="outline" onClick={toggleCam}>{camOn ? <Video size={16} aria-hidden /> : <VideoOff size={16} aria-hidden />}</Button>
            <Button variant="outline" onClick={() => endCall(true)}><PhoneOff size={16} aria-hidden /> End call</Button>
          </>
        )}
      </div>
    </Card>
  );
}
