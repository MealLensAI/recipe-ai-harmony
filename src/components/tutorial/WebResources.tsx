
import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { NetflixLoadingBar } from './LoadingSpinner';

interface WebResource {
  title: string;
  description: string;
  url: string;
  image?: string;
}

interface WebResourcesProps {
  resources: WebResource[];
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  loading?: boolean;
}

const WebResources: React.FC<WebResourcesProps> = ({ resources, onImageError, loading = false }) => {
  // Local state to cache fetched images
  const [images, setImages] = useState<{ [key: number]: string }>({});
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});

  const fetchOgImage = async (url: string, index: number) => {
    setLoadingImages((prev) => ({ ...prev, [index]: true }));
    try {
      // Use a CORS proxy to fetch the HTML (since most sites block direct fetches)
      const proxyUrl = 'https://corsproxy.io/?';
      const response = await fetch(proxyUrl + encodeURIComponent(url));
      if (!response.ok) throw new Error('Failed to fetch HTML');
      const html = await response.text();
      // Parse the HTML for og:image or twitter:image
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      const twitterImageMatch = html.match(/<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']twitter:image["']/i);
      let imageUrl = '';
      if (ogImageMatch && ogImageMatch[1]) {
        imageUrl = ogImageMatch[1];
      } else if (twitterImageMatch && twitterImageMatch[1]) {
        imageUrl = twitterImageMatch[1];
      }
      setImages((prev) => ({ ...prev, [index]: imageUrl }));
    } catch (e) {
      setImages((prev) => ({ ...prev, [index]: '' }));
    } finally {
      setLoadingImages((prev) => ({ ...prev, [index]: false }));
    }
  };

  // Handle image fetching for all resources
  useEffect(() => {
    setImages({});
    setLoadingImages({});
    
    // Fetch images for resources that don't have them
    resources.forEach((resource, index) => {
      const hasImage = resource.image && resource.image.length > 0;
      if (!hasImage && !images[index] && !loadingImages[index]) {
        fetchOgImage(resource.url, index);
      }
    });
  }, [resources]);

  return (
    <div className="bg-gradient-to-br from-white/95 to-white/80 rounded-3xl border border-gray-100 overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-[#2D3436]">Additional Resources</h3>
        </div>
        
        {loading ? (
          <div className="space-y-6">
            <NetflixLoadingBar />
            <p className="text-gray-500 text-center text-lg">Loading articles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource, index) => {
              const hasImage = resource.image && resource.image.length > 0;
              const imgSrc = hasImage ? resource.image : images[index];
              const isLoading = loadingImages[index];
              
              return (
                <div key={index} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="relative overflow-hidden">
                    {isLoading ? (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-100 animate-pulse">
                        <span className="text-gray-400">Loading image...</span>
                      </div>
                    ) : imgSrc ? (
                      <img 
                        src={imgSrc}
                        alt={resource.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={onImageError}
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                        <span className="text-gray-300">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-[#2D3436] text-lg mb-2 line-clamp-2 leading-tight">{resource.title}</h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3 leading-relaxed">{resource.description}</p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg hover:from-blue-400 hover:to-blue-500 transition-all duration-300 hover:shadow-xl"
                    >
                      <Globe className="w-4 h-4" />
                      Read More
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebResources;
