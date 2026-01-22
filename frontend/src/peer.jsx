import React, { useMemo } from "react";

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);


export const PeerProvider = (props) => {
  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );
const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
}

const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer)
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    console.log(answer)
    return answer
}

const setRemoteAns = async(ans) => {
await peer.setRemoteDescription(ans)
}
  return (
    <PeerContext.Provider value={{ peer, createOffer  , createAnswer , setRemoteAns}}>{props.children}</PeerContext.Provider>
  );
};
