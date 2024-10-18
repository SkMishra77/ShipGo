import React from 'react';
import TrackSse from "@/components/user/TrackSSE";

const Page = (props:{params:{id:string}}) => {
    return (
        <div className={`flex w-full h-full`}>
            <TrackSse id={props.params.id} />
        </div>
    );
};

export default Page;