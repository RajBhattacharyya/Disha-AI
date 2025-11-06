'use client';

import { useState } from 'react';
import { Waves, Home, Wind, Flame, CloudRain } from 'lucide-react';
import EmergencyKitScanner from '@/components/emergency/EmergencyKitScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DISASTER_TYPES = [
    {
        id: 'tsunami',
        name: 'Tsunami',
        icon: Waves,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Prepare for coastal flooding and waves'
    },
    {
        id: 'earthquake',
        name: 'Earthquake',
        icon: Home,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        description: 'Prepare for ground shaking and structural damage'
    },
    {
        id: 'hurricane',
        name: 'Hurricane',
        icon: Wind,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        description: 'Prepare for strong winds and heavy rain'
    },
    {
        id: 'wildfire',
        name: 'Wildfire',
        icon: Flame,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Prepare for fire and smoke evacuation'
    },
    {
        id: 'flood',
        name: 'Flood',
        icon: CloudRain,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        description: 'Prepare for water damage and evacuation'
    }
];

export default function EmergencyKitPage() {
    const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Emergency Kit Finder</h1>
                <p className="text-muted-foreground">
                    Select a disaster type and scan your emergency kit to ensure you're prepared
                </p>
            </div>

            {!selectedDisaster ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DISASTER_TYPES.map((disaster) => {
                        const Icon = disaster.icon;
                        return (
                            <Card
                                key={disaster.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => setSelectedDisaster(disaster.id)}
                            >
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg ${disaster.bgColor} flex items-center justify-center mb-2`}>
                                        <Icon className={`h-6 w-6 ${disaster.color}`} />
                                    </div>
                                    <CardTitle>{disaster.name}</CardTitle>
                                    <CardDescription>{disaster.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" variant="outline">
                                        Select & Scan
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-4">
                    <Button
                        onClick={() => setSelectedDisaster(null)}
                        variant="outline"
                        className="mb-4"
                    >
                        ← Back to Disaster Types
                    </Button>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {(() => {
                                    const disaster = DISASTER_TYPES.find(d => d.id === selectedDisaster);
                                    if (!disaster) return null;
                                    const Icon = disaster.icon;
                                    return (
                                        <>
                                            <div className={`w-10 h-10 rounded-lg ${disaster.bgColor} flex items-center justify-center`}>
                                                <Icon className={`h-5 w-5 ${disaster.color}`} />
                                            </div>
                                            {disaster.name} Preparedness
                                        </>
                                    );
                                })()}
                            </CardTitle>
                            <CardDescription>
                                {DISASTER_TYPES.find(d => d.id === selectedDisaster)?.description}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <EmergencyKitScanner disasterType={selectedDisaster} />
                </div>
            )}
        </div>
    );
}
