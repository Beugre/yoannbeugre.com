"use client";
import { useState } from "react";

const QUESTIONS = [
  { q:"SQL query prenant 8s sur 1M lignes. Que vérifiez-vous en premier ?", opts:["Indexes manquants","Couleur du bouton","Taille du logo","Police de caractères"], answer:0, exp:"Les indexes sont le premier levier de performance SQL. Un full table scan sur 1M lignes sans index = catastrophique. Analyse du plan d'exécution → CREATE INDEX sur les colonnes filtrées." },
  { q:"Le WebSocket Binance se déconnecte aléatoirement. Quelle est la solution ?", opts:["Logique de reconnexion automatique","Redémarrer le serveur","Vider le cache","Changer la police du dashboard"], answer:0, exp:"Les WebSockets nécessitent une gestion robuste des déconnexions : ping/pong keepalive, reconnect avec backoff exponentiel, et file d'attente des messages manqués pendant la reconnexion." },
  { q:"Python bot crash avec MemoryError sur large dataset. Que faire ?", opts:["Streaming + processing par chunks","Acheter plus de RAM","Supprimer les logs","Redémarrer Python"], answer:0, exp:"Charger 10M lignes en mémoire = antipattern. Solution : pandas read_csv(chunksize=10000), générateurs Python, ou traitement streaming. La RAM est une ressource limitée à optimiser, pas à acheter." },
  { q:"Le bot achète au mauvais prix. Cause probable ?", opts:["Slippage non géré","Problème de base de données","CSS mal rendu","Firewall actif"], answer:0, exp:"Le slippage est la différence entre prix demandé et prix exécuté. En trading haute fréquence, utiliser des ordres LIMIT (pas MARKET), gérer les queues de prix, et intégrer le slippage dans le backtest." },
  { q:"L'agent LLM donne des réponses incohérentes. Premier fix ?", opts:["Améliorer le system prompt","Changer la couleur du chatbot","Ajouter du CSS","Redémarrer le WiFi"], answer:0, exp:"90% des problèmes LLM viennent du prompt. Un bon system prompt définit le rôle, le contexte, les contraintes, le format de sortie, et des exemples (few-shot). Prompt engineering = fondation de l'IA fiable." },
  { q:"Migration DB cause 2h de downtime. Comment l'éviter ?", opts:["Blue-green deployment","Serveur plus puissant","Meilleur favicon","Plus de RAM"], answer:0, exp:"Blue-green deployment : on lance la nouvelle version en parallèle (green), on bascule le trafic instantanément, on garde l'ancienne version en stand-by. Zero downtime. Pattern standard en production." },
];

