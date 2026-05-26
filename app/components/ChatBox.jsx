"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useSession } from "next-auth/react";

export default function ChatBox({ receiver, onBack }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [inCall, setInCall] = useState(false);
  const [calling, setCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const peerConnectionRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const ringtoneOscillatorRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

  const bottomRef = useRef();

  useEffect(() => {
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(err => console.log("Autoplay blocked:", err.message));
    }
  }, [remoteStream]);

  const setLocalVideoRef = useCallback((el) => {
    localVideoRef.current = el;
    if (el) el.srcObject = localStream ?? null;
  }, [localStream]);

  const setRemoteVideoRef = useCallback((el) => {
    remoteVideoRef.current = el;
    if (el) {
      el.srcObject = remoteStream ?? null;
      if (remoteStream) {
        el.play().catch(err => console.log("Autoplay blocked:", err.message));
      }
    }
  }, [remoteStream]);

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:global.metered.ca:80", username: "anonymous", credential: "anonymous" },
    { urls: "turn:global.metered.ca:443", username: "anonymous", credential: "anonymous" },
  ];

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const playRingtone = () => {
    if (ringtoneOscillatorRef.current || ringtoneIntervalRef.current) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let count = 0;
    
    const playBeep = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    playBeep();
    ringtoneIntervalRef.current = setInterval(() => {
      count++;
      if (count < 6) playBeep();
      else {
        count = 0;
      }
    }, 400);
    
    ringtoneOscillatorRef.current = audioContext;
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (ringtoneOscillatorRef.current) {
      ringtoneOscillatorRef.current.close();
      ringtoneOscillatorRef.current = null;
    }
  };

  const endCall = (triggeredByRemote = false) => {
    console.log("=== END CALL START === triggeredByRemote:", triggeredByRemote);
    console.trace("Stack trace");
    stopRingtone();
    stopCallTimer();
    setShowCallScreen(false);
    
    if (!localStream && !peerConnectionRef.current && !remoteStream) {
      console.log("Call already ended, ignoring");
      return;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setRemoteStream(null);
    setInCall(false);
    setCalling(false);
    setCallAccepted(false);
    setCallEnded(true);
    setIncomingCall(null);
    setIsReceivingCall(false);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setCallType(null);
    setIsCameraOn(true);

    if (!triggeredByRemote && socket && receiver?.id) {
      const event = callType === "video" ? "video_end_call" : "end_call";
      console.log(`Emitting ${event} to`, receiver.id);
      socket.emit(event, { receiverId: receiver.id });
    }

    setTimeout(() => setCallEnded(false), 1000);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 0 : 1;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket && session?.user?.id) {
      socket.emit("join", String(session.user.id));
    }
  }, [socket, session]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive_message");
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("online_users");
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming_call", async ({ callerId, signalData, callerName }) => {
      console.log("Incoming call from", callerId, "signal type:", signalData?.type);
      if (signalData?.type === "offer") {
        setIncomingCall({ callerId, callerName, signalData });
        setCallType("audio");
        setIsReceivingCall(true);
        setShowCallScreen(true);
        playRingtone();
      }
    });

    socket.on("call_ringing", () => {
      console.log("Call is ringing...");
      setIsRinging(true);
    });

    socket.on("video_incoming_call", async ({ callerId, signalData, callerName }) => {
      console.log("Incoming video call from", callerId);
      if (signalData?.type === "offer") {
        setIncomingCall({ callerId, callerName, signalData });
        setCallType("video");
        setIsReceivingCall(true);
        setShowCallScreen(true);
        playRingtone();
      }
    });

    socket.on("video_call_ringing", () => {
      console.log("Video call is ringing...");
      setIsRinging(true);
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_ringing");
      socket.off("video_incoming_call");
      socket.off("video_call_ringing");
    };
  }, [socket, session]);

  useEffect(() => {
    if (!socket) return;

    socket.on("call_accepted", async ({ signalData, receiverId }) => {
      console.log("Call accepted, signal type:", signalData?.type);
      stopRingtone();
      setCallAccepted(true);
      startCallTimer();
      try {
        const pc = peerConnectionRef.current;
        if (pc && signalData?.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          console.log("Remote description set successfully");
        }
      } catch (err) {
        console.error("Error accepting call:", err);
      }
    });

    const handleCallEnded = () => {
      alert("Call ended by other user!");
      console.log("RECEIVED call_ended from other user");
      endCall(true);
    };
    socket.on("call_ended", handleCallEnded);
    socket.io.on("reconnect", () => {
      console.log("Socket reconnected, re-adding call_ended listener");
      socket.on("call_ended", handleCallEnded);
    });

    socket.on("ice_candidate", async ({ candidate, from }) => {
      if (!peerConnectionRef.current) {
        console.log("Ignoring ICE candidate - no active peer connection");
        return;
      }
      console.log("Received ICE candidate from", from);
      try {
        const pc = peerConnectionRef.current;
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("ICE candidate added successfully");
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("video_call_accepted", async ({ signalData, receiverId }) => {
      console.log("Video call accepted, signal type:", signalData?.type);
      stopRingtone();
      setCallAccepted(true);
      startCallTimer();
      try {
        const pc = peerConnectionRef.current;
        if (pc && signalData?.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          console.log("Remote description set successfully");
        }
      } catch (err) {
        console.error("Error accepting video call:", err);
      }
    });

    const handleVideoCallEnded = () => {
      alert("Video call ended by other user!");
      console.log("RECEIVED video_call_ended from other user");
      endCall(true);
    };
    socket.on("video_call_ended", handleVideoCallEnded);
    socket.io.on("reconnect", () => {
      console.log("Socket reconnected, re-adding video_call_ended listener");
      socket.on("video_call_ended", handleVideoCallEnded);
    });

    socket.on("video_ice_candidate", async ({ candidate, from }) => {
      if (!peerConnectionRef.current) {
        console.log("Ignoring ICE candidate - no active peer connection");
        return;
      }
      try {
        const pc = peerConnectionRef.current;
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("call_accepted");
      socket.off("call_ended", handleCallEnded);
      socket.off("ice_candidate");
      socket.off("video_call_accepted");
      socket.off("video_call_ended", handleVideoCallEnded);
      socket.off("video_ice_candidate");
    };
  }, [socket]);

  useEffect(() => {
    if (!receiver?.id) return;

    fetch(`/api/messages?userId=${receiver.id}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
      });
  }, [receiver]);

  useEffect(() => {
    if (!socket || !receiver?.id || !session?.user?.id) return;

    const timeout = setTimeout(() => {
      socket.emit("mark_seen", { senderId: receiver.id });

      fetch("/api/messages/seen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderId: receiver.id }),
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [receiver, socket, session]);

  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    socket.on("message_seen", () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId?.toString() === session.user.id ? { ...m, seen: true } : m
        )
      );
    });

    return () => socket.off("message_seen");
  }, [socket, session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopRingtone();
      stopCallTimer();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ receiverId: receiver.id, text }),
    });

    socket.emit("send_message", {
      senderId: session.user.id,
      receiverId: receiver.id,
      text,
    });

    setMessages((prev) => [
      ...prev,
      {
        text,
        senderId: session.user.id,
        createdAt: new Date(),
      },
    ]);

    setText("");
  };

  const startCall = async () => {
    try {
      setCalling(true);
      setShowCallScreen(true);
      setCallType("audio");
      console.log("Starting call...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate from caller");
          socket.emit("call_user", {
            callerId: session.user.id,
            receiverId: receiver.id,
            signalData: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote track");
        stopRingtone();
        setRemoteStream(event.streams[0]);
        setInCall(true);
        startCallTimer();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call_user", {
        callerId: session.user.id,
        receiverId: receiver.id,
        signalData: offer,
      });

      console.log("Offer sent");
      setInCall(true);
      playRingtone();
    } catch (err) {
      console.error("Error starting call:", err);
      setCalling(false);
      setShowCallScreen(false);
    }
  };

  const startVideoCall = async () => {
    try {
      setCalling(true);
      setShowCallScreen(true);
      setCallType("video");
      console.log("Starting video call...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate from video caller");
          socket.emit("video_call_user", {
            callerId: session.user.id,
            receiverId: receiver.id,
            signalData: { type: "candidate", candidate: event.candidate },
            callerName: session.user.name,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote video track");
        stopRingtone();
        setRemoteStream(event.streams[0]);
        setInCall(true);
        startCallTimer();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("video_call_user", {
        callerId: session.user.id,
        receiverId: receiver.id,
        signalData: offer,
        callerName: session.user.name,
      });

      console.log("Video offer sent");
      setInCall(true);
      playRingtone();
    } catch (err) {
      console.error("Error starting video call:", err);
      setCalling(false);
      setShowCallScreen(false);
      setCallType(null);
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    
    try {
      console.log("Answering call from", incomingCall.callerId);
      setCallType("audio");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate from receiver");
          socket.emit("answer_call", {
            callerId: incomingCall.callerId,
            receiverId: session.user.id,
            signalData: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote track");
        setRemoteStream(event.streams[0]);
      };

      console.log("Signal data before setting remote:", incomingCall.signalData);
      if (!incomingCall.signalData || incomingCall.signalData.type !== "offer") {
        console.error("Invalid signal data - not an offer:", incomingCall.signalData);
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signalData));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer_call", {
        callerId: incomingCall.callerId,
        receiverId: session.user.id,
        signalData: answer,
      });

      console.log("Answer sent");
      setInCall(true);
      setIncomingCall(null);
      setCallAccepted(true);
    } catch (err) {
      console.error("Error answering call:", err);
    }
  };

  const answerVideoCall = async () => {
    if (!incomingCall) return;
    
    try {
      console.log("Answering video call from", incomingCall.callerId);
      setCallType("video");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate from video receiver");
          socket.emit("video_answer_call", {
            callerId: incomingCall.callerId,
            receiverId: session.user.id,
            signalData: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote video track");
        setRemoteStream(event.streams[0]);
      };

      if (!incomingCall.signalData || incomingCall.signalData.type !== "offer") {
        console.error("Invalid signal data - not an offer:", incomingCall.signalData);
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signalData));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("video_answer_call", {
        callerId: incomingCall.callerId,
        receiverId: session.user.id,
        signalData: answer,
      });

      console.log("Video answer sent");
      setInCall(true);
      setIncomingCall(null);
      setCallAccepted(true);
    } catch (err) {
      console.error("Error answering video call:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <audio ref={localAudioRef} autoPlay muted playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {showCallScreen && incomingCall && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-4xl">{callType === "video" ? "📹" : "👤"}</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">{incomingCall.callerName}</h2>
            <p className="text-lg text-gray-400 mb-8">{callType === "video" ? "Incoming video call..." : "Incoming call..."}</p>
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => {
                  stopRingtone();
                  setIncomingCall(null);
                  setShowCallScreen(false);
                  setIsReceivingCall(false);
                  setCallType(null);
                  if (socket && incomingCall?.callerId) {
                    socket.emit(callType === "video" ? "video_end_call" : "end_call", { receiverId: incomingCall.callerId });
                  }
                }}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
              >
                <span className="text-2xl">📵</span>
              </button>
              <button
                onClick={() => {
                  stopRingtone();
                  if (callType === "video") {
                    answerVideoCall();
                  } else {
                    answerCall();
                  }
                }}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center animate-pulse"
              >
                <span className="text-2xl">{callType === "video" ? "📹" : "📞"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showCallScreen && calling && !inCall && callType !== "video" && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">{receiver.name}</h2>
            <p className="text-lg text-gray-400 mb-4">
              {isRinging ? "Ringing..." : "Calling..."}
            </p>
            {isRinging && (
              <div className="w-48 h-2 bg-gray-700 rounded-full mx-auto mb-8 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            )}
            <button
              onClick={endCall}
              className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
            >
              <span className="text-3xl">📵</span>
            </button>
            <p className="text-gray-500 mt-4">Tap to cancel</p>
          </div>
        </div>
      )}

      {showCallScreen && calling && !inCall && callType === "video" && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-50">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {localStream && (
              <video
                ref={setLocalVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute top-4 right-4 w-32 h-48 rounded-xl object-cover border-2 border-gray-600 z-10"
              />
            )}
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">{receiver.name}</h2>
              <p className="text-lg text-gray-400 mb-4">
                {isRinging ? "Ringing..." : "Calling..."}
              </p>
              {isRinging && (
                <div className="w-48 h-2 bg-gray-700 rounded-full mx-auto mb-8 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              )}
              <button
                onClick={endCall}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
              >
                <span className="text-3xl">📵</span>
              </button>
              <p className="text-gray-500 mt-4">Tap to cancel</p>
            </div>
          </div>
        </div>
      )}

      {showCallScreen && inCall && callType !== "video" && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center z-50">
          <div className="text-center mb-8">
            <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-5xl">👤</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-1">{receiver.name}</h2>
            <p className="text-lg text-gray-400">
              {callAccepted ? formatDuration(callDuration) : "Connecting..."}
            </p>
            {callAccepted && (
              <p className="text-sm text-green-400 mt-1">Connected</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-12 mt-8">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isMuted ? "bg-red-500" : "bg-gray-700"
              }`}
            >
              <span className="text-2xl">{isMuted ? "🔇" : "🎤"}</span>
            </button>
            <button
              onClick={toggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                !isSpeakerOn ? "bg-red-500" : "bg-gray-700"
              }`}
            >
              <span className="text-2xl">{isSpeakerOn ? "🔊" : "🔈"}</span>
            </button>
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
            >
              <span className="text-2xl">📵</span>
            </button>
          </div>

          <p className="text-gray-500 mt-8 text-sm">
            {isMuted ? "Muted" : "Unmuted"} • {isSpeakerOn ? "Speaker on" : "Speaker off"}
          </p>
        </div>
      )}

      {showCallScreen && inCall && callType === "video" && (
        <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
          {remoteStream ? (
            <video
              ref={setRemoteVideoRef}
              autoPlay
              playsInline
              className="flex-1 w-full object-cover"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-5xl">👤</span>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-1">{receiver.name}</h2>
                <p className="text-lg text-gray-400">
                  {callAccepted ? formatDuration(callDuration) : "Connecting..."}
                </p>
              </div>
            </div>
          )}
          {localStream && (
            <video
              ref={setLocalVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute top-4 right-4 w-32 h-48 rounded-xl object-cover border-2 border-gray-600 shadow-lg z-10"
            />
          )}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 z-20">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isMuted ? "bg-red-500" : "bg-gray-700"
              }`}
            >
              <span className="text-2xl">{isMuted ? "🔇" : "🎤"}</span>
            </button>
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                !isCameraOn ? "bg-red-500" : "bg-gray-700"
              }`}
            >
              <span className="text-2xl">{isCameraOn ? "📹" : "🚫"}</span>
            </button>
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
            >
              <span className="text-2xl">📵</span>
            </button>
          </div>
          <div className="absolute top-4 left-4 z-10">
            <p className="text-white text-sm font-semibold">{receiver.name}</p>
            <p className="text-gray-400 text-xs">{formatDuration(callDuration)}</p>
          </div>
        </div>
      )}

      <div className="p-4 bg-white shadow flex items-center gap-3 mt-16">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
          ←
        </button>
        <img src={receiver.image} className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <p className="font-semibold">{receiver.name}</p>
          <p className="text-xs text-gray-500">
            {onlineUsers.includes(String(receiver.id))
              ? "🟢 Online"
              : "⚫ Offline"}
          </p>
        </div>

        {!inCall && !showCallScreen && (
          <>
            <button
              onClick={startCall}
              disabled={calling || !onlineUsers.includes(String(receiver.id))}
              className="bg-green-500 text-white px-3 py-2 rounded-full text-sm disabled:bg-gray-400"
            >
              📞
            </button>
            <button
              onClick={startVideoCall}
              disabled={calling || !onlineUsers.includes(String(receiver.id))}
              className="bg-blue-500 text-white px-3 py-2 rounded-full text-sm disabled:bg-gray-400"
            >
              📹
            </button>
          </>
        )}

        {(inCall || showCallScreen) && (
          <button
            onClick={endCall}
            className="bg-red-500 text-white px-3 py-2 rounded-full text-sm"
          >
            End Call
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => {
          const isMe = String(m.senderId) === String(session?.user?.id);

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-gray-300 text-gray-800 rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{m.text}</p>

                <p className="text-[10px] mt-1 opacity-70 text-right">
                  {new Date(m.createdAt || 0).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {isMe && (
                  <p
                    className={`text-[10px] text-right ${
                      m.seen ? "text-blue-700" : "text-white"
                    }`}
                  >
                    ✓✓
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-white flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2"
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-5 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}