"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockAchievement } from "@/lib/achievements";

// ─── Sound engine (Web Audio API, no files needed) ──────────────────────────
function playTone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), dur * 1000 + 100);
  } catch { /* silently fail if audio not available */ }
}

function playSuccess() { [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.2, "sine", 0.12), i * 90)); }
function playError()   { [300, 220].forEach((f, i) => setTimeout(() => playTone(f, 0.15, "sawtooth", 0.08), i * 100)); }
function playClick()   { playTone(880, 0.06, "square", 0.06); }
function playReveal()  { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.12, "sine", 0.1), i * 70)); }

// ─── Confetti burst ──────────────────────────────────────────────────────────
function confettiBurst(x: number, y: number, count = 120) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none";
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d")!;
  const COLORS = ["#00d4ff", "#8b5cf6", "#10b981", "#f0b90b", "#ef4444", "#ffffff", "#facc15"];
  const particles = Array.from({ length: count }, () => ({
    x, y, vx: (Math.random() - 0.5) * 20, vy: -(Math.random() * 18 + 5),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: Math.random() * 10 + 4, h: Math.random() * 5 + 3,
    rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.35, life: 1,
  }));
  const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.65; p.vx *= 0.97;
      p.life -= 0.014; p.rot += p.rotV;
      if (p.life > 0) {
        alive = true;
        ctx.save(); ctx.globalAlpha = p.life; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
    });
    if (alive) requestAnimationFrame(frame); else document.body.removeChild(canvas);
  };
  requestAnimationFrame(frame);
}

const SHOW_N = 20;
const REPLAY_N = 8;
const REPLAY_MS = 420;
const ROUNDS = 5;

type Choice = "H" | "L";
type Phase = "intro" | "loading" | "predict" | "analyzing" | "replay" | "roundResult" | "final";
interface Candle { o: number; h: number; l: number; c: number; v: number; }
interface RoundResult { hChoice: Choice; aiChoice: Choice; aiConf: number; actual: Choice; pct: number; hWon: boolean; aiWon: boolean; aiLines: string[]; }
interface GS { candles: Candle[]; winIdx: number; round: number; hScore: number; aiScore: number; streak: number; best: number; log: RoundResult[]; aiChoice: Choice; aiConf: number; aiLines: string[]; actual: Choice; actualPct: number; hChoice: Choice | null; usedWins: number[]; }

