import React, { useEffect, useState } from "react";
import { Smartphone, Download, CheckCircle, ShieldCheck, X, Sparkles, ExternalLink } from "lucide-react";

const InstallPrompt = () => {
  const [showBanner, setShowBanner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check if running inside Capacitor Native App
    const checkNative = () => {
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        setIsNative(true);
        setShowBanner(false);
      }
    };
    checkNative();

    // Hide banner if user previously dismissed banner during session
    const dismissed = sessionStorage.getItem("apkPromptDismissed");
    if (dismissed === "true") {
      setShowBanner(false);
    }
  }, []);

  const handleDownloadAPK = () => {
    setIsDownloading(true);
    // Trigger direct APK download with cache-busting timestamp and attachment header
    const apkUrl = `${window.location.origin}/music-app.apk?v=${Date.now()}`;
    const link = document.createElement("a");
    link.href = apkUrl;
    link.setAttribute("download", "D-Music-App.apk");
    link.setAttribute("target", "_self");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 2500);
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("apkPromptDismissed", "true");
  };

  if (isNative) return null;

  return (
    <>
      {/* Floating Light Install Banner */}
      {showBanner && !showModal && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] w-full sm:max-w-lg animate-bounce-short">
          <div className="bg-white/95 backdrop-blur-xl text-slate-900 px-4 py-3 sm:px-5 sm:py-3.5 rounded-3xl shadow-2xl border border-emerald-200/80 flex items-center justify-between gap-3 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Smartphone className="w-5 h-5 animate-pulse text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">Install Native Android App</span>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300/50">
                    Background Songs 🎵
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Plays songs with screen locked & in background!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md transition-all duration-200 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap active:scale-95"
              >
                <Download className="w-4 h-4" />
                Install
              </button>
              <button
                onClick={handleCloseBanner}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Light APK Install Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header background accents */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20 text-white">
                <Smartphone className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
                Download Native Android App
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Zero Play Store fees • 100% Free • Screen Lock Background Songs
              </p>
            </div>

            {/* Features list */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-5 space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2 text-slate-700 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Plays music continuously when screen is OFF or app is minimized</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Lock screen notification player controls</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Direct APK installer — No store payment required</span>
              </div>
            </div>

            {/* 3 Step Installation Guide */}
            <div className="mb-6 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Easy 3-Step Setup</h4>
              <div className="flex items-start gap-3 text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  1
                </span>
                <span>Tap <strong>Download APK</strong> below to download file directly.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  2
                </span>
                <span>Open downloaded <strong className="text-slate-800">D-Music-App.apk</strong> & tap <strong>Install</strong> (Allow <em>Unknown Sources</em> if prompted).</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  3
                </span>
                <span>Launch <strong>D Music</strong> app and enjoy non-stop background songs!</span>
              </div>
            </div>

            {/* Download Button */}
            <div className="space-y-2">
              <button
                onClick={handleDownloadAPK}
                disabled={isDownloading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 active:scale-98"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Downloading APK...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Android APK (Native App)
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Continue in Browser Web Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;