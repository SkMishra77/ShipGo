import React, {PropsWithChildren} from 'react';
import UserSideBar from "@/components/user/UserSideBar";

const Layout = (props: PropsWithChildren) => {

    return (
        <div className={`flex h-screen w-full bg-black`}>
            <div className={`flex flex-col min-w-[200px] p-4`}>
                <UserSideBar />
            </div>
            <div className={`w-full flex p-4 bg-slate-100`}>
               <div className={`bg-white w-full rounded-md p-2`}>
                   {props.children}
               </div>
            </div>
        </div>
    );
};

export default Layout;