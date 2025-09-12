"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Utensils, Camera, Calendar, Sparkles, HeartPulse, ArrowRight, ArrowLeft } from "lucide-react"
import { useSicknessSettings } from "@/hooks/useSicknessSettings"

const steps = [
    {
        title: "Welcome to MealLensAI",
        subtitle: "Your smart kitchen copilot",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
        content: "Snap ingredients, get recipes, and plan balanced meals with a tap."
    },
    {
        title: "Ingredient & Food Detection",
        subtitle: "Point. Shoot. Identify.",
        image: "https://images.unsplash.com/photo-1495197359483-d092478c170a?q=80&w=1200&auto=format&fit=crop",
        content: "Use AI Kitchen and Food Detection to recognize foods and get instant cooking ideas."
    },
    {
        title: "AI Meal Planner",
        subtitle: "Tailored to your taste",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
        content: "Build weekly plans that match your goals, budget, and location."
    },
    {
        title: "Health Preferences",
        subtitle: "Personalize with care",
        image: "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=1200&auto=format&fit=crop",
        content: "We can adapt your Meal Planner for chronic conditions like diabetes or hypertension."
    }
]

const Onboarding: React.FC = () => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { settings, updateSettings, saveSettings } = useSicknessSettings()

    const [step, setStep] = useState<number>(0)
    const [hasSickness, setHasSickness] = useState<boolean>(settings.hasSickness)
    const [sicknessType, setSicknessType] = useState<string>(settings.sicknessType || "")
    const isLastIntro = step === steps.length

    const next = () => setStep((s) => Math.min(s + 1, steps.length))
    const prev = () => setStep((s) => Math.max(s - 1, 0))

    const handleFinish = async () => {
        const toSave = { hasSickness, sicknessType: hasSickness ? sicknessType.trim() : "" }
        updateSettings(toSave)
        const res = await saveSettings(toSave)
        if (res.success) {
            toast({ title: "You're all set!", description: "Jumping into your AI Kitchen." })
            navigate('/ai-kitchen', { replace: true })
        } else {
            toast({ title: "Could not save settings", description: "You can update them anytime in Settings.", variant: "destructive" })
            navigate('/ai-kitchen', { replace: true })
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                            <Utensils className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">MealLensAI</div>
                            <div className="text-xs text-gray-500">Smart food detection & meal planning</div>
                        </div>
                    </div>
                    <Link to="/ai-kitchen" className="text-sm text-gray-500 hover:text-gray-700">Skip</Link>
                </div>

                <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Left - Image / Progress */}
                        <div className="relative">
                            {step < steps.length ? (
                                <img src={steps[step].image} alt={steps[step].title} className="h-64 md:h-full w-full object-cover" />
                            ) : (
                                <img src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=1200&auto=format&fit=crop" alt="Health preferences" className="h-64 md:h-full w-full object-cover" />
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent text-white">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-full bg-white/30 rounded">
                                        <div className="h-1 bg-white rounded" style={{ width: `${((Math.min(step, steps.length)) / (steps.length + 1)) * 100}%` }} />
                                    </div>
                                    <span className="text-xs opacity-90">{Math.min(step + 1, steps.length + 1)}/{steps.length + 1}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right - Content */}
                        <CardContent className="p-6 md:p-8 space-y-6">
                            {step < steps.length ? (
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 text-orange-600 font-semibold text-xs">
                                        {step === 0 && <Sparkles className="h-4 w-4" />}
                                        {step === 1 && <Camera className="h-4 w-4" />}
                                        {step === 2 && <Calendar className="h-4 w-4" />}
                                        {step === 3 && <HeartPulse className="h-4 w-4" />}
                                        <span>Step {step + 1} of {steps.length}</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{steps[step].title}</h2>
                                    <p className="text-gray-600 font-medium">{steps[step].subtitle}</p>
                                    <p className="text-gray-600 leading-relaxed">{steps[step].content}</p>
                                    <div className="flex items-center justify-between pt-2">
                                        <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2">
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>
                                        <Button onClick={next} className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                                            Continue
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="inline-flex items-center gap-2 text-orange-600 font-semibold text-xs">
                                        <HeartPulse className="h-4 w-4" />
                                        <span>Personalize</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Do you have any health conditions?</h2>
                                    <p className="text-gray-600">We use this only to customize your AI Meal Planner. It won’t affect other features.</p>

                                    <div className="flex items-center gap-4">
                                        <Button variant={hasSickness ? "outline" : "default"} onClick={() => setHasSickness(false)}>
                                            No
                                        </Button>
                                        <Button variant={hasSickness ? "default" : "outline"} onClick={() => setHasSickness(true)}>
                                            Yes
                                        </Button>
                                    </div>

                                    {hasSickness && (
                                        <div className="space-y-2">
                                            <Label htmlFor="sickness" className="text-sm font-medium text-gray-700">What condition?</Label>
                                            <Input
                                                id="sickness"
                                                placeholder="e.g., diabetes, hypertension, celiac disease"
                                                value={sicknessType}
                                                onChange={(e) => setSicknessType(e.target.value)}
                                            />
                                            <p className="text-xs text-gray-500">You can change this anytime in Settings.</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                        <Button variant="outline" onClick={prev} className="gap-2">
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>
                                        <Button onClick={handleFinish} className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                                            Finish
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </div>
                </Card>

                <div className="text-center mt-6 text-sm text-gray-500">
                    By continuing, you agree to our <a className="underline hover:text-gray-700" href="#">Terms</a> and <a className="underline hover:text-gray-700" href="#">Privacy Policy</a>.
                </div>
            </div>
        </div>
    )
}

export default Onboarding


