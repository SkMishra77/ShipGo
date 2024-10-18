'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react';
import PlaceOrderMaps from "@/components/user/PlaceOrderMaps";
import {Autocomplete, LoadScript} from "@react-google-maps/api";
import {Library} from "@googlemaps/js-api-loader";
import useWebSocket from "../../../../hooks/useWebSocket";
import {useRouter} from "next/navigation";

const libraries: Library[] = ['places']; // Load the Places library

const Page = () => {

    const router = useRouter();


    const [autocomplete1, setAutocomplete1] = useState<google.maps.places.Autocomplete | null>(null);
    const [autocomplete2, setAutocomplete2] = useState<google.maps.places.Autocomplete | null>(null);
    const [sourceAddress, setSourceAddress] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [consignmentWeight, setConsignmentWeight] = useState('')
    const inputRef1 = useRef<HTMLInputElement>(null);
    const inputRef2 = useRef<HTMLInputElement>(null);

    const {isConnected, sendMessage, message} = useWebSocket('ws://localhost:8081/ws/booking?UserId=U100');

    const onLoad1 = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete1(autocompleteInstance);
    };

    const onLoad2 = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete2(autocompleteInstance);
    };

    const onPlaceChanged1 = useCallback(() => {
        if (autocomplete1) {
            const place = autocomplete1.getPlace();
            if (place && place.formatted_address) {
                setSourceAddress(place.formatted_address);
                console.log('Selected Source Place:', place);
            }
        }
    }, [autocomplete1]);

    const handlePlace = () => {
        if (!autocomplete1 || !autocomplete1.getPlace()) return
        if (!autocomplete2 || !autocomplete2.getPlace()) return
        console.log('hello')

        // @ts-ignore
        const sourceObj = autocomplete1.getPlace()?.geometry.location
        // @ts-ignore
        const destObj = autocomplete2.getPlace()?.geometry.location

        sendMessage({
            "action": "booking",
            "origin": [sourceObj?.lat(), sourceObj?.lng()],
            "destination": [destObj?.lat(), destObj?.lng()],
            "Logistics_load": consignmentWeight
        })
    }

    useEffect(() => {
        console.log(message)
        if (message && typeof message === 'object' && 'BookingId' in message) {
            router.push(`/user/track/${message.BookingId}`)
        }
    }, [message]);

    const onPlaceChanged2 = useCallback(() => {
        if (autocomplete2) {
            const place = autocomplete2.getPlace();
            if (place && place.formatted_address) {
                setDestinationAddress(place.formatted_address);
                console.log('Selected Destination Place:', place);
            }
        }
    }, [autocomplete2]);

    return (
        <div className={`flex w-full h-full flex-row-reverse justify-center items-center gap-3`}>
            <LoadScript
                googleMapsApiKey="AIzaSyCo4gjkCg54Vnk-94q2U2zsmHXQjuH3tXE" // Replace with your API key
                libraries={libraries}
            >
                <div className={`flex flex-col p-4 h-1/2 w-1/2 justify-around items-center`}>
                    <Autocomplete
                        onLoad={onLoad1}
                        onPlaceChanged={onPlaceChanged1}
                    >
                        <input
                            type="text"
                            placeholder="Enter source"
                            ref={inputRef1}
                            style={{
                                width: '500px',
                                height: '40px',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </Autocomplete>
                    <Autocomplete
                        onLoad={onLoad2}
                        onPlaceChanged={onPlaceChanged2}
                    >
                        <input
                            type="text"
                            placeholder="Enter destination"
                            ref={inputRef2}
                            style={{
                                width: '500px',
                                height: '40px',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </Autocomplete>

                    <input
                        type="number"
                        placeholder="Enter Consignment Weight in Kgs"
                        onChange={(e) => {
                            setConsignmentWeight(e.target.value);
                        }}
                        style={{
                            width: '500px',
                            height: '40px',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                    <select id="vehicle" name="vehicle" style={{
                        width: '500px',
                        height: '40px',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}>
                        <option value="Truck">Truck</option>
                    </select>
                    {
                        sourceAddress && destinationAddress && consignmentWeight && (
                            <div className={`bg-sky-200 p-1 px-4 rounded-md w-[100px] items-center`}>
                                <button className={`text-center w-full`} onClick={handlePlace}>Place</button>
                            </div>
                        )
                    }
                </div>
                <PlaceOrderMaps
                    source={sourceAddress}
                    destination={destinationAddress}
                    consignmentWeight={consignmentWeight}
                />
            </LoadScript>
        </div>
    );
};

export default Page;
