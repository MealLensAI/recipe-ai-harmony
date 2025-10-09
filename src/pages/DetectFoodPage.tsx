"use client"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Utensils } from "lucide-react"
import { useAuth } from "@/lib/utils"
import { APP_CONFIG } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import LoadingSpinner from "@/components/LoadingSpinner"

const DetectFoodPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [instructions, setInstructions] = useState<string>("")
  const [detectedFoods, setDetectedFoods] = useState<string[]>([])
  const [resources, setResources] = useState<any>(null)
  const [loadingResources, setLoadingResources] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { toast } = useToast()
  const { token, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg mx-auto">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
            <p className="text-gray-600">
              Please log in to use the food detection feature and save your detections to history.
            </p>
            <Button
              onClick={() => navigate('/landing')}
              className="w-full py-3 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSubmit = async () => {
    if (!selectedImage) return

    setIsLoading(true)
    setInstructions("")
    setDetectedFoods([])
    setResources(null)
    setShowResults(false)
    const formData = new FormData()
    formData.append("image", selectedImage)

    try {
      const response = await fetch("http://34.170.200.225:7017/food_detect", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      console.log("[DetectFood] /food_detect response:", data)

      if (data.error) {
        toast({
          title: "Error",
          description: data.error || "Failed to detect food.",
          variant: "destructive",
        })
        return
      }

      // Format instructions like in the HTML version
      let formattedInstructions = data.instructions || ""

      // Apply the same formatting as in the HTML
      formattedInstructions = formattedInstructions.replace(/\*\*(.*?)\*\*/g, '<br><strong>$1</strong><br>')
      formattedInstructions = formattedInstructions.replace(/\*\s*(.*?)\s*\*/g, '<p>$1</p>')
      formattedInstructions = formattedInstructions.replace(/(\d+\.)/g, '<br>$1')

      setInstructions(formattedInstructions)
      setDetectedFoods(data.food_detected || [])
      console.log("[DetectFood] Detected foods:", data.food_detected)

      // Show results immediately after detection
      setShowResults(true)

      // Save to detection history
      if (token && data.food_detected && data.instructions) {
        const payload = {
          recipe_type: "food_detection",
          suggestion: data.food_detected.join(", "),
          instructions: data.instructions,
          ingredients: JSON.stringify(data.food_detected || []),
          detected_foods: JSON.stringify(data.food_detected || []),
          analysis_id: data.analysis_id || "",
          youtube: "",
          google: "",
          resources: "{}"
        };

        try {
          await fetch(`${APP_CONFIG.api.base_url}/api/food_detection/detection_history`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload)
          });
          console.log("[DetectFood] Saved to detection history");
        } catch (historyError) {
          console.error("[DetectFood] Error saving to history:", historyError);
        }
      }

      // Fetch resources automatically when instructions are displayed
      if (data.food_detected && data.food_detected.length > 0) {
        setLoadingResources(true)
        try {
          console.log("[DetectFood] Fetching resources for:", data.food_detected)
          const resResponse = await fetch("http://34.170.200.225:7017/food_detect_resources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ food_detected: data.food_detected }),
          })

          console.log("[DetectFood] Resources response status:", resResponse.status)

          if (!resResponse.ok) {
            console.error("[DetectFood] Resources response not ok:", resResponse.status, resResponse.statusText)
            toast({
              title: "Resources Error",
              description: "Failed to fetch cooking resources, but food detection completed.",
              variant: "destructive",
            })
            setResources(null)
          } else {
            const resData = await resResponse.json()
            console.log("[DetectFood] Resources data received:", resData)
            setResources(resData)

            // Update history with resources
            if (token && data.analysis_id) {
              const updatePayload = {
                food_analysis_id: data.analysis_id,
                youtube_link: resData?.YoutubeSearch?.[0]?.link || "",
                google_link: resData?.GoogleSearch?.[0]?.link || "",
                resources_link: JSON.stringify(resData || {})
              };

              try {
                await fetch(`${APP_CONFIG.api.base_url}/api/food_detection/food_detect_resources`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(updatePayload)
                });
                console.log("[DetectFood] Updated history with resources");
              } catch (updateError) {
                console.error("[DetectFood] Error updating history with resources:", updateError);
              }
            }
          }
        } catch (resourceError) {
          console.error("[DetectFood] Error fetching resources:", resourceError)
          toast({
            title: "Resources Error",
            description: "Failed to fetch cooking resources, but food detection completed.",
            variant: "destructive",
          })
          setResources(null)
        } finally {
          setLoadingResources(false)
        }
      } else {
        console.warn("[DetectFood] No detected foods, skipping resources fetch.")
      }
    } catch (error) {
      console.error("[DetectFood] Error detecting food:", error)
      toast({
        title: "Error",
        description: "Failed to detect food. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getYouTubeVideoId = (url: string) => {
    if (!url) {
      console.error('Invalid URL:', url);
      return null;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div
      className="min-h-screen p-8 text-[#2D3436] leading-[1.6]"
      style={{
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        background: "url('https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat fixed",
        padding: "2rem 1rem"
      }}
    >
      <style>{`
        @keyframes loading-slide {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>

      <div className="max-w-[800px] mx-auto">
        <div
          className="bg-[rgba(255,255,255,0.95)] rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden p-12 relative"
        >
          {/* Header */}
          {/* Removed Home and Sign Out buttons */}

          {/* Title */}
          <h1
            className="text-[2.5rem] font-[800] text-center mb-8"
            style={{
              background: "linear-gradient(135deg, #FF6B6B, #FF8E53)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-1px"
            }}
          >
            Food Detection
          </h1>

          {/* Image Input */}
          <div className="mb-6">
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              className="w-full p-4 border-2 border-[rgba(0,0,0,0.1)] rounded-2xl text-[1.1rem] transition-all duration-300 shadow-[0_4px_6px_rgba(0,0,0,0.05)] focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.2)]"
              onChange={handleImageSelect}
            />
            <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
              <img
                id="imagePreview"
                src={imagePreview || ""}
                alt="Image Preview"
                style={{
                  display: imagePreview ? "block" : "none",
                  width: "400px",
                  height: "300px",
                  objectFit: "cover",
                  borderRadius: "1rem"
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white border-none rounded-2xl py-4 px-8 text-xl font-semibold transition-all duration-300 uppercase tracking-wider shadow-[0_4px_15px_rgba(255,107,107,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(255,107,107,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex justify-center mt-8">
              <div className="w-12 h-12 border-4 border-[rgba(255,107,107,0.3)] border-t-[#FF6B6B] rounded-full animate-spin"></div>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div className="mt-4">
              {/* Instructions Section */}
              {instructions && (
                <div
                  className="mt-8 bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                >
                  <div className="p-4 mt-2.5">
                    <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                      Cooking Instructions
                    </h5>
                    <div
                      className="leading-[1.4] m-0 text-left"
                      style={{ lineHeight: '1.4', margin: 0, textAlign: 'left' }}
                      dangerouslySetInnerHTML={{ __html: instructions }}
                    />
                  </div>
                </div>
              )}

              {/* Resources Section */}
              {loadingResources && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* YouTube Resources Loading */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Youtube Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                      <div className="w-full h-1 bg-[#f0f0f0] rounded-sm my-4 overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-sm"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">Loading video tutorials...</div>
                    </div>
                  </div>

                  {/* Google Resources Loading */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Google Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                      <div className="w-full h-1 bg-[#f0f0f0] rounded-sm my-4 overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-sm"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">Loading articles...</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources Content */}
              {resources && !loadingResources && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* YouTube Resources */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Youtube Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Video Tutorials</h6>
                      {resources.YoutubeSearch && resources.YoutubeSearch.length > 0 ? (
                        <div className="space-y-6">
                          {/* Flatten the nested arrays like in the HTML version */}
                          {resources.YoutubeSearch.flat().map((item: any, idx: number) => {
                            // Add null checks for item and item.link
                            if (!item || !item.link) {
                              console.warn('Invalid YouTube item:', item);
                              return null;
                            }

                            const videoId = getYouTubeVideoId(item.link);
                            return videoId ? (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="relative w-full aspect-video bg-black">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={item.title || 'YouTube Video'}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full rounded-t-2xl"
                                  />
                                </div>
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title || 'Untitled Video'}</h4>
                                  <p className="text-xs text-gray-500 mb-4 text-left">{item.channel || ''}</p>
                                </div>
                              </div>
                            ) : (
                              <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="p-6">
                                  <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title || 'Untitled Video'}</h4>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-red-500 text-base font-semibold hover:underline"
                                  >
                                    Watch Tutorial
                                  </a>
                                </div>
                              </div>
                            )
                          }).filter(Boolean)} {/* Filter out null items */}
                        </div>
                      ) : (
                        <p className="text-center text-gray-600">No video tutorials available.</p>
                      )}
                    </div>
                  </div>

                  {/* Google Resources */}
                  <div
                    className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0.8)] rounded-[1.5rem] border-none overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-4 mt-2.5">
                      <h5 className="text-[#2D3436] font-bold text-xl mb-6 border-b-2 border-[rgba(255,107,107,0.2)] pb-3 text-left">
                        Google Resources
                      </h5>
                      <h6 className="font-bold mb-3 text-left">Recommended Articles</h6>
                      {resources.GoogleSearch && resources.GoogleSearch.length > 0 ? (
                        <div className="space-y-6">
                          {/* Flatten the nested arrays like in the HTML version */}
                          {resources.GoogleSearch.flat().map((item: any, idx: number) => (
                            <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                              <div className="p-6">
                                <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight text-left">{item.title}</h4>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed text-left">{item.description}</p>
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:from-blue-400 hover:to-blue-500 transition-colors"
                                >
                                  Read More
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-600">No articles available.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetectFoodPage