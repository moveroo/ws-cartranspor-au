/**
 * Brain Web Analytics - Lightweight Privacy-First Analytics
 *
 * Tracks pageviews, user actions, scroll depth, and Web Vitals.
 * Sends data to Brain Nucleus API.
 *
 * Usage:
 *   BrainAnalytics.init({ url: 'https://brain.example.com', key: 'your-api-key' });
 *
 * @version 1.0.0
 */
/* eslint-disable @typescript-eslint/no-this-alias, @typescript-eslint/no-unused-vars */
(function (window, document) {
  'use strict';

  var BrainAnalytics = {
    config: {
      url: '',
      key: '',
      trackScrollDepth: true,
      trackPerformance: true,
      trackClicks: true,
      debug: false,
    },
    sessionId: null,
    pageCount: 0,
    scrollDepths: [],
    startTime: Date.now(),

    /**
     * Initialize Brain Analytics
     * @param {Object} options - Configuration options
     */
    init: function (options) {
      if (!options.url || !options.key) {
        console.warn('[BrainAnalytics] Missing url or key');
        return;
      }

      // Respect Do Not Track
      if (navigator.doNotTrack === '1') {
        if (options.debug) console.log('[BrainAnalytics] DNT enabled, not tracking');
        return;
      }

      // Merge options
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          this.config[key] = options[key];
        }
      }

      // Generate or retrieve session ID
      this.sessionId = this.getSessionId();
      this.pageCount = this.getPageCount();

      // Track pageview
      this.trackPageview();

      // Set up event listeners
      if (this.config.trackClicks) this.setupClickTracking();
      if (this.config.trackScrollDepth) this.setupScrollTracking();
      if (this.config.trackPerformance) this.trackPerformance();

      // Track time on page when leaving
      this.setupExitTracking();

      if (this.config.debug) console.log('[BrainAnalytics] Initialized', this.config);
    },

    /**
     * Get or create session ID
     */
    getSessionId: function () {
      var sid = sessionStorage.getItem('brain_sid');
      if (!sid) {
        sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('brain_sid', sid);
        sessionStorage.setItem('brain_landing', location.pathname);
        sessionStorage.setItem('brain_pages', '0');
      }
      return sid;
    },

    /**
     * Get and increment page count
     */
    getPageCount: function () {
      var count = parseInt(sessionStorage.getItem('brain_pages') || '0', 10) + 1;
      sessionStorage.setItem('brain_pages', count.toString());
      return count;
    },

    /**
     * Parse user agent for device/browser info
     */
    getDeviceInfo: function () {
      var ua = navigator.userAgent;
      var device = 'desktop';
      var browser = 'other';

      if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        device = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
      }

      if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'chrome';
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'safari';
      else if (/Firefox/i.test(ua)) browser = 'firefox';
      else if (/Edge|Edg/i.test(ua)) browser = 'edge';

      return { device: device, browser: browser };
    },

    /**
     * Get UTM parameters from URL
     */
    getUTMParams: function () {
      var params = {};
      var search = location.search.substring(1);
      if (!search) return params;

      var pairs = search.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var key = decodeURIComponent(pair[0]);
        if (key.indexOf('utm_') === 0) {
          params[key] = decodeURIComponent(pair[1] || '');
        }
      }
      return params;
    },

    /**
     * Send event to Brain API
     */
    send: function (eventType, payload) {
      if (!this.config.url || !this.config.key) return;

      payload.session_id = this.sessionId;

      var body = JSON.stringify({
        event_type: eventType,
        payload: payload,
      });

      if (this.config.debug) {
        console.log('[BrainAnalytics] Sending:', eventType, payload);
      }

      // Use sendBeacon if available (for exit events), otherwise fetch
      if (eventType === 'web.time_on_page' && navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(this.config.url + '/api/v1/events?key=' + this.config.key, blob);
      } else {
        fetch(this.config.url + '/api/v1/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Brain-Key': this.config.key,
          },
          body: body,
          keepalive: true,
        }).catch(function () {}); // Silent fail
      }
    },

    /**
     * Track pageview
     */
    trackPageview: function () {
      var deviceInfo = this.getDeviceInfo();
      var utmParams = this.getUTMParams();
      var isNewSession = this.pageCount === 1;

      var payload = {
        url: location.pathname,
        title: document.title,
        referrer: document.referrer || '',
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        screen: window.innerWidth + 'x' + window.innerHeight,
        language: navigator.language || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        is_new_session: isNewSession,
        page_count: this.pageCount,
      };

      // Add landing page for new sessions
      if (isNewSession) {
        payload.landing_page = location.pathname;
      }

      // Add UTM params if present
      for (var key in utmParams) {
        if (utmParams.hasOwnProperty(key)) {
          payload[key] = utmParams[key];
        }
      }

      this.send('web.pageview', payload);
    },

    /**
     * Set up click tracking
     */
    setupClickTracking: function () {
      var self = this;

      document.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;

        var href = link.getAttribute('href') || '';

        // Quote link clicks
        if (href.indexOf('removalistquotes') !== -1 || href.indexOf('quote') !== -1) {
          self.send('web.quote_clicked', {
            url: location.pathname,
            button_text: (link.textContent || '').trim().substring(0, 50),
            destination: href,
          });
        }
        // Phone clicks
        else if (href.indexOf('tel:') === 0) {
          self.send('web.phone_clicked', {
            url: location.pathname,
            phone: href.replace('tel:', ''),
          });
        }
        // External links
        else if (link.hostname && link.hostname !== location.hostname) {
          self.send('web.external_link', {
            url: location.pathname,
            destination: href,
          });
        }
      });

      // FAQ/details tracking
      document.addEventListener(
        'toggle',
        function (e) {
          if (e.target.tagName === 'DETAILS' && e.target.open) {
            var summary = e.target.querySelector('summary');
            self.send('web.faq_opened', {
              url: location.pathname,
              question: (summary ? summary.textContent : '').trim().substring(0, 100),
            });
          }
        },
        true
      );
    },

    /**
     * Set up scroll depth tracking
     */
    setupScrollTracking: function () {
      var self = this;
      var depths = [25, 50, 75, 100];
      var tracked = {};

      var checkScroll = function () {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

        for (var i = 0; i < depths.length; i++) {
          var depth = depths[i];
          if (scrollPercent >= depth && !tracked[depth]) {
            tracked[depth] = true;
            self.send('web.scroll_depth', {
              url: location.pathname,
              depth: depth,
            });
          }
        }
      };

      // Throttle scroll events
      var timeout;
      window.addEventListener('scroll', function () {
        if (timeout) return;
        timeout = setTimeout(function () {
          timeout = null;
          checkScroll();
        }, 200);
      });
    },

    /**
     * Track Web Vitals performance
     */
    trackPerformance: function () {
      var self = this;

      // Wait for load to complete
      window.addEventListener('load', function () {
        setTimeout(function () {
          var timing = performance.timing || {};
          var nav = performance.getEntriesByType('navigation')[0] || {};

          var payload = {
            url: location.pathname,
            ttfb: Math.round(timing.responseStart - timing.requestStart) || 0,
            dom_ready: Math.round(timing.domContentLoadedEventEnd - timing.requestStart) || 0,
            load_time: Math.round(timing.loadEventEnd - timing.requestStart) || 0,
          };

          // Get LCP if available
          if (window.PerformanceObserver) {
            try {
              new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                if (entries.length) {
                  payload.lcp = Math.round(entries[entries.length - 1].startTime);
                  self.send('web.performance', payload);
                }
              }).observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {
              self.send('web.performance', payload);
            }
          } else {
            self.send('web.performance', payload);
          }
        }, 100);
      });
    },

    /**
     * Track time on page when exiting
     */
    setupExitTracking: function () {
      var self = this;

      var sendExitEvent = function () {
        var timeOnPage = Math.round((Date.now() - self.startTime) / 1000);
        if (timeOnPage > 0) {
          self.send('web.time_on_page', {
            url: location.pathname,
            seconds: timeOnPage,
          });
        }
      };

      // Use visibilitychange for more reliable tracking
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
          sendExitEvent();
        }
      });

      // Fallback for older browsers
      window.addEventListener('pagehide', sendExitEvent);
    },

    /**
     * Manual event tracking
     */
    track: function (eventType, payload) {
      this.send('web.' + eventType, payload || {});
    },
  };

  // Expose globally
  window.BrainAnalytics = BrainAnalytics;
})(window, document);
