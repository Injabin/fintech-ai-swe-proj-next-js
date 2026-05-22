'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Palette, 
  CheckCircle, 
  XCircle, 
  BookmarkPlus, 
  Trash2, 
  Plus, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Activity 
} from 'lucide-react';
import { U } from '@/lib/constants';
import { GlassCard } from '@/components/shared/glass-card';
import { SectionTitle } from '@/components/shared/section-title';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useToast } from '@/components/shared/toast-provider';
import { useTheme } from '@/components/shared/theme-provider';

interface KeyHealth {
  keyName: string;
  provider: string;
  label: string;
  status: 'healthy' | 'missing' | 'error' | 'rate-limited';
  errorDetails?: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<KeyHealth[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Finnhub': false,
    'Alpha Vantage': false,
    'Gemini AI': false,
  });

  const { watchlist, addSymbol, removeSymbol, ready } = useWatchlist();
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<{ sym: string; name: string }[]>([]);
  const [clearing, setClearing] = useState(false);
  const { toast } = useToast();
  
  const { 
    theme, 
    toggleTheme, 
    glassIntensity, 
    toggleGlassIntensity, 
    animationsEnabled, 
    toggleAnimationsEnabled 
  } = useTheme();

  // Fetch API health statuses
  const fetchKeyHealth = async (refresh = false) => {
    setLoadingKeys(true);
    try {
      const url = refresh ? '/api/settings?refresh=true' : '/api/settings';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        if (refresh) {
          toast('success', 'API key status refreshed successfully');
        }
      } else {
        if (refresh) toast('error', 'Failed to retrieve API key health');
      }
    } catch {
      if (refresh) toast('error', 'Connection error checking key health');
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchKeyHealth(false);
  }, []);

  const clearCache = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      const res = await fetch('/api/cache', { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        toast('success', `Cleared ${data.cleared} cached candle files`);
      } else {
        toast('error', data.error || 'Failed to clear candle cache');
      }
    } catch {
      toast('error', 'Request failed while clearing candle cache');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    if (!addQuery.trim()) { setAddResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/symbols?q=${encodeURIComponent(addQuery)}`);
        if (!res.ok) return;
        setAddResults(await res.json());
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [addQuery]);

  // Expand/collapse helper
  const toggleExpanded = (provider: string) => {
    setExpanded(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  // Provider summary generator
  const getProviderSummary = (providerName: string) => {
    const providerKeys = keys.filter(k => k.provider === providerName);
    if (!providerKeys.length) {
      return { 
        text: 'Checking...', 
        color: U.textMute, 
        softBg: U.glass, 
        icon: Activity, 
        pulse: true 
      };
    }

    const allMissing = providerKeys.every(k => k.status === 'missing');
    if (allMissing) {
      return { 
        text: 'Not Configured', 
        color: U.textMute, 
        softBg: U.glass, 
        icon: XCircle, 
        pulse: false 
      };
    }

    const anyRateLimited = providerKeys.some(k => k.status === 'rate-limited');
    if (anyRateLimited) {
      return { 
        text: 'Rate Limited', 
        color: U.amber, 
        softBg: U.amberSoft, 
        icon: AlertTriangle, 
        pulse: true 
      };
    }

    const anyError = providerKeys.some(k => k.status === 'error');
    if (anyError) {
      return { 
        text: 'Degraded', 
        color: U.rose, 
        softBg: U.roseSoft, 
        icon: AlertTriangle, 
        pulse: false 
      };
    }

    const healthyCount = providerKeys.filter(k => k.status === 'healthy').length;
    const totalCount = providerKeys.length;

    return { 
      text: `${healthyCount}/${totalCount} Active`, 
      color: U.emerald, 
      softBg: U.emeraldSoft, 
      icon: CheckCircle, 
      pulse: false 
    };
  };

  const providers = [
    { name: 'Finnhub', label: 'Market data (primary)' },
    { name: 'Alpha Vantage', label: 'Market data (fallback)' },
    { name: 'Gemini AI', label: 'AI Copilot' },
  ];

  return (
    <div style={{ animation: animationsEnabled ? "fi .4s ease" : "none", maxWidth: 900, margin: "0 auto" }}>
      <SectionTitle icon={SettingsIcon}>Settings</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "var(--grid-2)", gap: 16, alignItems: "stretch" }}>
        
        {/* Watchlist Card */}
        <GlassCard className="settings-card-watchlist" style={{ padding: "24px 26px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${U.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: U.cyanSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookmarkPlus size={17} color={U.cyan} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: U.text }}>Watchlist</div>
              <div style={{ fontSize: 11, color: U.textMute }}>{watchlist.length} symbols tracked</div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input 
              value={addQuery} 
              onChange={e => setAddQuery(e.target.value)}
              placeholder="Search to add a symbol..."
              style={{ flex: 1, background: U.glassLo, border: `1px solid ${U.border}`, borderRadius: 10, padding: "10px 14px", color: U.text, fontSize: 13, outline: "none" }}
            />
          </div>

          {addQuery && (
            <div style={{ marginBottom: 14, maxHeight: 180, overflow: "auto", background: U.glassLo, borderRadius: 10, border: `1px solid ${U.border}` }}>
              {addResults.map(r => (
                <div key={r.sym} onClick={() => { addSymbol(r.sym, r.name); setAddQuery(''); setAddResults([]); toast('success', `${r.sym} added to watchlist`); }}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${U.border}`, display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.background = U.glass)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: U.emeraldSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={11} color={U.emerald} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: U.text }}>{r.sym}</span>
                  <span style={{ fontSize: 11, color: U.textMute, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                </div>
              ))}
              {addQuery && !addResults.length && <div style={{ padding: 14, textAlign: "center", fontSize: 12, color: U.textMute }}>No matches</div>}
            </div>
          )}

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, maxHeight: 340, overflowY: "auto" }}>
            {ready && watchlist.map(s => (
              <div key={s.sym} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 8, transition: animationsEnabled ? "background .15s" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = U.glass)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: U.text, width: 56, fontFamily: "JetBrains Mono" }}>{s.sym}</span>
                <span style={{ fontSize: 12, color: U.textMute, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <button onClick={() => { removeSymbol(s.sym); toast('info', `${s.sym} removed from watchlist`); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: U.textFaint, padding: 4, borderRadius: 6, transition: animationsEnabled ? "all .15s" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = U.roseSoft, e.currentTarget.style.color = U.rose)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = U.textFaint)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {ready && watchlist.length === 0 && (
            <div style={{ fontSize: 11, color: U.textMute, textAlign: "center", padding: "12px 0" }}>No symbols in watchlist</div>
          )}
        </GlassCard>

        {/* API Connections Card */}
        <GlassCard className="settings-card-api" style={{ padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${U.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: U.cyanSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Server size={17} color={U.cyan} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: U.text }}>API Connections</div>
              <div style={{ fontSize: 11, color: U.textMute }}>Verify diagnostic health status</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {providers.map(p => {
              const summary = getProviderSummary(p.name);
              const IconComponent = summary.icon;
              const isExpanded = !!expanded[p.name];
              const providerKeys = keys.filter(k => k.provider === p.name);

              return (
                <div key={p.name} style={{ borderRadius: 10, border: isExpanded ? `1px solid ${U.border}` : `1px solid transparent`, background: isExpanded ? U.glassLo : 'transparent', padding: "2px", transition: animationsEnabled ? "all .2s" : "none" }}>
                  <div 
                    onClick={() => toggleExpanded(p.name)} 
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", borderRadius: 8, cursor: "pointer", transition: animationsEnabled ? "background .15s" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = U.glass)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ color: U.textFaint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: summary.softBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconComponent 
                        size={15} 
                        color={summary.color} 
                        style={{ animation: summary.pulse && animationsEnabled ? "pulse-dot 1.5s infinite" : "none" }} 
                      />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: U.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: U.textMute }}>{p.label}</div>
                    </div>
                    
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 600, 
                      color: summary.color, 
                      background: summary.softBg, 
                      padding: "4px 12px", 
                      borderRadius: 999 
                    }}>
                      {summary.text}
                    </span>
                  </div>

                  {/* Nested Keys (Accordion Content) */}
                  {isExpanded && (
                    <div style={{ padding: "4px 10px 12px 34px", display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${U.border}`, marginTop: 4 }}>
                      {loadingKeys && !keys.length && (
                        <div style={{ fontSize: 11, color: U.textMute, padding: "6px 0" }}>Loading diagnostic information...</div>
                      )}
                      
                      {!loadingKeys && !providerKeys.length && (
                        <div style={{ fontSize: 11, color: U.textMute, padding: "6px 0" }}>No keys configured for this provider.</div>
                      )}

                      {providerKeys.map(k => {
                        const isHealthy = k.status === 'healthy';
                        const isMissing = k.status === 'missing';
                        const isRate = k.status === 'rate-limited';
                        
                        let badgeColor = U.textMute;
                        let badgeBg = U.glass;
                        let labelText = 'Not Set';

                        if (isHealthy) {
                          badgeColor = U.emerald;
                          badgeBg = U.emeraldSoft;
                          labelText = 'Active';
                        } else if (isRate) {
                          badgeColor = U.amber;
                          badgeBg = U.amberSoft;
                          labelText = 'Rate Limited';
                        } else if (k.status === 'error') {
                          badgeColor = U.rose;
                          badgeBg = U.roseSoft;
                          labelText = 'Error';
                        }

                        return (
                          <div key={k.keyName} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 10px", borderRadius: 8, background: U.glassLo, border: `1px solid ${U.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: U.textDim }}>{k.label}</span>
                                <span style={{ fontSize: 9, fontFamily: "JetBrains Mono", color: U.textFaint, marginTop: 1 }}>{k.keyName}</span>
                              </div>
                              <span style={{ fontSize: 9, fontWeight: 700, color: badgeColor, background: badgeBg, padding: "2px 8px", borderRadius: 999 }}>
                                {labelText}
                              </span>
                            </div>
                            {k.errorDetails && (
                              <div style={{ fontSize: 9, color: U.rose, marginTop: 4, padding: "4px 8px", background: U.roseSoft, borderRadius: 4, fontFamily: "JetBrains Mono", wordBreak: "break-all" }}>
                                {k.errorDetails}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Diagnostics and Cache Controls Footer */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${U.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: U.text }}>Candle Cache</div>
                <div style={{ fontSize: 11, color: U.textMute, marginTop: 2 }}>Purges cached chart data, forcing immediate API retrieval</div>
              </div>
              <button 
                onClick={clearCache} 
                disabled={clearing} 
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: 10,
                  border: `1px solid ${U.borderHi}`,
                  background: U.glassHi, color: clearing ? U.textMute : U.text,
                  fontSize: 12, fontWeight: 600, cursor: clearing ? "not-allowed" : "pointer",
                  opacity: clearing ? 0.6 : 1, transition: animationsEnabled ? "all .15s" : "none", whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { if (!clearing) e.currentTarget.style.background = U.glass; }}
                onMouseLeave={e => { if (!clearing) e.currentTarget.style.background = U.glassHi; }}
              >
                <RefreshCw size={13} style={{ animation: clearing && animationsEnabled ? "spin .8s linear infinite" : "none" }} />
                {clearing ? "Clearing..." : "Clear Cache"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingTop: 12, borderTop: `1px solid ${U.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: U.text }}>Diagnostics Health</div>
                <div style={{ fontSize: 11, color: U.textMute, marginTop: 2 }}>Triggers live request checks to bypass 12h caches</div>
              </div>
              <button 
                onClick={() => fetchKeyHealth(true)} 
                disabled={loadingKeys} 
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: 10,
                  border: `1px solid ${U.borderHi}`,
                  background: U.glassHi, color: loadingKeys ? U.textMute : U.text,
                  fontSize: 12, fontWeight: 600, cursor: loadingKeys ? "not-allowed" : "pointer",
                  opacity: loadingKeys ? 0.6 : 1, transition: animationsEnabled ? "all .15s" : "none", whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { if (!loadingKeys) e.currentTarget.style.background = U.glass; }}
                onMouseLeave={e => { if (!loadingKeys) e.currentTarget.style.background = U.glassHi; }}
              >
                <RefreshCw size={13} style={{ animation: loadingKeys && animationsEnabled ? "spin .8s linear infinite" : "none" }} />
                {loadingKeys ? "Checking..." : "Refresh Status"}
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Appearance Options Card */}
        <GlassCard className="settings-card-appearance" style={{ padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${U.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: U.violetSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Palette size={17} color={U.violet} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: U.text }}>Appearance</div>
              <div style={{ fontSize: 11, color: U.textMute }}>Customize your display preferences</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Theme Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 10px", borderRadius: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = U.glass)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: U.text }}>Theme</div>
                <div style={{ fontSize: 11, color: U.textMute, marginTop: 1 }}>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
              </div>
              <div 
                onClick={toggleTheme}
                style={{
                  width: 48, height: 26, borderRadius: 999, background: theme === 'dark' ? U.glassHi : U.glass, border: `1px solid ${theme === 'dark' ? U.cyan : U.border}`,
                  display: "flex", alignItems: "center", padding: "0 4px", cursor: "pointer", transition: animationsEnabled ? "all .3s" : "none"
                }}>
                <div style={{ 
                  width: 18, height: 18, borderRadius: "50%", background: theme === 'dark' ? U.cyan : U.textMute, 
                  transform: theme === 'dark' ? "translateX(20px)" : "translateX(0px)", transition: animationsEnabled ? "all .3s" : "none" 
                }} />
              </div>
            </div>

            {/* Performance Mode (Glass Intensity Toggle) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 10px", borderRadius: 8, marginTop: 4 }}
              onMouseEnter={e => (e.currentTarget.style.background = U.glass)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: U.text }}>Performance Mode</div>
                <div style={{ fontSize: 11, color: U.textMute, marginTop: 1 }}>{glassIntensity === 'low' ? 'Low Blur (Optimized)' : 'Frosted Blur (Frosted)'}</div>
              </div>
              <div 
                onClick={toggleGlassIntensity}
                style={{
                  width: 48, height: 26, borderRadius: 999, background: glassIntensity === 'low' ? U.glassHi : U.glass, border: `1px solid ${glassIntensity === 'low' ? U.cyan : U.border}`,
                  display: "flex", alignItems: "center", padding: "0 4px", cursor: "pointer", transition: animationsEnabled ? "all .3s" : "none"
                }}>
                <div style={{ 
                  width: 18, height: 18, borderRadius: "50%", background: glassIntensity === 'low' ? U.cyan : U.textMute, 
                  transform: glassIntensity === 'low' ? "translateX(20px)" : "translateX(0px)", transition: animationsEnabled ? "all .3s" : "none" 
                }} />
              </div>
            </div>

            {/* Micro-animations Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 10px", borderRadius: 8, marginTop: 4 }}
              onMouseEnter={e => (e.currentTarget.style.background = U.glass)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: U.text }}>Micro-animations</div>
                <div style={{ fontSize: 11, color: U.textMute, marginTop: 1 }}>{animationsEnabled ? 'Enabled' : 'Reduced Motion'}</div>
              </div>
              <div 
                onClick={toggleAnimationsEnabled}
                style={{
                  width: 48, height: 26, borderRadius: 999, background: animationsEnabled ? U.glassHi : U.glass, border: `1px solid ${animationsEnabled ? U.cyan : U.border}`,
                  display: "flex", alignItems: "center", padding: "0 4px", cursor: "pointer", transition: "all .3s"
                }}>
                <div style={{ 
                  width: 18, height: 18, borderRadius: "50%", background: animationsEnabled ? U.cyan : U.textMute, 
                  transform: animationsEnabled ? "translateX(20px)" : "translateX(0px)", transition: "all .3s" 
                }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: U.textFaint, marginTop: 12, padding: "0 10px" }}>
            Tweak display rendering rules to perfectly match your hardware capabilities.
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
