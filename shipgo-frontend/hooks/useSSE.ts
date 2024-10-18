// hooks/useSSE.ts
import { useEffect, useState } from 'react';

const useSSE = (url: string) => {
    const [data, setData] = useState<any[]>();
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const eventSource = new EventSource(url);
        eventSource.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                console.log(parsedData)
                setData(parsedData); // Append new data
            } catch (err) {
                setError('Error parsing data');
            }
        };

        eventSource.onerror = (event) => {
            setError('Error connecting to server');
            eventSource.close();
        };
        setIsConnected(true);
        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, [url]);

    return { data, error, isConnected };
};

export default useSSE;
