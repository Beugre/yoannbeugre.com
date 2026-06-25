"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockAchievement } from "@/lib/achievements";

function playTone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), dur * 1200);
  } catch { /* noop */ }
}
function playUp()  { [440, 554, 659].forEach((f, i) => setTimeout(() => playTone(f, 0.15, "sine", 0.1), i * 80)); }
function playDown(){ [440, 349, 262].forEach((f, i) => setTimeout(() => playTone(f, 0.15, "sawtooth", 0.08), i * 80)); }
function playWin() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.18, "sine", 0.12), i * 90)); }
function playLose(){ [300, 220].forEach((f, i) => setTimeout(() => playTone(f, 0.2, "sawtooth", 0.08), i * 110)); }

function confettiBurst(x: number, y: number) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none";
  document.body.appendChild(canvas); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d")!;
  const COLS = ["#f0b90b","#10b981","#3b82f6","#8b5cf6","#ef4444","#fff","#facc15"];
  const ps = Array.from({length:160}, () => ({
    x, y, vx: (Math.random()-0.5)*22, vy: -(Math.random()*18+4),
    c: COLS[Math.floor(Math.random()*COLS.length)],
    w: Math.random()*10+4, h: Math.random()*5+3,
    r: Math.random()*Math.PI*2, rv: (Math.random()-0.5)*0.35, l: 1
  }));
  const frame = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height); let alive = false;
    ps.forEach(p => {
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.65; p.vx*=0.97; p.l-=0.013; p.r+=p.rv;
      if (p.l > 0) { alive=true; ctx.save(); ctx.globalAlpha=p.l; ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore(); }
    });
    if (alive) requestAnimationFrame(frame); else document.body.removeChild(canvas);
  };
  requestAnimationFrame(frame);
}

interface Candle { o: number; h: number; l: number; c: number; v: number; }
type Choice = "UP" | "DOWN";
type Phase = "intro" | "loading" | "predict" | "analyzing" | "replay" | "result" | "final";
interface Round { choice: Choice; aiChoice: Choice; aiConf: number; actual: Choice; pct: number; won: boolean; }
interface GS { candles: Candle[]; winIdx: number; round: number; hScore: number; aiScore: number; log: Round[]; aiChoice: Choice; aiConf: number; aiLines: string[]; actual: Choice; actualPct: number; targetPrice: number; usedIdxs: number[]; }

const ROUNDS = 5;
const SHOW = 12;
const REPLAY_N = 6;

