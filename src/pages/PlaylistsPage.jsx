// src/pages/PlaylistPage.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Player from "../components/Player";
import { PlayerContext } from "../context/PlayerContext";
import {
  getPlaylists,
  createPlaylist,
  getPlaylist,
  deletePlaylist,
  removeSongFromPlaylist,
  toggleLike,
} from "../utils/db";
import { PlusCircle, Music2, ArrowLeft, Heart, MoreVertical,Trash2  } from "lucide-react";

const PlaylistPage = () => {
  const { setNewQueue } = useContext(PlayerContext);

  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); // For 3-dot song menu
  const [openPlaylistMenuId, setOpenPlaylistMenuId] = useState(null); // For playlist 3-dot menu

  const menuRefs = useRef({});
  const playlistMenuRefs = useRef({});

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    setLoading(true);
    const all = await getPlaylists();
    setPlaylists(all.reverse());
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setShowCreateModal(false);
      await loadPlaylists();
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  };

  const handleDeletePlaylist = async (id) => {
    if (window.confirm("Delete this playlist?")) {
      await deletePlaylist(id);
      setSelectedPlaylist(null);
      setOpenPlaylistMenuId(null);
      await loadPlaylists();
    }
  };

  const openPlaylist = async (id) => {
    const pl = await getPlaylist(id);
    setSelectedPlaylist(pl);
  };

  const handlePlayAll = () => {
    if (selectedPlaylist?.songs?.length > 0) {
      setNewQueue(selectedPlaylist.songs);
    }
  };

  const handleRemoveSong = async (songId) => {
    if (!selectedPlaylist) return;
    await removeSongFromPlaylist(selectedPlaylist.id, songId);
    setSelectedPlaylist((prev) => ({
      ...prev,
      songs: prev.songs.filter((s) => s.songId !== songId),
    }));
    setOpenMenuId(null);
  };

  const handleToggleLike = async (song) => {
    await toggleLike(song);
    setOpenMenuId(null);
  };

  // Close song menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId].contains(event.target)
      ) {
        setOpenMenuId(null);
      }
      if (
        openPlaylistMenuId &&
        playlistMenuRefs.current[openPlaylistMenuId] &&
        !playlistMenuRefs.current[openPlaylistMenuId].contains(event.target)
      ) {
        setOpenPlaylistMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId, openPlaylistMenuId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-32">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Create Playlist Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg w-80">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                New Playlist
              </h3>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="bg-green-600 px-3 py-1 rounded-md hover:bg-green-500 text-white"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {selectedPlaylist ? (
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
          ) : (
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Playlists
            </h1>
          )}

          {!selectedPlaylist && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center bg-green-600 hover:bg-green-500 px-3 py-1 rounded-md text-white"
            >
              <PlusCircle className="w-5 h-5 mr-1" />
              New
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading playlists...
            </p>
          </div>
        ) : !selectedPlaylist ? (
          // Playlist List View - Grid with first song thumbnail and 3-dot menu
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.length === 0 ? (
              <p className="text-gray-400 text-center col-span-full">
                No playlists created yet.
              </p>
            ) : (
              playlists.map((pl) => {
                const firstSong = pl.songs?.[0];
                return (
                  <div
                    key={pl.id}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow relative"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0"
                      onClick={() => openPlaylist(pl.id)}
                    >
                      {firstSong ? (
                        <img
                          src={firstSong.thumbnail}
                          alt={pl.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <Music2 className="text-white" size={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {pl.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {pl.songs?.length || 0} songs
                        </p>
                      </div>
                    </div>

                    {/* Playlist 3-dot menu */}
                    <div
                      className="relative"
                      ref={(el) => (playlistMenuRefs.current[pl.id] = el)}
                    >
                      <button
                        onClick={() =>
                          setOpenPlaylistMenuId(
                            openPlaylistMenuId === pl.id ? null : pl.id
                          )
                        }
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openPlaylistMenuId === pl.id && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden animate-fade-in z-50">
                          <button
                            onClick={() => handleDeletePlaylist(pl.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-red-500"
                          >
                            <Trash2 size={18} /> Delete Playlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Single Playlist View - Vertical List with 3-dot drawer
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedPlaylist.name}
              </h2>
              {selectedPlaylist.songs?.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/40"
                >
                  Play All
                </button>
              )}
            </div>

            {selectedPlaylist.songs?.length ? (
              <div className="flex flex-col gap-2">
                {selectedPlaylist.songs.map((song) => (
                  <div
                    key={song.songId}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm relative"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                      onClick={() => setNewQueue([song])}
                    >
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {song.title}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    {/* Song 3-dot menu */}
                    <div className="relative" ref={(el) => (menuRefs.current[song.songId] = el)}>
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === song.songId ? null : song.songId)
                        }
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openMenuId === song.songId && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden animate-fade-in z-50">
                          <button
                            onClick={() => handleToggleLike(song)}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Heart size={18} /> Add to Likes
                          </button>
                          <button
                            onClick={() => handleRemoveSong(song.songId)}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-red-500"
                          >
                            <Trash2 size={18} /> Remove from Playlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm mt-4">No songs in this playlist.</p>
            )}
          </div>
        )}
      </div>

      <BottomNav />
      <Player />
    </div>
  );
};

export default PlaylistPage;
