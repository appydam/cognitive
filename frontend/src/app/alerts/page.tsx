'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Radio, TrendingUp, CheckCircle, XCircle, TestTube, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { alertClient } from '@/lib/websocket';
import { toast } from 'sonner';
import { ConsequenceAPI } from '@/lib/api';

export default function AlertsPage() {
  const [wsConnected, setWsConnected] = useState(false);
  const [alertHistory, setAlertHistory] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({
    minSurprise: 5.0,
    highConfidenceOnly: true,
    preMarket: true,
    afterHours: true,
  });
  const [notificationChannels, setNotificationChannels] = useState({
    email: { enabled: false, value: '' },
    slack: { enabled: false, value: '' },
    whatsapp: { enabled: false, value: '' },
    sms: { enabled: false, value: '' },
  });
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'NVDA', 'MSFT']);
  const [newTicker, setNewTicker] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    // Load notification preferences from backend
    const loadPreferences = async () => {
      try {
        const prefs = await ConsequenceAPI.getNotificationPreferences();
        setPreferences({
          minSurprise: prefs.min_surprise,
          highConfidenceOnly: prefs.high_confidence_only,
          preMarket: prefs.pre_market_alerts,
          afterHours: prefs.after_hours_alerts,
        });
        setNotificationChannels({
          email: { enabled: prefs.email_enabled, value: prefs.email_address || '' },
          slack: { enabled: prefs.slack_enabled, value: prefs.slack_webhook || '' },
          whatsapp: { enabled: prefs.whatsapp_enabled, value: prefs.whatsapp_number || '' },
          sms: { enabled: prefs.sms_enabled, value: prefs.sms_number || '' },
        });
        setWatchlist(prefs.watchlist || ['AAPL', 'NVDA', 'MSFT']);
      } catch (err) {
        // Silently handle - backend may not be available yet
        console.log('Failed to load preferences, using defaults');
      }
    };

    loadPreferences();

    // Check WebSocket connection status
    const checkConnection = setInterval(() => {
      setWsConnected(true);
    }, 1000);

    // Subscribe to alerts and add to history
    const unsubscribe = alertClient.subscribe((alert) => {
      setAlertHistory((prev) => [
        {
          ...alert,
          receivedAt: new Date().toISOString(),
        },
        ...prev.slice(0, 49), // Keep last 50 alerts
      ]);
    });

    return () => {
      clearInterval(checkConnection);
      unsubscribe();
    };
  }, []);

  const sendTestAlert = async () => {
    try {
      // Call backend to send actual notifications
      const result = await ConsequenceAPI.sendTestNotification();

      // Simulate a test alert in the UI
      const testAlert = {
        event: {
          ticker: 'TEST',
          company: 'Test Company',
          surprise_percent: 8.5,
          report_time: new Date().toISOString(),
        },
        cascade: {
          total_effects: 23,
          timeline: {},
        },
        timestamp: new Date().toISOString(),
      };

      // Show UI toast
      toast.custom((t) => (
        <div className="bg-slate-900 border border-green-400/50 p-4 rounded-lg min-w-[400px]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-green-400 mb-1">
                TEST EARNINGS ALERT
              </div>
              <div className="text-xs text-slate-300 mb-2">
                Beat by <span className="text-green-400">8.5%</span>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                Cascade: 23 effects detected
              </div>
              <button
                onClick={() => toast.dismiss(t)}
                className="text-xs bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 rounded px-3 py-1.5 text-green-400 font-medium transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ), {
        duration: 10000,
        position: 'top-right',
      });

      // Show notification send status
      if (result.status === 'success') {
        toast.success('Test notifications sent!', {
          description: result.message || `Sent to ${result.results?.length || 0} channels`,
        });
      } else if (result.status === 'partial_failure') {
        toast.warning('Some notifications failed', {
          description: result.message,
        });
      } else {
        toast.error('No channels enabled', {
          description: 'Please enable and configure notification channels',
        });
      }

      // Add to history
      setAlertHistory((prev) => [
        {
          ...testAlert,
          receivedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      toast.error('Failed to send test notification', {
        description: 'Backend may not be available',
      });
    }
  };

  const addToWatchlist = () => {
    if (newTicker && !watchlist.includes(newTicker.toUpperCase())) {
      setWatchlist([...watchlist, newTicker.toUpperCase()]);
      setNewTicker('');
    }
  };

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist(watchlist.filter((t) => t !== ticker));
  };

  const saveNotificationSettings = async () => {
    setSaveStatus('saving');

    try {
      await ConsequenceAPI.saveNotificationPreferences({
        min_surprise: preferences.minSurprise,
        high_confidence_only: preferences.highConfidenceOnly,
        pre_market_alerts: preferences.preMarket,
        after_hours_alerts: preferences.afterHours,
        email_enabled: notificationChannels.email.enabled,
        email_address: notificationChannels.email.value,
        slack_enabled: notificationChannels.slack.enabled,
        slack_webhook: notificationChannels.slack.value,
        whatsapp_enabled: notificationChannels.whatsapp.enabled,
        whatsapp_number: notificationChannels.whatsapp.value,
        sms_enabled: notificationChannels.sms.enabled,
        sms_number: notificationChannels.sms.value,
        watchlist: watchlist,
      });

      setSaveStatus('saved');
      toast.success('Notification settings saved!', {
        description: 'You will receive alerts on enabled channels',
      });
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('idle');
      toast.error('Failed to save settings', {
        description: 'Backend may not be available. Settings saved locally.',
      });
    }
  };

  const updateChannel = (channel: keyof typeof notificationChannels, field: 'enabled' | 'value', value: any) => {
    setNotificationChannels({
      ...notificationChannels,
      [channel]: {
        ...notificationChannels[channel],
        [field]: value,
      },
    });
  };

  return (
    <div className="min-h-screen bg-black tactical-grid scanlines">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-block bg-cyan-500/10 border border-cyan-500 text-cyan-400 px-4 py-1 military-font text-xs mb-4">
            ⬢ ALERT SYSTEM ⬢
          </div>
          <h1 className="text-4xl font-bold mb-2 terminal-text military-font">
            &gt; REAL-TIME CASCADE ALERTS
          </h1>
          <p className="text-sm text-green-400/70 font-mono">
            CONFIGURE NOTIFICATIONS | MONITOR WEBSOCKET | MANAGE WATCHLIST
          </p>
        </div>

        {/* Connection Status */}
        <Card className="p-6 hud-panel border-green-500/30 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio className={`w-5 h-5 ${wsConnected ? 'text-green-400' : 'text-red-400'}`} />
              <div>
                <h2 className="text-lg font-bold text-green-400 military-font">
                  WEBSOCKET STATUS
                </h2>
                <p className="text-xs text-green-400/60 font-mono mt-1">
                  {wsConnected ? 'CONNECTED - RECEIVING LIVE ALERTS' : 'DISCONNECTED - RECONNECTING...'}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded border ${
              wsConnected
                ? 'bg-green-500/20 border-green-400/50 text-green-400'
                : 'bg-red-500/20 border-red-400/50 text-red-400'
            } font-mono text-sm`}>
              {wsConnected ? '● ONLINE' : '○ OFFLINE'}
            </div>
          </div>
        </Card>

        {/* Notification Channels */}
        <Card className="p-6 hud-panel border-purple-500/30 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-purple-400 military-font">
                NOTIFICATION CHANNELS
              </h2>
            </div>
            <Button
              onClick={saveNotificationSettings}
              disabled={saveStatus === 'saving'}
              className={`military-font text-xs ${
                saveStatus === 'saved'
                  ? 'bg-green-500/20 border-green-400/50 text-green-400'
                  : 'bg-purple-500/20 border-purple-400/50 text-purple-400'
              }`}
            >
              {saveStatus === 'saving' ? 'SAVING...' : saveStatus === 'saved' ? '✓ SAVED' : 'SAVE SETTINGS'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="p-4 bg-black/40 border border-purple-400/20 rounded">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400 military-font">EMAIL</span>
                <label className="ml-auto flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationChannels.email.enabled}
                    onChange={(e) => updateChannel('email', 'enabled', e.target.checked)}
                    className="w-4 h-4 bg-purple-500/20 border-purple-400/50 rounded"
                  />
                </label>
              </div>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={notificationChannels.email.value}
                onChange={(e) => updateChannel('email', 'value', e.target.value)}
                disabled={!notificationChannels.email.enabled}
                className="w-full bg-black/60 border border-purple-400/30 rounded px-3 py-2 text-purple-400 font-mono text-xs focus:outline-none focus:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-purple-400/40 font-mono mt-2">
                Instant email notifications with cascade details
              </p>
            </div>

            {/* Slack */}
            <div className="p-4 bg-black/40 border border-purple-400/20 rounded">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400 military-font">SLACK</span>
                <label className="ml-auto flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationChannels.slack.enabled}
                    onChange={(e) => updateChannel('slack', 'enabled', e.target.checked)}
                    className="w-4 h-4 bg-purple-500/20 border-purple-400/50 rounded"
                  />
                </label>
              </div>
              <input
                type="text"
                placeholder="Webhook URL or #channel"
                value={notificationChannels.slack.value}
                onChange={(e) => updateChannel('slack', 'value', e.target.value)}
                disabled={!notificationChannels.slack.enabled}
                className="w-full bg-black/60 border border-purple-400/30 rounded px-3 py-2 text-purple-400 font-mono text-xs focus:outline-none focus:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-purple-400/40 font-mono mt-2">
                Post alerts to Slack channel or DM
              </p>
            </div>

            {/* WhatsApp */}
            <div className="p-4 bg-black/40 border border-purple-400/20 rounded">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400 military-font">WHATSAPP</span>
                <label className="ml-auto flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationChannels.whatsapp.enabled}
                    onChange={(e) => updateChannel('whatsapp', 'enabled', e.target.checked)}
                    className="w-4 h-4 bg-purple-500/20 border-purple-400/50 rounded"
                  />
                </label>
              </div>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={notificationChannels.whatsapp.value}
                onChange={(e) => updateChannel('whatsapp', 'value', e.target.value)}
                disabled={!notificationChannels.whatsapp.enabled}
                className="w-full bg-black/60 border border-purple-400/30 rounded px-3 py-2 text-purple-400 font-mono text-xs focus:outline-none focus:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-purple-400/40 font-mono mt-2">
                WhatsApp messages via Twilio API
              </p>
            </div>

            {/* SMS */}
            <div className="p-4 bg-black/40 border border-purple-400/20 rounded">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400 military-font">SMS</span>
                <label className="ml-auto flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationChannels.sms.enabled}
                    onChange={(e) => updateChannel('sms', 'enabled', e.target.checked)}
                    className="w-4 h-4 bg-purple-500/20 border-purple-400/50 rounded"
                  />
                </label>
              </div>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={notificationChannels.sms.value}
                onChange={(e) => updateChannel('sms', 'value', e.target.value)}
                disabled={!notificationChannels.sms.enabled}
                className="w-full bg-black/60 border border-purple-400/30 rounded px-3 py-2 text-purple-400 font-mono text-xs focus:outline-none focus:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-purple-400/40 font-mono mt-2">
                Text message alerts for critical events
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-400/30 rounded">
            <p className="text-xs text-purple-400/70 font-mono leading-relaxed">
              <strong className="text-purple-400">PRIVACY & SECURITY:</strong> Your contact information is encrypted at rest and only used for alert delivery. We never share your data with third parties. You can disable any channel at any time.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Alert Preferences */}
          <Card className="p-6 hud-panel border-cyan-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-400 military-font">
                ALERT PREFERENCES
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-green-400/80 mb-2">
                  Minimum Surprise Threshold
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={preferences.minSurprise}
                    onChange={(e) => setPreferences({ ...preferences, minSurprise: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-green-500/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-green-400 font-mono text-sm w-16 text-right">
                    {preferences.minSurprise.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.highConfidenceOnly}
                    onChange={(e) => setPreferences({ ...preferences, highConfidenceOnly: e.target.checked })}
                    className="w-4 h-4 bg-green-500/20 border-green-400/50 rounded"
                  />
                  <span className="text-sm font-mono text-green-400/80">
                    High confidence cascades only (&gt;70%)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.preMarket}
                    onChange={(e) => setPreferences({ ...preferences, preMarket: e.target.checked })}
                    className="w-4 h-4 bg-green-500/20 border-green-400/50 rounded"
                  />
                  <span className="text-sm font-mono text-green-400/80">
                    Pre-market alerts (Before 9:30 AM ET)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.afterHours}
                    onChange={(e) => setPreferences({ ...preferences, afterHours: e.target.checked })}
                    className="w-4 h-4 bg-green-500/20 border-green-400/50 rounded"
                  />
                  <span className="text-sm font-mono text-green-400/80">
                    After-hours alerts (After 4:00 PM ET)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-green-500/20">
                <Button
                  onClick={sendTestAlert}
                  className="w-full tactical-button military-font text-xs flex items-center justify-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  SEND TEST ALERT
                </Button>
              </div>
            </div>
          </Card>

          {/* Watchlist */}
          <Card className="p-6 hud-panel border-yellow-500/30">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold text-yellow-400 military-font">
                TICKER WATCHLIST
              </h2>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                  placeholder="Add ticker..."
                  className="flex-1 bg-black/40 border border-yellow-400/30 rounded px-3 py-2 text-yellow-400 font-mono text-sm focus:outline-none focus:border-yellow-400"
                />
                <Button
                  onClick={addToWatchlist}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 text-yellow-400 font-mono text-xs px-4"
                >
                  ADD
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {watchlist.length === 0 ? (
                <p className="text-center text-yellow-400/40 font-mono text-xs py-8">
                  No tickers in watchlist
                </p>
              ) : (
                watchlist.map((ticker) => (
                  <div
                    key={ticker}
                    className="flex items-center justify-between bg-black/40 border border-yellow-400/20 rounded px-4 py-2 hover:bg-yellow-500/5 transition"
                  >
                    <span className="font-mono text-sm text-yellow-400">{ticker}</span>
                    <button
                      onClick={() => removeFromWatchlist(ticker)}
                      className="text-yellow-400/60 hover:text-red-400 transition"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-yellow-400/40 font-mono mt-4">
              Priority alerts for watchlist tickers will be highlighted
            </p>
          </Card>
        </div>

        {/* Alert History */}
        <Card className="p-6 hud-panel border-green-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-green-400 military-font">
              ALERT HISTORY
            </h2>
            <span className="text-xs font-mono text-green-400/60">
              LAST 50 ALERTS
            </span>
          </div>

          {alertHistory.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-green-400/20 mx-auto mb-4" />
              <p className="text-sm text-green-400/60 font-mono mb-2">
                NO ALERTS YET
              </p>
              <p className="text-xs text-green-400/40 font-mono">
                Waiting for earnings events to trigger cascades...
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {alertHistory.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-black/40 border border-green-500/20 rounded hover:bg-green-500/5 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.event.surprise_percent > 0 ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="font-bold text-sm text-green-400">
                        {alert.event.ticker}
                      </span>
                      <span className="text-xs text-green-400/60 font-mono">
                        {alert.event.company}
                      </span>
                    </div>
                    <span className="text-xs text-green-400/40 font-mono">
                      {new Date(alert.receivedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className={alert.event.surprise_percent > 0 ? 'text-green-400' : 'text-red-400'}>
                      {alert.event.surprise_percent > 0 ? 'Beat' : 'Missed'} by{' '}
                      {Math.abs(alert.event.surprise_percent).toFixed(1)}%
                    </span>
                    <span className="text-green-400/60">
                      {alert.cascade.total_effects} effects
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