function fmt(n: number) { return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

async function loadCandles(interval = "5m"): Promise<Candle[]> {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=80`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error();
    const d: unknown[][] = await r.json();
    return d.map(k => ({ o: +String(k[1]), h: +String(k[2]), l: +String(k[3]), c: +String(k[4]), v: +String(k[5]) }));
  } catch {
    let p = 59500;
    return Array.from({length:80}, () => {
      const o = p, ch = (Math.random()-0.47)*280, c = Math.max(55000, o+ch);
      p = c; return { o, h: Math.max(o,c)+Math.random()*90, l: Math.min(o,c)-Math.random()*90, c, v: 20+Math.random()*80 };
    });
  }
}

function aiDecide(candles: Candle[], idx: number): { choice: Choice; conf: number; lines: string[] } {
  if (idx < 6) return { choice: "UP", conf: 55, lines: ["Analyse RSI...", "Analyse momentum...", "Analyse volume...", "Confluence...", "Prédiction: UP 55%"] };
  const slice = candles.slice(Math.max(0,idx-13), idx+1);
  const closes = slice.map(c => c.c);
  let g=0, l=0;
  for (let i=1; i<closes.length; i++) { const d=closes[i]-closes[i-1]; if(d>0)g+=d; else l-=d; }
  const avg = closes.length-1||1;
  const rsi = l===0 ? 100 : 100-100/(1+(g/avg)/(l/avg));
  const mom = candles[idx].c - candles[Math.max(0,idx-4)].c;
  const vol = slice.slice(-3).reduce((a,c)=>a+c.v,0)/3;
  const avgVol = slice.reduce((a,c)=>a+c.v,0)/slice.length;
  const vt = vol/(avgVol||1);
  let bull=0, bear=0;
  if(rsi<40)bull+=2; else if(rsi<48)bull+=1;
  if(rsi>60)bear+=2; else if(rsi>52)bear+=1;
  if(mom>200)bull+=2; else if(mom>50)bull+=1;
  if(mom<-200)bear+=2; else if(mom<-50)bear+=1;
  if(vt>1.3&&mom>0)bull+=1; if(vt>1.3&&mom<0)bear+=1;
  const choice: Choice = bull>=bear?"UP":"DOWN";
  const conf = Math.min(88, 52+Math.abs(bull-bear)*10);
  return { choice, conf, lines: [
    `RSI(14): ${rsi.toFixed(1)} → ${rsi<40?"Oversold ↑":rsi>60?"Overbought ↓":"Neutre →"}`,
    `Momentum(5): ${mom>=0?"+":""}${mom.toFixed(0)} USDT ${mom>0?"↑":"↓"}`,
    `Volume: ${((vt-1)*100).toFixed(0)}% ${vt>1?"au-dessus":"en-dessous"} moyenne`,
    `Confluence: ${bull} bull / ${bear} bear signal${bull+bear>1?"s":""}`,
    `Prédiction verrouillée: ${choice==="UP"?"↑ UP":"↓ DOWN"} (${conf}%)`,
  ]};
}

function pickIdx(candles: Candle[], used: number[]): number {
  const pool: number[] = [];
  for (let i=SHOW+2; i<candles.length-REPLAY_N-2; i++) if(!used.includes(i)) pool.push(i);
  return pool.length ? pool[Math.floor(Math.random()*pool.length)] : SHOW+5;
}

function Chart({ candles, winIdx, replayN, showReplay, animKey }: { candles: Candle[]; winIdx: number; replayN: number; showReplay: boolean; animKey: number }) {
  const hist = candles.slice(Math.max(0,winIdx-SHOW), winIdx+1);
  const repl = showReplay ? candles.slice(winIdx+1, winIdx+1+Math.min(replayN, REPLAY_N)) : [];
  const all = [...hist, ...repl];
  const full = candles.slice(Math.max(0,winIdx-SHOW), winIdx+1+REPLAY_N);
  const lo = Math.min(...full.map(c=>c.l))*0.9996;
  const hi = Math.max(...full.map(c=>c.h))*1.0004;
  const rng = hi-lo||1;
  const W=700,H=155,VH=20,ML=50,MR=6,MT=6,MB=2;
  const IW=W-ML-MR, IH=H-MT-MB-VH-4;
  const total=SHOW+1+REPLAY_N;
  const px=(i:number)=>ML+(i+0.5)/total*IW;
  const py=(v:number)=>MT+IH-((v-lo)/rng)*IH;
  const cw=Math.max(3,(IW/total)*0.5);
  const last=all[all.length-1];
  const tgt=hist[hist.length-1].c;
  const nowX=px(SHOW);
  const up=last?last.c>=tgt:true;
  const ticks=[0.25,0.5,0.75].map(r=>lo+r*rng);
  // Smooth bezier curve (Polymarket style)
  let linePts = `M${px(0)},${py(all[0].c)}`;
  for (let i = 1; i < all.length; i++) {
    const cpx = (px(i - 1) + px(i)) / 2;
    linePts += ` C${cpx},${py(all[i-1].c)} ${cpx},${py(all[i].c)} ${px(i)},${py(all[i].c)}`;
  }

  const clipId = `clip-${animKey}`;
  const dur = showReplay ? `${REPLAY_N * 0.4}s` : "1.1s";
  const rightEdge = px(all.length - 1) + 10;

  return (
    <svg viewBox={`0 0 ${W} ${H+VH}`} className="w-full" style={{height:180}} preserveAspectRatio="none">
      <defs>
        <filter id="glw"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up?"rgba(240,185,11,0.2)":"rgba(239,68,68,0.15)"}/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        {/* ClipPath rectangle that slides from left to right — THE smooth reveal technique */}
        <clipPath id={clipId}>
          <rect x={ML} y={0} height={H+VH} width={0}>
            <animate
              attributeName="width"
              from="0"
              to={String(rightEdge - ML + 20)}
              dur={dur}
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
            />
          </rect>
        </clipPath>
      </defs>
      {ticks.map((v,i)=>(
        <g key={i}>
          <line x1={ML} y1={py(v)} x2={W-MR} y2={py(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
          <text x={ML-3} y={py(v)+3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">{(v/1000).toFixed(1)}k</text>
        </g>
      ))}
      {all.map((c,i)=>{
        const maxV=Math.max(...all.map(x=>x.v))||1;
        const vh=(c.v/maxV)*VH;
        return <rect key={`v${i}`} x={px(i)-cw/2} y={H-MB-vh} width={cw} height={vh} fill={c.c>=c.o?"rgba(240,185,11,0.22)":"rgba(239,68,68,0.18)"} rx="0.3"/>;
      })}
      {all.map((c,i)=>{
        const x=px(i),up2=c.c>=c.o;
        const col=i>SHOW?"rgba(240,185,11,0.45)":(up2?"rgba(240,185,11,0.35)":"rgba(239,68,68,0.35)");
        const bT=py(Math.max(c.o,c.c)),bH=Math.max(1,Math.abs(py(c.o)-py(c.c)));
        return <g key={i}><line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth="0.6" opacity="0.5"/><rect x={x-cw/2} y={bT} width={cw} height={bH} fill={col} rx="0.3"/></g>;
      })}
      {all.length>1&&(
        /* Apply clip to the line + fill group */
        <g clipPath={`url(#${clipId})`} key={`grp-${animKey}-${all.length}`}>
          <path d={linePts+` L${px(all.length-1)},${H-MB-VH} L${px(0)},${H-MB-VH} Z`} fill="url(#ag)"/>
          <path d={linePts} fill="none" stroke="#f0b90b" strokeWidth="2.2" filter="url(#glw)" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx={px(all.length-1)} cy={py(last.c)} r="4" fill="#f0b90b" filter="url(#glw)">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>
      )}
      <line x1={ML} y1={py(tgt)} x2={W-MR} y2={py(tgt)} stroke="rgba(240,185,11,0.45)" strokeWidth="1" strokeDasharray="4,3"/>
      <rect x={W-MR-54} y={py(tgt)-7} width={56} height={14} rx="2.5" fill="rgba(240,185,11,0.12)" stroke="rgba(240,185,11,0.5)" strokeWidth="0.5"/>
      <text x={W-MR-27} y={py(tgt)+3.5} textAnchor="middle" fill="#f0b90b" fontSize="7.5" fontFamily="monospace" fontWeight="bold">Target</text>
      <line x1={nowX} y1={MT} x2={nowX} y2={H-MB-VH} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" strokeDasharray="3,2"/>
      <text x={nowX} y={MT-2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6.5" fontFamily="monospace">NOW</text>
    </svg>
  );
}

