import React from 'react';
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
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-8 h-8 text-blue-500" />
        <h3 className="text-2xl font-bold text-[#2D3436]">Additional Resources</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <div key={index} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative overflow-hidden">
              <img 
                src={resource.image}
                alt={resource.title}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={onImageError}
              />
            </div>
            <div className="p-5">
              <h4 className="font-bold text-[#2D3436] text-sm mb-2 line-clamp-2 leading-tight">{resource.title}</h4>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">{resource.description}</p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors"
              >
                <Globe className="w-4 h-4" />
                Read More
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebResources;
