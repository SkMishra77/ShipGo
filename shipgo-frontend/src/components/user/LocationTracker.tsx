import React, {useEffect, useState, useRef} from 'react';
import {GoogleMap, Marker, DirectionsRenderer} from '@react-google-maps/api';
import {languageFontMap} from "next/dist/compiled/@vercel/og/language";

// Haversine formula to calculate distance between two coordinates
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
};

const containerStyle: React.CSSProperties = {
    width: '600px',
    height: '500px',
};

interface LiveLocationDirectionsProps {
    lat: number;
    lng: number;
    origin: [number, number];
    destination: [number, number]
}

const LiveLocationDirections: React.FC<LiveLocationDirectionsProps> = ({lat, lng, origin, destination}) => {
    const [liveLat, setLiveLat] = useState<number | null>(null);
    const [liveLng, setLiveLng] = useState<number | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);


    useEffect(() => {
        console.log({liveLat, liveLng, lat: lat, lng: lng});
        setLiveLat(lat);
        setLiveLng(lng);
        if (liveLat !== null && liveLng !== null) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: new google.maps.LatLng(lat, lng),
                    destination: new google.maps.LatLng(destination[0], destination[1]),
                    waypoints: [
                        {
                            location: {lat: origin[0], lng: origin[1]},
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
    }, [liveLat, liveLng, lat, lng]);

    return (
        <div>
            <GoogleMap
                mapContainerStyle={containerStyle}
                zoom={14}
                center={{lat: liveLat || 0, lng: liveLng || 0}}
                mapTypeId="terrain" // Center the map on the live location
            >
                {liveLat && liveLng && <Marker position={{lat: liveLat, lng: liveLng}} label="Driver Location"/>}
                <Marker position={{lat: origin[0], lng: origin[1]}} label="PickUp"/>
                <Marker position={{lat: destination[0], lng: destination[1]}} label="Destination"/>
                {directions && <DirectionsRenderer directions={directions}/>}
            </GoogleMap>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </div>
    );
};

export default LiveLocationDirections;