export default function DebugSystem() {
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === QUESTIONS[qi].answer) setScore(s => s+1);
  };

  const next = () => {
    if (qi + 1 >= QUESTIONS.length) { setDone(true); return; }
    setQi(q => q+1); setSelected(null);
  };

  const reset = () => { setQi(0); setSelected(null); setScore(0); setDone(false); };

  const q = QUESTIONS[qi];
  const pct = Math.round(score / QUESTIONS.length * 100);

  const S=(o:React.CSSProperties)=>o;

  return (
    <section id="debug" className="relative py-12 md:py-24 px-4 md:px-6">
      <div style={S({position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 50% 100%,rgba(16,185,129,0.04),transparent)",pointerEvents:"none"})}/>
      <div style={S({maxWidth:680,margin:"0 auto",position:"relative",zIndex:1})}>

        <div style={S({textAlign:"center",marginBottom:24})}>
          <div style={S({display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:8})}>
            <div style={S({height:1,width:40,background:"linear-gradient(90deg,transparent,rgba(16,185,129,0.6))"})}/>
            <span style={S({fontFamily:"monospace",fontSize:10,color:"#10b981",letterSpacing:4,textTransform:"uppercase"})}>Challenge Arena</span>
            <div style={S({height:1,width:40,background:"linear-gradient(90deg,rgba(16,185,129,0.6),transparent)"})}/>
          </div>
          <h2 style={S({fontSize:"clamp(24px,4vw,40px)",fontWeight:900,color:"rgba(255,255,255,0.92)",marginBottom:4})}>Debug The System</h2>
          <p style={S({color:"rgba(255,255,255,0.35)",fontSize:13})}>Un module est en panne · Diagnostiquez comme un senior dev</p>
        </div>

        {!done ? (
          <div style={S({background:"rgba(255,255,255,0.025)",borderRadius:20,border:"1px solid rgba(16,185,129,0.2)",overflow:"hidden"})}>
            {/* Progress */}
            <div style={{background:"rgba(0,0,0,0.3)",padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{display:"flex",gap:4}}>
                {QUESTIONS.map((_,i)=>(
                  <div key={i} style={{width:28,height:4,borderRadius:2,background:i<qi?(i<qi?( QUESTIONS[i].answer===0?"#10b981":"#ef4444"):"#10b981"):i===qi?"#facc15":"rgba(255,255,255,0.1)"}}/>
                ))}
              </div>
              <span style={{fontFamily:"monospace",fontSize:10,color:"rgba(255,255,255,0.4)",marginLeft:"auto"}}>Q{qi+1}/{QUESTIONS.length}</span>
            </div>

            <div style={{padding:"24px 28px"}}>
              {/* Error badge */}
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,marginBottom:16}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",animation:"btcPulse 1s infinite",display:"inline-block"}}/>
                <span style={{fontFamily:"monospace",fontSize:10,color:"#ef4444",letterSpacing:1}}>SYSTEM ERROR DETECTED</span>
              </div>

              <div style={{fontSize:17,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:20,lineHeight:1.5}}>{q.q}</div>

              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {q.opts.map((opt,i)=>{
                  const isAnswer=i===q.answer, isSelected=i===selected, revealed=selected!==null;
                  let bg="rgba(255,255,255,0.03)", border="1px solid rgba(255,255,255,0.1)", color="rgba(255,255,255,0.7)";
                  if(revealed){
                    if(isAnswer){bg="rgba(16,185,129,0.12)";border="1px solid rgba(16,185,129,0.5)";color="#10b981";}
                    else if(isSelected&&!isAnswer){bg="rgba(239,68,68,0.1)";border="1px solid rgba(239,68,68,0.4)";color="#ef4444";}
                  } else if(isSelected){bg="rgba(139,92,246,0.1)";border="1px solid rgba(139,92,246,0.4)";color="#a78bfa";}
                  return (
                    <button key={i} type="button" onClick={()=>choose(i)} style={{cursor:selected!==null?"default":"pointer",background:bg,border,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${revealed&&isAnswer?"#10b981":revealed&&isSelected&&!isAnswer?"#ef4444":"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {revealed&&isAnswer&&<span style={{color:"#10b981",fontSize:12,fontWeight:900}}>✓</span>}
                        {revealed&&isSelected&&!isAnswer&&<span style={{color:"#ef4444",fontSize:12,fontWeight:900}}>✗</span>}
                        {(!revealed||(!isAnswer&&!isSelected))&&<span style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>{String.fromCharCode(65+i)}</span>}
                      </div>
                      <span style={{fontSize:13,fontWeight:600,color}}>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {selected!==null&&(
                <div style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(0,212,255,0.2)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
                  <div style={{fontSize:10,fontFamily:"monospace",color:"rgba(0,212,255,0.7)",marginBottom:6}}>💡 Explication technique :</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{q.exp}</div>
                </div>
              )}

              {selected!==null&&(
                <div style={{textAlign:"center"}}>
                  <button type="button" onClick={next} style={{cursor:"pointer",padding:"12px 36px",borderRadius:12,fontWeight:900,fontSize:14,color:"#000",background:"linear-gradient(135deg,#10b981,#059669)",border:"none"}}>
                    {qi+1>=QUESTIONS.length?"Voir mon score →":"Question suivante →"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ):(
          <div style={S({background:"rgba(255,255,255,0.025)",borderRadius:20,border:"1px solid rgba(16,185,129,0.2)",overflow:"hidden"})}>
            <div style={{padding:"32px 28px",textAlign:"center",background:pct>=70?"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(0,212,255,0.04))":"linear-gradient(135deg,rgba(239,68,68,0.08),rgba(251,146,60,0.04))"}}>
              <div style={{fontSize:56,marginBottom:10}}>{pct>=80?"🏆":pct>=60?"✅":"🔧"}</div>
              <div style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.35)",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>DEBUG SCORE</div>
              <h3 style={{fontSize:26,fontWeight:900,color:"rgba(255,255,255,0.92)",marginBottom:6}}>{score}/{QUESTIONS.length} bonnes réponses</h3>
              <div style={{fontSize:40,fontWeight:900,color:pct>=70?"#10b981":"#f59e0b"}}>{pct}%</div>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginTop:8}}>{pct>=80?"Excellente maîtrise technique. Yoann pense de la même façon.":pct>=60?"Bonne base. La pratique affine le diagnostic.":"Le diagnostic technique s'acquiert avec l'expérience."}</p>
            </div>
            <div style={{padding:"20px 24px"}}>
              <div style={{display:"flex",gap:10}}>
                <button type="button" onClick={reset} style={{cursor:"pointer",flex:1,padding:"12px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"rgba(255,255,255,0.65)",fontWeight:700,fontSize:14}}>🔄 Rejouer</button>
                <button type="button" onClick={()=>document.querySelector("#contact")?.scrollIntoView({behavior:"smooth"})} style={{cursor:"pointer",flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#10b981,#059669)",color:"#000",fontWeight:900,fontSize:14}}>📩 Contacter Yoann</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes btcPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </section>
  );
}
