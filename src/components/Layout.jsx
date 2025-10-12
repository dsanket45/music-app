import React from "react";
import Navbar from "./Navbar";
import Player from "./Player";

const Layout = ({ children, hidePlayerOn = [] }) => {
  const path = window.location.pathname;

  const hidePlayer = hidePlayerOn.includes(path); // login/settings pages

  return (
    <div className="min-h-screen relative pb-28">
      <Navbar />
      <div>{children}</div>
      {!hidePlayer && <Player />}
    </div>
  );
};

export default Layout;
