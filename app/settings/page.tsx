'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Palette, CheckCircle, XCircle, BookmarkPlus, Trash2, Plus, RefreshCw } from 'lucide-react';
import { U } from '@/lib/constants';
import { GlassCard } from '@/components/shared/glass-card';
import { SectionTitle } from '@/components/shared/section-title';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useToast } from '@/components/shared/toast-provider';
import { useTheme } from '@/components/shared/theme-provider';
import { useSymbolSearch } from '@/hooks/use-symbol-search';
import { SearchInput } from '@/components/search/search-input';
import { SearchSuggestions } from '@/components/search/search-suggestions';

export default function SettingsPage() {
  const [conn, setConn] = useState<Record<string, boolean>>({});
  const { watchlist, addSymbol, removeSymbol, ready } = useWatchlist();
  const { query, setQuery, results, loading, clear } = useSymbolSearch();
  const [clearing, setClearing] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setConn).catch(() => {});
  }, []);

  const clearCache = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/cache', { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        toast('success', `Cleared ${data.cleared} cached candle files`);
      } else {
        toast('error', data.error || 'Failed to clear cache');
      }
    } catch {
      toast('error', 'Cache clear request failed');
    } finally {
      setClearing(false);
    }
  };



  const connections = [
    { name: 'Finnhub Key 1', ok: conn.finnhub, label: 'Market data (primary)' },
    { name: 'Finnhub Key 2', ok: conn.finnhub2, label: 'Market data (primary fallback)' },
    { name: 'Alpha Vantage Key 1', ok: conn.alphaVantage, label: 'Market data (fallback)' },
    { name: 'Alpha Vantage Key 2', ok: conn.alphaVantage2, label: 'Market data (fallback)' },
    { name: 'Alpha Vantage Key 3', ok: conn.alphaVantage3, label: 'Market data (fallback)' },
    { name: 'Alpha Vantage Key 4', ok: conn.alphaVantage4, label: 'Market data (fallback)' },
    { name: 'Gemini AI', ok: conn.gemini, label: 'AI Copilot' },
  ];

  return (
    <div style={{ animation: "fi .4s ease", maxWidth: 640 }}>
      <SectionTitle icon={SettingsIcon}>Settings</SectionTitle>

      <GlassCard style={{ padding: "20px 22px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: U.cyanSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookmarkPlus size={16} color={U.cyan} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: U.text }}>Watchlist</div>
            <div style={{ fontSize: 10, color: U.textMute }}>{watchlist.length} symbols tracked</div>
          </div>
        </div>
        <SearchInput 
          query={query} 
          onChange={setQuery} 
          loading={loading} 
          placeholder="Search to add a symbol..."
          variant="medium"
          onClear={clear}
        />
        <SearchSuggestions
          query={query}
          results={results}
          onSelect={(sym, name) => {
            addSymbol(sym, name);
            clear();
            toast('success', `${sym} added to watchlist`);
          }}
          renderItem={(r, onSelect) => (
            <div key={r.sym} onClick={onSelect}
              style={{ padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${U.border}`, display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = U.glass)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Plus size={12} color={U.emerald} />
              <span style={{ fontSize: 12, fontWeight: 700, color: U.text }}>{r.sym}</span>
              <span style={{ fontSize: 10, color: U.textMute }}>{r.name}</span>
            </div>
          )}
        />
        {ready && watchlist.slice(0, 12).map(s => (
          <div key={s.sym} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${U.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: U.text, width: 52 }}>{s.sym}</span>
            <span style={{ fontSize: 11, color: U.textMute, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <button onClick={() => { removeSymbol(s.sym); toast('info', `${s.sym} removed from watchlist`); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: U.textFaint, padding: 4 }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {ready && watchlist.length > 12 && (
          <div style={{ fontSize: 10, color: U.textMute, textAlign: "center", padding: "8px 0" }}>
            +{watchlist.length - 12} more symbols
          </div>
        )}
      </GlassCard>

      <GlassCard style={{ padding: "20px 22px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: U.cyanSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Server size={16} color={U.cyan} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: U.text }}>API Connections</div>
            <div style={{ fontSize: 10, color: U.textMute }}>Data provider status</div>
          </div>
        </div>
        {connections.map(c => {
          return (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${U.border}` }}>
              {c.ok ? <CheckCircle size={16} color={U.emerald} /> : <XCircle size={16} color={U.rose} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: U.text }}>{c.name}</div>
                <div style={{ fontSize: 10, color: U.textMute }}>{c.label}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: c.ok ? U.emerald : U.rose, background: c.ok ? U.emeraldSoft : U.roseSoft, padding: "3px 10px", borderRadius: 999 }}>{c.ok ? 'Connected' : 'Not set'}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${U.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: U.text }}>Candle Cache</div>
            <div style={{ fontSize: 10, color: U.textMute }}>Clears cached historical data, forcing fresh API calls</div>
          </div>
          <button onClick={clearCache} disabled={clearing} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 10,
            border: `1px solid ${U.borderHi}`,
            background: U.glassHi, color: clearing ? U.textMute : U.text,
            fontSize: 11, fontWeight: 600, cursor: clearing ? "not-allowed" : "pointer",
            opacity: clearing ? 0.6 : 1, transition: "all .15s"
          }}>
            <RefreshCw size={12} style={{ animation: clearing ? "spin .8s linear infinite" : "none" }} />
            {clearing ? "Clearing..." : "Clear Cache"}
          </button>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: U.violetSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Palette size={16} color={U.violet} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: U.text }}>Appearance</div>
            <div style={{ fontSize: 10, color: U.textMute }}>Display preferences</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: U.text }}>Theme</div>
            <div style={{ fontSize: 10, color: U.textMute }}>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
          </div>
          <div 
            onClick={toggleTheme}
            style={{
              width: 44, height: 24, borderRadius: 999, background: theme === 'dark' ? U.glassHi : U.glass, border: `1px solid ${theme === 'dark' ? U.cyan : U.border}`,
              display: "flex", alignItems: "center", padding: "0 4px", cursor: "pointer", transition: "all .3s"
            }}>
            <div style={{ 
              width: 16, height: 16, borderRadius: "50%", background: theme === 'dark' ? U.cyan : U.textMute, 
              transform: theme === 'dark' ? "translateX(18px)" : "translateX(0px)", transition: "all .3s" 
            }} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: U.textFaint, marginTop: 8 }}>Click to toggle between light and dark trading vibes.</div>
      </GlassCard>
    </div>
  );
}
