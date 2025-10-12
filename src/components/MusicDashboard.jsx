// import React, { useState, useEffect } from "react";
// import { Play, TrendingUp, Clock, Sparkles, User, Settings, LogOut, Info, Home, Search, Heart, Plus, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';

// // Mock data
// const mockSongs = [
//   { songId: 1, title: "Blinding Lights", artist: "The Weeknd", thumbnail: "https://via.placeholder.com/300/8B5CF6/ffffff?text=Song+1" },
//   { songId: 2, title: "Shape of You", artist: "Ed Sheeran", thumbnail: "https://via.placeholder.com/300/EC4899/ffffff?text=Song+2" },
//   { songId: 3, title: "Levitating", artist: "Dua Lipa", thumbnail: "https://via.placeholder.com/300/10B981/ffffff?text=Song+3" },
//   { songId: 4, title: "Starboy", artist: "The Weeknd", thumbnail: "https://via.placeholder.com/300/F59E0B/ffffff?text=Song+4" },
//   { songId: 5, title: "Perfect", artist: "Ed Sheeran", thumbnail: "https://via.placeholder.com/300/3B82F6/ffffff?text=Song+5" },
//   { songId: 6, title: "Don't Start Now", artist: "Dua Lipa", thumbnail: "https://via.placeholder.com/300/EF4444/ffffff?text=Song+6" },
// ];

// const SongCard = ({ song, onPlay }) => (
//   <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer group">
//     <div className="relative mb-3">
//       <img src={song.thumbnail} alt={song.title} className="w-full aspect-square object-cover rounded-md" />
//       <button 
//         onClick={() => onPlay(song)}
//         className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl hover:scale-105"
//       >
//         <Play size={20} fill="currentColor" className="text-white ml-0.5" />
//       </button>
//     </div>
//     <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">{song.title}</h3>
//     <p className="text-gray-400 text-xs line-clamp-1">{song.artist}</p>
//   </div>
// );

// const MusicDashboard = () => {
//   const [currentSong, setCurrentSong] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentPage, setCurrentPage] = useState('/dashboard');
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [expanded, setExpanded] = useState(false);
//   const [shuffle, setShuffle] = useState(false);
//   const [repeat, setRepeat] = useState('off');
//   const [volume, setVolume] = useState(70);
//   const [currentTime, setCurrentTime] = useState(45);
//   const [duration, setDuration] = useState(180);
//   const [showVolume, setShowVolume] = useState(false);

//   const mostPlayed = mockSongs.slice(0, 4);
//   const recentlyPlayed = mockSongs.slice(2, 6);
//   const likedSongs = mockSongs.slice(1, 5);

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return "Good morning";
//     if (hour < 18) return "Good afternoon";
//     return "Good evening";
//   };

//   const formatTime = (s) => {
//     const m = Math.floor(s / 60);
//     const sec = Math.floor(s % 60);
//     return `${m}:${sec.toString().padStart(2, "0")}`;
//   };

//   const handlePlaySong = (song) => {
//     setCurrentSong(song);
//     setIsPlaying(true);
//   };

//   const togglePlayPause = () => setIsPlaying(!isPlaying);

//   const nextSong = () => {
//     const currentIndex = mockSongs.findIndex(s => s.songId === currentSong?.songId);
//     const nextIndex = (currentIndex + 1) % mockSongs.length;
//     setCurrentSong(mockSongs[nextIndex]);
//   };

//   const prevSong = () => {
//     const currentIndex = mockSongs.findIndex(s => s.songId === currentSong?.songId);
//     const prevIndex = (currentIndex - 1 + mockSongs.length) % mockSongs.length;
//     setCurrentSong(mockSongs[prevIndex]);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
//       {/* Navbar */}
//       <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-xl p-4 sticky top-0 z-40 border-b border-gray-700">
//         <div className="flex justify-between items-center max-w-7xl mx-auto">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
//               <span className="text-white font-bold text-xl">S</span>
//             </div>
//             <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
//               SanketMusic
//             </h1>
//           </div>
          
//           <button
//             onClick={() => setDrawerOpen(true)}
//             className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition-all duration-300 border border-gray-600 hover:border-green-500 group"
//           >
//             <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
//               <User size={18} className="text-white" />
//             </div>
//             <span className="text-white text-sm font-medium hidden sm:block group-hover:text-green-400 transition-colors">
//               Music Lover
//             </span>
//           </button>
//         </div>
//       </nav>

