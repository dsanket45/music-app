// src/pages/AboutPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 font-medium flex items-center gap-1 text-sm sm:text-base transition-colors"
        aria-label="Close"
      >
        ← Close
      </button>

      <div className="z-10">
        <h1 className="text-3xl font-bold mb-4 text-green-500">About D Music</h1>
        <p className="max-w-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
          D Music is a modern web-based music player built with React. 
          It lets users explore trending songs, create playlists, and enjoy 
          a beautiful audio experience. The project is crafted by Sanket — a passionate 
          fullstack developer — to bring simplicity and speed to online music.
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} D Music. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;