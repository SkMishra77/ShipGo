import React, {useEffect, useRef, useState} from 'react';
import {DirectionsRenderer, GoogleMap, Marker} from '@react-google-maps/api';

const containerStyle = {
    width: '600px',
    height: '500px',
};

const PlaceOrderMaps = ({source, destination, consignmentWeight}) => {
    const [directions, setDirections] = useState(null);
    const [error, setError] = useState(null);
    const mapRef = useRef(null);

    // Directions Service for getting route
    const getDirections = async (origin, dest) => {
        const directionsService = new google.maps.DirectionsService();
        return new Promise((resolve, reject) => {
            directionsService.route(
                {
                    origin,
                    destination: dest,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        resolve(result);
                    } else {
                        reject(`Error fetching directions: ${status}`);
                    }
                }
            );
        });
    };

    useEffect(() => {
        const fetchDirections = async () => {
            if (source && destination) {
                try {
                    const directionsResult = await getDirections(source, destination);
                    setDirections(directionsResult);
                    setError(null);
                } catch (error) {
                    setDirections(null);
                    setError(error);
                }
            }
        };
        fetchDirections();
    }, [source, destination]);


    if (!source || !destination || !consignmentWeight) {
        return <div>Please provide source, destination addresses, weight.</div>;
    }

    return (
        <div>
            <GoogleMap
                mapContainerStyle={containerStyle}
                zoom={10}
                onLoad={(map) => (mapRef.current = map)}
            >
                {/* Render directions if available */}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{preserveViewport: true}}
                    />
                )}
                {/* Optional: Add markers for source and destination */}
                {directions && (
                    <>
                        <Marker
                            position={{
                                lat: directions.routes[0].legs[0].start_location.lat(),
                                lng: directions.routes[0].legs[0].start_location.lng(),
                            }}
                            label="Source"
                        />
                        <Marker
                            position={{
                                lat: directions.routes[0].legs[0].end_location.lat(),
                                lng: directions.routes[0].legs[0].end_location.lng(),
                            }}
                            label="Destination"
                        />
                    </>
                )}
            </GoogleMap>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </div>
    );
};

export default PlaceOrderMaps;
