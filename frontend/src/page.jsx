import { useLocation } from "react-router-dom";
import "./index.css";
import { useState, useRef, useEffect, useCallback } from "react";
import { connectWS } from "./ws";
import { usePeer } from "./peer";

export default function Chat() {
  const socket = useRef(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [photos, setPhotos] = useState([]);
  
  const [totalUsers, setTotalUsers] = useState(0);
  const location = useLocation();
  const username = location.state?.userName || "guest";
  const { createOffer, createAnswer, setRemoteAns, sendStream, remoteStream } = usePeer();
  const messagesEndRef = useRef(null);
  const [myStream, setMyStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // Track if we've already initiated a call with a user
  const calledUsers = useRef(new Set());
  const isProcessingCall = useRef(false);

  const handleNewUserJoined = useCallback(
    async (data) => {
      if (data.username === username) return;
      
      // Check if we've already called this user
      if (calledUsers.current.has(data.username)) {
        console.log("Already called user:", data.username);
        return;
      }

      if (isProcessingCall.current) {
        console.log("Already processing a call");
        return;
      }

      console.log("New user joined:", data.username);
      isProcessingCall.current = true;
      calledUsers.current.add(data.username);

      try {
        const offer = await createOffer();
        if (offer) {
          socket.current.emit("call-user", {
            username: data.username,
            offer,
          });
        }
      } catch (error) {
        console.error("Error creating offer:", error);
        calledUsers.current.delete(data.username);
      } finally {
        isProcessingCall.current = false;
      }
    },
    [createOffer, username],
  );

  const handleSend = () => {
    if (!input.trim()) return;

    socket.current.emit("sendMessage", {
      text: input,
      sender: username,
      timestamp: Date.now(),
    });

    setInput("");
  };

  const handleImageSend = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;

      socket.current.emit("sendPhoto", {
        image: base64data,
        sender: username,
        timestamp: Date.now(),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleIncomminCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      
      if (isProcessingCall.current) {
        console.log("Already processing a call, ignoring incoming call");
        return;
      }

      console.log("Incoming call from:", from);
      isProcessingCall.current = true;

      try {
        const ans = await createAnswer(offer);
        if (ans) {
          socket.current.emit("call-accepted", {
            to: from,
            ans,
          });
          console.log("Call accepted, answer sent to:", from);
        }
      } catch (error) {
        console.error("Error accepting call:", error);
      } finally {
        isProcessingCall.current = false;
      }
    },
    [createAnswer],
  );

  const handlecallAccepted = useCallback(
    async (data) => {
      const { ans } = data;
      console.log("Call accepted by remote peer");
      
      try {
        await setRemoteAns(ans);
      } catch (error) {
        console.error("Error setting remote answer:", error);
      }
    },
    [setRemoteAns],
  );

  const toggleAudio = () => {
    if (!myStream) return;
    
    const audioTrack = myStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
      console.log("Audio", audioTrack.enabled ? "unmuted" : "muted");
    }
  };

  const toggleVideo = () => {
    if (!myStream) return;
    
    const videoTrack = myStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      console.log("Video", videoTrack.enabled ? "on" : "off");
    }
  };

  useEffect(() => {
    socket.current = connectWS();

    socket.current.on("incomming-call", handleIncomminCall);
    socket.current.on("user:joined", handleNewUserJoined);
    socket.current.on("call-accepted", handlecallAccepted);

    socket.current.on("totalperson", (count) => {
      setTotalUsers(count);
    });
    
    socket.current.on("message", (msg) => {
      if (!msg || typeof msg !== "object") return;
      setMessages((prev) => [...prev, { ...msg, type: "text" }]);
    });

    socket.current.on("photo", (pho) => {
      if (!pho || typeof pho !== "object") return;
      setPhotos((prev) => [...prev, { ...pho, type: "image" }]);
    });

    socket.current.emit("user:join", username);

    return () => {
      socket.current.off("message");
      socket.current.off("photo");
      socket.current.off("incomming-call");
      socket.current.off("user:joined");
      socket.current.off("call-accepted");
      socket.current.disconnect();
      
      // Stop all tracks on unmount
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      
      calledUsers.current.clear();
    };
  }, [username, handleNewUserJoined, handleIncomminCall, handlecallAccepted]);

  const allMessages = [...messages, ...photos].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
  );

  const getUserMediaStream = useCallback(async() => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true, 
        video: true
      });
      setMyStream(stream);
      sendStream(stream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  }, [sendStream]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  return (
    <>
      <div className="chat-app-container">
        <div className="userinfo">
          <div className="user-info-left">
            <span className="joined-as">
              Joined as: <strong>{username}</strong>
            </span>
          </div>
          <div className="user-info-right">
            Total members: <strong>{totalUsers}</strong>
          </div>
        </div>

        <div className="chatbox">
          <div className="messageside">
            {allMessages.map((item, index) => {
              const isOwnMessage = item.sender === username;
              const time = new Date();
              const hour = time.getHours().toString().padStart(2, "0");
              const min = time.getMinutes().toString().padStart(2, "0");

              return (
                <div
                  key={index}
                  className={`message-wrapper ${isOwnMessage ? "own" : "other"}`}
                >
                  <div className="message-bubble">
                    {!isOwnMessage && (
                      <span className="message-sender">{item.sender}</span>
                    )}

                    {item.type === "text" ? (
                      <div className="message-content">{item.text}</div>
                    ) : (
                      <img
                        src={item.image}
                        alt="shared"
                        className="shared-image"
                      />
                    )}

                    <span className="message-time">
                      {hour}:{min}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="inputside">
            <input
              placeholder="Type a message..."
              className="input2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="button2" onClick={handleSend}>
              Send
            </button>

            <div className="upload">
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                hidden
                onChange={handleImageSend}
              />
              <label htmlFor="fileInput" className="upload-btn">
                file
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="video-page">
        {/* Your own video – always shown */}
        <div className="video-tile">
          <div className="video-placeholder">
            {myStream ? (
              <video
                autoPlay
                muted
                playsInline
                ref={(video) => {
                  if (video) video.srcObject = myStream;
                }}
              />
            ) : (
              <div className="no-stream">Starting camera...</div>
            )}
          </div>
          
          <div className="video-controls">
            <button 
              className={`control-btn ${isAudioMuted ? 'muted' : ''}`}
              onClick={toggleAudio}
              title={isAudioMuted ? "Unmute" : "Mute"}
              disabled={!myStream}
            >
              {isAudioMuted ? "🔇" : "🔊"}
            </button>
            
            <button 
              className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
              onClick={toggleVideo}
              title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              disabled={!myStream}
            >
              {isVideoOff ? "📷❌" : "📷"}
            </button>
          </div>
          
          <div className="participant-name">You ({username})</div>
        </div>

        {/* Remote video stream */}
        {remoteStream && (
          <div className="video-tile">
            <div className="video-placeholder">
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video) video.srcObject = remoteStream;
                }}
              />
            </div>
            <div className="participant-name">
              Remote User
            </div>
          </div>
        )}

        {/* Show waiting state when alone */}
        {!remoteStream && totalUsers <= 1 && (
          <div className="video-tile empty-state">
            <div className="video-placeholder">
              <div className="no-participants">
                Waiting for others to join...
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}