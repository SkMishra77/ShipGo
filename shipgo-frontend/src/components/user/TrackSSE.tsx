'use client'

import React from 'react';
import useSSE from "../../../hooks/useSSE";
import {LoadScript} from "@react-google-maps/api";
import {Library} from "@googlemaps/js-api-loader";
import LocationTracker from "@/components/user/LocationTracker";


const libraries: Library[] = ['places']; // Load the Places library

interface LiveLocationData {
    lat: number;
    lng: number;
    origin: [number, number];
    destination: [number, number]
}

const TrackSse = ({id}:{id:string}) => {
    const { data, error, isConnected } = useSSE(`http://localhost:8081/subscribe/${id}`);
    const someData = data ? (data as unknown as LiveLocationData) : null;
    // @ts-ignore
    return (
        <div className={`w-full h-full flex justify-center items-center`}>
            {someData ? (
                <LoadScript
                    googleMapsApiKey="AIzaSyCo4gjkCg54Vnk-94q2U2zsmHXQjuH3tXE"
                    libraries={libraries}
                >
              <LocationTracker lat={someData?.lat} lng={someData?.lng} origin={someData?.origin} destination={someData?.destination} />
                </LoadScript>
            ) : (
                <p>Waiting for location updates...</p>
                )
            }
        </div>
    );
};

export default TrackSse;