//       {/* Drawer */}
//       {drawerOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
//           onClick={() => setDrawerOpen(false)}
//         >
//           <div 
//             className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl transform transition-transform duration-300 border-l border-gray-700"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-8">
//                 <h2 className="text-xl font-bold text-white">Profile</h2>
//                 <button 
//                   onClick={() => setDrawerOpen(false)}
//                   className="text-gray-400 hover:text-white transition-colors"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-700">
//                 <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl mb-4">
//                   <User size={48} className="text-white" />
//                 </div>
//                 <h3 className="text-white font-semibold text-lg">Music Lover</h3>
//                 <p className="text-gray-400 text-sm mt-1">user@example.com</p>
//               </div>

//               <div className="space-y-2">
//                 <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
//                   <Settings size={20} />
//                   <span>Settings</span>
//                 </button>
//                 <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
//                   <Info size={20} />
//                   <span>About</span>
//                 </button>
//                 <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 mt-4">
//                   <LogOut size={20} />
//                   <span>Logout</span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <div className="p-6 space-y-8 max-w-7xl mx-auto pb-32">
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
//             <Sparkles className="text-green-400" size={32} />
//             {getGreeting()}
//           </h1>
//           <p className="text-gray-400 text-lg">Welcome back, Music Lover</p>
//         </div>

//         {/* Most Played */}
//         <section>
//           <div className="flex justify-between items-center mb-5">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
//                 <TrendingUp className="text-white" size={20} />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-white">Most Played</h2>
//                 <p className="text-gray-400 text-sm">Your top tracks</p>
//               </div>
//             </div>
//             <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/30">
//               <Play size={18} fill="currentColor" />
//               Play All
//             </button>
//           </div>
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
//             {mostPlayed.map((song) => (
//               <SongCard key={song.songId} song={song} onPlay={handlePlaySong} />
//             ))}
//           </div>
//         </section>

//         {/* Recently Played */}
//         <section>
//           <div className="flex justify-between items-center mb-5">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
//                 <Clock className="text-white" size={20} />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-white">Recently Played</h2>
//                 <p className="text-gray-400 text-sm">Jump back in</p>
//               </div>
//             </div>
//           </div>
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
//             {recentlyPlayed.map((song) => (
//               <SongCard key={song.songId} song={song} onPlay={handlePlaySong} />
//             ))}
//           </div>
//         </section>

//         {/* Liked Songs */}
//         <section>
//           <div className="flex justify-between items-center mb-5">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
//                 <span className="text-2xl">❤️</span>
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-white">Liked Songs</h2>
//                 <p className="text-gray-400 text-sm">{likedSongs.length} songs</p>
//               </div>
//             </div>
//             <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/30">
//               <Play size={18} fill="currentColor" />
//               Play All
//             </button>
//           </div>
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
//             {likedSongs.map((song) => (
//               <SongCard key={song.songId} song={song} onPlay={handlePlaySong} />
//             ))}
//           </div>
//         </section>
//       </div>

//       {/* Bottom Navigation */}
//       <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-800 border-t border-gray-700 shadow-2xl z-40">
//         <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-4">
//           {[
//             { path: '/dashboard', icon: Home, label: 'Home' },
//             { path: '/search', icon: Search, label: 'Search' },
//             { path: '/liked', icon: Heart, label: 'Liked' },
//             { path: '/create', icon: Plus, label: 'Create' }
//           ].map(({ path, icon: Icon, label }) => {
//             const isActive = currentPage === path;
//             return (
//               <button
//                 key={path}
//                 onClick={() => setCurrentPage(path)}
//                 className="flex flex-col items-center justify-center gap-1 flex-1 group transition-all duration-300"
//               >
//                 <div className={`p-2 rounded-full transition-all duration-300 ${
//                   isActive ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-transparent group-hover:bg-gray-700'
//                 }`}>
//                   <Icon 
//                     size={22} 
//                     className={`transition-colors duration-300 ${
//                       isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
//                     }`}
//                     fill={isActive && label === 'Liked' ? 'currentColor' : 'none'}
//                   />
//                 </div>
//                 <span className={`text-xs font-medium transition-colors duration-300 ${
//                   isActive ? 'text-green-400' : 'text-gray-400 group-hover:text-gray-200'
//                 }`}>
//                   {label}
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       </nav>

