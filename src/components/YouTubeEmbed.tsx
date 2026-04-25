'use client';

import React from 'react';

interface YouTubeEmbedProps {
  url: string;
}

export default function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  // Extract video ID from various YouTube URL formats
  const getID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getID(url);

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300">
        <p className="text-gray-400 text-sm">Invalid Video URL</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl group ring-1 ring-white/10">
      <iframe
        className="absolute top-0 left-0 w-full h-full border-0"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      <div className="absolute inset-0 pointer-events-none group-hover:bg-black/5 transition-colors duration-500"></div>
    </div>
  );
}