function Timer({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds/60).toString().padStart(2,"0");
  const s = (seconds%60).toString().padStart(2,"0");
  const color = seconds>120?"#10b981":seconds>60?"#f0b90b":"#ef4444";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:3}}>
        <span style={{fontSize:30,fontWeight:900,fontFamily:"monospace",color,lineHeight:1}}>{m}</span>
        <span style={{fontSize:13,fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>MIN</span>
        <span style={{fontSize:30,fontWeight:900,fontFamily:"monospace",color,lineHeight:1,marginLeft:4}}>{s}</span>
        <span style={{fontSize:13,fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>SECS</span>
      </div>
      <div style={{width:70,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden",marginTop:3}}>
        <div style={{height:"100%",width:`${Math.min(100,(1-seconds/300)*100)}%`,background:color,transition:"width 1s linear",borderRadius:2}}/>
      </div>
    </div>
  );
}

const INIT: GS = {candles:[],winIdx:0,round:0,hScore:0,aiScore:0,log:[],aiChoice:"UP",aiConf:55,aiLines:[],actual:"UP",actualPct:0,targetPrice:0,usedIdxs:[]};

export default function BTCPredictionChallenge() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [gs, setGs] = useState<GS>(INIT);
  const [timer, setTimer] = useState(300);
  const [replayIdx, setReplayIdx] = useState(0);
  const [aiStep, setAiStep] = useState(0);
  const [hChoice, setHChoice] = useState<Choice|null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("5m");
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const aiRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const replayRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (phase==="predict") {
      setTimer(300);
      timerRef.current = setInterval(() => setTimer(t => t<=1 ? (clearInterval(timerRef.current!), 0) : t-1), 1000);
      const kh = (e:KeyboardEvent) => { if(phaseRef.current!=="predict") return; if(e.key==="ArrowUp"||e.key==="u"||e.key==="U") doPick("UP"); if(e.key==="ArrowDown"||e.key==="d"||e.key==="D") doPick("DOWN"); };
      window.addEventListener("keydown",kh);
      return () => { clearInterval(timerRef.current!); window.removeEventListener("keydown",kh); };
    }
    if (phase==="analyzing") {
      setAiStep(0); let s=0;
      aiRef.current = setInterval(()=>{ s++; setAiStep(s); if(s>=5){ clearInterval(aiRef.current!); setTimeout(()=>{ setReplayIdx(0); setPhase("replay"); },600); }},420);
      return ()=>clearInterval(aiRef.current!);
    }
    if (phase==="replay") {
      replayRef.current = setInterval(()=>setReplayIdx(prev=>{ const n=prev+1; if(n>=REPLAY_N){ clearInterval(replayRef.current!); setTimeout(()=>setPhase("result"),400); return REPLAY_N; } return n; }), 400);
      return ()=>clearInterval(replayRef.current!);
    }
    if (phase==="result") {
      const won = hChoice===gs.actual;
      won ? (playWin(), confettiBurst(window.innerWidth/2,window.innerHeight*0.4)) : playLose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startGame = async (tf = timeframe) => {
    setLoading(true);
    const candles = await loadCandles(tf);
    const wi = pickIdx(candles,[]);
    const {choice:aiChoice,conf:aiConf,lines:aiLines} = aiDecide(candles,wi);
    const nxt = candles[wi+1]; const pct = nxt?(nxt.c-candles[wi].c)/candles[wi].c:0;
    setGs({...INIT,candles,winIdx:wi,aiChoice,aiConf,aiLines,actual:pct>=0?"UP":"DOWN",actualPct:pct,targetPrice:candles[wi].c});
    setHChoice(null); setReplayIdx(0); setAiStep(0); setAnimKey(k=>k+1); setLoading(false); setPhase("predict");
  };

  const changeTimeframe = async (tf: string) => {
    setTimeframe(tf);
    if (phase==="intro") return;
    // Reload candles with new timeframe if already playing
    setLoading(true);
    const candles = await loadCandles(tf);
    setGs(g => ({...g, candles}));
    setAnimKey(k=>k+1);
    setLoading(false);
  };

  const doPick = useCallback((ch: Choice) => {
    if(phaseRef.current!=="predict") return;
    ch==="UP" ? playUp() : playDown();
    setHChoice(ch); clearInterval(timerRef.current!); setPhase("analyzing");
  },[]);

  const nextRound = () => {
    const won = hChoice===gs.actual;
    const nr = gs.round+1;
    const newLog = [...gs.log, {choice:hChoice!,aiChoice:gs.aiChoice,aiConf:gs.aiConf,actual:gs.actual,pct:gs.actualPct,won}];
    const hScore=gs.hScore+(won?1:0), aiScore=gs.aiScore+(gs.aiChoice===gs.actual?1:0);
    if(nr>=ROUNDS){
      setGs(g=>({...g,log:newLog,hScore,aiScore,round:nr}));
      setTimeout(()=>{ setPhase("final"); unlockAchievement("TRADE_DONE"); if(hScore>aiScore)unlockAchievement("TRADE_WIN"); },50);
      return;
    }
    const usedIdxs=[...gs.usedIdxs,gs.winIdx];
    const wi=pickIdx(gs.candles,usedIdxs);
    const {choice:aiChoice,conf:aiConf,lines:aiLines}=aiDecide(gs.candles,wi);
    const nxt=gs.candles[wi+1]; const pct=nxt?(nxt.c-gs.candles[wi].c)/gs.candles[wi].c:0;
    setGs(g=>({...g,log:newLog,hScore,aiScore,round:nr,winIdx:wi,aiChoice,aiConf,aiLines,actual:pct>=0?"UP":"DOWN",actualPct:pct,targetPrice:gs.candles[wi].c,usedIdxs}));
    setHChoice(null); setReplayIdx(0); setAiStep(0); setTimeout(()=>setPhase("predict"),50);
  };

  const cur = gs.candles[gs.winIdx];
  const prevC = gs.candles[gs.winIdx-1];
  const delta = cur&&prevC ? cur.c-prevC.c : 0;
  const won = hChoice===gs.actual;

  return (
    <section id="trade" className="relative py-20 px-4">
      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 70% 50% at 50% 100%,rgba(240,185,11,0.04),transparent)"}}/>
      <div style={{maxWidth:800,margin:"0 auto",position:"relative",zIndex:1}}>

        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
            <div style={{height:1,width:36,background:"linear-gradient(90deg,transparent,rgba(240,185,11,0.7))"}}/>
            <span style={{fontFamily:"monospace",fontSize:10,color:"#f0b90b",letterSpacing:4,textTransform:"uppercase"}}>Challenge Arena</span>
            <div style={{height:1,width:36,background:"linear-gradient(90deg,rgba(240,185,11,0.7),transparent)"}}/>
          </div>
          <h2 style={{fontSize:"clamp(24px,4vw,40px)",fontWeight:900,color:"rgba(255,255,255,0.92)",marginBottom:4}}>BTC Prediction Challenge</h2>
          <p style={{color:"rgba(255,255,255,0.35)",fontSize:13,fontFamily:"monospace"}}>Données réelles Binance · ↑ UP ou ↓ DOWN dans 5 minutes</p>
        </div>

        {/* INTRO */}
        {phase==="intro"&&(
          <div style={{background:"rgba(14,14,20,0.98)",border:"1px solid rgba(240,185,11,0.2)",borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{width:42,height:42,borderRadius:10,background:"#f0b90b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#000",flexShrink:0}}>₿</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"rgba(255,255,255,0.88)"}}>BTC vers le haut ou vers le bas — 5 min</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",fontFamily:"monospace"}}>Binance · BTC/USDT · Live data</div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                {(["5m","15m","1h","1d"] as const).map((tf,i)=>{
                  const labels=["5 min","15 min","1 heure","1 jour"];
                  const active=timeframe===tf;
                  return <button key={tf} type="button" onClick={()=>changeTimeframe(tf)} style={{cursor:"pointer",padding:"4px 10px",borderRadius:20,border:`1px solid ${active?"rgba(240,185,11,0.4)":"rgba(255,255,255,0.1)"}`,background:active?"rgba(240,185,11,0.1)":"transparent",color:active?"#f0b90b":"rgba(255,255,255,0.4)",fontSize:11,fontFamily:"monospace"}}>{labels[i]}</button>;
                })}
              </div>
            </div>
            <div style={{padding:"20px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                {[["🎯","Prédisez UP ou DOWN","Direction BTC dans 5 min"],["🤖","Algo RSI vs vous","Momentum + Volume + RSI(14)"],["📊","Données Binance réelles","Chandelles 5m historiques"],["🏆",`${ROUNDS} manches rapides`,"Score humain vs algorithme IA"]].map(([ic,t,d])=>(
                  <div key={t as string} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px"}}>
                    <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
                    <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>{t}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"monospace",marginTop:2}}>{d}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                <div style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:10,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:900,color:"#10b981"}}>↑ UP</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"monospace",marginTop:2}}>Touche ↑ ou U</div>
                </div>
                <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:900,color:"#ef4444"}}>↓ DOWN</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"monospace",marginTop:2}}>Touche ↓ ou D</div>
                </div>
              </div>
              <button type="button" onClick={() => startGame()} disabled={loading}
                style={{cursor:"pointer",width:"100%",padding:"15px",borderRadius:10,fontWeight:900,fontSize:16,color:"#000",background:loading?"#888":"linear-gradient(135deg,#f0b90b,#f97316)",border:"none"}}>
                {loading?"⏳ Connexion Binance...":"▶ Lancer le challenge"}
              </button>
            </div>
          </div>
        )}

        {/* PLAYING */}
        {(phase==="predict"||phase==="analyzing"||phase==="replay")&&cur&&(
          <div style={{background:"rgba(10,10,15,0.98)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{width:34,height:34,borderRadius:8,background:"#f0b90b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#000",flexShrink:0}}>₿</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.85)"}}>BTC vers le haut ou vers le bas — 5 min</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:"monospace"}}>Round {gs.round+1}/{ROUNDS} · Vous {gs.hScore} — IA {gs.aiScore}</div>
              </div>
              <div style={{display:"flex",gap:4}}>
                {Array.from({length:ROUNDS}).map((_,i)=>{
                  const h=gs.log[i]; const done=i<gs.round;
                  return <div key={i} style={{width:8,height:8,borderRadius:2,background:done?(h?.won?"#10b981":"#ef4444"):i===gs.round?"#f0b90b":"rgba(255,255,255,0.1)"}}/>;
                })}
              </div>
            </div>

            {/* Price row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div>
                <div style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:1}}>Prix à battre</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:"rgba(255,255,255,0.5)"}}>${fmt(gs.targetPrice)}</div>
              </div>
              {phase==="predict"&&<Timer seconds={timer}/>}
              {(phase==="analyzing"||phase==="replay")&&(
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(240,185,11,0.7)",marginBottom:3}}>{phase==="analyzing"?"YOANN AI ANALYZING...":"MARKET REPLAY"}</div>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#f0b90b",margin:"0 auto",animation:"btcPulse 0.7s infinite"}}/>
                </div>
              )}
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:1}}>Prix actuel</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:"monospace",color:delta>=0?"#10b981":"#ef4444"}}>
                  ${fmt(cur.c)}&nbsp;<span style={{fontSize:11}}>{delta>=0?"▲":"▼"}{Math.abs(delta).toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{padding:"6px 14px 2px",background:"rgba(6,6,10,0.7)"}}>
              <Chart candles={gs.candles} winIdx={gs.winIdx} replayN={replayIdx} showReplay={phase==="replay"} animKey={animKey}/>
            </div>

            {/* Time tabs */}
            <div style={{display:"flex",gap:4,padding:"8px 16px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
              {(["5m","15m","1h","1d"] as const).map((tf,i)=>{
                const labels=["5 min","15 min","1 heure","1 jour"];
                const active=timeframe===tf;
                return <button key={tf} type="button" onClick={()=>changeTimeframe(tf)} style={{cursor:"pointer",padding:"3px 10px",borderRadius:20,border:`1px solid ${active?"rgba(240,185,11,0.4)":"rgba(255,255,255,0.07)"}`,background:active?"rgba(240,185,11,0.1)":"transparent",color:active?"#f0b90b":"rgba(255,255,255,0.3)",fontSize:10,fontFamily:"monospace"}}>{labels[i]}</button>;
              })}
            </div>

            {/* UP/DOWN buttons */}
            {phase==="predict"&&(
              <div style={{padding:"12px 16px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button type="button" onClick={()=>doPick("UP")}
                  style={{cursor:"pointer",background:"#10b981",borderRadius:10,padding:"16px 12px",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",color:"#000",fontWeight:900,fontSize:17,boxShadow:"0 4px 20px rgba(16,185,129,0.3)"}}>
                  <span>↑ UP</span>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:19,fontWeight:900}}>35¢</div>
                    <div style={{fontSize:9,opacity:0.7}}>si vous gagnez</div>
                  </div>
                </button>
                <button type="button" onClick={()=>doPick("DOWN")}
                  style={{cursor:"pointer",background:"rgba(28,28,36,0.9)",borderRadius:10,padding:"16px 12px",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between",color:"rgba(255,255,255,0.55)",fontWeight:700,fontSize:17}}>
                  <span>↓ DOWN</span>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:19,fontWeight:700}}>6¢</div>
                    <div style={{fontSize:9,opacity:0.5}}>si vous gagnez</div>
                  </div>
                </button>
              </div>
            )}

            {/* Analyzing */}
            {phase==="analyzing"&&(
              <div style={{padding:"12px 16px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:hChoice==="UP"?"#10b981":"#ef4444"}}>Votre choix: {hChoice==="UP"?"↑ UP":"↓ DOWN"}</span>
                  <span style={{marginLeft:"auto",fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,0.3)"}}>YOANN AI en analyse...</span>
                </div>
                <div style={{background:"rgba(0,0,0,0.6)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:10,padding:"12px 14px"}}>
                  {gs.aiLines.slice(0,aiStep).map((line,i)=>(
                    <div key={i} style={{fontFamily:"monospace",fontSize:11,color:i===aiStep-1?"#00d4ff":"rgba(255,255,255,0.4)",display:"flex",gap:6,marginBottom:3}}>
                      <span style={{color:"#8b5cf6"}}>›</span><span>{line}</span>
                      {i===aiStep-1&&<span style={{color:"#00d4ff",animation:"btcBlink 0.5s steps(1) infinite"}}>█</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Replay label */}
            {phase==="replay"&&(
              <div style={{padding:"8px 16px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#f0b90b",animation:"btcPulse 0.7s infinite"}}/>
                  <span style={{fontFamily:"monospace",fontSize:10,color:"rgba(240,185,11,0.8)"}}>MARKET REPLAY · +{replayIdx*5} min</span>
                </div>
                <div style={{display:"flex",gap:12,fontFamily:"monospace",fontSize:10}}>
                  <span style={{color:hChoice==="UP"?"#10b981":"#ef4444"}}>{hChoice==="UP"?"↑":"↓"} Vous</span>
                  <span style={{color:"rgba(0,212,255,0.7)"}}>IA: {gs.aiChoice==="UP"?"↑":"↓"} ({gs.aiConf}%)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {phase==="result"&&(
          <div style={{background:"rgba(10,10,15,0.98)",border:`1px solid ${won?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.25)"}`,borderRadius:16,overflow:"hidden"}}>
            <div style={{padding:"24px 20px",textAlign:"center",background:won?"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(0,212,255,0.04))":"linear-gradient(135deg,rgba(239,68,68,0.09),rgba(251,146,60,0.04))"}}>
              <div style={{fontSize:52,marginBottom:8}}>{won?"✅":"❌"}</div>
              <div style={{fontSize:25,fontWeight:900,color:won?"#10b981":"#ef4444"}}>{won?"YOU WERE RIGHT !":"YOU WERE WRONG"}</div>
              <div style={{fontFamily:"monospace",fontSize:13,color:"rgba(255,255,255,0.45)",marginTop:5}}>
                BTC {gs.actualPct>=0?"▲ UP":"▼ DOWN"} · {gs.actualPct>=0?"+":""}{(gs.actualPct*100).toFixed(3)}%
              </div>
            </div>
            <div style={{padding:"14px 20px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${won?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.18)"}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:4}}>VOUS</div>
                  <div style={{fontSize:20,fontWeight:900,color:won?"#10b981":"#ef4444"}}>{hChoice==="UP"?"↑ UP":"↓ DOWN"}</div>
                  <div style={{fontSize:11,color:won?"#10b981":"#ef4444",marginTop:3}}>{won?"✓ Correct":"✗ Incorrect"}</div>
                </div>
                <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${gs.aiChoice===gs.actual?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:4}}>YOANN AI · {gs.aiConf}%</div>
                  <div style={{fontSize:20,fontWeight:900,color:"#00d4ff"}}>{gs.aiChoice==="UP"?"↑ UP":"↓ DOWN"}</div>
                  <div style={{fontSize:11,color:gs.aiChoice===gs.actual?"#10b981":"#ef4444",marginTop:3}}>{gs.aiChoice===gs.actual?"✓ Correct":"✗ Incorrect"}</div>
                </div>
              </div>
              <button type="button" onClick={nextRound}
                style={{cursor:"pointer",width:"100%",padding:"13px",borderRadius:10,fontWeight:900,fontSize:15,color:"#000",background:"linear-gradient(135deg,#f0b90b,#f97316)",border:"none"}}>
                {gs.round+1>=ROUNDS?"Voir le résultat final →":`Manche ${gs.round+2}/${ROUNDS} →`}
              </button>
            </div>
          </div>
        )}

        {/* FINAL */}
        {phase==="final"&&(()=>{
          const hAcc=Math.round(gs.hScore/ROUNDS*100), aiAcc=Math.round(gs.aiScore/ROUNDS*100), won2=gs.hScore>gs.aiScore;
          return (
            <div style={{background:"rgba(10,10,15,0.98)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"32px 24px",textAlign:"center",background:won2?"linear-gradient(135deg,rgba(16,185,129,0.09),rgba(0,212,255,0.04))":"linear-gradient(135deg,rgba(239,68,68,0.07),rgba(251,146,60,0.04))"}}>
                <div style={{fontSize:58,marginBottom:10}}>{won2?"🏆":gs.hScore===gs.aiScore?"🤝":"🤖"}</div>
                <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>CHALLENGE COMPLETE</div>
                <h3 style={{fontSize:24,fontWeight:900,color:"rgba(255,255,255,0.92)"}}>{won2?"Vous battez l'algorithme !":gs.hScore===gs.aiScore?"Match nul !":"L'IA vous domine"}</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:260,margin:"14px auto 0"}}>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"12px"}}>
                    <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:2}}>HUMAIN</div>
                    <div style={{fontSize:32,fontWeight:900,color:won2?"#10b981":"#ef4444"}}>{hAcc}%</div>
                    <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>{gs.hScore}/{ROUNDS}</div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"12px"}}>
                    <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:2}}>YOANN AI</div>
                    <div style={{fontSize:32,fontWeight:900,color:"#00d4ff"}}>{aiAcc}%</div>
                    <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>{gs.aiScore}/{ROUNDS}</div>
                  </div>
                </div>
              </div>
              <div style={{padding:"16px 20px"}}>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",marginBottom:8,textTransform:"uppercase",letterSpacing:2}}>Résumé des manches</div>
                  {gs.log.map((r,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"20px 80px 1fr 70px 55px",gap:8,alignItems:"center",padding:"5px 10px",marginBottom:4,borderRadius:8,background:r.won?"rgba(16,185,129,0.05)":"rgba(239,68,68,0.04)",border:`1px solid ${r.won?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.1)"}`}}>
                      <span style={{fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,0.25)"}}>#{i+1}</span>
                      <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:r.won?"#10b981":"#ef4444"}}>{r.won?"✓":"✗"} {r.choice}</span>
                      <div style={{height:2,background:"rgba(255,255,255,0.06)",borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.abs(r.pct)*5000)}%`,background:r.pct>=0?"#10b981":"#ef4444"}}/></div>
                      <span style={{fontFamily:"monospace",fontSize:10,color:r.pct>=0?"#10b981":"#ef4444",textAlign:"right"}}>{r.pct>=0?"+":""}{(r.pct*100).toFixed(3)}%</span>
                      <span style={{fontFamily:"monospace",fontSize:9,color:"rgba(0,212,255,0.55)",textAlign:"right"}}>IA:{r.aiChoice==="UP"?"↑":"↓"}{r.aiChoice===r.actual?"✓":"✗"}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,0.2)",textAlign:"center",borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:10,marginBottom:12}}>
                  Algo: RSI(14) + Momentum(5) + Volume · Données Binance réelles
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button type="button" onClick={() => startGame()} style={{cursor:"pointer",flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.14)",background:"transparent",color:"rgba(255,255,255,0.65)",fontWeight:700,fontSize:14}}>🔄 Rejouer</button>
                  <button type="button" onClick={()=>document.querySelector("#contact")?.scrollIntoView({behavior:"smooth"})} style={{cursor:"pointer",flex:1,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f0b90b,#f97316)",color:"#000",fontWeight:900,fontSize:14}}>📩 Contacter Yoann</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <style>{`@keyframes btcBlink{0%,100%{opacity:1}50%{opacity:0}}@keyframes btcPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.75)}}@keyframes drawBTCLine{to{stroke-dashoffset:0}}`}</style>
    </section>
  );
}
