import { ref } from "vue";

const analyticsConsent = ref(null);
const analyticsLoaded = ref(false);

export function useAnalytics() {
  const checkConsent = () => {
    const consent = localStorage.getItem("rocus-analytics-consent");
    analyticsConsent.value = consent === "true";
    return analyticsConsent.value;
  };

  const setConsent = (value) => {
    analyticsConsent.value = value;
    localStorage.setItem("rocus-analytics-consent", value.toString());
    
    if (value) {
      loadUmami();
    } else {
      removeUmami();
    }
  };

  const loadUmami = () => {
    if (analyticsLoaded.value) return;

    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
    const src = import.meta.env.VITE_UMAMI_SRC;

    console.log(" Umami config:", { websiteId, src });

    if (!websiteId || !src) {
      console.warn("Umami not configured");
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = src;
    script.setAttribute("data-website-id", websiteId);
    script.setAttribute("data-domains", "rocus.io");
    script.setAttribute("data-auto-track", "true"); // CRITICAL
    script.setAttribute("data-cache", "true");
    
    script.onload = () => {
      console.log("Umami loaded");
      analyticsLoaded.value = true;
      
      // Wait for umami to be available, then force track
      let attempts = 0;
      const checkUmami = setInterval(() => {
        attempts++;
        if (window.umami) {
          console.log("window.umami available");
          clearInterval(checkUmami);
          
          // Force immediate pageview
          console.log("Forcing pageview");
          window.umami.track('pageview');
          
          // Test event
          console.log("Sending test event");
          window.umami.track('app-loaded', { 
            timestamp: Date.now(),
            path: window.location.pathname
          });
        } else if (attempts > 20) {
          console.error("window.umami never became available");
          clearInterval(checkUmami);
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error(" Failed to load Umami:", error);
    };
    
    document.head.appendChild(script);
    console.log(" Umami script added to DOM");
  };

  const removeUmami = () => {
    const scripts = document.querySelectorAll("script[data-website-id]");
    scripts.forEach((script) => script.remove());
    analyticsLoaded.value = false;
    console.log("Analytics disabled");
  };

  const trackEvent = (eventName, eventData = {}) => {
    if (!analyticsConsent.value || !analyticsLoaded.value) {
      console.log("Not tracking:", eventName, "- consent:", analyticsConsent.value, "loaded:", analyticsLoaded.value);
      return;
    }

    if (window.umami) {
      console.log("Tracking:", eventName, eventData);
      window.umami.track(eventName, eventData);
    } else {
      console.error("window.umami not available");
    }
  };

  return {
    analyticsConsent,
    analyticsLoaded,
    checkConsent,
    setConsent,
    trackEvent,
  };
}