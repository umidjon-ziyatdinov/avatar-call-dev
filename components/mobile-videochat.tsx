// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Video } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RealtimeClient } from "@openai/realtime-api-beta";
import { SimliClient } from "simli-client";
import RingingAnimation from "@/components/RingingAnimation";
import { Avatar, PatientDetails } from "@/lib/db/schema";
import { generateFinalPrompt } from "@/utils/utils";

import { useDraggable } from "@/hooks/useDraggable";
import VideoBox from "./video-box";
import VideoControls from "./VideoChatControls";
import { useMediaStream } from "@/hooks/useMediaStream ";

interface Position {
  x: number;
  y: number;
}

interface CallMetrics {
  qualityMetrics: {
    audioQuality: number;
    videoQuality: number;
    networkLatency: number;
    dropouts: number;
  };
  conversationMetrics: {
    userSpeakingTime: number;
    avatarSpeakingTime: number;
    turnsCount: number;
    avgResponseTime: number;
  };
  technicalDetails: {
    browserInfo: string;
    deviceType: string;
    networkType: string;
    osVersion: string;
    startTime: string;
  };
  errorLogs: Array<{
    timestamp: string;
    error: string;
    context: string;
  }>;
}

const simliClient = new SimliClient();

const MobileVideoChat: React.FC<{
  avatar: Avatar;
  className?: string;
  patient?: PatientDetails;
  onBack?: (url?: string) => void;
}> = ({ avatar, onBack, className, patient }) => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userMessage, setUserMessage] = useState("...");
  const [callId, setCallId] = useState<string | null>(null);

  // Metrics State
  const [callMetrics, setCallMetrics] = useState<CallMetrics>({
    qualityMetrics: {
      audioQuality: 100,
      videoQuality: 100,
      networkLatency: 0,
      dropouts: 0
    },
    conversationMetrics: {
      userSpeakingTime: 0,
      avatarSpeakingTime: 0,
      turnsCount: 0,
      avgResponseTime: 0
    },
    technicalDetails: {
      browserInfo: navigator.userAgent,
      deviceType: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      networkType: (navigator as any).connection?.type || 'unknown',
      osVersion: navigator.platform,
      startTime: ''
    },
    errorLogs: []
  });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const openAIClientRef = useRef<RealtimeClient | null>(null);
  const audioChunkQueueRef = useRef<Int16Array[]>([]);
  const isProcessingChunkRef = useRef(false);

  // Recording Refs
  const conversationAudioRef = useRef<{
    audio: Int16Array;
    timestamp: number;
    speaker: 'user' | 'assistant';
  }[]>([]);

  // Custom hooks
  const {
    stream,
    hasCamera,
    checkCameraAvailability,
    startVideoStream,
    stopVideoStream
  } = useMediaStream();

  const { position, handleDragStart } = useDraggable(containerRef, videoBoxRef);

  // Audio Processing Functions
  const downsampleAudio = (audio: Int16Array, fromSampleRate: number, toSampleRate: number): Int16Array => {
    if (fromSampleRate === toSampleRate) return audio;
    
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audio.length / ratio);
    const result = new Int16Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const oldIndex = Math.floor(i * ratio);
      result[i] = audio[oldIndex];
    }
    
    return result;
  };

  const encodeWAV = (samples: Int16Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // Write WAV header
    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    // Write audio data
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(44 + i * 2, samples[i], true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  // Audio Queue Processing
  const processNextAudioChunk = useCallback(() => {
    console.log('Queue length:', audioChunkQueueRef.current.length);
    if (audioChunkQueueRef.current.length > 0 && !isProcessingChunkRef.current) {
      isProcessingChunkRef.current = true;
      const audioChunk = audioChunkQueueRef.current.shift();
      console.log('Processing chunk size:', audioChunk?.length);
      if (audioChunk) {
        simliClient?.sendAudioData(audioChunk);
      }

      isProcessingChunkRef.current = false;

      if (audioChunkQueueRef.current.length > 0) {
        setTimeout(processNextAudioChunk, 50);
      }
    }
  }, []);

  // OpenAI Event Handlers
  const handleConversationUpdate = useCallback((event: any) => {
    const { item, delta } = event;
    console.log('item: ' , item)
    console.log('delta', delta)
    if (item.type === "message" && item.role === "assistant") {
      if (delta && delta.audio) {
        const downsampledAudio = downsampleAudio(delta.audio, 24000, 16000);
        console.log('Assistant audio chunk:', downsampledAudio.length);
        // Store assistant's audio with timestamp
        conversationAudioRef.current.push({
          audio: downsampledAudio,
          timestamp: Date.now(),
          speaker: 'assistant'
        });
        
        audioChunkQueueRef.current.push(downsampledAudio);
        if (!isProcessingChunkRef.current) {
          processNextAudioChunk();
        }
      }
    } else if (item.type === "message" && item.role === "user") {
      setUserMessage(item.content[0].transcript);
    }
  }, [processNextAudioChunk]);

  const handleSpeechStopped = useCallback((event: any) => {
    console.log("Speech stopped event received", event);
  }, []);

  const interruptConversation = useCallback(() => {
    simliClient?.ClearBuffer();
    openAIClientRef.current?.cancelResponse("");
  }, []);

  // Recording Functions
  const startRecording = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const source = audioContextRef.current.createMediaStreamSource(
        streamRef.current
      );
      processorRef.current = audioContextRef.current.createScriptProcessor(
        2048,
        1,
        1
      );

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const audioData = new Int16Array(inputData.length);
     
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          audioData[i] = Math.floor(sample * 32767);
        }
        console.log('User audio chunk:', audioData.length);
        // Store user's audio with timestamp
        conversationAudioRef.current.push({
          audio: audioData,
          timestamp: Date.now(),
          speaker: 'user'
        });

        openAIClientRef.current?.appendInputAudio(audioData);
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      setIsRecording(true);
    } catch (error: any) {
      logError("Microphone Access", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Upload Functions
  const sendAggregatedAudio = async () => {
    console.log('Total conversation chunks:', conversationAudioRef.current.length);
    const sortedAudio = conversationAudioRef.current.sort((a, b) => a.timestamp - b.timestamp);
    const totalLength = sortedAudio.reduce((acc, chunk) => acc + chunk.audio.length, 0);
    const merged = new Int16Array(totalLength);
    console.log('Total audio length:', totalLength);
    let offset = 0;
    sortedAudio.forEach((chunk, index) => {
      console.log(`Chunk ${index}: ${chunk.speaker}, length: ${chunk.audio.length}`);
      merged.set(chunk.audio, offset);
      offset += chunk.audio.length;
    });

    const audioBlob = encodeWAV(merged, 16000);
    const formData = new FormData();
    formData.append("file", audioBlob, "call-full-audio.wav");
    console.log('Final WAV blob size:', audioBlob.size);

    try {
      const response = await fetch("/api/upload-recording", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload aggregated audio");
      }
      const data = await response.json();
      return { url: data?.url || '' };
    } catch (error) {
      console.error("Error saving aggregated audio:", error);
      return { url: '' };
    }
  };

  // Initialize Clients
  const initializeSimliClient = useCallback(() => {
    if (!videoRef.current || !audioRef.current) {
      logError("Simli Initialization", "Video or Audio ref not available");
      return;
    }

    try {
      const SimliConfig = {
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY,
        faceID: avatar.simliFaceId,
        handleSilence: true,
        maxSessionLength: 6000,
        maxIdleTime: 6000,
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true,
        disableAudio: false,
      };

      simliClient.Initialize(SimliConfig);
    } catch (error: any) {
      logError("Simli Initialization", error);
    }
  }, [avatar.simliFaceId]);

  const initializeOpenAIClient = useCallback(async () => {
    try {
      openAIClientRef.current = new RealtimeClient({
        model: avatar.openaiModel,
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowAPIKeyInBrowser: true,
      });

      const prompt = generateFinalPrompt(patient ? patient : {}, avatar, avatar?.personality);
      await openAIClientRef.current.updateSession({
        instructions: prompt,
        voice: avatar.openaiVoice,
        turn_detection: { type: "server_vad" },
        input_audio_transcription: { model: "whisper-1" },
      });

      openAIClientRef.current.on("conversation.updated", handleConversationUpdate);
      openAIClientRef.current.on("conversation.interrupted", interruptConversation);
      openAIClientRef.current.on("input_audio_buffer.speech_stopped", handleSpeechStopped);

      await openAIClientRef.current.connect();
      openAIClientRef.current.createResponse();
      setIsAvatarVisible(true);
    } catch (error: any) {
      logError("OpenAI Initialization", error);
    }
  }, [
    avatar.openaiModel,
    avatar.openaiVoice,
    handleConversationUpdate,
    handleSpeechStopped,
    interruptConversation,
    patient
  ]);

  // Session Management
  const handleStart = async () => {
    setIsLoading(true);
    setIsConnecting(true);
    setError("");

    const startTime = new Date().toISOString();
    setCallMetrics(prev => ({
      ...prev,
      technicalDetails: {
        ...prev.technicalDetails,
        startTime
      }
    }));
    
    const response = await fetch('/api/calls', {
      method: 'POST',
      body: JSON.stringify({
        avatarId: avatar.id,
        status: 'active',
        qualityMetrics: callMetrics.qualityMetrics,
        conversationMetrics: callMetrics.conversationMetrics,
        technicalDetails: {
          ...callMetrics.technicalDetails,
          startTime
        },
        metadata: {
          avatarName: avatar.name,
          avatarModel: avatar.openaiModel,
          avatarVoice: avatar.openaiVoice
        }
      })
    });
    
    const { id } = await response.json();
    setCallId(id);
    try {
      await simliClient?.start();
      const cleanup = eventListenerSimli();
      return () => {
        if (cleanup) cleanup();
      };
    } catch (error: any) {
      logError("Call Start", error);
      setIsConnecting(false);
      setIsLoading(false);
    } finally {
      setIsAvatarVisible(true);
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    setIsLoading(false);
    setError("");
    stopRecording();
    setIsAvatarVisible(false);
    simliClient?.close();
    openAIClientRef.current?.disconnect();

    // Clear audio state
    audioChunkQueueRef.current = [];
    isProcessingChunkRef.current = false;

    if (audioContextRef.current) {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }
    conversationAudioRef.current = [];
  };

  const calculateSpeakingTime = (speaker: 'user' | 'assistant') => {
    return conversationAudioRef.current
      .filter(audio => audio.speaker === speaker)
      .reduce((total, audio) => total + (audio.audio.length / 16000), 0);
  };

  // Error Handling
  const logError = (context: string, error: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    setCallMetrics(prev => ({
      ...prev,
      errorLogs: [
        ...prev.errorLogs,
        {
          timestamp: new Date().toISOString(),
          error: errorMessage,
          context
        }
      ]
    }));
    
    setError(errorMessage);
  };

  // Event Listeners
  const eventListenerSimli = useCallback(() => {
    if (!simliClient) return;

    const onConnected = () => {
      initializeOpenAIClient()
        .then(() => {
          startRecording();
          setIsConnecting(false);
        })
        .catch((error) => {
          console.error("Error in OpenAI initialization:", error);
          setIsConnecting(false);
          setError("Failed to initialize OpenAI client");
        });
    };

    const onDisconnected = () => {
      stopRecording();
      openAIClientRef.current?.disconnect();
      if (audioContextRef.current) {
        audioContextRef.current?.close();
        audioContextRef.current = null;
      }
    };

    simliClient.on("connected", onConnected);
    simliClient.on("disconnected", onDisconnected);

    return () => {
      simliClient.off("connected", onConnected);
      simliClient.off("disconnected", onDisconnected);
    };
  }, [initializeOpenAIClient, startRecording, stopRecording]);

  // Call Controls
  const handleStartCall = () => {
    setIsOpen(true);
    setIsInCall(true);
    handleStart();
  };

  const handleEndCall = async () => {
    const endTime = new Date();
    const startTime = new Date(callMetrics.technicalDetails.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    stopVideoStream();
    setIsOpen(false);
    setIsInCall(false);
    handleStop();

    const audioBlob = await sendAggregatedAudio();
    
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        endedAt: endTime.toISOString(),
        duration,
        recordingUrl: audioBlob?.url,
        qualityMetrics: callMetrics.qualityMetrics,
        conversationMetrics: {
          ...callMetrics.conversationMetrics,
          turnsCount: conversationAudioRef.current.length,
          userSpeakingTime: calculateSpeakingTime('user'),
          avatarSpeakingTime: calculateSpeakingTime('assistant')
        },
        errorLogs: callMetrics.errorLogs
      })
    });
  };

  // Effects
  useEffect(() => {
    checkCameraAvailability();
    return () => stopVideoStream();
  }, []);

  useEffect(() => {
    if (isOpen && hasCamera && isVideoEnabled) {
      startVideoStream();
    }
  }, [isOpen, hasCamera, isVideoEnabled]);

  useEffect(() => {
    if (isOpen && videoRef.current && audioRef.current) {
      initializeSimliClient();
    }
  }, [isOpen, videoRef.current, initializeSimliClient]);

  useEffect(() => {
    const handleConnectionError = () => {
      logError("Network", "Lost connection to server");
    };
  
    window.addEventListener('offline', () => {
      logError("Network", "Device went offline");
    });
  
    return () => {
      window.removeEventListener('offline', () => {
        logError("Network", "Device went offline");
      });
    };
  }, []);

  return (
    <>
      <Button
        onClick={handleStartCall}
        disabled={isLoading}
        className="w-full max-w-sm h-12 font-medium hover:bg-simliblue/90 active:scale-95 
                   flex items-center justify-center gap-2 transition-all duration-200 ease-in-out 
                   rounded-lg shadow-sm hover:shadow-md"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Video className="h-5 w-5" />
        )}
        {isLoading ? 'Connecting...' : 'Start Video Call'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 gap-0 h-[100dvh] max-w-full bg-background dark:bg-gray-900">
          <div ref={containerRef} className="relative w-full h-full bg-gray-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <audio 
                  ref={audioRef} 
                  autoPlay 
                  playsInline
                  className="hidden"
                />
              </div>

              {isConnecting && <RingingAnimation />}

              {isLoading && !isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="h-[20px] animate-loader">Loading...</span>
                </div>
              )}

              {error && (
                <Alert className="absolute bottom-20 left-4 right-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <VideoBox
              hasCamera={hasCamera}
              isVideoEnabled={isVideoEnabled}
              position={position}
              onDragStart={handleDragStart}
              videoRef={userVideoRef}
            />

            <VideoControls
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              hasCamera={hasCamera}
              onVideoToggle={() => {
                if (stream) {
                  stream.getVideoTracks().forEach(track => {
                    track.enabled = !isVideoEnabled;
                  });
                }
                setIsVideoEnabled(!isVideoEnabled);
              }}
              onAudioToggle={() => {
                if (stream) {
                  stream.getAudioTracks().forEach(track => {
                    track.enabled = !isAudioEnabled;
                  });
                }
                setIsAudioEnabled(!isAudioEnabled);
              }}
              onEndCall={handleEndCall}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileVideoChat;