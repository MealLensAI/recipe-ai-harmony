const GA_MEASUREMENT_ID = 'G-TPT4ET0Y2Q'

declare global {
    interface Window {
        gtag?: (...args: any[]) => void
        dataLayer?: any[]
    }
}

export function initializeAnalytics() {
    if (typeof window === 'undefined') return
    if (window.gtag) return
    // index.html includes the GA script tag; here we just ensure dataLayer exists
    window.dataLayer = window.dataLayer || []
}

export function trackPageView(path: string) {
    if (typeof window === 'undefined') return
    if (!window.gtag) return
    window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: path
    })
}

export function trackEvent(action: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined') return
    if (!window.gtag) return
    window.gtag('event', action, params)
}

export const Analytics = {
    initialize: initializeAnalytics,
    pageview: trackPageView,
    event: trackEvent
}


