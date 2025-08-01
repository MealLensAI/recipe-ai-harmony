import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, Globe, Shield, Palette, Download, Settings, Moon, Sun, Monitor, Zap, Eye, EyeOff, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState(true)
  const [locationServices, setLocationServices] = useState(true)
  const [dataSharing, setDataSharing] = useState(false)
  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("UTC-5")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [analytics, setAnalytics] = useState(true)

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    })
  }

  const handleExportData = () => {
    toast({
      title: "Data Export",
      description: "Your data export has been initiated. You'll receive an email when it's ready.",
    })
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      case 'auto': return <Monitor className="h-4 w-4" />
      default: return <Sun className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
        {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
              className="text-[#2D3436] hover:bg-gray-100"
          >
            <Link to="/">
                <ArrowLeft className="h-5 w-5 mr-2" /> Back
            </Link>
          </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#2D3436]">Settings</h1>
              <p className="text-sm text-[#1e293b]">Customize your experience and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
            {/* Appearance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            <div className="flex items-center mb-6">
              <Palette className="h-6 w-6 mr-3 text-purple-600" />
              <h2 className="text-xl font-bold text-[#2D3436]">Appearance</h2>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="theme" className="text-sm font-medium text-[#2D3436] mb-2 block">
                        Theme
                      </Label>
                      <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="border-[#e2e8f0] focus:border-[#FF6B6B] focus:ring-[#FF6B6B]">
                          <div className="flex items-center space-x-2">
                            {getThemeIcon()}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center space-x-2">
                              <Sun className="h-4 w-4" />
                              <span>Light</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center space-x-2">
                              <Moon className="h-4 w-4" />
                              <span>Dark</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="auto">
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-4 w-4" />
                              <span>Auto</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                <div>
                  <Label htmlFor="language" className="text-sm font-medium text-[#2D3436] mb-2 block">
                        Language
                      </Label>
                      <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="border-[#e2e8f0] focus:border-[#FF6B6B] focus:ring-[#FF6B6B]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              <div>
                <Label htmlFor="timezone" className="text-sm font-medium text-[#2D3436] mb-2 block">
                        Timezone
                      </Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="border-[#e2e8f0] focus:border-[#FF6B6B] focus:ring-[#FF6B6B]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                    <SelectItem value="UTC-5">Eastern Time</SelectItem>
                    <SelectItem value="UTC-6">Central Time</SelectItem>
                    <SelectItem value="UTC-7">Mountain Time</SelectItem>
                    <SelectItem value="UTC-8">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

            {/* Notifications */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            <div className="flex items-center mb-6">
              <Bell className="h-6 w-6 mr-3 text-blue-600" />
              <h2 className="text-xl font-bold text-[#2D3436]">Notifications</h2>
            </div>
                <div className="space-y-4">
              <div className="flex items-center justify-between">
                      <div>
                  <Label className="text-sm font-medium text-[#2D3436]">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-[#2D3436]">Push Notifications</Label>
                  <p className="text-xs text-gray-500">Get instant alerts on your device</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  className="data-[state=checked]:bg-blue-500"
                />
                      </div>
              <Separator />
              <div className="flex items-center justify-between">
                      <div>
                  <Label className="text-sm font-medium text-[#2D3436]">General Notifications</Label>
                  <p className="text-xs text-gray-500">Receive all app notifications</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
                      </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            <div className="flex items-center mb-6">
              <Shield className="h-6 w-6 mr-3 text-green-600" />
              <h2 className="text-xl font-bold text-[#2D3436]">Privacy & Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-[#2D3436]">Location Services</Label>
                  <p className="text-xs text-gray-500">Allow access to your location for better recommendations</p>
                    </div>
                    <Switch
                      checked={locationServices}
                      onCheckedChange={setLocationServices}
                  className="data-[state=checked]:bg-green-500"
                    />
                  </div>
              <Separator />
              <div className="flex items-center justify-between">
                      <div>
                  <Label className="text-sm font-medium text-[#2D3436]">Data Sharing</Label>
                  <p className="text-xs text-gray-500">Share anonymous usage data to improve the app</p>
                    </div>
                    <Switch
                      checked={dataSharing}
                      onCheckedChange={setDataSharing}
                  className="data-[state=checked]:bg-green-500"
                    />
                  </div>
              <Separator />
              <div className="flex items-center justify-between">
                      <div>
                  <Label className="text-sm font-medium text-[#2D3436]">Analytics</Label>
                  <p className="text-xs text-gray-500">Help us improve by sharing usage analytics</p>
                    </div>
                    <Switch
                      checked={analytics}
                      onCheckedChange={setAnalytics}
                  className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
          </div>
          </div>

          {/* Sidebar */}
        <div className="w-64 space-y-4">
            {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            <h3 className="text-lg font-semibold text-[#2D3436] mb-4">Quick Actions</h3>
            <div className="space-y-3">
                <Button 
                  onClick={handleSaveSettings}
                className="w-full bg-[#FF6B6B] hover:bg-[#FF8E53] text-white font-semibold"
                >
                  <Settings className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
                <Button 
                variant="outline"
                  onClick={handleExportData}
                className="w-full border-[#e2e8f0] hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            <h3 className="text-lg font-semibold text-[#2D3436] mb-4">Account Status</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                <span className="text-gray-600">Plan</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Premium
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Active
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Login</span>
                <span className="text-sm font-medium text-[#2D3436]">2 hours ago</span>
              </div>
                </div>
                </div>

          {/* System Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
            <h3 className="text-lg font-semibold text-[#2D3436] mb-4">System Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Version</span>
                <span className="text-sm font-medium text-[#2D3436]">1.2.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Build</span>
                <span className="text-sm font-medium text-[#2D3436]">2024.01.15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform</span>
                <span className="text-sm font-medium text-[#2D3436]">Web</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