//       {/* Mini Player */}
//       {currentSong && !expanded && (
//         <div className="fixed bottom-16 left-0 right-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl z-30">
//           <div className="w-full h-1 bg-gray-700 cursor-pointer group">
//             <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-200" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
//           </div>
//           <div className="p-3 flex items-center justify-between gap-3">
//             <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(true)}>
//               <div className="relative group">
//                 <img src={currentSong.thumbnail} className="w-14 h-14 object-cover rounded-lg shadow-lg" alt={currentSong.title} />
//                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
//                   <ChevronUp className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
//                 </div>
//               </div>
//               <div className="min-w-0 flex-1">
//                 <p className="text-white text-sm font-medium line-clamp-1">{currentSong.title}</p>
//                 <p className="text-gray-400 text-xs line-clamp-1">{currentSong.artist}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <button onClick={prevSong} className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-full">
//                 <SkipBack size={20} fill="currentColor" />
//               </button>
//               <button onClick={togglePlayPause} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-900 transition-all duration-200 hover:scale-105 shadow-lg">
//                 {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
//               </button>
//               <button onClick={nextSong} className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-full">
//                 <SkipForward size={20} fill="currentColor" />
//               </button>
//             </div>
//             <div className="hidden sm:flex items-center gap-2">
//               <button className="text-gray-400 hover:text-green-400 transition-colors p-2 hover:bg-gray-700 rounded-full">
//                 <Heart size={20} />
//               </button>
//               <button onClick={() => setShowVolume(!showVolume)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-full">
//                 {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
//               </button>
//               {showVolume && (
//                 <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-24 h-1 bg-gray-600 rounded-lg cursor-pointer accent-green-500" />
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Full Screen Player */}
//       {currentSong && expanded && (
//         <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 z-50 flex flex-col">
//           <div className="flex justify-between items-center p-6">
//             <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
//               <ChevronDown size={28} />
//             </button>
//             <h2 className="text-white text-sm font-medium uppercase tracking-wider">Now Playing</h2>
//             <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
//               <Heart size={24} />
//             </button>
//           </div>
//           <div className="flex-1 flex items-center justify-center px-8 py-8">
//             <div className="relative max-w-md w-full aspect-square">
//               <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover rounded-2xl shadow-2xl" />
//             </div>
//           </div>
//           <div className="text-center px-8 mb-6">
//             <h1 className="text-white text-2xl font-bold mb-2">{currentSong.title}</h1>
//             <p className="text-gray-400 text-lg">{currentSong.artist}</p>
//           </div>
//           <div className="px-8 mb-2">
//             <div className="w-full h-1.5 bg-gray-700 rounded-full cursor-pointer">
//               <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
//             </div>
//             <div className="flex justify-between text-gray-400 text-xs mt-2">
//               <span>{formatTime(currentTime)}</span>
//               <span>{formatTime(duration)}</span>
//             </div>
//           </div>
//           <div className="flex items-center justify-center gap-8 px-8 mb-6">
//             <button onClick={() => setShuffle(!shuffle)} className={`transition-all p-2 rounded-full ${shuffle ? "text-green-400 bg-green-400/10" : "text-gray-400"}`}>
//               <Shuffle size={22} />
//             </button>
//             <button onClick={prevSong} className="text-gray-300 hover:text-white transition-colors">
//               <SkipBack size={28} fill="currentColor" />
//             </button>
//             <button onClick={togglePlayPause} className="w-16 h-16 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-900 transition-all hover:scale-105 shadow-2xl">
//               {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
//             </button>
//             <button onClick={nextSong} className="text-gray-300 hover:text-white transition-colors">
//               <SkipForward size={28} fill="currentColor" />
//             </button>
//             <button onClick={() => setRepeat(repeat === "all" ? "off" : repeat === "off" ? "one" : "all")} className={`transition-all p-2 rounded-full ${repeat !== "off" ? "text-green-400 bg-green-400/10" : "text-gray-400"}`}>
//               {repeat === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
//             </button>
//           </div>
//           <div className="flex items-center justify-center gap-3 px-8 pb-8">
//             <button onClick={() => setVolume(volume === 0 ? 50 : 0)}>
//               {volume === 0 ? <VolumeX className="text-gray-400" size={20} /> : <Volume2 className="text-gray-400" size={20} />}
//             </button>
//             <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="flex-1 max-w-xs h-1.5 bg-gray-700 rounded-lg cursor-pointer accent-green-500" />
//             <span className="text-gray-400 text-sm w-10 text-right">{volume}</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MusicDashboard;