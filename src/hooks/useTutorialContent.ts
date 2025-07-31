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
  const [loadingResources, setLoadingResources] = useState(false);

  // Helper to extract YouTube video ID from a URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : null;
  };

  const generateContent = async (recipeName: string, ingredients?: string[]) => {
    setLoading(true);
    setInstructions('');
    setYoutubeVideos([]);
    setWebResources([]);
    
    try {
      console.log('[useTutorialContent] Generating content for:', { recipeName, ingredients });
      
      // 1. Get cooking instructions first
      const instrRes = await fetch('https://ai-utu2.onrender.com/meal_plan_instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          food_name: recipeName,
          ingredients: ingredients || []
        }),
      });
      
      if (!instrRes.ok) {
        throw new Error(`HTTP error! status: ${instrRes.status}`);
      }
      
      const instrData = await instrRes.json();
      console.log('[useTutorialContent] Instructions API response:', instrData);
      
      // The API returns markdown, so convert to HTML (same as the HTML code)
      let htmlInstructions = instrData.instructions || '';
      htmlInstructions = htmlInstructions
        .replace(/\*\*(.*?)\*\*/g, '<br><strong>$1</strong><br>')
        .replace(/\*\s*(.*?)\s*\*/g, '<p>$1</p>')
        .replace(/(\d+\.)/g, '<br>$1');
      setInstructions(htmlInstructions);

      // Instructions are loaded, now start loading resources
      setLoading(false);
      setLoadingResources(true);

      // 2. Get resources (YouTube and Google) using the correct form data
      const formData = new FormData();
      formData.append('food_choice_index', recipeName);
      const resRes = await fetch('https://ai-utu2.onrender.com/resources', {
        method: 'POST',
        body: formData,
      });
      
      if (!resRes.ok) {
        throw new Error(`HTTP error! status: ${resRes.status}`);
      }
      
      const resData = await resRes.json();
      console.log('[useTutorialContent] Resources API response:', resData);

      // Flatten and parse YouTube resources (same as HTML code)
      const ytResults = (resData.YoutubeSearch || []).flat().map((item: any) => ({
        title: item.title,
        thumbnail: item.thumbnail || (getYouTubeVideoId(item.link) ? `https://img.youtube.com/vi/${getYouTubeVideoId(item.link)}/maxresdefault.jpg` : ''),
        url: item.link,
        videoId: getYouTubeVideoId(item.link),
        channel: item.channel || '',
      }));
      setYoutubeVideos(ytResults);

      // Flatten and parse Google resources (same as HTML code)
      const googleResults = (resData.GoogleSearch || []).flat().map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.link,
        image: item.image || '',
      }));
      setWebResources(googleResults);
      
    } catch (error) {
      console.error('[useTutorialContent] Error generating content:', error);
      setInstructions('Failed to load instructions. Please try again.');
      setYoutubeVideos([]);
      setWebResources([]);
    } finally {
      setLoading(false);
      setLoadingResources(false);
    }
  };

  return {
    instructions,
    youtubeVideos,
    webResources,
    loading,
    loadingResources,
    generateContent
  };
};
