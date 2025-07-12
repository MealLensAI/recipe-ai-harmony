import { useState } from 'react';

interface VideoResource {
  title: string;
  thumbnail: string;
  url: string;
  videoId?: string;
  channel?: string;
}

interface WebResource {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export const useTutorialContent = () => {
  const [instructions, setInstructions] = useState('');
  const [youtubeVideos, setYoutubeVideos] = useState<VideoResource[]>([]);
  const [webResources, setWebResources] = useState<WebResource[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to extract YouTube video ID from a URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : null;
  };

  const generateContent = async (recipeName: string) => {
    setLoading(true);
    setInstructions('');
    setYoutubeVideos([]);
    setWebResources([]);
    try {
      // 1. Get instructions and detected foods
      const instrRes = await fetch('https://ai-utu2.onrender.com/food_detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: recipeName }),
      });
      const instrData = await instrRes.json();
      // The API returns markdown, so convert to HTML (simple replace for demo)
      let htmlInstructions = instrData.instructions || '';
      htmlInstructions = htmlInstructions
        .replace(/\*\*(.*?)\*\*/g, '<br><strong>$1</strong><br>')
        .replace(/\*\s*(.*?)\s*\*/g, '<p>$1</p>')
        .replace(/(\d+\.)/g, '<br>$1');
      setInstructions(htmlInstructions);

      // 2. Get resources (YouTube and Google)
      let detectedFoods = instrData.food_detected || [recipeName];
      const resRes = await fetch('https://ai-utu2.onrender.com/food_detect_resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_detected: detectedFoods }),
      });
      const resData = await resRes.json();

      // Flatten and parse YouTube resources
      const ytResults = (resData.YoutubeSearch || []).flat().map((item: any) => ({
        title: item.title,
        thumbnail: item.thumbnail || (getYouTubeVideoId(item.link) ? `https://img.youtube.com/vi/${getYouTubeVideoId(item.link)}/maxresdefault.jpg` : ''),
        url: item.link,
        videoId: getYouTubeVideoId(item.link),
        channel: item.channel || '',
      }));
      setYoutubeVideos(ytResults);

      // Flatten and parse Google resources
      const googleResults = (resData.GoogleSearch || []).flat().map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.link,
        image: item.image || '',
      }));
      setWebResources(googleResults);
    } catch (error) {
      console.error('Error generating content:', error);
      setInstructions('Failed to load instructions.');
      setYoutubeVideos([]);
      setWebResources([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    instructions,
    youtubeVideos,
    webResources,
    loading,
    generateContent
  };
};
