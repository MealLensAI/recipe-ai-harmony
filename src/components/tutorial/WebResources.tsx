
import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink } from 'lucide-react';

interface WebResource {
  title: string;
  description: string;
  url: string;
  image?: string;
}

interface WebResourcesProps {
  resources: WebResource[];
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const WebResources: React.FC<WebResourcesProps> = ({ resources, onImageError }) => {
  // Local state to cache fetched images
  const [images, setImages] = useState<{ [key: number]: string }>({});
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    setImages({});
    setLoadingImages({});
  }, [resources]);

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

  return (
    <div className="space-y-6">
      {resources.map((resource, index) => {
        const hasImage = resource.image && resource.image.length > 0;
        const imgSrc = hasImage ? resource.image : images[index];
        const isLoading = loadingImages[index];
        useEffect(() => {
          if (!hasImage && !images[index] && !isLoading) {
            fetchOgImage(resource.url, index);
          }
          // eslint-disable-next-line
        }, [hasImage, images, isLoading, resource.url, index]);
        return (
          <div key={index} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative overflow-hidden">
              {isLoading ? (
                <div className="w-full h-44 flex items-center justify-center bg-gray-100 animate-pulse">
                  <span className="text-gray-400">Loading image...</span>
                </div>
              ) : imgSrc ? (
                <img 
                  src={imgSrc}
                  alt={resource.title}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={onImageError}
                />
              ) : (
                <div className="w-full h-44 flex items-center justify-center bg-gray-100">
                  <span className="text-gray-300">No image</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight">{resource.title}</h4>
              <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed">{resource.description}</p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:from-blue-400 hover:to-blue-500 transition-colors"
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
  );
};

export default WebResources;
