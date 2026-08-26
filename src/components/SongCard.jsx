// src/components/SongCard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { toggleLike, getLikedSongs } from '../utils/db';
import { Play, Pause, Heart } from 'lucide-react';

const SongCard = ({ song }) => {
  const { setNewQueue, currentSong, isPlaying, togglePlayPause } = useContext(PlayerContext);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkLiked = async () => {
      const liked = await getLikedSongs();
      if (mounted) {
        setIsLiked(liked.some(s => s.songId === song.songId || s.id === song.id));
      }
    };
    checkLiked();
    return () => { mounted = false; };
  }, [song.songId, song.id]);

  const isCurrentSong = (currentSong?.songId && (currentSong.songId === song.songId || currentSong.id === song.id)) ||
                        (currentSong?.title && currentSong.title === song.title);

  const handleCardClick = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else {
      setNewQueue([song], 0);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    const liked = await toggleLike(song);
    setIsLiked(liked);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#181818] hover:bg-[#282828] p-3.5 rounded-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Artwork Container */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-[#282828] mb-3 shadow-md">
        <img
          src={song.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop'}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop';
          }}
        />

        {/* Floating Spotify Green Play Button */}
        <div
          className={`absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#1DB954] hover:bg-[#1ED760] hover:scale-105 flex items-center justify-center shadow-xl transition-all duration-300 transform ${
            isCurrentSong && isPlaying
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          {isCurrentSong && isPlaying ? (
            <Pause size={20} fill="#000000" className="text-black" />
          ) : (
            <Play size={20} fill="#000000" className="text-black ml-0.5" />
          )}
        </div>

        {/* Top-Right Heart / Like Button */}
        <button
          onClick={handleLike}
          aria-label={isLiked ? "Unlike" : "Like"}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all duration-200 ${
            isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart
            size={16}
            className={`transition-colors ${
              isLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'text-white/80 hover:text-white'
            }`}
          />
        </button>
      </div>

      {/* Song Info */}
      <div className="flex flex-col">
        <h3
          className={`text-sm font-bold truncate mb-1 transition-colors ${
            isCurrentSong ? 'text-[#1DB954]' : 'text-white group-hover:text-white'
          }`}
        >
          {song.title}
        </h3>
        <p className="text-xs text-[#B3B3B3] truncate font-medium">
          {song.artist}
        </p>
      </div>
    </div>
  );
};

export default SongCard;