function fmt(n: number) { return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtPct(n: number) { return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(3)}%`; }

async function fetchCandles(): Promise<Candle[]> {
  try {
    const r = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=80", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error();
    const d: unknown[][] = await r.json();
    return d.map(k => ({ o: +String(k[1]), h: +String(k[2]), l: +String(k[3]), c: +String(k[4]), v: +String(k[5]) }));
  } catch {
    let p = 43200;
    return Array.from({ length: 80 }, (_, i) => {
      const trend = Math.sin(i / 8) * 250;
      const o = p, d = trend + (Math.random() - 0.46) * 300, c = Math.max(38000, o + d);
      p = c; return { o, h: Math.max(o,c)+Math.random()*100, l: Math.min(o,c)-Math.random()*100, c, v: 20+Math.random()*80 };
    });
  }
}

function computeAI(candles: Candle[], wi: number): { choice: Choice; conf: number; lines: string[]; } {
  const closes = candles.slice(Math.max(0, wi - 14), wi + 1).map(c => c.c);
  let g = 0, l = 0;
  for (let i = 1; i < closes.length; i++) { const d = closes[i] - closes[i-1]; if (d > 0) g += d; else l -= d; }
  const n = closes.length - 1 || 1;
  const rsi = l === 0 ? 100 : 100 - 100 / (1 + (g/n) / (l/n));
  const mom = candles[wi].c - candles[Math.max(0, wi-5)].c;
  const rv = candles.slice(Math.max(0,wi-3), wi+1).reduce((a,c)=>a+c.v,0)/3;
  const av = candles.slice(Math.max(0,wi-10), wi+1).reduce((a,c)=>a+c.v,0)/10;
  const vt = rv / (av||1);
  let bull = 0;
  if (rsi < 45) bull++; if (rsi < 35) bull++;
  if (mom > 0) bull++; if (vt > 1.2 && mom > 0) bull++;
  let bear = 0;
  if (rsi > 55) bear++; if (rsi > 65) bear++;
  if (mom < 0) bear++; if (vt > 1.2 && mom < 0) bear++;
  const choice: Choice = bull >= bear ? "H" : "L";
  const conf = Math.min(84, 52 + Math.abs(bull - bear) * 11);
  return {
    choice, conf,
    lines: [
      `Scanning RSI(14)... ${rsi.toFixed(1)} → ${rsi < 40 ? "Oversold ↑ signal fort" : rsi > 60 ? "Overbought ↓ signal baissier" : "Zone neutre →"}`,
      `Momentum(5)... ${mom >= 0 ? "+" : ""}${mom.toFixed(0)} → ${mom > 200 ? "Forte pression haussière" : mom > 0 ? "Légère pression haussière" : mom > -200 ? "Légère pression baissière" : "Forte pression baissière"}`,
      `Volume trend... ${((vt-1)*100).toFixed(0)}% ${vt>1?"au-dessus":"en-dessous"} de la moyenne`,
      `Calcul probabilité directionnelle... ${bull} signals haussiers · ${bear} signals baissiers`,
      `Prédiction verrouillée: ${choice==="H"?"HIGHER ▲":"LOWER ▼"} (confiance: ${conf}%)`,
    ]
  };
}

function pickWin(candles: Candle[], used: number[]): number {
  const pool = [];
  for (let i = SHOW_N + 3; i < candles.length - REPLAY_N - 3; i++) if (!used.includes(i)) pool.push(i);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : SHOW_N + 3 + Math.floor(Math.random() * 15);
}

function Chart({ candles, winIdx, replayIdx, phase }: { candles: Candle[]; winIdx: number; replayIdx: number; phase: Phase }) {
  const hist = candles.slice(Math.max(0, winIdx - SHOW_N), winIdx + 1);
  const replay = (phase==="replay"||phase==="roundResult"||phase==="final") ? candles.slice(winIdx+1, winIdx+1+Math.min(replayIdx, REPLAY_N)) : [];
  const all = [...hist, ...replay];
  const rangeAll = [...candles.slice(Math.max(0,winIdx-SHOW_N), winIdx+1+REPLAY_N)];
  const lo = Math.min(...rangeAll.map(c=>c.l))*0.9997, hi = Math.max(...rangeAll.map(c=>c.h))*1.0003, rng = hi-lo||1;
  const maxV = Math.max(...all.map(c=>c.v))||1;
  const W = 680, H = 148, VH = 26, ML = 46, MR = 4, MT = 8, MB = 2, IW = W-ML-MR, IH = H-MT-MB-VH-4;
  const total = SHOW_N + 1 + REPLAY_N;
  const px = (i: number) => ML + ((i+0.5)/total)*IW;
  const py = (v: number) => MT+IH-((v-lo)/rng)*IH;
  const cw = Math.max(2.5, (IW/total)*0.52);
  const sma7 = hist.map((_,i)=>{ const s=hist.slice(Math.max(0,i-6),i+1); return s.reduce((a,c)=>a+c.c,0)/s.length; });
  const nowX = px(SHOW_N);
  const last = all[all.length-1];
  const upTrend = last ? last.c >= hist[0].c : true;
  const ticks = [0.25,0.5,0.75].map(r=>lo+r*rng);

  return (
    <svg viewBox={`0 0 ${W} ${H+VH}`} className="w-full" style={{height:180}} preserveAspectRatio="none">
      <defs>
        <filter id="cgl"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="rz" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(139,92,246,0.07)"/><stop offset="100%" stopColor="transparent"/></linearGradient>
      </defs>
      {ticks.map((v,i)=>(
        <g key={i}>
          <line x1={ML} y1={py(v)} x2={W} y2={py(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.7"/>
          <text x={ML-3} y={py(v)+3} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7.5" fontFamily="monospace">{(v/1000).toFixed(1)}k</text>
        </g>
      ))}
      {(phase==="replay"||phase==="roundResult") && <rect x={nowX} y={MT} width={IW-(nowX-ML)} height={IH+VH} fill="url(#rz)"/>}
      <line x1={nowX} y1={MT-2} x2={nowX} y2={H+VH-MB} stroke="rgba(250,204,21,0.45)" strokeWidth="1" strokeDasharray="3,2"/>
      <text x={nowX} y={MT-4} textAnchor="middle" fill="rgba(250,204,21,0.45)" fontSize="6.5" fontFamily="monospace">NOW</text>
      {all.map((c,i)=>{ const x=px(i); const vh=(c.v/maxV)*VH; return <rect key={`v${i}`} x={x-cw/2} y={H-MB-vh} width={cw} height={vh} fill={c.c>=c.o?"rgba(16,185,129,0.28)":"rgba(239,68,68,0.22)"} rx="0.3"/>; })}
      {sma7.length>2&&<polyline points={sma7.map((v,i)=>`${px(i)},${py(v)}`).join(" ")} fill="none" stroke="rgba(251,191,36,0.45)" strokeWidth="1" strokeDasharray="4,2"/>}
      {all.map((c,i)=>{ const x=px(i),up=c.c>=c.o,col=up?"#10b981":"#ef4444"; const bT=py(Math.max(c.o,c.c)),bH=Math.max(1.5,Math.abs(py(c.o)-py(c.c))); const cur=i===all.length-1,isR=i>SHOW_N;
        return (<g key={i} opacity={isR?1:0.82}><line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth={cur?1.5:0.75} opacity={cur?1:0.6}/><rect x={x-cw/2} y={bT} width={cw} height={bH} fill={col} opacity={cur?1:0.68} rx="0.5" filter={cur?"url(#cgl)":undefined}/></g>);
      })}
      {last&&(<>
        <line x1={ML} y1={py(last.c)} x2={W-MR} y2={py(last.c)} stroke={upTrend?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"} strokeWidth="0.6" strokeDasharray="3,2"/>
        <rect x={W-MR-40} y={py(last.c)-7} width={42} height={15} rx="2.5" fill={upTrend?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"} stroke={upTrend?"#10b981":"#ef4444"} strokeWidth="0.5"/>
        <text x={W-MR-19} y={py(last.c)+3.5} textAnchor="middle" fill={upTrend?"#10b981":"#ef4444"} fontSize="7" fontFamily="monospace" fontWeight="bold">{(last.c/1000).toFixed(2)}k</text>
        <circle cx={px(all.length-1)} cy={py(last.c)} r="3.5" fill={upTrend?"#10b981":"#ef4444"} filter="url(#cgl)"><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/></circle>
      </>)}
    </svg>
  );
}

const INIT: GS = { candles:[], winIdx:0, round:0, hScore:0, aiScore:0, streak:0, best:0, log:[], aiChoice:"H", aiConf:50, aiLines:[], actual:"H", actualPct:0, hChoice:null, usedWins:[] };

export default function BTCPredictionChallenge() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [gs, setGs] = useState<GS>(INIT);
  const [replayIdx, setReplayIdx] = useState(0);
  const [aiStep, setAiStep] = useState(0);
  const replayRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const aiRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>()=>{ if(replayRef.current)clearInterval(replayRef.current); if(aiRef.current)clearInterval(aiRef.current); },[]);

  // Keyboard shortcuts
  useEffect(()=>{
    if(phase==="predict"){ const h=(e:KeyboardEvent)=>{ if(e.key==="h"||e.key==="H")choose("H"); if(e.key==="l"||e.key==="L"||e.key==="ArrowDown")choose("L"); }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); }
    if(phase==="roundResult"){ const h=(e:KeyboardEvent)=>{ if(e.key==="Enter"||e.key===" ")nextRound(); }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase]);

  // AI analysis → replay
  useEffect(()=>{
    if(phase!=="analyzing")return;
    setAiStep(0); let s=0;
    aiRef.current=setInterval(()=>{ s++; setAiStep(s); if(s>=5){ clearInterval(aiRef.current!); setTimeout(()=>{ setReplayIdx(0); setPhase("replay"); playReveal(); },700); } },380);
    return()=>{ if(aiRef.current)clearInterval(aiRef.current); };
  },[phase]);

  // Replay
  useEffect(()=>{
    if(phase!=="replay")return;
    replayRef.current=setInterval(()=>setReplayIdx(prev=>{ const n=prev+1; if(n>REPLAY_N){ clearInterval(replayRef.current!); setTimeout(()=>setPhase("roundResult"),400); return REPLAY_N; } return n; }),REPLAY_MS);
    return()=>{ if(replayRef.current)clearInterval(replayRef.current); };
  },[phase]);

  const startGame = useCallback(async()=>{
    setPhase("loading");
    const candles=await fetchCandles();
    const wi=pickWin(candles,[]);
    const {choice:aiChoice,conf:aiConf,lines:aiLines}=computeAI(candles,wi);
    const nxt=candles[wi+1]; const pct=nxt?(nxt.c-candles[wi].c)/candles[wi].c:0;
    setGs({...INIT,candles,winIdx:wi,aiChoice,aiConf,aiLines,actual:pct>=0?"H":"L",actualPct:pct});
    setPhase("predict");
  },[]);

  const choose=useCallback((ch:Choice)=>{ playClick(); setGs(prev=>({...prev,hChoice:ch})); setPhase("analyzing"); },[]);

  const nextRound=useCallback(()=>{
    setGs(prev=>{
      if(!prev.hChoice)return prev;
      const hWon=prev.hChoice===prev.actual, aiWon=prev.aiChoice===prev.actual;
      const rr:RoundResult={hChoice:prev.hChoice,aiChoice:prev.aiChoice,aiConf:prev.aiConf,actual:prev.actual,pct:prev.actualPct,hWon,aiWon,aiLines:prev.aiLines};
      const log=[...prev.log,rr], hScore=prev.hScore+(hWon?1:0), aiScore=prev.aiScore+(aiWon?1:0);
      const streak=hWon?prev.streak+1:0, best=Math.max(prev.best,streak), round=prev.round+1;
      if(round>=ROUNDS){ setTimeout(()=>{ setPhase("final"); unlockAchievement("TRADE_DONE"); if(hScore>aiScore)unlockAchievement("TRADE_WIN"); },100); return{...prev,log,hScore,aiScore,streak,best,round,hChoice:null}; }
      const usedWins=[...prev.usedWins,prev.winIdx], wi=pickWin(prev.candles,usedWins);
      const{choice:aiChoice,conf:aiConf,lines:aiLines}=computeAI(prev.candles,wi);
      const nxt=prev.candles[wi+1]; const pct=nxt?(nxt.c-prev.candles[wi].c)/prev.candles[wi].c:0;
      setTimeout(()=>setPhase("predict"),100);
      return{...prev,log,hScore,aiScore,streak,best,round,hChoice:null,winIdx:wi,aiChoice,aiConf,aiLines,actual:pct>=0?"H":"L",actualPct:pct,usedWins};
    });
  },[]);

  const {candles,winIdx,round,hScore,aiScore,streak,best,log,aiChoice,aiConf,aiLines,actual,actualPct,hChoice}=gs;
  const cur=candles[winIdx], prev2=candles[winIdx-1];

  const S=(o:React.CSSProperties)=>o;

  return (
    <section id="trade" className="relative py-28 px-6">
      <div style={S({position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 50% 100%,rgba(250,204,21,0.04),transparent)",pointerEvents:"none"})}/>
      <div style={S({maxWidth:760,margin:"0 auto",position:"relative",zIndex:1})}>

        <div style={S({textAlign:"center",marginBottom:28})}>
          <div style={S({display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:8})}>
            <div style={S({height:1,width:40,background:"linear-gradient(90deg,transparent,rgba(250,204,21,0.6))"})}/>
            <span style={S({fontFamily:"monospace",fontSize:10,color:"#facc15",letterSpacing:4,textTransform:"uppercase"})}>Challenge Arena</span>
            <div style={S({height:1,width:40,background:"linear-gradient(90deg,rgba(250,204,21,0.6),transparent)"})}/>
          </div>
          <h2 style={S({fontSize:"clamp(26px,4.5vw,44px)",fontWeight:900,color:"rgba(255,255,255,0.92)",marginBottom:4})}>BTC Prediction Challenge</h2>
          <p style={S({color:"rgba(255,255,255,0.35)",fontSize:13})}>Données réelles Binance · HIGHER ou LOWER dans 5 minutes · Battez l&apos;algo RSI</p>
        </div>

        {/* INTRO */}
        {phase==="intro"&&(
          <div style={S({background:"rgba(255,255,255,0.025)",borderRadius:20,border:"1px solid rgba(250,204,21,0.2)",overflow:"hidden"})}>
            <div style={S({position:"relative",height:90,overflow:"hidden",pointerEvents:"none",background:"rgba(0,0,0,0.25)"})}>
              <svg viewBox="0 0 700 90" style={{width:"100%",height:"100%"}} preserveAspectRatio="none">
                <defs><linearGradient id="ig6" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(16,185,129,0.2)"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs>
                <path d="M0,70 C50,65 80,78 120,55 C160,32 190,48 230,38 C270,28 300,52 340,35 C380,18 410,42 450,25 C490,8 530,20 575,12 C620,6 650,16 700,10 L700,90 L0,90Z" fill="url(#ig6)"/>
                <path d="M0,70 C50,65 80,78 120,55 C160,32 190,48 230,38 C270,28 300,52 340,35 C380,18 410,42 450,25 C490,8 530,20 575,12 C620,6 650,16 700,10" fill="none" stroke="#10b981" strokeWidth="1.5"/>
              </svg>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#030712 25%,transparent)"}}/>
              <div style={{position:"absolute",bottom:8,left:14,display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:"#10b981",display:"inline-block"}}/>
                <span style={{fontFamily:"monospace",fontSize:9,color:"#10b981"}}>BTC/USDT · LIVE · Binance 5m</span>
              </div>
            </div>
            <div style={S({padding:"22px 28px 28px"})}>
              <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:420,margin:"0 auto 20px"})}>
                {[["🎯","HIGHER ou LOWER ?","Prédisez la direction du BTC"],["🤖","Algo RSI quantitatif","Momentum + Volume + RSI(14)"],["📊","Données Binance réelles","Chandelles 5 min en direct"],["🏆",`${ROUNDS} Manches rapides`,"Score humain vs algorithme IA"]].map(([ic,t,d])=>(
                  <div key={t as string} style={S({background:"rgba(255,255,255,0.04)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",padding:"12px"})}>
                    <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
                    <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.82)",marginBottom:2}}>{t}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"monospace"}}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={S({textAlign:"center"})}>
                <div style={S({fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.25)",marginBottom:12})}>Raccourcis : <span style={{color:"#10b981"}}>H</span> = HIGHER · <span style={{color:"#ef4444"}}>L</span> = LOWER · <span style={{color:"rgba(255,255,255,0.5)"}}>Entrée</span> = Suivant</div>
                <button type="button" onClick={startGame} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:10,padding:"14px 40px",borderRadius:14,fontWeight:900,fontSize:16,color:"#000",background:"linear-gradient(135deg,#facc15,#f97316)",border:"none"}}>🚀 Lancer le challenge</button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase==="loading"&&(
          <div style={S({background:"rgba(255,255,255,0.02)",borderRadius:20,border:"1px solid rgba(250,204,21,0.2)",padding:"60px",textAlign:"center"})}>
            <div style={S({display:"inline-flex",alignItems:"center",gap:12})}>
              <div style={S({width:20,height:20,borderRadius:"50%",border:"2px solid rgba(250,204,21,0.3)",borderTopColor:"#facc15",animation:"btcSpin 0.8s linear infinite"})}/>
              <span style={S({fontFamily:"monospace",color:"#facc15",fontSize:14})}>Connexion Binance API...</span>
            </div>
          </div>
        )}

        {/* PREDICT */}
        {phase==="predict"&&candles.length>0&&(
          <div>
            <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12})}>
              <div style={S({background:"rgba(255,255,255,0.03)",border:`1px solid ${hScore>0?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"10px 14px"})}>
                <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:2}}>VOUS</div>
                <div style={{fontSize:24,fontWeight:900,color:hScore>0?"#10b981":"rgba(255,255,255,0.75)"}}>{hScore}<span style={{fontSize:12,opacity:0.5,marginLeft:3}}>/{round}</span></div>
                {streak>0&&<div style={{fontSize:9,fontFamily:"monospace",color:"#facc15"}}>🔥 Série: {streak}</div>}
              </div>
              <div style={S({background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 14px",textAlign:"center"})}>
                <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:2}}>MANCHE</div>
                <div style={{fontSize:24,fontWeight:900,color:"rgba(255,255,255,0.8)"}}>{round+1}<span style={{fontSize:12,opacity:0.4}}>/{ROUNDS}</span></div>
                <div style={{display:"flex",gap:3,justifyContent:"center",marginTop:4}}>
                  {Array.from({length:ROUNDS}).map((_,i)=>(
                    <div key={i} style={{width:8,height:8,borderRadius:2,background:i<round?(log[i]?.hWon?"#10b981":"#ef4444"):i===round?"#facc15":"rgba(255,255,255,0.08)"}}/>
                  ))}
                </div>
              </div>
              <div style={S({background:"rgba(255,255,255,0.03)",border:`1px solid ${aiScore>0?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"10px 14px",textAlign:"right"})}>
                <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:2}}>ALGO IA</div>
                <div style={{fontSize:24,fontWeight:900,color:aiScore>0?"#00d4ff":"rgba(255,255,255,0.75)"}}>{aiScore}<span style={{fontSize:12,opacity:0.5,marginLeft:3}}>/{round}</span></div>
              </div>
            </div>
            <div style={S({background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"12px 14px",marginBottom:12,position:"relative"})}>
              <div style={S({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6})}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:"#10b981",display:"inline-block"}}/>
                  <span style={{fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,0.35)"}}>BTC/USDT · 5m · Binance</span>
                  <span style={{fontFamily:"monospace",fontSize:9,color:"rgba(250,204,21,0.5)",marginLeft:8}}>⋯ T+5min ?</span>
                </div>
                {cur&&prev2&&(
                  <div style={{color:cur.c>=prev2.c?"#10b981":"#ef4444"}}>
                    <span style={{fontFamily:"monospace",fontWeight:900,fontSize:16}}>${fmt(cur.c)}</span>
                    <span style={{fontFamily:"monospace",fontSize:10,marginLeft:6,opacity:0.7}}>{cur.c>=prev2.c?"▲":"▼"}{Math.abs((cur.c-prev2.c)/prev2.c*100).toFixed(3)}%</span>
                  </div>
                )}
              </div>
              <Chart candles={candles} winIdx={winIdx} replayIdx={0} phase="predict"/>
            </div>
            <div style={S({textAlign:"center",marginBottom:6})}>
              <div style={S({fontSize:12,fontFamily:"monospace",color:"rgba(255,255,255,0.4)",marginBottom:10,letterSpacing:2,textTransform:"uppercase"})}>Dans 5 minutes, le BTC sera...</div>
              <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr",gap:12})}>
                <button type="button" onClick={()=>choose("H")} style={{cursor:"pointer",background:"rgba(16,185,129,0.12)",border:"2.5px solid rgba(16,185,129,0.5)",borderRadius:20,padding:"26px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,color:"#10b981",fontWeight:900,boxShadow:"0 0 30px rgba(16,185,129,0.15)",transition:"all 0.15s"}}>
                  <span style={{fontSize:40}}>▲</span>
                  <span style={{fontSize:20,letterSpacing:4}}>HIGHER</span>
                  <span style={{fontSize:10,fontFamily:"monospace",opacity:0.55}}>Plus haut [H]</span>
                </button>
                <button type="button" onClick={()=>choose("L")} style={{cursor:"pointer",background:"rgba(239,68,68,0.12)",border:"2.5px solid rgba(239,68,68,0.5)",borderRadius:20,padding:"26px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,color:"#ef4444",fontWeight:900,boxShadow:"0 0 30px rgba(239,68,68,0.15)",transition:"all 0.15s"}}>
                  <span style={{fontSize:40}}>▼</span>
                  <span style={{fontSize:20,letterSpacing:4}}>LOWER</span>
                  <span style={{fontSize:10,fontFamily:"monospace",opacity:0.55}}>Plus bas [L]</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ANALYZING */}
        {phase==="analyzing"&&(
          <div>
            <div style={S({background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"12px 14px",marginBottom:12})}>
              <Chart candles={candles} winIdx={winIdx} replayIdx={0} phase="analyzing"/>
            </div>
            <div style={S({textAlign:"center",marginBottom:12})}>
              <div style={S({display:"inline-flex",alignItems:"center",gap:8,padding:"8px 20px",background:hChoice==="H"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",border:`1px solid ${hChoice==="H"?"rgba(16,185,129,0.5)":"rgba(239,68,68,0.5)"}`,borderRadius:10})}>
                <span style={{color:hChoice==="H"?"#10b981":"#ef4444",fontFamily:"monospace",fontWeight:700,fontSize:14}}>{hChoice==="H"?"▲ HIGHER":"▼ LOWER"} — Votre prédiction</span>
              </div>
            </div>
            <div style={S({background:"rgba(0,0,0,0.5)",border:"1px solid rgba(139,92,246,0.35)",borderRadius:16,padding:"20px 24px"})}>
              <div style={S({display:"flex",alignItems:"center",gap:8,marginBottom:14})}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#8b5cf6"}}/>
                <span style={{fontFamily:"monospace",fontSize:11,color:"#8b5cf6",letterSpacing:2}}>YOANN AI — ANALYZING...</span>
                <div style={{marginLeft:"auto",width:14,height:14,borderRadius:"50%",border:"2px solid rgba(139,92,246,0.3)",borderTopColor:"#8b5cf6",animation:"btcSpin 0.7s linear infinite"}}/>
              </div>
              <div style={S({fontFamily:"monospace",fontSize:12,display:"flex",flexDirection:"column",gap:7})}>
                {aiLines.slice(0,aiStep).map((line,i)=>(
                  <div key={i} style={{color:i===aiStep-1?"#00d4ff":"rgba(255,255,255,0.52)",display:"flex",alignItems:"flex-start",gap:8}}>
                    <span style={{color:"#8b5cf6",opacity:0.7,flexShrink:0}}>›</span>
                    <span>{line}</span>
                    {i===aiStep-1&&<span style={{color:"#00d4ff",animation:"btcBlink 0.5s steps(1) infinite",marginLeft:2}}>█</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REPLAY */}
        {phase==="replay"&&candles.length>0&&(
          <div>
            <div style={S({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10})}>
              <div style={S({fontFamily:"monospace",fontSize:11,color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",gap:6})}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#facc15",animation:"btcPulse 1s infinite",display:"inline-block"}}/>
                MARKET REPLAY · +{replayIdx*5}min
              </div>
              <div style={S({display:"flex",gap:12,fontFamily:"monospace",fontSize:11})}>
                <span style={{color:hChoice==="H"?"#10b981":"#ef4444"}}>Vous: {hChoice==="H"?"▲":"▼"}</span>
                <span style={{color:"rgba(0,212,255,0.8)"}}>IA: {aiChoice==="H"?"▲":"▼"} ({aiConf}%)</span>
              </div>
            </div>
            <div style={S({background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"12px 14px"})}>
              <Chart candles={candles} winIdx={winIdx} replayIdx={replayIdx} phase="replay"/>
            </div>
          </div>
        )}

        {/* ROUND RESULT */}
        {phase==="roundResult"&&candles.length>0&&(()=>{
          const hWon=hChoice===actual, aiWon=aiChoice===actual;
          return (
            <div>
              <div style={S({background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"12px 14px",marginBottom:12})}>
                <Chart candles={candles} winIdx={winIdx} replayIdx={REPLAY_N} phase="roundResult"/>
              </div>
              <div style={S({background:hWon?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${hWon?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.4)"}`,borderRadius:16,padding:"18px 24px",marginBottom:12,textAlign:"center"})}>
                <div style={{fontSize:36,marginBottom:6}}>{hWon?"✅":"❌"}</div>
                <div style={{fontSize:22,fontWeight:900,color:hWon?"#10b981":"#ef4444",marginBottom:4}}>{hWon?"YOU WERE RIGHT!":"YOU WERE WRONG"}</div>
                <div style={{fontFamily:"monospace",fontSize:14,color:actualPct>=0?"#10b981":"#ef4444"}}>BTC: {actualPct>=0?"▲":"▼"} {fmtPct(Math.abs(actualPct))} → {actual==="H"?"HIGHER ✓":"LOWER ✓"}</div>
              </div>
              <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12})}>
                <div style={S({background:hWon?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${hWon?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:12,padding:"14px",textAlign:"center"})}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:6}}>VOUS</div>
                  <div style={{fontSize:20,color:hChoice==="H"?"#10b981":"#ef4444",fontWeight:900}}>{hChoice==="H"?"▲ HIGHER":"▼ LOWER"}</div>
                  <div style={{fontSize:11,color:hWon?"#10b981":"#ef4444",marginTop:4}}>{hWon?"✓ Correct":"✗ Incorrect"}</div>
                </div>
                <div style={S({background:aiWon?"rgba(0,212,255,0.07)":"rgba(239,68,68,0.07)",border:`1px solid ${aiWon?"rgba(0,212,255,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:12,padding:"14px",textAlign:"center"})}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:6}}>ALGO IA ({aiConf}%)</div>
                  <div style={{fontSize:20,color:"#00d4ff",fontWeight:900}}>{aiChoice==="H"?"▲ HIGHER":"▼ LOWER"}</div>
                  <div style={{fontSize:11,color:aiWon?"#10b981":"#ef4444",marginTop:4}}>{aiWon?"✓ Correct":"✗ Incorrect"}</div>
                </div>
              </div>
              <div style={S({textAlign:"center"})}>
                <button type="button" onClick={nextRound} style={{cursor:"pointer",padding:"13px 40px",borderRadius:12,fontWeight:900,fontSize:15,color:"#000",background:"linear-gradient(135deg,#facc15,#f97316)",border:"none"}}>
                  {round+1>=ROUNDS?"Voir le résultat final →":`Manche ${round+2}/${ROUNDS} → [Entrée]`}
                </button>
              </div>
            </div>
          );
        })()}

        {/* FINAL */}
        {phase==="final"&&(()=>{
          const won=hScore>aiScore, hAcc=Math.round(hScore/ROUNDS*100), aiAcc=Math.round(aiScore/ROUNDS*100);
          return (
            <div style={S({background:"rgba(255,255,255,0.02)",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",overflow:"hidden"})}>
              <div style={S({padding:"36px 32px 28px",textAlign:"center",background:won?"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(0,212,255,0.04))":"linear-gradient(135deg,rgba(239,68,68,0.08),rgba(251,146,60,0.04))"})}>
                <div style={{fontSize:60,marginBottom:10}}>{won?"🏆":hScore===aiScore?"🤝":"🤖"}</div>
                <div style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.35)",letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>CHALLENGE COMPLETE</div>
                <h3 style={{fontSize:26,fontWeight:900,color:"rgba(255,255,255,0.92)",marginBottom:14}}>{won?"Vous battez l'algorithme !":hScore===aiScore?"Match nul — Égalité parfaite !":"L'algorithme vous domine"}</h3>
                <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:320,margin:"0 auto"})}>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"14px"}}>
                    <div style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:4}}>HUMAN</div>
                    <div style={{fontSize:32,fontWeight:900,color:won?"#10b981":"#ef4444"}}>{hAcc}%</div>
                    <div style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.35)"}}>{hScore}/{ROUNDS} · best: {best}</div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"14px"}}>
                    <div style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:4}}>AI</div>
                    <div style={{fontSize:32,fontWeight:900,color:"#00d4ff"}}>{aiAcc}%</div>
                    <div style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.35)"}}>{aiScore}/{ROUNDS} manches</div>
                  </div>
                </div>
              </div>
              <div style={S({padding:"20px 24px"})}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:8,textTransform:"uppercase",letterSpacing:2}}>Analyse des manches</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {log.map((r,i)=>(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"20px 1fr 90px 80px 65px",gap:8,alignItems:"center",padding:"6px 10px",borderRadius:8,background:r.hWon?"rgba(16,185,129,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${r.hWon?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.12)"}`}}>
                        <span style={{fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,0.3)"}}>#{i+1}</span>
                        <div style={{height:2,background:"rgba(255,255,255,0.08)",borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.abs(r.pct)*6000)}%`,background:r.pct>=0?"#10b981":"#ef4444"}}/></div>
                        <span style={{fontFamily:"monospace",fontSize:10,color:r.hWon?"#10b981":"#ef4444"}}>{r.hWon?"✓":"✗"} {r.hChoice==="H"?"HIGHER":"LOWER"}</span>
                        <span style={{fontFamily:"monospace",fontSize:10,color:r.aiWon?"#00d4ff":"rgba(255,255,255,0.3)"}}>IA:{r.aiChoice==="H"?"↑":"↓"}{r.aiWon?"✓":"✗"}</span>
                        <span style={{fontFamily:"monospace",fontSize:10,color:r.pct>=0?"#10b981":"#ef4444",textAlign:"right"}}>{fmtPct(r.pct)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 14px",marginBottom:14,fontFamily:"monospace",fontSize:10,color:"rgba(255,255,255,0.4)"}}>
                  Algo IA : RSI(14) + Momentum(5) + Volume trend → signal directionnel probabiliste
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button type="button" onClick={startGame} style={{cursor:"pointer",flex:1,padding:"13px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"rgba(255,255,255,0.65)",fontWeight:700,fontSize:14}}>🔄 Rejouer</button>
                  <button type="button" onClick={()=>document.querySelector("#contact")?.scrollIntoView({behavior:"smooth"})} style={{cursor:"pointer",flex:1,padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",color:"#000",fontWeight:900,fontSize:14}}>📩 Contacter Yoann</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <style>{`@keyframes btcSpin{to{transform:rotate(360deg)}}@keyframes btcBlink{0%,100%{opacity:1}50%{opacity:0}}@keyframes btcPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </section>
  );
}
