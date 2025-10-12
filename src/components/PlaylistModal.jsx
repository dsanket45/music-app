// src/components/PlaylistModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { getPlaylists, createPlaylist, addSongToPlaylist } from '../utils/db';

const PlaylistModal = ({ song, onClose }) => {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToPlaylists, setAddedToPlaylists] = useState([]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    const allPlaylists = await getPlaylists();
    setPlaylists(allPlaylists);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = await createPlaylist(newPlaylistName.trim());
    await addSongToPlaylist(newPlaylist.id, song);
    
    setAddedToPlaylists([...addedToPlaylists, newPlaylist.id]);
    setNewPlaylistName('');
    setShowCreateNew(false);
    loadPlaylists();

    setTimeout(() => {
      setAddedToPlaylists(prev => prev.filter(id => id !== newPlaylist.id));
    }, 2000);
  };

  const handleAddToPlaylist = async (playlistId) => {
    await addSongToPlaylist(playlistId, song);
    setAddedToPlaylists([...addedToPlaylists, playlistId]);
    
    setTimeout(() => {
      setAddedToPlaylists(prev => prev.filter(id => id !== playlistId));
    }, 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add to Playlist</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{song.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-6">
          {/* Create New Playlist */}
          {!showCreateNew ? (
            <button
              onClick={() => setShowCreateNew(true)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30 mb-4"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <p className="font-semibold">Create New Playlist</p>
                <p className="text-sm text-white/80">Start a fresh collection</p>
              </div>
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateNew(false);
                    setNewPlaylistName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Playlists */}
          <div className="space-y-2">
            {playlists.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Music className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No playlists yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first playlist above</p>
              </div>
            ) : (
              playlists.map((playlist) => {
                const isAdded = addedToPlaylists.includes(playlist.id);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => !isAdded && handleAddToPlaylist(playlist.id)}
                    disabled={isAdded}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                      isAdded
                        ? 'bg-green-50 dark:bg-green-500/10 border-2 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isAdded 
                        ? 'bg-green-500' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                    }`}>
                      {isAdded ? (
                        <Check className="text-white" size={24} />
                      ) : (
                        <Music className="text-white" size={24} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">{playlist.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {playlist.songs?.length || 0} songs
                      </p>
                    </div>
                    {isAdded && (
                      <span className="text-green-500 text-sm font-medium">Added!</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistModal;