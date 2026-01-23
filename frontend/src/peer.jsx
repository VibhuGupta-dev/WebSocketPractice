import { createContext, useMemo, useEffect, useState, useCallback, useContext } from "react";

const PeerContext = createContext(null);

export const usePeer = () => useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null);

  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      }),
    []
  );

  const createOffer = async () => {
    if (peer.signalingState !== "stable") {
      console.log("Cannot create offer, peer state:", peer.signalingState);
      return null;
    }
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    if (peer.signalingState !== "stable" && peer.signalingState !== "have-remote-offer") {
      console.log("Cannot create answer, peer state:", peer.signalingState);
      return null;
    }
    
    if (peer.signalingState === "stable") {
      await peer.setRemoteDescription(offer);
    }
    
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAns = async (ans) => {
    if (peer.signalingState !== "have-local-offer") {
      console.log("Cannot set remote answer, peer state:", peer.signalingState);
      return;
    }
    await peer.setRemoteDescription(ans);
  };

  const sendStream = async (stream) => {
    const senders = peer.getSenders();
    const tracks = stream.getTracks();
    
    for (const track of tracks) {
      const existingSender = senders.find(s => s.track?.kind === track.kind);
      if (existingSender) {
        existingSender.replaceTrack(track);
      } else {
        peer.addTrack(track, stream);
      }
    }
  };

  const resetPeer = () => {
    const senders = peer.getSenders();
    senders.forEach(sender => {
      if (sender.track) {
        peer.removeTrack(sender);
      }
    });
    setRemoteStream(null);
    console.log("Peer connection reset");
  };

  const handleTrackEvent = useCallback((event) => {
    const streams = event.streams;
    if (streams && streams[0]) {
      console.log("Remote stream received");
      setRemoteStream(streams[0]);
    }
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);
    
    peer.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        console.log("ICE candidate:", event.candidate);
      }
    });

    peer.addEventListener("connectionstatechange", () => {
      console.log("Connection state:", peer.connectionState);
    });

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [peer, handleTrackEvent]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
        remoteStream,
        resetPeer,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};