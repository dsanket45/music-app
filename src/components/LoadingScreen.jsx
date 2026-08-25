import React from "react";
import dologo from "../assets/dologo.png";

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <img
        src={dologo}
        alt="Music App Logo"
        className="w-28 h-28 mb-6 animate-bounce"
      />
      <div className="flex space-x-1">
        <div className="w-2 h-6 bg-green-500 animate-pulse delay-100 rounded"></div>
        <div className="w-2 h-8 bg-green-400 animate-pulse delay-200 rounded"></div>
        <div className="w-2 h-10 bg-green-300 animate-pulse delay-300 rounded"></div>
        <div className="w-2 h-8 bg-green-400 animate-pulse delay-400 rounded"></div>
        <div className="w-2 h-6 bg-green-500 animate-pulse delay-500 rounded"></div>
      </div>
      <p className="text-gray-300 text-lg mt-5 font-semibold tracking-wide animate-pulse">
        Loading your music...
      </p>
    </div>
  );
};

export default LoadingScreen;
