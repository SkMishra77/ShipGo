'use client'

import React from 'react';
import {usePathname} from "next/navigation";
import Link from "next/link";

const UserSideBar = () => {
    let pathname = usePathname()
    return (

        <div className={`flex flex-col gap-3`}>
            <div className={`bg-cyan-600 text-5xl font-mono text-center`}>
                GoShip
            </div>
            <Link className={`${pathname.includes('/user/add') ? 'bg-sky-100' : ''} hover:bg-sky-200 px-2 py-1  rounded-md`}
                  href={'/user/add'}>Add</Link>
        </div>
    );
};

export default UserSideBar;