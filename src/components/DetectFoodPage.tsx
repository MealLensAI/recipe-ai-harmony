"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import "../styles/detect-food.css"

interface FoodItem {
  name: string
  confidence: number
  description: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  category: string
}


const DetectFoodPage: React.FC = () => {
  const [inputType, setInputType] = useState<'image' | 'ingredient_list'>('image');
  const [ingredientList, setIngredientList] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelectFile(file);
  };

  // File select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelectFile(file);
  };
  const handleImageSelectFile = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Trigger file input
  const triggerFileInput = () => fileInputRef.current?.click();

  // Submit to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setResults(null);
    try {
      const formData = new FormData();
      formData.append('image_or_ingredient_list', inputType);
      if (inputType === 'ingredient_list') {
        formData.append('ingredient_list', ingredientList);
      } else {
        if (!selectedImage) {
          setError('Please select an image to upload.');
          setIsLoading(false);
          return;
        }
        formData.append('image', selectedImage);
      }
      const response = await fetch('https://ai-utu2.onrender.com/food_detect', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to detect food.');
      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Error detecting food.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="detect-food-container">
      <div className="container mx-auto px-4">
        <Link to="/" className="back-button">← Back to Home</Link>
        <div className="detect-header">
          <h1 className="detect-title">📸 Food Detection AI</h1>
          <p className="detect-subtitle">
            Upload a photo of any dish and our AI will identify it, providing detailed nutritional information and insights about your food.
          </p>
        </div>

        {/* Upload Section */}
        <form className="upload-section" onSubmit={handleSubmit}>
          <div
            className={`upload-area ${dragOver ? 'dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerFileInput}
          >
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              {imagePreview ? 'Image selected! Click to change' : 'Drop your food image here or click to browse'}
            </div>
            <div className="upload-subtext">Supports JPG, PNG, GIF up to 10MB</div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="file-input" />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview || "/placeholder.svg"} alt="Selected food" className="preview-image" />
              <button type="submit" disabled={isLoading} className="analyze-button">
                {isLoading ? 'Analyzing...' : '🔍 Analyze Food'}
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </form>

        {/* Results Section */}
        {results && (
          <div className="results-section">
            <h2 className="results-title">🍽️ Detection Results</h2>
            <div className="space-y-6">
              {results.food_detected && results.food_detected.length > 0 && results.food_detected.map((food: string, idx: number) => (
                <div key={idx} className="food-item">
                  <h3 className="food-name">{food}</h3>
                </div>
              ))}
              {results.instructions && (
                <div className="cooking-instructions">
                  <h3>Cooking Instructions</h3>
                  <div className="instructions-text" dangerouslySetInnerHTML={{ __html: results.instructions }} />
                </div>
              )}
              {/* Youtube/Google resources if available */}
              {(results.YoutubeSearch || results.GoogleSearch) && (
                <div className="resource-section">
                  <h3>Online Resources</h3>
                  <div className="resources-grid">
                    {results.YoutubeSearch && results.YoutubeSearch.map((yt: any, i: number) => (
                      <a key={i} href={yt.url} target="_blank" rel="noopener" className="resource-link">{yt.title}</a>
                    ))}
                    {results.GoogleSearch && results.GoogleSearch.map((g: any, i: number) => (
                      <a key={i} href={g.url} target="_blank" rel="noopener" className="resource-link">{g.title}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-8 space-x-4">
          <Link to="/ai-response" className="cta-button bg-blue-500 hover:bg-blue-600">🥗 Try Ingredient Detection</Link>
          <Link to="/" className="cta-button bg-purple-500 hover:bg-purple-600">🏠 Home</Link>
          <Link to="/meal-planner" className="cta-button bg-orange-500 hover:bg-orange-600">📅 Plan Your Meals</Link>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="text-gray-600">Analyzing your food image...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectFoodPage;
