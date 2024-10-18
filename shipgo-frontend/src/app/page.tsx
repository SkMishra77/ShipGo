"use client";
import React from "react";
import {useRouter} from "next/navigation";


export default function Home() {
    const router = useRouter();
    return (
        <div className={`flex flex-col h-screen w-full justify-center items-center font-semibold text-4xl pt-10`}>
            Welcome to Atlan assignment!
            <div className="flex flex-col justify-center items-center w-full h-full space-y-4">
                <button onClick={() => router.push('/driver')}
                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 ease-in-out">
                    Driver
                </button>
                <button onClick={() => router.push('/user/add/')}
                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 ease-in-out">
                    User
                </button>
            </div>
        </div>
    );
}
