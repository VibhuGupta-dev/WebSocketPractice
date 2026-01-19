import { useLocation } from "react-router-dom";
import "./index.css";
import { useState, useRef, useEffect } from "react";
import { connectWS } from "./ws";

export default function Chat() {
  const socket = useRef(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const location = useLocation();
  const username = location.state?.userName || "guest";

  const handleSend = () => {
    if (!input.trim()) return;

    socket.current.emit("sendMessage", {
      text: input,
      sender: username,
    });

    setInput("");
  };

  useEffect(() => {
    socket.current = connectWS();

    socket.current.on("user:joined", (data) => {
      console.log("User connected:", data.username);
    });

    socket.current.on("totalperson", (count) => {
      setTotalUsers(count);
    });

    socket.current.on("message", (msg) => {
  // SAFETY CHECK
  if (!msg || typeof msg !== "object") return;

  setMessages(prev => Array.isArray(prev) ? [...prev, msg] : [msg]);
});

    socket.current.emit("user:join", username);

    return () => {
      socket.current.off("message");
      socket.current.disconnect();
    };
  }, [username]);

  return (
    <div className="chat-app-container">
      <div className="userinfo">
        <div>Joined As: {username}</div>
        <div>Total Members: {totalUsers}</div>
      </div>

    <div className="messageside">
  {Array.isArray(messages) &&
    messages.map((msg, index) => (
      <div key={index}>
        <b>{msg.sender}:</b> {msg.text}
      </div>
    ))}
</div>


      <div className="inputside">
        <input
          className="input2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
