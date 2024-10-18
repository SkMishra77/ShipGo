'use client'

import React, {useEffect, useState} from 'react';
import useWebSocket from "../../hooks/useWebSocket";
import LocationTracker from "@/components/user/LocationTrackerDriver";


const DriverHome = () => {
    const {isConnected, message, sendMessage} = useWebSocket('ws://127.0.0.1:8000/ws?driverId=D103');
    const [dataArr, setDataArr] = useState([]);
    const [locationNames, setLocationNames] = useState({});
    const [acceptedOrder, setAcceptedOrder] = useState(null);
    const apiKey = 'AIzaSyCo4gjkCg54Vnk-94q2U2zsmHXQjuH3tXE';

    useEffect(() => {
        if (message && typeof message === 'object' && message.action) {
            if (message.action === 'booking-notify') {
                setDataArr(prev => [...prev, message]);
                const {origin, destination} = message; // Assuming message contains origin and destination arrays
                getLocationNames(origin, destination, message.BookingId);
            }

            if (message.action === 'trip-start') {
                setAcceptedOrder(message);
            }

        }
    }, [message]);

    const getLocationNames = (origin, destination, bookingId) => {
        const geocoder = new window.google.maps.Geocoder();

        const getAddress = (latLng) => {
            return new Promise((resolve, reject) => {
                geocoder.geocode({location: latLng}, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0].formatted_address);
                    } else {
                        reject('Geocoder failed due to: ' + status);
                    }
                });
            });
        };

        Promise.all([
            getAddress({lat: origin[0], lng: origin[1]}),
            getAddress({lat: destination[0], lng: destination[1]}),
        ])
            .then(([originName, destinationName]) => {
                setLocationNames(prev => ({
                    ...prev,
                    [bookingId]: {origin: originName, destination: destinationName},
                }));
            })
            .catch(error => {
                console.error(error);
            });
    };

    useEffect(() => {
        const loadScript = (src) => {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                document.body.appendChild(script);
            });
        };

        loadScript(`https://maps.googleapis.com/maps/api/js?key=${apiKey}`);
    }, [apiKey]);

    const handleAccept = (bookingId) => {
        const order = dataArr.find(item => item.BookingId === bookingId);
        order.action = 'booking-accept'
        sendMessage(order)
    };

    const handleReject = (bookingId) => {
        setDataArr(prev => prev.filter(item => item.BookingId !== bookingId));
        setLocationNames(prev => {
            const newState = {...prev};
            delete newState[bookingId]; // Remove the location names for the rejected order
            return newState;
        });
        if (acceptedOrder && acceptedOrder.BookingId === bookingId) {
            setAcceptedOrder(null); // Clear accepted order if it was rejected
        }
    };

    useEffect(() => {

        const getCurrentLocation = () => {
            if (isConnected) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const obj = {
                                "action": "location_update",
                                "lat": position.coords.latitude,
                                "lng": position.coords.longitude
                            }
                            console.log(obj)
                            sendMessage(obj)
                        },
                        (error) => {
                            console.error(error);
                        }
                    );
                } else {
                    console.error('Geolocation is not supported by this browser.');
                }
            }
        };

        let time = setInterval(() => {
            getCurrentLocation();
        }, 5000)

        return () => {
            clearInterval(time)
        }
    }, [isConnected]);

    if (dataArr.length === 0) {
        return (
            <div className={`flex justify-center items-center w-full h-full text-2xl font-semibold`}>
                There are no current orders
            </div>
        )
    }

    return (
        <div className={`flex flex-col gap-4 p-4 w-full`}>
            {acceptedOrder ? (
                <div className={`flex flex-row justify-center items-center w-full h-full`}>
                    <LocationTracker
                        destinationLat={acceptedOrder.destination[0]}
                        destinationLng={acceptedOrder.destination[1]}
                        sendMessage={sendMessage}
                        BookingId={acceptedOrder.BookingId}
                        UserId={acceptedOrder.UserId}
                        originLat={acceptedOrder.origin[0]}
                        originLng={acceptedOrder.origin[1]}

                    />
                    <div className="flex flex-col justify-center items-center w-full h-full space-y-4">
                        <button
                            className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 ease-in-out">
                            PickedUp
                        </button>
                        <button
                            className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 ease-in-out">
                            Completed
                        </button>
                    </div>
                </div>
            ) : (
                dataArr.map((item, index) => (
                    <div key={index} className={`border p-4 rounded-md`}>
                        <div>Booking ID: {item.BookingId}</div>
                        {locationNames[item.BookingId] && (
                            <>
                                <div>Origin: {locationNames[item.BookingId].origin}</div>
                                <div>Destination: {locationNames[item.BookingId].destination}</div>
                            </>
                        )}
                        <div className={`flex gap-4`}>
                            <button className={`bg-red-500 bg-opacity-10 text-red-500 px-2 rounded-md`}
                                    onClick={() => handleAccept(item.BookingId)}>Accept
                            </button>
                            <button className={`bg-green-500 bg-opacity-10 text-green-500 px-2 rounded-md`}
                                    onClick={() => handleReject(item.BookingId)}>Reject
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default DriverHome;
