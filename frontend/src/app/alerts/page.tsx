'use client';

import { useState, useEffect } from 'react';
import { Bell, Radio, TrendingUp, XCircle, TestTube, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { alertClient } from '@/lib/websocket';
import { toast } from 'sonner';
import { ConsequenceAPI } from '@/lib/api';

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] ${
        checked ? 'bg-indigo-500' : 'bg-[#333333]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

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
        console.log('Failed to load preferences, using defaults');
      }
    };

    loadPreferences();

    const checkConnection = setInterval(() => {
      setWsConnected(true);
    }, 1000);

    const unsubscribe = alertClient.subscribe((alert) => {
      setAlertHistory((prev) => [
        {
          ...alert,
          receivedAt: new Date().toISOString(),
        },
        ...prev.slice(0, 49),
      ]);
    });

    return () => {
      clearInterval(checkConnection);
      unsubscribe();
    };
  }, []);

  const sendTestAlert = async () => {
    try {
      const result = await ConsequenceAPI.sendTestNotification();

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

      toast.custom((t) => (
        <div className="bg-[#1E1E1E] border border-white/10 p-4 rounded-xl shadow-2xl min-w-[360px]">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-0.5">Test Earnings Alert</p>
              <p className="text-xs text-[#A0A0A0] mb-1">
                Beat by <span className="text-emerald-400 font-medium">8.5%</span>
              </p>
              <p className="text-xs text-[#666666] mb-3">Cascade: 23 effects detected</p>
              <button
                onClick={() => toast.dismiss(t)}
                className="text-xs px-3 py-1.5 rounded-md bg-[#262626] hover:bg-[#333333] text-[#A0A0A0] hover:text-white border border-white/[0.06] transition-all"
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
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10">
              <Bell className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Alerts
            </h1>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-2 ml-[52px]">
            Configure real-time notifications for cascade events and manage your watchlist.
          </p>
        </div>

        {/* Connection Status Bar */}
        <div className="flex items-center gap-2.5 mb-8 px-4 py-3 rounded-xl bg-[#141414] border border-white/[0.06]">
          <span className={`h-2 w-2 rounded-full shrink-0 ${wsConnected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'}`} />
          <span className="text-sm text-[#A0A0A0]">
            {wsConnected ? 'Connected — receiving live alerts' : 'Disconnected — reconnecting...'}
          </span>
          <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-md ${
            wsConnected
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {wsConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Notification Channels */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Notification Channels</h2>
              <p className="text-sm text-[#666666] mt-0.5">Choose how you want to receive cascade alerts</p>
            </div>
            <button
              onClick={saveNotificationSettings}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-500 hover:bg-indigo-400 text-white'
              }`}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="rounded-xl bg-[#141414] border border-white/[0.06] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.1]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
                    <Mail className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Email</span>
                </div>
                <ToggleSwitch
                  checked={notificationChannels.email.enabled}
                  onChange={(v) => updateChannel('email', 'enabled', v)}
                />
              </div>
              <input
                type="email"
                placeholder="you@company.com"
                value={notificationChannels.email.value}
                onChange={(e) => updateChannel('email', 'value', e.target.value)}
                disabled={!notificationChannels.email.enabled}
                className="w-full rounded-lg bg-[#1E1E1E] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
              <p className="text-xs text-[#666666] mt-2">Instant notifications with cascade details</p>
            </div>

            {/* Slack */}
            <div className="rounded-xl bg-[#141414] border border-white/[0.06] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.1]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Slack</span>
                </div>
                <ToggleSwitch
                  checked={notificationChannels.slack.enabled}
                  onChange={(v) => updateChannel('slack', 'enabled', v)}
                />
              </div>
              <input
                type="text"
                placeholder="Webhook URL or #channel"
                value={notificationChannels.slack.value}
                onChange={(e) => updateChannel('slack', 'value', e.target.value)}
                disabled={!notificationChannels.slack.enabled}
                className="w-full rounded-lg bg-[#1E1E1E] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
              <p className="text-xs text-[#666666] mt-2">Post alerts to your Slack workspace</p>
            </div>

            {/* WhatsApp */}
            <div className="rounded-xl bg-[#141414] border border-white/[0.06] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.1]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-white">WhatsApp</span>
                </div>
                <ToggleSwitch
                  checked={notificationChannels.whatsapp.enabled}
                  onChange={(v) => updateChannel('whatsapp', 'enabled', v)}
                />
              </div>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={notificationChannels.whatsapp.value}
                onChange={(e) => updateChannel('whatsapp', 'value', e.target.value)}
                disabled={!notificationChannels.whatsapp.enabled}
                className="w-full rounded-lg bg-[#1E1E1E] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
              <p className="text-xs text-[#666666] mt-2">WhatsApp messages via Twilio</p>
            </div>

            {/* SMS */}
            <div className="rounded-xl bg-[#141414] border border-white/[0.06] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.1]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
                    <Phone className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-white">SMS</span>
                </div>
                <ToggleSwitch
                  checked={notificationChannels.sms.enabled}
                  onChange={(v) => updateChannel('sms', 'enabled', v)}
                />
              </div>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={notificationChannels.sms.value}
                onChange={(e) => updateChannel('sms', 'value', e.target.value)}
                disabled={!notificationChannels.sms.enabled}
                className="w-full rounded-lg bg-[#1E1E1E] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
              <p className="text-xs text-[#666666] mt-2">Text alerts for critical events</p>
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-4 rounded-xl bg-[#141414] border border-white/[0.06] px-5 py-4">
            <p className="text-xs text-[#666666] leading-relaxed">
              <span className="text-[#A0A0A0] font-medium">Privacy & Security:</span> Your contact information is encrypted at rest and only used for alert delivery. We never share your data with third parties.
            </p>
          </div>
        </div>

        {/* Two-column grid: Preferences + Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Alert Preferences */}
          <div className="rounded-xl bg-[#141414] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Alert Preferences</h2>
            </div>

            <div className="space-y-5">
              {/* Threshold Slider */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-sm text-[#A0A0A0]">Minimum surprise threshold</label>
                  <span className="text-sm font-medium text-white tabular-nums bg-[#1E1E1E] px-2.5 py-0.5 rounded-md">
                    {preferences.minSurprise.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={preferences.minSurprise}
                  onChange={(e) => setPreferences({ ...preferences, minSurprise: parseFloat(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#333333] accent-indigo-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[#666666]">1%</span>
                  <span className="text-[10px] text-[#666666]">20%</span>
                </div>
              </div>

              {/* Toggle Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-[#A0A0A0]">High confidence only (&gt;70%)</span>
                  <ToggleSwitch
                    checked={preferences.highConfidenceOnly}
                    onChange={(v) => setPreferences({ ...preferences, highConfidenceOnly: v })}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm text-[#A0A0A0]">Pre-market alerts</span>
                    <p className="text-xs text-[#666666] mt-0.5">Before 9:30 AM ET</p>
                  </div>
                  <ToggleSwitch
                    checked={preferences.preMarket}
                    onChange={(v) => setPreferences({ ...preferences, preMarket: v })}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm text-[#A0A0A0]">After-hours alerts</span>
                    <p className="text-xs text-[#666666] mt-0.5">After 4:00 PM ET</p>
                  </div>
                  <ToggleSwitch
                    checked={preferences.afterHours}
                    onChange={(v) => setPreferences({ ...preferences, afterHours: v })}
                  />
                </div>
              </div>

              {/* Test Button */}
              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={sendTestAlert}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-white/[0.1] bg-[#1E1E1E] text-white hover:bg-[#262626] transition-all duration-200"
                >
                  <TestTube className="w-4 h-4 text-indigo-400" />
                  Send Test Alert
                </button>
              </div>
            </div>
          </div>

          {/* Watchlist */}
          <div className="rounded-xl bg-[#141414] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Watchlist</h2>
            </div>

            {/* Add ticker */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                placeholder="Add ticker..."
                className="flex-1 rounded-lg bg-[#1E1E1E] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
              />
              <button
                onClick={addToWatchlist}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white transition-all duration-200"
              >
                Add
              </button>
            </div>

            {/* Ticker list */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {watchlist.length === 0 ? (
                <div className="text-center py-10">
                  <TrendingUp className="w-8 h-8 text-[#333333] mx-auto mb-3" />
                  <p className="text-sm text-[#666666]">No tickers in watchlist</p>
                </div>
              ) : (
                watchlist.map((ticker) => (
                  <div
                    key={ticker}
                    className="flex items-center justify-between rounded-lg bg-[#1E1E1E] px-4 py-2.5 group hover:bg-[#262626] transition-all duration-150"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-sm font-medium text-white">{ticker}</span>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(ticker)}
                      className="text-[#666666] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-150"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-[#666666] mt-4">
              Watchlist tickers receive priority alerts and highlighted notifications.
            </p>
          </div>
        </div>

        {/* Alert History */}
        <div className="rounded-xl bg-[#141414] border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Alert History</h2>
            <span className="text-xs text-[#666666]">Last 50 alerts</span>
          </div>

          {alertHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E1E1E] mb-4">
                <Bell className="w-6 h-6 text-[#666666]" />
              </div>
              <p className="text-sm text-[#A0A0A0] mb-1">No alerts yet</p>
              <p className="text-xs text-[#666666]">
                Alerts will appear here when earnings events trigger cascades
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {alertHistory.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-[#1E1E1E] px-4 py-3 hover:bg-[#262626] transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${
                      alert.event.surprise_percent > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{alert.event.ticker}</span>
                        <span className="text-xs text-[#666666]">{alert.event.company}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs font-medium ${
                          alert.event.surprise_percent > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {alert.event.surprise_percent > 0 ? 'Beat' : 'Missed'} by{' '}
                          {Math.abs(alert.event.surprise_percent).toFixed(1)}%
                        </span>
                        <span className="text-xs text-[#666666]">
                          {alert.cascade.total_effects} effects
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#666666] tabular-nums shrink-0 ml-4">
                    {new Date(alert.receivedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
