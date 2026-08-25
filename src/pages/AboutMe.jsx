// src/pages/AboutMe.jsx
import React from "react";
import {
  XCircle,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Code2,
  Zap,
  Globe,
} from "lucide-react";
import sanket1 from "../assets/sanket1.jpg"; // your photo
import dslogo from "../assets/dslogo.png"; // logo
import { useNavigate } from "react-router-dom";

// Tech stack data
const techStack = [
  "React",
  "Spring Boot",
  "Java",
  "Node.js",
  "MongoDB",
  "REST APIs",
  "PostgreSQL",
  "TailwindCSS",
  "Vercel",
];

// Reusable Social Link Component
const SocialLink = ({ icon, name, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 group text-gray-300 hover:text-green-400 transition-all"
  >
    <div className="p-2 rounded-full bg-gray-800 border border-gray-700 group-hover:bg-green-500 group-hover:text-black transition-all">
      {icon}
    </div>
    <span className="text-sm font-medium">{name}</span>
  </a>
);

// Main AboutMe Modal Component
const AboutMe = ({ onClose }) => {
  const navigate = useNavigate(); // ✅ Hook used INSIDE component

  // Handle close: you can choose either onClose() or navigate(-1)
  const handleClose = () => {
    if (onClose) {
      onClose(); // Preferred for modals — just closes overlay
    } else {
      navigate(-1); // Fallback: go back in history
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex justify-end"
      onClick={handleClose}
    >
      <div
        className="w-96 h-full bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0f172a] shadow-2xl border-l border-gray-700 p-6 overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (X) */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <XCircle size={26} />
        </button>

        {/* Profile Section */}
        <div className="text-center mt-6 mb-8">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <img
              src={sanket1}
              alt="Sanket"
              className="rounded-full w-full h-full object-cover shadow-[0_0_25px_rgba(16,185,129,0.4)] border-2 border-green-500"
            />
            <div className="absolute inset-0 rounded-full border-2 border-green-400/50 animate-pulse"></div>
          </div>

          <h2 className="text-white text-2xl font-bold tracking-wide">
            Sanket
          </h2>
          <p className="text-green-400 font-medium mt-1">
            Software Engineer
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Creator of this entire Music App 🎶
          </p>
        </div>

        {/* Bio */}
        <div className="text-gray-300 space-y-4 mb-8 leading-relaxed text-sm">
          <p>
            I'm a passionate developer who built this app from scratch — from
            design to deployment — with ❤️, React, and Spring Boot.
          </p>
          <p>
            I focus on building <span className="text-green-400 font-semibold">scalable</span> &
            <span className="text-green-400 font-semibold"> performance-driven</span> products that blend
            creativity with clean architecture.
          </p>
          <p>
            My expertise includes <strong>frontend engineering</strong> with
            React & Tailwind, and <strong>backend mastery</strong> using Spring
            Boot, Java, and modern database design.
          </p>
          <p>
            Explore my portfolio at{" "}
            <span
              className="text-green-400 hover:text-green-300 cursor-pointer underline"
              onClick={() => window.open("https://dsanket.netlify.app", "_blank")}
            >
              dsanket.netlify.app
            </span>
            .
          </p>
        </div>

        {/* Tech Stack */}
        <div className="mb-8">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
            <Code2 className="text-green-400" size={18} />
            Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-green-400 hover:bg-green-500 hover:text-black transition-all"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-10">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
            <Globe className="text-green-400" size={18} />
            Connect With Me
          </h3>
          <div className="flex flex-col gap-3">
            <SocialLink
              icon={<Github size={18} />}
              name="GitHub"
              url="https://github.com/dsanket45"
            />
            <SocialLink
              icon={<Linkedin size={18} />}
              name="LinkedIn"
              url="https://www.linkedin.com/in/d-sanket-39b735246/"
            />
            <SocialLink
              icon={<Twitter size={18} />}
              name="Twitter"
              url="https://x.com/D__Sanket"
            />
            <SocialLink
              icon={<Instagram size={18} />}
              name="Instagram"
              url="https://www.instagram.com/thenameissanket_/"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 pt-6 flex flex-col items-center">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Zap className="text-green-400" size={14} />
            <span>Built & Designed by Sanket</span>
          </div>
          <img
            src={dslogo}
            alt="Logo"
            className="w-14 h-14 object-contain mt-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          />
          <span className="text-[11px] text-gray-500 mt-2">
            © {new Date().getFullYear()} Sanket Dev Labs
          </span>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;