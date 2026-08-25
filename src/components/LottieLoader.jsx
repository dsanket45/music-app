import React from "react";
import Lottie from "lottie-react";
import animationData from "../assets/animations/music-loading.json";

const LottieLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <Lottie animationData={animationData} loop={true} className="w-60 h-60" />
      <p className="text-gray-400 text-lg mt-6 font-semibold">
        Loading your vibe 🎶
      </p>
    </div>
  );
};

export default LottieLoader;
