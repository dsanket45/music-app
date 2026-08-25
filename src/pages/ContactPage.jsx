// src/pages/ContactPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ContactPage = () => {
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
        <h1 className="text-3xl font-bold mb-4 text-green-500">Contact Us</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Have feedback, found a bug, or want to collaborate?
        </p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          📧 Email us at{" "}
          <a
            href="mailto:dsanket373@gmail.com"
            className="text-green-500 underline hover:text-green-400 dark:hover:text-green-300"
          >
            dsanket373@gmail.com
          </a>
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          We'll do our best to respond within 24–48 hours.
        </p>
      </div>
    </div>
  );
};

export default ContactPage;