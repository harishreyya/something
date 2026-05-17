"use client";

import { useEffect, useRef, useState } from "react";
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

  const peerConnectionRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

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

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:global.metered.ca:80", username: "anonymous", credential: "anonymous" },
    { urls: "turn:global.metered.ca:443", username: "anonymous", credential: "anonymous" },
  ];

  const endCall = (triggeredByRemote = false) => {
    console.log("Ending call", triggeredByRemote ? "(remote)" : "(local)");
    
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

    if (!triggeredByRemote && socket && receiver?.id) {
      socket.emit("end_call", { receiverId: receiver.id });
    }

    setTimeout(() => setCallEnded(false), 1000);
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
      }
    });

    return () => socket.off("incoming_call");
  }, [socket, session]);

  useEffect(() => {
    if (!socket) return;

    socket.on("call_accepted", async ({ signalData, receiverId }) => {
      console.log("Call accepted, signal type:", signalData?.type);
      try {
        const pc = peerConnectionRef.current;
        if (pc && signalData?.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          setCallAccepted(true);
          console.log("Remote description set successfully");
        }
      } catch (err) {
        console.error("Error accepting call:", err);
      }
    });

    socket.on("call_ended", () => {
      console.log("Received call_ended event");
      endCall(true);
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

    return () => {
      socket.off("call_accepted");
      socket.off("call_ended");
      socket.off("ice_candidate");
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
        setRemoteStream(event.streams[0]);
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
    } catch (err) {
      console.error("Error starting call:", err);
      setCalling(false);
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    
    try {
      console.log("Answering call from", incomingCall.callerId);
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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
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

        {!inCall && (
          <button
            onClick={startCall}
            disabled={calling || !onlineUsers.includes(String(receiver.id))}
            className="bg-green-500 text-white px-3 py-2 rounded-full text-sm disabled:bg-gray-400"
          >
            {calling ? "Calling..." : "📞 Call"}
          </button>
        )}

        {inCall && (
          <button
            onClick={endCall}
            className="bg-red-500 text-white px-3 py-2 rounded-full text-sm"
          >
            End Call
          </button>
        )}
      </div>

      {inCall && (
        <div className="bg-green-100 p-3 text-center text-green-800 flex items-center justify-center gap-2">
          <span className="animate-pulse">🔊</span>
          {callAccepted ? "In call..." : calling ? "Calling..." : "Incoming call..."}
        </div>
      )}

      <audio ref={localAudioRef} autoPlay muted playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {incomingCall && !inCall && (
        <div className="bg-blue-100 p-4 text-center flex items-center justify-center gap-3">
          <span>📞 Incoming call from {incomingCall.callerName}</span>
          <button
            onClick={answerCall}
            className="bg-green-500 text-white px-4 py-2 rounded-full"
          >
            Answer
          </button>
          <button
            onClick={() => setIncomingCall(null)}
            className="bg-red-500 text-white px-4 py-2 rounded-full"
          >
            Decline
          </button>
        </div>
      )}

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