import { useState, useRef, useEffect, useCallback } from "react";
import { WS_URL } from "../config";

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function useWebRTC(pcName: string, autoConnect: boolean = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const viewerIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInteractionHandlerRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  const [showVideo, setShowVideo] = useState(autoConnect);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Function to try playing video
  const tryPlayVideo = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (video.srcObject && !video.error) {
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`${pcName}: Video playback started successfully`);
            setIsVideoActive(true);
            setShowPlayButton(false);
            setVideoLoading(false);
            setHasUserInteracted(true);
          })
          .catch((err) => {
            console.log(`${pcName}: Auto-play blocked:`, err.message);

            // Only show play button if we haven't had user interaction yet
            if (!hasUserInteracted) {
              setShowPlayButton(true);
              setIsVideoActive(false);
            }
          });
      }
    }
  }, [pcName, hasUserInteracted]);

  // Handle manual play button click
  const handleManualPlay = useCallback(() => {
    setHasUserInteracted(true);
    setShowPlayButton(false);
    tryPlayVideo();
  }, [tryPlayVideo]);

  // Setup user interaction listener for autoplay
  const setupAutoplayListener = useCallback(() => {
    const handleUserInteraction = () => {
      console.log(`${pcName}: User interaction detected`);
      setHasUserInteracted(true);
      tryPlayVideo();

      // Remove listener after first interaction
      if (userInteractionHandlerRef.current) {
        document.removeEventListener("click", userInteractionHandlerRef.current);
        userInteractionHandlerRef.current = null;
      }
    };

    userInteractionHandlerRef.current = handleUserInteraction;
    document.addEventListener("click", handleUserInteraction);

    return () => {
      if (userInteractionHandlerRef.current) {
        document.removeEventListener("click", userInteractionHandlerRef.current);
        userInteractionHandlerRef.current = null;
      }
    };
  }, [pcName, tryPlayVideo]);

  // Cleanup WebRTC properly
  const cleanupWebRTC = useCallback((isReconnecting: boolean = false) => {
    console.log(`${pcName}: Cleaning up WebRTC${isReconnecting ? ' for reconnect' : ''}`);
    
    // Clear reconnection timeout first
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Cleanup");
      }
      wsRef.current = null;
    }

    // Close PeerConnection
    if (pcRef.current) {
      // Remove all event listeners before closing
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.onsignalingstatechange = null;
      
      // Close the connection
      try {
        pcRef.current.close();
      } catch (err) {
        console.log(`${pcName}: Error closing PeerConnection:`, err);
      }
      pcRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }

    viewerIdRef.current = null;

    // Clean up autoplay listener
    if (userInteractionHandlerRef.current) {
      document.removeEventListener("click", userInteractionHandlerRef.current);
      userInteractionHandlerRef.current = null;
    }

    // Only reset state if not reconnecting
    if (!isReconnecting) {
      setIsVideoActive(false);
      setVideoLoading(false);
      setShowPlayButton(false);
      setConnectionStatus("disconnected");
      setVideoError(null);
      setHasUserInteracted(false);
    }
  }, [pcName]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (showVideo) {
      console.log(`${pcName}: Scheduling reconnect in 5 seconds...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`${pcName}: Attempting to reconnect...`);
        cleanupWebRTC(true); // Cleanup for reconnect
        initWebRTC();
      }, 5000);
    }
  }, [pcName, showVideo, cleanupWebRTC]);

  const initWebRTC = useCallback(() => {
    if (!showVideo) return;
    if (isInitializedRef.current && connectionStatus === "connecting") return;

    try {
      console.log(`${pcName}: Initializing WebRTC...`);
      isInitializedRef.current = true;
      
      setVideoError(null);
      setVideoLoading(true);
      setConnectionStatus("connecting");
      setShowPlayButton(false);

      const viewerId = uuidv4();
      viewerIdRef.current = viewerId;

      const wsUrl = `${WS_URL.replace("http", "ws")}/ws/webrtc/${pcName}`;
      console.log(`${pcName}: Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const pcObj = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });
      pcRef.current = pcObj;

      let cleanupSetupAutoplay: (() => void) | null = null;

      pcObj.ontrack = (event) => {
        console.log(`${pcName}: Received video track!`);
        if (event.streams && event.streams[0] && videoRef.current) {
          const stream = event.streams[0];
          console.log(`${pcName}: Stream has ${stream.getTracks().length} track(s)`);

          stream.getTracks().forEach((track, i) => {
            console.log(`${pcName}: Track ${i}: ${track.kind} - ${track.readyState}`);
            // Handle track ended event
            track.onended = () => {
              console.log(`${pcName}: Track ${i} ended`);
              setIsVideoActive(false);
            };
          });

          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;

          // Don't automatically set isVideoActive here - wait for play success
          setVideoLoading(false);
          setConnectionStatus("connected");

          // Setup autoplay listener if needed
          cleanupSetupAutoplay = setupAutoplayListener();

          // Try to play video
          setTimeout(() => {
            tryPlayVideo();
          }, 100);
        } else {
          console.error(`${pcName}: No stream or video element in ontrack`);
          setVideoError("No video stream received");
          setConnectionStatus("failed");
        }
      };

      pcObj.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          console.log(`${pcName}: Sending ICE candidate`);
          ws.send(
            JSON.stringify({
              type: "candidate",
              candidate: event.candidate.toJSON(),
              viewer_id: viewerId,
            })
          );
        } else if (!event.candidate) {
          console.log(`${pcName}: ICE gathering complete`);
        }
      };

      pcObj.oniceconnectionstatechange = () => {
        console.log(`${pcName}: ICE state: ${pcObj.iceConnectionState}`);
        if (pcObj.iceConnectionState === "failed") {
          console.error(`${pcName}: ICE connection failed`);
          setVideoError("ICE connection failed");
          setConnectionStatus("failed");
          if (cleanupSetupAutoplay) cleanupSetupAutoplay();
          cleanupWebRTC();
          scheduleReconnect();
        } else if (pcObj.iceConnectionState === "connected") {
          console.log(`${pcName}: ICE connected successfully`);
          setConnectionStatus("connected");
        } else if (pcObj.iceConnectionState === "disconnected") {
          console.log(`${pcName}: ICE disconnected`);
          setConnectionStatus("disconnected");
          setIsVideoActive(false);
        } else if (pcObj.iceConnectionState === "closed") {
          console.log(`${pcName}: ICE connection closed`);
          setConnectionStatus("disconnected");
          setIsVideoActive(false);
        }
      };

      pcObj.onconnectionstatechange = () => {
        console.log(`${pcName}: Connection state: ${pcObj.connectionState}`);
        if (pcObj.connectionState === "connected") {
          console.log(`${pcName}: WebRTC fully connected`);
          setConnectionStatus("connected");
        } else if (
          pcObj.connectionState === "disconnected" ||
          pcObj.connectionState === "failed"
        ) {
          console.log(`${pcName}: Connection ${pcObj.connectionState}`);
          setConnectionStatus(pcObj.connectionState);
          setIsVideoActive(false);
          if (cleanupSetupAutoplay) cleanupSetupAutoplay();
          cleanupWebRTC();
          scheduleReconnect();
        } else if (pcObj.connectionState === "closed") {
          console.log(`${pcName}: Connection closed`);
          setConnectionStatus("disconnected");
          setIsVideoActive(false);
          if (cleanupSetupAutoplay) cleanupSetupAutoplay();
        }
      };

      pcObj.onsignalingstatechange = () => {
        console.log(`${pcName}: Signaling state: ${pcObj.signalingState}`);
      };

      ws.onopen = async () => {
        console.log(`${pcName}: WebSocket connected`);
        setConnectionStatus("connecting");

        // Send identification
        ws.send(
          JSON.stringify({
            role: "viewer",
            viewer_id: viewerId,
          })
        );
        console.log(`${pcName}: Sent viewer identification`);

        try {
          // Add transceiver and create offer
          pcObj.addTransceiver("video", { direction: "recvonly" });
          const offer = await pcObj.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false,
          });

          console.log(`${pcName}: Created offer, setting local description`);
          await pcObj.setLocalDescription(offer);

          ws.send(
            JSON.stringify({
              type: "offer",
              sdp: offer.sdp,
              viewer_id: viewerId,
            })
          );
          console.log(`${pcName}: Offer sent to agent`);
        } catch (err) {
          console.error(`${pcName}: Failed to create/send offer:`, err);
          setVideoError("Failed to create connection");
          setConnectionStatus("failed");
          if (cleanupSetupAutoplay) cleanupSetupAutoplay();
          cleanupWebRTC();
          scheduleReconnect();
        }
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`${pcName}: Received message type: ${data.type}`);

          switch (data.type) {
            case "answer":
              if (data.viewer_id === viewerId) {
                console.log(`${pcName}: Received answer from agent`);
                console.log(`${pcName}: Answer SDP length: ${data.sdp?.length || 0} chars`);

                try {
                  await pcObj.setRemoteDescription(
                    new RTCSessionDescription({ type: "answer", sdp: data.sdp })
                  );
                  console.log(`${pcName}: Remote description set successfully`);

                  // Check if we have tracks
                  setTimeout(() => {
                    if (pcObj.getReceivers().length > 0) {
                      console.log(`${pcName}: Has ${pcObj.getReceivers().length} receiver(s)`);
                      const receivers = pcObj.getReceivers();
                      receivers.forEach((rec, i) => {
                        console.log(`${pcName}: Receiver ${i}:`, rec.track.kind, rec.track.readyState);
                      });
                    } else {
                      console.log(`${pcName}: No receivers yet`);
                      // If no receivers after 3 seconds, try to reconnect
                      setTimeout(() => {
                        if (pcObj.getReceivers().length === 0) {
                          console.log(`${pcName}: Still no receivers, reconnecting...`);
                          setVideoError("No video receivers");
                          setConnectionStatus("failed");
                          if (cleanupSetupAutoplay) cleanupSetupAutoplay();
                          cleanupWebRTC();
                          scheduleReconnect();
                        }
                      }, 3000);
                    }
                  }, 1000);
                } catch (err: any) {
                  console.error(`${pcName}: Failed to set remote description:`, err);
                  console.error(`${pcName}: Error details:`, err.message);
                  setVideoError("Failed to process answer");
                  setConnectionStatus("failed");
                  if (cleanupSetupAutoplay) cleanupSetupAutoplay();
                  cleanupWebRTC();
                  scheduleReconnect();
                }
              } else {
                console.log(`${pcName}: Answer for different viewer (expected ${viewerId}, got ${data.viewer_id})`);
              }
              break;

            case "candidate":
              if (data.viewer_id === viewerId && data.candidate) {
                try {
                  console.log(`${pcName}: Adding ICE candidate from agent`);
                  await pcObj.addIceCandidate(new RTCIceCandidate(data.candidate));
                  console.log(`${pcName}: ICE candidate added`);
                } catch (err) {
                  console.log(`${pcName}: Failed to add ICE candidate:`, err);
                }
              }
              break;

            case "error":
              console.error(`${pcName}: Signaling error:`, data.message);
              setVideoError(data.message || "Connection error");
              setConnectionStatus("failed");
              if (cleanupSetupAutoplay) cleanupSetupAutoplay();
              cleanupWebRTC();
              scheduleReconnect();
              break;

            case "ack":
            case "ready":
            case "viewer_connected":
              console.log(`${pcName}: ${data.type}: ${data.message || ""}`);
              break;

            default:
              console.log(`${pcName}: Unknown message type: ${data.type}`, data);
          }
        } catch (err) {
          console.error(`${pcName}: Failed to parse message:`, err);
        }
      };

      ws.onerror = (error) => {
        console.error(`${pcName}: WebSocket error:`, error);
        setVideoError("WebSocket error");
        setConnectionStatus("failed");
        if (cleanupSetupAutoplay) cleanupSetupAutoplay();
        cleanupWebRTC();
        scheduleReconnect();
      };

      ws.onclose = (event) => {
        console.log(`${pcName}: WebSocket closed:`, event.code, event.reason);
        if (cleanupSetupAutoplay) cleanupSetupAutoplay();
        
        if (event.code !== 1000 && event.code !== 1001) {
          setConnectionStatus("disconnected");
          setIsVideoActive(false);
          cleanupWebRTC();
          scheduleReconnect();
        }
      };

      // Handle video element events
      if (videoRef.current) {
        const video = videoRef.current;
        const handleVideoError = () => {
          console.error(`${pcName}: Video element error:`, video.error);
          setVideoError("Video playback error");
          setIsVideoActive(false);
        };
        
        const handleVideoEnded = () => {
          console.log(`${pcName}: Video ended`);
          setIsVideoActive(false);
        };

        video.onerror = handleVideoError;
        video.onended = handleVideoEnded;

        // Return cleanup for video listeners
        return () => {
          video.onerror = null;
          video.onended = null;
          if (cleanupSetupAutoplay) cleanupSetupAutoplay();
        };
      }
    } catch (err) {
      console.error(`${pcName}: WebRTC initialization failed:`, err);
      setVideoError("Failed to initialize");
      setConnectionStatus("failed");
      cleanupWebRTC();
      scheduleReconnect();
    }
  }, [pcName, showVideo, setupAutoplayListener, tryPlayVideo, cleanupWebRTC, scheduleReconnect, connectionStatus]);

  // Toggle video on/off
  const toggleVideo = useCallback(() => {
    const newShowVideo = !showVideo;
    console.log(`${pcName}: Toggling video: ${newShowVideo ? 'ON' : 'OFF'}`);
    
    setShowVideo(newShowVideo);
    setHasUserInteracted(false); // Reset user interaction when toggling

    if (newShowVideo) {
      // Turning ON
      isInitializedRef.current = false;
      setTimeout(() => {
        initWebRTC();
      }, 100);
    } else {
      // Turning OFF
      isInitializedRef.current = false;
      cleanupWebRTC();
    }
  }, [showVideo, initWebRTC, cleanupWebRTC, pcName]);

  // Initialize WebRTC on mount
  useEffect(() => {
    if (showVideo && autoConnect) {
      console.log(`${pcName}: Mounting with autoConnect=${autoConnect}`);
      initWebRTC();
    }

    return () => {
      console.log(`${pcName}: Unmounting, cleaning up...`);
      isInitializedRef.current = false;
      cleanupWebRTC();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Handle showVideo changes
  useEffect(() => {
    if (showVideo && autoConnect) {
      if (!isInitializedRef.current) {
        initWebRTC();
      }
    } else if (!showVideo) {
      cleanupWebRTC();
    }
  }, [showVideo, autoConnect, initWebRTC, cleanupWebRTC]);

  return {
    videoRef,
    showVideo,
    setShowVideo,
    videoLoading,
    videoError,
    isVideoActive,
    setIsVideoActive,
    connectionStatus,
    showPlayButton,
    handleManualPlay,
    hasUserInteracted,
    toggleVideo,
    cleanupWebRTC,
    initWebRTC, // Export init for manual control
  };
}