import React, { useContext, useState, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { toggleLike, getLikedSongs } from '../utils/db';
import { Play, Heart } from 'lucide-react';

const SongCard = ({ song }) => {
  const { setNewQueue, currentSong, isPlaying } = useContext(PlayerContext);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  useEffect(() => {
    const checkLiked = async () => {
      const liked = await getLikedSongs();
      setIsLiked(liked.some(s => s.songId === song.songId));
    };
    checkLiked();
  }, [song.songId]);

  const handlePlay = () => {
    setNewQueue([song], 0);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    setLikeAnimation(true);
    const liked = await toggleLike(song);
    setIsLiked(liked);
    setTimeout(() => setLikeAnimation(false), 600);
  };

  const isActive = currentSong?.songId === song.songId && isPlaying;

  return (
    <div
      onClick={handlePlay}
      className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer ${
        isActive 
          ? 'ring-2 ring-green-500 shadow-green-500/30' 
          : 'hover:scale-105'
      }`}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={song.thumbnail || 'https://via.placeholder.com/300/10B981/ffffff?text=Music'}
          alt={song.title}
          className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300/10B981/ffffff?text=No+Image';
          }}
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play size={24} fill="white" className="text-white ml-1" />
          </div>
        </div>

        {/* Active Playing Animation */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 to-transparent flex items-center justify-center">
            <div className="flex gap-1 items-end h-8">
              <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0ms' }}></div>
              <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '80%', animationDelay: '150ms' }}></div>
              <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '300ms' }}></div>
              <div className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: '90%', animationDelay: '450ms' }}></div>
            </div>
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`absolute top-2 right-2 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 z-10 ${
            isLiked 
              ? 'bg-red-500 shadow-lg shadow-red-500/50' 
              : 'bg-black/30 hover:bg-black/50'
          } ${likeAnimation ? 'scale-125' : 'scale-100'}`}
          aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          title={isLiked ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            size={20} 
            className={`transition-all duration-300 ${
              isLiked ? 'text-white fill-white' : 'text-white'
            }`}
          />
        </button>
      </div>

      <div className="mt-3">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
          {song.title}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
          {song.artist}
        </p>
        {song.duration && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {song.duration}
          </p>
        )}
      </div>
    </div>
  );
};

export default SongCard;