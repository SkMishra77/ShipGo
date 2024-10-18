import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketHook {
    isConnected: boolean;
    message: string | object | null;
    sendMessage: (msg: object) => void;
    disconnect: () => void;
}

export default function useWebSocket(url: string): WebSocketHook {

    const [isConnected, setIsConnected] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // Function to send a message
    const sendMessage = useCallback((msg: object) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify(msg));
        }
    }, [isConnected]);

    // Function to close the connection
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
        }
    }, []);

    useEffect(() => {
        // Initialize WebSocket
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        };

        socket.onmessage = (event) => {
            try{
                setMessage(JSON.parse(event.data));
            }catch (e){
                setMessage(event.data);
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        };

        socket.onerror = (error) => {
            console.error('WebSocket error', error);
        };

        // Cleanup on component unmount
        return () => {
            socket.close();
        };
    }, [url]);

    return { isConnected, message, sendMessage, disconnect };
}
