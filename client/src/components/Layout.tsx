

import Navbar from "./Narbars";
import { Outlet } from "react-router";
import styles from "./styles/Layout.module.css";
import { useState } from "react";
import Chat from "./Chat";

function Layout (){
    const [showChat, setShowChat] = useState(false);
    return(
        <div className={styles.layoutContainer}>
            {!showChat && <Navbar onOpenChat={() => setShowChat(true)} />}
            <main className={styles.mainContent}>
                <Outlet />
            </main>
            {showChat && <Chat onClose={() => setShowChat(false)} />}
        </div>
    );
}

export default Layout;