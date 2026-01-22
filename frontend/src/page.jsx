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
  const { createOffer, createAnswer, setRemoteAns } = usePeer();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNewUserJoined = useCallback(
    async (data) => {
      if (data.username === username) return; // 🚫 self-call block

      const offer = await createOffer();
      socket.current.emit("call-user", {
        username: data.username,
        offer,
      });
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
      console.log("incommming call", from, offer);
      const ans = await createAnswer(offer);
      socket.current.emit("call-accepted", {
  to: from,
  ans,
});

    },
    [createAnswer, socket],
  );

  const handlecallAccepted = useCallback(
    async (data) => {
      const { ans } = data;
      console.log("call accepted anser", ans);
      await setRemoteAns(ans);
    },
    [setRemoteAns],
  );

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
      socket.current.off("new-user-joined");
      socket.current.off("call-accepted");

      socket.current.disconnect();
    };
  }, [username, handleNewUserJoined, handleIncomminCall]);

  const allMessages = [...messages, ...photos].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
  );

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

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
        <button className="startvideo" onClick={handleIncomminCall}>
          start Video
        </button>
      </div>

      <div className="video-page">
        <div className="video-tile">
          <div className="video-placeholder" />
          <button className="end-btn">End</button>
          <div className="participant-name">You</div>
        </div>

        <div className="video-tile">
          <div className="video-placeholder" />
          <button className="end-btn">End</button>
          <div className="participant-name">Alice</div>
        </div>
      </div>
    </>
  );
}
