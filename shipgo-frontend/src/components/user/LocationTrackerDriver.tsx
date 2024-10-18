import React, {useEffect, useRef, useState} from 'react';
import {DirectionsRenderer, GoogleMap, Marker} from '@react-google-maps/api';

const containerStyle: React.CSSProperties = {
    width: '600px',
    height: '500px',
};

interface LiveLocationDirectionsProps {
    destinationLat: number;
    destinationLng: number;
    sendMessage: any;
    BookingId: string;
    UserId: string,
    originLat: number;
    originLng: number;
}

const LiveLocationDirections: React.FC<LiveLocationDirectionsProps> = ({
                                                                           destinationLat,
                                                                           destinationLng,
                                                                           sendMessage,
                                                                           BookingId,
                                                                           UserId,
                                                                           originLat,
                                                                           originLng
                                                                       }) => {
    const [liveLat, setLiveLat] = useState<number | null>(null);
    const [liveLng, setLiveLng] = useState<number | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    useEffect(() => {
        // Request permission and get current location
        const getCurrentLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLiveLat(position.coords.latitude);
                        setLiveLng(position.coords.longitude);
                        sendMessage({
                            "BookingId": BookingId,
                            "lat": position.coords.latitude,
                            "lng": position.coords.longitude,
                            "action": "trip-update",
                            "UserId": UserId,
                            "origin": [originLat, originLng],
                            "destination": [destinationLat, destinationLng]
                        })
                    },
                    (error) => {
                        setError('Unable to retrieve your location. Please check your settings.');
                        console.error(error);
                    }
                );
            } else {
                setError('Geolocation is not supported by this browser.');
            }
        };

        let time = setInterval(() => {
            getCurrentLocation();
        }, 2000)

        return () => {
            clearInterval(time)
        }
    }, []);

    useEffect(() => {
        console.log({liveLat, liveLng, destinationLat, destinationLng});

        if (liveLat !== null && liveLng !== null) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: new google.maps.LatLng(liveLat, liveLng),
                    destination: new google.maps.LatLng(destinationLat, destinationLng),
                    waypoints: [
                        {
                            location: {lat: originLat, lng: originLng},
                            stopover: true,
                        },
                    ],
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        setDirections(result);
                        setError(null);
                    } else {
                        setError(`Error fetching directions: ${status}`);
                    }
                }
            );
        }
    }, [liveLat, liveLng]);

    return (
        <div>
            <GoogleMap
                mapContainerStyle={containerStyle}
                zoom={14}
                center={{lat: liveLat || 0, lng: liveLng || 0}}
                mapTypeId="terrain" // Center the map on the live location
            >
                {liveLat && liveLng && <Marker position={{lat: liveLat, lng: liveLng}} label="Live Location"/>}
                <Marker position={{lat: originLat, lng: originLng}} label="PickUp"/>
                <Marker position={{lat: destinationLat, lng: destinationLng}} label="Delivery"/>
                {directions && <DirectionsRenderer directions={directions}/>}
            </GoogleMap>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </div>
    );
};

export default LiveLocationDirections;
