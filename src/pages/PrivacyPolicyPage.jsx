// src/pages/PrivacyPolicyPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-center p-6 relative">
      {/* Close Button - Top Left */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 font-medium flex items-center gap-1 text-sm sm:text-base transition-colors"
        aria-label="Close"
      >
        ← Close
      </button>

      <div className="z-10">
        <h1 className="text-3xl font-bold mb-4 text-green-500">Privacy Policy</h1>
        <p className="max-w-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
          D Music respects your privacy. We do not collect personal data without your consent. 
          Third-party services like Google AdSense may use cookies to serve ads based on your interests. 
          By using our site, you agree to our use of cookies in accordance with Google’s policies.
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          This page was last updated on {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;