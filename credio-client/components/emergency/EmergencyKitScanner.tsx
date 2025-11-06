'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface DetectedObject {
    name: string;
    confidence: number;
    bbox?: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
}

interface ChecklistItem {
    name: string;
    checked: boolean;
}

interface EmergencyKitScannerProps {
    disasterType: string;
}

export default function EmergencyKitScanner({ disasterType }: EmergencyKitScannerProps) {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize checklist when disaster type changes
    useEffect(() => {
        const fetchDisasterItems = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/detect-kit-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: 'data:image/jpeg;base64,',
                        disasterType
                    })
                });
                const itemsData = await response.json();

                if (itemsData.requiredItems) {
                    setChecklist(itemsData.requiredItems.map((item: string) => ({
                        name: item,
                        checked: false
                    })));
                }
            } catch (err) {
                console.error('Failed to fetch disaster items:', err);
            }
        };

        fetchDisasterItems();
    }, [disasterType]);

    const startCamera = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1280, height: 720 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            setError('Failed to access camera. Please grant camera permissions.');
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsCameraActive(false);
        setIsDetecting(false);
        setDetectedObjects([]);
    };

    const captureImage = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.6);
    }, []);

    const detectObjects = useCallback(async () => {
        const imageData = captureImage();
        if (!imageData) return;

        try {
            const response = await fetch('http://localhost:5000/api/detect-kit-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageData,
                    disasterType: disasterType
                })
            });

            if (!response.ok) return;

            const data = await response.json();
            console.log('API Response:', data);

            // Update detected objects from API
            if (data.detectedObjects && Array.isArray(data.detectedObjects)) {
                const detected: DetectedObject[] = data.detectedObjects.map((item: any) => ({
                    name: item.name,
                    confidence: item.confidence,
                    bbox: item.bbox
                }));

                console.log('Detected objects:', detected);
                setDetectedObjects(detected);
            } else {
                setDetectedObjects([]);
            }
        } catch (err) {
            console.error('Detection error:', err);
        }
    }, [captureImage, disasterType]);

    const startDetection = () => {
        setIsDetecting(true);
        setError(null);

        // Run detection every 1.5 seconds
        detectionIntervalRef.current = setInterval(() => {
            detectObjects();
        }, 1500);
    };

    const stopDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        setIsDetecting(false);
        setDetectedObjects([]);
    };

    // Draw overlays on video
    useEffect(() => {
        if (!overlayCanvasRef.current || !videoRef.current || !isDetecting) return;

        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const drawOverlay = () => {
            if (!video.videoWidth || !video.videoHeight) {
                animationId = requestAnimationFrame(drawOverlay);
                return;
            }

            // Set canvas size to match video
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw detected objects with bounding boxes
            if (detectedObjects.length > 0) {
                detectedObjects.forEach((obj) => {
                    if (obj.bbox) {
                        const { x1, y1, x2, y2 } = obj.bbox;

                        // Calculate scale factors (canvas size vs original image size)
                        const scaleX = canvas.width / video.videoWidth;
                        const scaleY = canvas.height / video.videoHeight;

                        // Scale bounding box coordinates
                        const scaledX1 = x1 * scaleX;
                        const scaledY1 = y1 * scaleY;
                        const scaledX2 = x2 * scaleX;
                        const scaledY2 = y2 * scaleY;
                        const width = scaledX2 - scaledX1;
                        const height = scaledY2 - scaledY1;

                        // Draw bounding box
                        ctx.strokeStyle = 'rgba(34, 197, 94, 1)';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(scaledX1, scaledY1, width, height);

                        // Draw label background
                        ctx.font = 'bold 16px sans-serif';
                        const text = `${obj.name}: ${(obj.confidence * 100).toFixed(0)}%`;
                        const textMetrics = ctx.measureText(text);
                        const padding = 8;

                        ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
                        ctx.fillRect(
                            scaledX1,
                            scaledY1 - 30,
                            textMetrics.width + padding * 2,
                            28
                        );

                        // Draw label text
                        ctx.fillStyle = 'white';
                        ctx.fillText(text, scaledX1 + padding, scaledY1 - 8);
                    }
                });
            }

            animationId = requestAnimationFrame(drawOverlay);
        };

        // Start drawing loop
        animationId = requestAnimationFrame(drawOverlay);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [detectedObjects, isDetecting]);

    const toggleChecklistItem = (index: number) => {
        setChecklist(prev => prev.map((item, i) =>
            i === index ? { ...item, checked: !item.checked } : item
        ));
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const isItemDetected = (itemName: string) => {
        return detectedObjects.some(obj =>
            obj.name.toLowerCase() === itemName.toLowerCase()
        );
    };

    const checkedCount = checklist.filter(item => item.checked).length;
    const totalCount = checklist.length;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        <CardTitle>Emergency Kit Scanner</CardTitle>
                        <CardDescription>
                            Live detection for {disasterType} preparedness
                        </CardDescription>
                    </div>
                    {isDetecting && (
                        <Badge variant="destructive" className="animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full mr-2" />
                            LIVE
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <canvas
                            ref={overlayCanvasRef}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {!isCameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Button onClick={startCamera} size="lg">
                                    <Camera className="mr-2 h-5 w-5" />
                                    Start Camera
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {isCameraActive && (
                            <>
                                {!isDetecting ? (
                                    <Button
                                        onClick={startDetection}
                                        className="flex-1"
                                    >
                                        <Search className="mr-2 h-4 w-4" />
                                        Start Live Detection
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={stopDetection}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Stop Detection
                                    </Button>
                                )}
                                <Button onClick={stopCamera} variant="outline">
                                    Stop Camera
                                </Button>
                            </>
                        )}
                    </div>

                    {isDetecting && detectedObjects.length > 0 && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Currently detecting {detectedObjects.length} item{detectedObjects.length !== 1 ? 's' : ''}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {checklist.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Emergency Kit Checklist</CardTitle>
                        <CardDescription>
                            {checkedCount} of {totalCount} items checked
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {checklist.map((item, index) => {
                                const detected = isItemDetected(item.name);
                                const detectedObj = detectedObjects.find(obj =>
                                    obj.name.toLowerCase() === item.name.toLowerCase()
                                );

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${detected && !item.checked
                                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                                            : item.checked
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={item.checked}
                                                onCheckedChange={() => toggleChecklistItem(index)}
                                            />
                                            <span className={`font-medium capitalize ${item.checked ? 'line-through text-gray-500' : ''}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {detected && detectedObj && (
                                                <Badge variant="secondary">
                                                    {(detectedObj.confidence * 100).toFixed(0)}%
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
