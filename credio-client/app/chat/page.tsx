'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { useUserChatSessions, useCreateChatSession, useDeleteChatSession } from '@/lib/hooks/use-chat'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ChatPageContent() {
    const searchParams = useSearchParams()
    const disasterId = searchParams.get('disaster')

    const { data: sessions, isLoading } = useUserChatSessions()
    const createSession = useCreateChatSession()
    const deleteSession = useDeleteChatSession()

    const [activeSessionId, setActiveSessionId] = useState<string>('new')

    const handleNewChat = () => {
        createSession.mutate(undefined, {
            onSuccess: (response) => {
                setActiveSessionId(response.data.session.id)
            },
        })
    }

    const handleDeleteSession = (sessionId: string) => {
        deleteSession.mutate(sessionId, {
            onSuccess: () => {
                if (activeSessionId === sessionId) {
                    setActiveSessionId('new')
                }
            },
        })
    }

    return (
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 h-[calc(100vh-180px)]">
            {/* Sidebar */}
            <Card className="hidden lg:block">
                <CardContent className="p-4">
                    <Button className="w-full mb-4" onClick={handleNewChat}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Chat
                    </Button>

                    <ScrollArea className="h-[calc(100vh-280px)]">
                        <div className="space-y-2">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
                            ) : sessions && sessions.length > 0 ? (
                                sessions.map((session: any) => (
                                    <div
                                        key={session.id}
                                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${activeSessionId === session.id
                                            ? 'bg-primary/10 border-primary'
                                            : 'hover:bg-muted'
                                            }`}
                                        onClick={() => setActiveSessionId(session.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {session.title || 'Untitled Chat'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {session.preview}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteSession(session.id)
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-sm">No chat history</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Chat Interface */}
            <ChatInterface sessionId={activeSessionId} />
        </div>
    )
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Skeleton className="h-[600px] w-full" /></div>}>
            <ChatPageContent />
        </Suspense>
    )
}
