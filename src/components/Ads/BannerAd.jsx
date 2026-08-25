// src/components/Ads/BannerAd.jsx
import { useEffect } from "react";

const BannerAd = () => {
  useEffect(() => {
    try {
      // Check if the script already exists
      if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
        const script = document.createElement("script");
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        script.async = true;
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);
      }

      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.log("Ad script failed", e);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
         style={{ display: "block", width: "100%", height: "90px" }}
         data-ad-client="ca-pub-2286575716043591" // replace with your actual client ID
         data-ad-slot="1234567890"               // replace with your ad slot ID
         data-ad-format="auto"></ins>
  );
};

export default BannerAd;
