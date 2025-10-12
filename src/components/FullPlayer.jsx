// src/components/FullPlayer.jsx
import React, { useContext, useRef, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';

const FullPlayer = ({ onClose }) => {
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    nextSong,
    prevSong,
    shuffle,
    repeat,
    setShuffle,
    setRepeat,
    volume,
    currentTime,
    duration,
    handleSeek,
    handleVolumeChange,
    queue,
    currentIndex,
  } = useContext(PlayerContext);

  const progressRef = useRef(null);

  if (!currentSong) return null;

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    handleSeek(newTime);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white flex flex-col">
      {/* Close Button */}
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="text-2xl font-bold">✕</button>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src={currentSong.thumbnail}
          alt={currentSong.title}
          className="w-64 h-64 object-cover rounded-xl shadow-lg"
        />
      </div>

      {/* Song Info */}
      <div className="text-center mt-4 px-4">
        <h2 className="text-2xl font-bold line-clamp-1">{currentSong.title}</h2>
        <p className="text-gray-400 text-sm">{currentSong.artist}</p>
      </div>

      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="h-2 bg-gray-700 mx-8 rounded-full mt-4 cursor-pointer"
      >
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        ></div>
      </div>

      <div className="flex justify-between px-8 text-xs text-gray-400 mt-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-6 mt-6">
        <button onClick={() => setShuffle(!shuffle)} className={`${shuffle ? 'text-green-400' : 'text-gray-400'}`}>🔀</button>
        <button onClick={prevSong} className="text-3xl">⏮</button>
        <button
          onClick={togglePlayPause}
          className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-black text-3xl"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={nextSong} className="text-3xl">⏭</button>
        <button
          onClick={() =>
            setRepeat(repeat === 'all' ? 'off' : repeat === 'off' ? 'one' : 'all')
          }
          className={`${repeat !== 'off' ? 'text-green-400' : 'text-gray-400'}`}
        >
          {repeat === 'one' ? '🔂' : '🔁'}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-center gap-2 mt-4 mb-8 px-8">
        <span className="text-gray-400">🔈</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg"
        />
      </div>

      {/* Queue */}
      <div className="px-8 pb-8 overflow-y-auto flex-1">
        <h3 className="text-lg font-semibold mb-2">Queue</h3>
        <ul>
          {queue.map((song, idx) => (
            <li
              key={song.songId}
              className={`p-2 rounded cursor-pointer ${
                idx === currentIndex ? 'bg-green-500/30' : ''
              }`}
              onClick={() => handleSeek(0) || setNewQueue(queue, idx)}
            >
              {song.title} - {song.artist}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FullPlayer;
