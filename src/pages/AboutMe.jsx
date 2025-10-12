// src/pages/AboutMe.jsx
import React from 'react';
import { XCircle, Github, Linkedin, Twitter } from 'lucide-react';
import sanket1 from '../assets/sanket1.jpg'; // your personal image
import dslogo from '../assets/dslogo.png';   // logo image

const AboutMe = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-80 h-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl border-l border-gray-700 p-6 overflow-y-auto transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">About Me</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Personal Image */}
        <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-700">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl mb-3">
            <img src={sanket1} alt="Sanket" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-white font-semibold text-lg">Sanket</h3>
          <p className="text-gray-400 text-sm mt-1">Full Stack Developer</p>
        </div>

        {/* Bio / Portfolio */}
        <div className="space-y-4 text-gray-300 mb-6">
          <p>
            Hi! I’m Sanket, a passionate full-stack developer focused on building **efficient and scalable web applications**. I enjoy turning complex problems into clean, user-friendly solutions.
          </p>
          <p>
            I have worked on **React, Node.js, Java, Spring Boot, and MongoDB**, creating interactive front-end interfaces and robust back-end systems.
          </p>
          <p>
            Over the years, I have developed multiple projects, including music apps, dashboards, and APIs, improving performance and user experience. You can check some of my work at <span className="text-green-400 hover:text-green-300 cursor-pointer" onClick={() => window.open('https://dsanket.netlify.app', '_blank')}>dsanket.netlify.app</span>.
          </p>
          <p>
            Outside coding, I explore **open-source projects, emerging tech trends, and community contributions** to stay updated.
          </p>
        </div>

        {/* Social Links */}
        <div className="mt-4 flex flex-col gap-2">
          <a
            href="https://github.com/sanket"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <Github size={18} /> GitHub
          </a>
          <a
            href="https://linkedin.com/in/sanket"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <Linkedin size={18} /> LinkedIn
          </a>
          <a
            href="https://twitter.com/sanket"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <Twitter size={18} /> Twitter
          </a>
        </div>

        {/* Logo at bottom */}
        <div className="mt-8 flex justify-center">
          <img src={dslogo} alt="Logo" className="w-16 h-16 object-contain rounded-full shadow-md" />
        </div>
      </div>
    </div>
  );
};

export default AboutMe;
