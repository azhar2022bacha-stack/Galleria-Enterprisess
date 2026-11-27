'use client';

import { clearAdminSupportPreview, readAdminSupportPreview, saveAdminSupportPreview } from '@/lib/adminSupportPreview';
import dynamic from 'next/dynamic';
import { ProfilePhotoEditor } from './ProfilePhotoEditor';
import { ImageComposer } from './ImageComposer';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

import { createPortal } from 'react-dom';
import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Paperclip, Mic, Square, Smile, Search, MessageCircle, X, RotateCw, Maximize2, Minimize2, UserRound, ArrowLeft, ChevronLeft, ChevronRight, Reply, ZoomIn, ZoomOut, ChevronDown, Pin, Download, Trash2, Pause, Play } from 'lucide-react';
type Attachment = { url: string; name: string; type: string };
type Message = { id: string; role: string; text: string; at: string; edited?: boolean; deleted?: boolean; pinned?: boolean; hiddenFor?: string[]; read?: boolean; delivered?: boolean; attachment?: Attachment; reply?: string };
type Chat = { id: string; email: string; name: string; status: string; presence?: Record<string,number>; messages: Message[]; updatedAt?: string };
let activeSupportAudio: HTMLAudioElement | null = null;

function VoicePlayer({ url, id, photo, name }: { url: string; id: string; photo?: string; name: string }) {
 const audio = useRef<HTMLAudioElement>(null); const [playing,setPlaying]=useState(false); const [duration,setDuration]=useState(0); const [time,setTime]=useState(0); const [speed,setSpeed]=useState(1); const [heard,setHeard]=useState(false); const [peaks,setPeaks]=useState<number[]>([]);
 useEffect(()=>{setHeard(localStorage.getItem('support-voice-heard-'+id)==='1');let cancelled=false;const context=new AudioContext();fetch(url).then(r=>r.arrayBuffer()).then(b=>context.decodeAudioData(b)).then(buffer=>{if(cancelled)return;setDuration(buffer.duration);const samples=buffer.getChannelData(0);const values=Array.from({length:48},(_,i)=>{const from=Math.floor(i*samples.length/48),to=Math.floor((i+1)*samples.length/48);let sum=0;for(let j=from;j<to;j++)sum+=samples[j]*samples[j];return Math.sqrt(sum/Math.max(1,to-from));});const max=Math.max(...values,0.01);setPeaks(values.map(v=>Math.max(3,v/max*25)));}).catch(()=>{}).finally(()=>context.close().catch(()=>{}));return()=>{cancelled=true;};},[url,id]);
 useEffect(()=>{const element=audio.current;return()=>{element?.pause();if(activeSupportAudio===element)activeSupportAudio=null;};},[]);
 const clock=(n:number)=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
 return <div className="w-[220px] sm:w-[250px] max-w-full py-1"><audio ref={audio} src={url} preload="metadata" onLoadedMetadata={()=>{const n=audio.current?.duration;if(n&&Number.isFinite(n))setDuration(n);}} onTimeUpdate={()=>setTime(audio.current?.currentTime||0)} onPlay={()=>{const current=audio.current;if(activeSupportAudio&&activeSupportAudio!==current)activeSupportAudio.pause();activeSupportAudio=current;setPlaying(true);}} onPause={()=>{if(activeSupportAudio===audio.current)activeSupportAudio=null;setPlaying(false);}} onEnded={()=>{if(activeSupportAudio===audio.current)activeSupportAudio=null;setPlaying(false);setHeard(true);localStorage.setItem('support-voice-heard-'+id,'1');}}/>
 <div className="flex items-center gap-2"><div className="relative shrink-0"><div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">{photo?<img src={photo} alt={name+' profile photo'} className="w-full h-full object-cover"/>:name.charAt(0).toUpperCase()}</div><span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-sky-500"><Mic size={12}/></span></div><button aria-label={playing?'Pause voice message':'Play voice message'} onClick={()=>{if(!audio.current)return;if(playing)audio.current.pause();else audio.current.play().catch(()=>{});}} className={`w-8 h-8 shrink-0 rounded-full border flex items-center justify-center ${heard?'bg-emerald-600 border-emerald-600 text-white':'border-emerald-500 text-gray-900'}`}>{playing?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}</button>
 <div className="flex-1 min-w-0"><div className="relative h-8 flex items-center gap-[2px] overflow-hidden">{(peaks.length?peaks:Array(48).fill(3)).map((height,i)=><span key={i} className={`w-[3px] shrink-0 rounded-full ${heard?'bg-emerald-500':i/48<=time/(duration||1)?'bg-sky-400':'bg-gray-400'}`} style={{height}}/>)}<input aria-label="Seek voice message" type="range" min="0" max={duration||1} step="0.01" value={Math.min(time,duration||1)} onChange={e=>{if(audio.current)audio.current.currentTime=Number(e.target.value);setTime(Number(e.target.value));}} className="absolute inset-0 w-full opacity-0 cursor-pointer"/></div><span className="text-[10px] text-gray-500">{clock(time||duration)}</span></div>
 <button aria-label="Playback speed" onClick={()=>{const n=speed===1?1.5:speed===1.5?2:1;setSpeed(n);if(audio.current)audio.current.playbackRate=n;}} className="rounded-full bg-gray-500 text-white px-2 py-0.5 text-[11px] font-semibold">{speed}×</button></div></div>;
}
export function SupportChat({ admin = false, previewOwner = '' }: { admin?: boolean; previewOwner?: string }) {
 const [draftImage,setDraftImage] = useState<Attachment | null>(null);
 const [viewer, setViewer] = useState<Attachment | null>(null); const [zoom,setZoom] = useState(1);
 const [voiceMenu, setVoiceMenu] = useState<string | null>(null);
 const [profileDraft,setProfileDraft] = useState<string | null>(null);
 const [profiles,setProfiles] = useState<Record<string,string>>({}); const [profileMenu,setProfileMenu] = useState(false); const profileInput=useRef<HTMLInputElement>(null);
 const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
 const [fullScreen, setFullScreen] = useState(true);
 const layoutRef = useRef<HTMLDivElement>(null);
 useEffect(() => {
   if (!fullScreen) return;
   const sidebar = document.querySelector(admin ? '[data-admin-sidebar]' : '[data-seller-sidebar]');
   const viewport = window.visualViewport;
   const update = () => {
     const layout = layoutRef.current;
     if (!layout) return;
     const desktop = window.matchMedia('(min-width: 1024px)').matches;
     const scale = desktop ? 0.75 : 1;
     const left = desktop ? sidebar?.getBoundingClientRect().right ?? 0 : 0;
     layout.style.left = left / scale + 'px';
     layout.style.width = (window.innerWidth - left) / scale + 'px';
     layout.style.top = (!desktop && viewport ? viewport.offsetTop : 0) + 'px';
     const height = !desktop && viewport ? viewport.height : window.innerHeight;
     layout.style.height = height / scale + 'px';
   };
   update();
   const observer = new ResizeObserver(update);
   if (sidebar) observer.observe(sidebar);
   window.addEventListener('resize', update);
   viewport?.addEventListener('resize', update);
   viewport?.addEventListener('scroll', update);
   return () => {
     observer.disconnect();
     window.removeEventListener('resize', update);
     viewport?.removeEventListener('resize', update);
     viewport?.removeEventListener('scroll', update);
   };
 }, [admin, fullScreen]);
 const [identity, setIdentity] = useState({ email: '', name: '' });
 const [initialChats] = useState(() => admin ? readAdminSupportPreview(previewOwner) : undefined);
 const [chats,setChats] = useState<Chat[]>(initialChats || []);
 const [selected,setSelected] = useState(() => {
   if (initialChats) {
     try {
       const saved = sessionStorage.getItem('admin_support_selected_chat');
       if (saved && initialChats.some(chat => chat.email === saved)) return saved;
     } catch {}
   }
   return '';
 });
 const [text,setText] = useState(''); const [search,setSearch] = useState(''); const [messageSearch,setMessageSearch] = useState('');
 const [error,setError] = useState(''); const [busy,setBusy] = useState(false); const [emojis,setEmojis] = useState(false);
 const [attachment,setAttachment] = useState<Attachment | null>(null); const [editing,setEditing] = useState<string | null>(null); const [reply,setReply] = useState('');
 const [voiceLevels,setVoiceLevels] = useState<number[]>(Array(45).fill(2));
 const audioContext = useRef<AudioContext | null>(null); const animationFrame = useRef<number | null>(null);
 const sendInFlight = useRef(false);
 const [recordSeconds,setRecordSeconds] = useState(0); const [paused,setPaused] = useState(false); const discardRecording = useRef(false); const sendRecording = useRef(false);
 useEffect(()=>{if(admin)return;const withdrawalDraft=sessionStorage.getItem('seller_support_withdrawal_draft');const shouldAutoSendWithdrawal=sessionStorage.getItem('seller_support_withdrawal_autosend')==='1';if(withdrawalDraft&&shouldAutoSendWithdrawal)return;const draft=withdrawalDraft||sessionStorage.getItem('seller_support_deposit_draft');if(draft){setText(draft);sessionStorage.removeItem('seller_support_withdrawal_draft');sessionStorage.removeItem('seller_support_deposit_draft');}},[admin]);
 const [recording,setRecording] = useState(false); const recorder = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null);
 const input = useRef<HTMLInputElement>(null); const bottom = useRef<HTMLDivElement>(null); const role = admin ? 'admin' : 'seller';
 const [inboxLoaded, setInboxLoaded] = useState(initialChats !== undefined);
 const [inboxError, setInboxError] = useState('');
 const restoreConversation = useRef(true);
 const [showingPreview, setShowingPreview] = useState(initialChats !== undefined);
 const latestInboxRequest = useRef(0);
 useEffect(() => {
   if (!admin) {
     try {
       const user = JSON.parse(localStorage.getItem('galleria_active_seller') || '{}');
       setIdentity({ email: user.email || '', name: user.shopName || user.fullName || user.email || '' });
       setSelected(user.email || '');
     } catch {}
   }
   return () => { recorder.current?.stop(); stream.current?.getTracks().forEach(t => t.stop()); };
 }, [admin]);

 async function refresh() {
   if (!admin && !identity.email) return;
   const request = ++latestInboxRequest.current;
   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort(), 15_000);
   try {
     const query = admin ? '?summary=0' : '?email=' + encodeURIComponent(identity.email);
     const res = await fetch('/api/support' + query, { cache: 'no-store', signal: controller.signal });
     if (admin && request === latestInboxRequest.current && (res.status === 401 || res.status === 403)) {
       clearAdminSupportPreview();
       setChats([]);
       setProfiles({});
       setSelected('');
       setInboxLoaded(false);
     }
     if (!res.ok) throw new Error();
     const data = await res.json();
     if (admin && request !== latestInboxRequest.current) return;
     if (!Array.isArray(data.chats)) throw new Error();
     const loaded: Chat[] = data.chats;
     setChats(loaded);
     setProfiles(data.profiles || {});
     if (admin) {
       setShowingPreview(false);
       saveAdminSupportPreview(previewOwner, loaded);
       setInboxLoaded(true);
       setInboxError('');
       if (restoreConversation.current) {
         restoreConversation.current = false;
         try {
           const saved = sessionStorage.getItem('admin_support_selected_chat');
           setSelected(saved && loaded.some(c => c.email === saved) ? saved : '');
         } catch {}
       }
     }
   } catch (error) {
     if (admin) {
       if (request === latestInboxRequest.current) {
         setInboxError(error instanceof Error && error.name === 'AbortError'
           ? 'Support conversations took too long to load. Please retry.'
           : 'Could not load support conversations. Please retry.');
       }
     } else setError('Unable to connect. Your draft is preserved.');
   } finally {
     window.clearTimeout(timeout);
   }
 }

 useEffect(() => {
   let active = true;
   let requestInFlight = false;
   const load = async () => {
     if (!active || requestInFlight) return;
     requestInFlight = true;
     try { await refresh(); } finally { requestInFlight = false; }
   };
   const refreshWhenVisible = () => {
     if (document.visibilityState !== 'hidden') void load();
   };
   if (admin) void load();
   else refreshWhenVisible();
   const timer = setInterval(refreshWhenVisible, 15_000);
   window.addEventListener('focus', refreshWhenVisible);
   document.addEventListener('visibilitychange', refreshWhenVisible);
   return () => {
     active = false;
     latestInboxRequest.current++;
     clearInterval(timer);
     window.removeEventListener('focus', refreshWhenVisible);
     document.removeEventListener('visibilitychange', refreshWhenVisible);
   };
 }, [admin, identity.email]);

 useEffect(()=>{if(!voiceMenu)return;const close=(e:MouseEvent)=>{if(!(e.target as HTMLElement).closest('[data-attachment-menu]'))setVoiceMenu(null);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setVoiceMenu(null);};document.addEventListener('click',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('click',close);document.removeEventListener('keydown',key);};},[voiceMenu]);
 const chat=chats.find(c=>c.email===selected); const messages=chat?.messages || [];
 const lastSellerSeen = chat?.presence?.seller || 0;
 const sellerOnline = lastSellerSeen > 0 && Date.now()-lastSellerSeen < 45000;
 function lastSeenLabel(timestamp:number) {
 if (!timestamp) return 'Offline · Last seen unavailable';
 const minutes=Math.floor((Date.now()-timestamp)/60000);
 if(minutes<1)return 'Offline · Last seen just now';
 if(minutes<60)return 'Offline · Last seen '+minutes+' min ago';
 const hours=Math.floor(minutes/60);if(hours<24)return 'Offline · Last seen '+hours+' hour'+(hours===1?'':'s')+' ago';
 const days=Math.floor(hours/24);return 'Offline · Last seen '+days+' day'+(days===1?'':'s')+' ago';
 }
 useEffect(()=>{ bottom.current?.scrollIntoView({behavior:'smooth',block:'nearest'}); },[messages.length,selected]);
 const gallery=messages.filter(m=>!m.deleted&&!m.hiddenFor?.includes(role)&&m.attachment?.type.startsWith('image/'));
 const ownProfileKey=admin?'admin':identity.email;
 const imageIndex=gallery.findIndex(m=>m.attachment?.url===viewer?.url); const imageMessage=gallery[imageIndex];
 function navigateImage(delta:number){const m=gallery[imageIndex+delta];if(m?.attachment){setViewer(m.attachment);setZoom(1);}}
 async function action(action: string, extra: object = {}, options: { refreshAfter?: boolean } = {}): Promise<Chat | null> {
   setError('');
   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort(), 15_000);
   let response: Response;
   let data: any;
   try {
     response = await fetch('/api/support', {
       method: 'POST',
       credentials: 'same-origin',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ action, email: selected, name: identity.name, role, ...extra }),
       signal: controller.signal,
     });
     data = await response.json().catch(() => null);
   } catch (error) {
     if (controller.signal.aborted) {
       throw new Error('The support request timed out. Check the conversation before retrying.');
     }
     throw error;
   } finally {
     window.clearTimeout(timeout);
   }
   if (!response.ok) throw new Error(data?.error || `Support request failed (${response.status}).`);
   if (action === 'send' && !data?.chat) throw new Error('The message was not saved. Your draft is still here.');
   if (options.refreshAfter !== false) await refresh();
   return data?.chat || null;
 }
 const withdrawalAutoSendStarted = useRef(false);
 useEffect(()=>{
   if(admin||!identity.email||selected!==identity.email||withdrawalAutoSendStarted.current)return;
   const shouldAutoSend=sessionStorage.getItem('seller_support_withdrawal_autosend')==='1';
   const draft=sessionStorage.getItem('seller_support_withdrawal_draft');
   if(!shouldAutoSend||!draft)return;
   withdrawalAutoSendStarted.current=true;
   sessionStorage.removeItem('seller_support_withdrawal_autosend');
   void (async()=>{
     try{
       await action('send',{text:draft});
       sessionStorage.removeItem('seller_support_withdrawal_draft');
       setText('');
     }catch(error:any){
       sessionStorage.removeItem('seller_support_withdrawal_draft');
       setText(draft);
       setError(`Could not send the withdrawal request automatically. Please press Send to contact Support. ${error?.message||''}`.trim());
     }
   })();
 },[admin,identity.email,selected]);
 useEffect(()=>{
 if (!selected) return;
 let requestInFlight = false;
 const heartbeat = async () => {
   if (requestInFlight || document.visibilityState !== 'visible' || !document.hasFocus()) return;
   requestInFlight = true;
   try {
     await fetch('/api/support', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ action: 'heartbeat', email: selected, name: identity.name, role }),
     });
   } catch {
     // The next heartbeat or focus refresh will retry.
   } finally {
     requestInFlight = false;
   }
 };
 void heartbeat(); const timer = setInterval(() => void heartbeat(), 15_000);
 window.addEventListener('focus', heartbeat); document.addEventListener('visibilitychange', heartbeat);
 return () => { clearInterval(timer); window.removeEventListener('focus', heartbeat); document.removeEventListener('visibilitychange', heartbeat); };
 },[selected,role]);
 async function send() {
   if (sendInFlight.current || busy || (!text.trim() && !attachment) || recording) return;
   sendInFlight.current = true;
   setBusy(true);
   try {
     const savedChat = await action(editing ? 'edit' : 'send', { text, attachment, messageId: editing, reply }, { refreshAfter: false });
     if (savedChat) {
       // Apply the server-confirmed conversation immediately. Do not keep the
       // composer disabled while a separate inbox refresh is loading.
       latestInboxRequest.current++;
       setChats(current => {
         const next = [savedChat, ...current.filter(chat => chat.email !== savedChat.email)]
           .sort((a, b) => Date.parse(b.updatedAt || b.messages.at(-1)?.at || '') - Date.parse(a.updatedAt || a.messages.at(-1)?.at || ''));
         if (admin) saveAdminSupportPreview(previewOwner, next);
         return next;
       });
     }
     setText('');
     setAttachment(null);
     setEditing(null);
     setReply('');
     void refresh();
   } catch (e: any) {
     setError(e instanceof Error ? e.message : 'Unable to send the message. Your draft is still here.');
   } finally {
     sendInFlight.current = false;
     setBusy(false);
   }
 }
 function loadFile(file?: File) { if(!file) return; if(file.size>5*1024*1024){setError('Please choose a file smaller than 5 MB.');return;} if(!/^(image\/(png|jpeg|webp)|audio\/(webm|ogg|mp4))$/.test(file.type)){setError('Choose a PNG, JPEG, WebP image or supported audio file.');return;} const reader=new FileReader();reader.onload=()=>{const selected={url:String(reader.result),type:file.type,name:file.name};if(file.type.startsWith('image/'))setDraftImage(selected);else setAttachment(selected);};reader.readAsDataURL(file); }
 useEffect(()=>{if(!recording||paused)return;const timer=setInterval(()=>setRecordSeconds(n=>n+1),1000);return()=>clearInterval(timer);},[recording,paused]);
 function finishRecording(discard = false, sendNow = false) { discardRecording.current=discard; sendRecording.current=sendNow; recorder.current?.stop(); setRecording(false); setPaused(false); }
 function stopVisualization() { if(animationFrame.current!==null)cancelAnimationFrame(animationFrame.current); animationFrame.current=null; audioContext.current?.close().catch(()=>{}); audioContext.current=null; }
 function startVisualization(media: MediaStream) {
 stopVisualization(); setVoiceLevels(Array(45).fill(2));
 const context = new AudioContext(); audioContext.current=context;
 const analyser=context.createAnalyser(); analyser.fftSize=1024;
 context.createMediaStreamSource(media).connect(analyser);
 const samples=new Uint8Array(analyser.fftSize); let last=0;
 const draw=(now:number)=>{
 if(now-last>=65){last=now;analyser.getByteTimeDomainData(samples);let power=0;for(let i=0;i<samples.length;i++){const v=(samples[i]-128)/128;power+=v*v;}const level=Math.min(26,Math.max(2,Math.sqrt(power/samples.length)*150));if(recorder.current?.state==='recording')setVoiceLevels(prev=>[...prev.slice(1),level]);}
 animationFrame.current=requestAnimationFrame(draw);
 }; animationFrame.current=requestAnimationFrame(draw);
 }
 useEffect(()=>()=>stopVisualization(),[]);
 async function record() { try { if(recording){finishRecording();return;} if(!navigator.mediaDevices || !window.MediaRecorder) throw new Error('Voice recording requires a supported browser and microphone access.'); discardRecording.current=false;sendRecording.current=false;setRecordSeconds(0);setPaused(false);const media=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=media;const rec=new MediaRecorder(media);recorder.current=rec;const chunks:BlobPart[]=[];rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{stopVisualization();media.getTracks().forEach(t=>t.stop()); if(discardRecording.current)return; const file=new File(chunks,'voice-message.webm',{type:rec.mimeType.split(';')[0]}); if(sendRecording.current){const reader=new FileReader();reader.onload=async()=>{setBusy(true);try{await action('send',{text:'',attachment:{url:String(reader.result),type:file.type,name:file.name}});}catch(e:any){setError(e.message);setAttachment({url:String(reader.result),type:file.type,name:file.name});}finally{setBusy(false);}};reader.readAsDataURL(file);}else loadFile(file);};rec.start();setRecording(true);try{startVisualization(media);}catch{setError('Live waveform is unavailable in this browser. Audio is still recording.');}setTimeout(()=>{if(rec.state!=='inactive'){rec.stop();setRecording(false);setPaused(false);}},60000); }catch(e:any){setError(e.message);} }
 async function rotateImage() { if(!attachment?.type.startsWith('image/'))return; const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.height;canvas.height=image.width;const ctx=canvas.getContext('2d')!;ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(Math.PI/2);ctx.drawImage(image,-image.width/2,-image.height/2);setAttachment({...attachment,url:canvas.toDataURL('image/jpeg',0.85),type:'image/jpeg'});};image.src=attachment.url; }
 const chatLayout = <div key={fullScreen ? "fullscreen" : "inline"} ref={layoutRef} className={fullScreen ? "support-chat-desktop-scale support-chat-fullscreen fixed inset-0 z-50 bg-white flex flex-col" : "support-chat-desktop-scale relative flex flex-col h-[calc(100dvh-100px)] min-h-[400px]"}>

 <input ref={profileInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(f.size>2*1024*1024){setError('Choose a profile photo smaller than 2 MB.');return;}const r=new FileReader();r.onload=()=>setProfileDraft(String(r.result));r.readAsDataURL(f);}}/>
 {profileDraft&&<ProfilePhotoEditor src={profileDraft} onCancel={()=>setProfileDraft(null)} onSave={async photo=>{const res=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'profile',role,email:identity.email||'admin',photo})});if(!res.ok)throw new Error('Unable to save profile photo.');await refresh();setProfileDraft(null);setProfileMenu(false);}}/>}

 {profileMenu&&<div className="fixed inset-0 z-[85] bg-black/40 flex items-center justify-center p-4" onClick={()=>setProfileMenu(false)}><section role="dialog" aria-modal="true" aria-label="Profile photo options" className="bg-white rounded-2xl p-5 w-full max-w-xs space-y-2" onClick={e=>e.stopPropagation()}><h2 className="font-bold mb-3">Your profile photo</h2>{profiles[ownProfileKey]&&<img src={profiles[ownProfileKey]} alt="Your profile" className="w-24 h-24 rounded-full object-cover mx-auto mb-3"/>}<button className="block w-full p-2 rounded hover:bg-gray-50 text-left" onClick={()=>profileInput.current?.click()}>{profiles[ownProfileKey]?'Replace photo':'Upload photo'}</button>{profiles[ownProfileKey]&&<><button className="block w-full p-2 rounded hover:bg-gray-50 text-left" onClick={()=>{setViewer({url:profiles[ownProfileKey],type:'image/jpeg',name:'Profile photo'});setZoom(1);setProfileMenu(false);}}>View photo</button><button className="block w-full p-2 text-red-600 text-left" onClick={async()=>{try{const res=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'profile',role,email:identity.email||'admin',photo:null})});if(!res.ok)throw new Error('Unable to remove photo.');await refresh();setProfileMenu(false);}catch(e:any){setError(e.message);}}}>Remove photo</button></>}<button className="block w-full p-2 text-gray-500" onClick={()=>setProfileMenu(false)}>Cancel</button></section></div>}

 {draftImage && <ImageComposer image={draftImage} onCancel={()=>setDraftImage(null)} onSend={async(image,caption)=>{await action('send',{text:caption,attachment:image,reply});setDraftImage(null);setReply('');}}/>}

 {viewer && <div role="dialog" aria-modal="true" aria-label="Image viewer" className="fixed inset-0 z-[90] bg-white flex flex-col" onKeyDown={e=>{if(e.key==='Escape')setViewer(null);}}>
 <div className="flex items-center gap-3 p-3 text-gray-700 bg-white border-b shrink-0 flex-wrap"><div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{imageMessage?.role==='admin'?'Support':chat?.name||identity.name}</p><p className="text-xs text-gray-400">{imageMessage?new Date(imageMessage.at).toLocaleString():viewer.name} · {imageIndex+1} of {gallery.length} images</p></div><button aria-label="Reply to image" onClick={()=>{setReply(imageMessage?.text||'Photo');setViewer(null);}}><Reply size={20}/></button><button aria-label="Pin image" onClick={()=>{if(imageMessage)action('pin',{messageId:imageMessage.id}).catch(e=>setError(e.message));}} className={imageMessage?.pinned?'text-emerald-600':''}><Pin size={20}/></button><button aria-label="Zoom out" className="px-3 py-2 rounded bg-white/10" onClick={()=>setZoom(z=>Math.max(0.25,z-0.25))}><ZoomOut size={20}/></button><button aria-label="Reset zoom" className="text-xs px-2" onClick={()=>setZoom(1)}>{Math.round(zoom*100)}%</button><button aria-label="Zoom in" className="px-3 py-2 rounded bg-white/10" onClick={()=>setZoom(z=>Math.min(5,z+0.25))}><ZoomIn size={20}/></button><a aria-label="Download image" href={viewer.url} download={viewer.name}><Download size={20}/></a><button autoFocus aria-label="Close image viewer" onClick={()=>setViewer(null)} className="p-2"><X size={22}/></button></div>
 <div className="relative flex-1 min-h-0 overflow-auto p-4" onWheel={e=>{if(e.ctrlKey){e.preventDefault();setZoom(z=>Math.min(5,Math.max(0.25,z+(e.deltaY<0?0.1:-0.1))));}}}><button aria-label="Previous image" disabled={imageIndex<=0} onClick={()=>navigateImage(-1)} className="fixed left-3 top-1/2 z-10 p-2 rounded-full bg-black/50 text-white disabled:opacity-20"><ChevronLeft size={24}/></button><button aria-label="Next image" disabled={imageIndex>=gallery.length-1} onClick={()=>navigateImage(1)} className="fixed right-3 top-1/2 z-10 p-2 rounded-full bg-black/50 text-white disabled:opacity-20"><ChevronRight size={24}/></button><div className="min-w-full min-h-full grid place-items-center" style={{width:zoom>1?zoom*100+'%':'100%'}}><img src={viewer.url} alt={viewer.name} draggable={false} onDoubleClick={()=>setZoom(z=>z===1?2:1)} style={{width:zoom<1?zoom*100+'%':'100%',maxHeight:zoom<=1?'calc(100dvh - 210px)':undefined,objectFit:'contain'}}/></div></div>
 <div className="shrink-0 border-t bg-white p-3 flex gap-2 overflow-x-auto">{gallery.map((m,i)=><button key={m.id} aria-label={`View image ${i+1} of ${gallery.length}`} onClick={()=>{setViewer(m.attachment!);setZoom(1);}} className={`shrink-0 p-1 rounded border-2 ${i===imageIndex?'border-emerald-600':'border-transparent'}`}><img src={m.attachment!.url} alt={m.attachment!.name} className="w-16 h-16 object-cover rounded"/></button>)}</div>
 </div>}

 {deleteTarget && <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" onClick={()=>setDeleteTarget(null)}>
   <section role="dialog" aria-modal="true" aria-labelledby="delete-message-title" className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-xl" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setDeleteTarget(null);}}>
     <h2 id="delete-message-title" className="text-xl text-center font-medium mb-5">Delete message?</h2>
     <div className="flex flex-col gap-2">
       {messages.find(m=>m.id===deleteTarget)?.role===role && <button autoFocus disabled={busy} className="rounded-full border border-gray-300 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50" onClick={async()=>{setBusy(true);try{await action('delete',{messageId:deleteTarget});setDeleteTarget(null);}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>Delete for everyone</button>}
       <button disabled={busy} className="rounded-full border border-gray-300 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50" onClick={async()=>{setBusy(true);try{await action('deleteForMe',{messageId:deleteTarget});setDeleteTarget(null);}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>Delete for me</button>
       <button disabled={busy} className="py-3 mt-1 text-sm font-semibold text-emerald-600" onClick={()=>setDeleteTarget(null)}>Cancel</button>
     </div>
   </section>
 </div>}

 <div className={`flex flex-1 min-h-0 overflow-hidden bg-white`}>
 {admin&&<aside className={`w-full md:w-64 lg:w-72 border-r flex-col shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}><div className="p-3 border-b"><button type="button" onClick={()=>setProfileMenu(true)} className="flex items-center gap-2 mb-3 text-xs text-emerald-700">{profiles.admin?<img src={profiles.admin} alt="Your profile" className="w-8 h-8 rounded-full object-cover"/>:<span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">S</span>}Your profile photo</button><div className="flex gap-2 items-center"><Search size={16}/><input aria-label="Search conversations" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sellers" className="w-full min-w-0 text-sm outline-none"/></div></div><div className="overflow-y-auto flex-1">{chats.filter(c=>(c.name+c.email).toLowerCase().includes(search.toLowerCase())).map(c=><button key={c.id} onClick={()=>{sessionStorage.setItem('admin_support_selected_chat',c.email);setSelected(c.email);setText('');setEditing(null);setReply('');setAttachment(null);}} className={`text-left p-4 w-full border-b ${selected===c.email?'bg-emerald-50':'hover:bg-gray-50'}`}><div className="font-semibold truncate text-sm flex gap-2 items-center">{profiles[c.email]&&<img src={profiles[c.email]} alt="" className="w-8 h-8 rounded-full object-cover"/>}{c.name}</div><div className="text-xs text-gray-400 truncate">{c.email}</div><p className="text-xs text-gray-500 truncate mt-1">{c.messages.at(-1)?.deleted?'Message deleted':c.messages.at(-1)?.text||'Attachment'}</p><span className="text-[10px] text-emerald-700">{c.status} {c.messages.filter(m=>m.role==='seller'&&!m.read&&!m.deleted&&!m.hiddenFor?.includes('admin')).length>0&&<span className="inline-flex items-center justify-center ml-2 min-w-[22px] h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold px-1.5">{c.messages.filter(m=>m.role==='seller'&&!m.read&&!m.deleted&&!m.hiddenFor?.includes('admin')).length}</span>}</span></button>)}{inboxError && <p role="alert" className="p-4 text-xs text-amber-800">{inboxError} <button type="button" className="underline" onClick={() => void refresh()}>Retry</button></p>}
 {!inboxError && !inboxLoaded && <p role="status" className="p-4 text-xs text-gray-500">Loading conversations…</p>}
 {!inboxError && inboxLoaded && !chats.length && <p className="p-4 text-xs text-gray-500">No support conversations yet.</p>}</div></aside>}
 <main className={`flex-col flex-1 min-w-0 ${admin && !selected ? 'hidden md:flex' : 'flex'}`}>{!selected?<div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3"><MessageCircle size={48}/><p>{admin?'Select a conversation':'Sign in to your seller account to chat.'}</p></div>:<><div className="p-2 sm:p-3 border-b flex flex-wrap items-center gap-3 bg-white">{!admin&&<button type="button" aria-label="Your profile settings" title="Your profile photo" onClick={()=>setProfileMenu(true)} className="ml-auto order-last inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-sm hover:bg-emerald-100 hover:border-emerald-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"><span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white"><UserRound size={16}/></span><span className="text-xs font-semibold">Profile</span></button>}<button type="button" onClick={()=>setFullScreen(value => !value)} aria-label={fullScreen ? 'Exit full screen' : 'Open full screen'} className="ml-auto order-last p-2 rounded-lg text-gray-500 hover:bg-gray-100">{fullScreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>{admin && <button type="button" aria-label="Back to conversations" onClick={()=>{sessionStorage.removeItem('admin_support_selected_chat');setSelected('');}} className="md:hidden p-1"><ArrowLeft size={20}/></button>}<div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold overflow-hidden">{profiles[admin?selected:'admin']?<img src={profiles[admin?selected:'admin']} alt={admin?chat?.name:'Support'} className="w-full h-full object-cover"/>:admin?(chat?.name||'S')[0]:'S'}</div><div className="flex-1"><h2 className="font-bold text-sm">{admin?chat?.name||selected:'Support team'}</h2><p className={`text-xs ${!admin||sellerOnline?'text-emerald-600':'text-gray-500'}`}>{!admin?'Online':sellerOnline?'Online':lastSeenLabel(lastSellerSeen)}</p></div>{admin&&chat&&<button className="text-xs text-emerald-700 border rounded-lg p-2" onClick={()=>action('status').catch(e=>setError(e.message))}>{chat.status==='closed'?'Reopen':'Resolve'}</button>}<input aria-label="Search messages" className="border rounded-lg p-2 text-xs w-32" placeholder="Search messages" value={messageSearch} onChange={e=>setMessageSearch(e.target.value)}/></div>
 <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#efeae2]" style={{backgroundImage:'radial-gradient(#d6d1c7 0.7px, transparent 0.7px)',backgroundSize:'18px 18px'}}>{!messages.length&&<p className="bg-white/80 rounded-lg p-3 text-xs text-gray-500 text-center">Start a conversation. Send a message, photo or voice note.</p>}{messages.filter(m=>!m.hiddenFor?.includes(role) && (!messageSearch||m.text.toLowerCase().includes(messageSearch.toLowerCase()))).map(m=><div key={m.id} className={`flex items-end gap-2 ${m.role===role?'justify-end':'justify-start'}`}><article className={`relative group max-w-[85%] sm:max-w-[75%] rounded-lg px-2.5 py-1.5 shadow-sm text-[13px] ${m.role===role?'bg-[#d9fdd3]':'bg-white'}`}>{m.attachment && !m.deleted && <div data-attachment-menu className="absolute right-1 top-1 z-10">
 <button aria-label="Attachment options" aria-expanded={voiceMenu===m.id} onClick={()=>setVoiceMenu(voiceMenu===m.id?null:m.id)} className="p-1 rounded hover:bg-black/5 text-gray-500"><ChevronDown size={14}/></button>
 {voiceMenu===m.id && <div className="absolute right-0 top-7 w-40 rounded-lg bg-white border shadow-lg py-1 text-xs">
 <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{setReply(m.text || (m.attachment?.type.startsWith('image/') ? 'Photo' : 'Voice message'));setVoiceMenu(null);}}>Reply</button><button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex gap-2" onClick={()=>{action('pin',{messageId:m.id}).catch(e=>setError(e.message));setVoiceMenu(null);}}><Pin size={14}/>{m.pinned?'Unpin':'Pin'}</button>
 <a className="px-3 py-2 hover:bg-gray-50 flex gap-2" href={m.attachment.url} download={m.attachment.name||'voice-message.webm'} onClick={()=>setVoiceMenu(null)}><Download size={14}/>Download</a>
 <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex gap-2" onClick={()=>{setDeleteTarget(m.id);setVoiceMenu(null);}}><Trash2 size={14}/>Delete</button>
 </div>}
 </div>}{m.pinned&&<span className="text-[9px] text-emerald-700 flex items-center gap-1 mb-1"><Pin size={10}/>Pinned</span>}<p className="text-[10px] font-semibold text-[#1684c5] mb-0.5 pr-5">~ {m.role==='admin'?'Support':chat?.name||identity.name}</p>{m.reply&&<blockquote className="border-l-2 border-emerald-500 p-2 bg-black/5 text-xs mb-2">{m.reply}</blockquote>}{m.deleted?<p className="italic text-gray-400">This message was deleted</p>:<>{m.attachment?.type.startsWith('image/')&&<button type="button" aria-label="Open image" onClick={()=>{setViewer(m.attachment!);setZoom(1);}}><img src={m.attachment.url} alt={m.attachment.name} className="max-h-64 rounded-lg mb-2 cursor-default"/></button>}{m.attachment?.type.startsWith('audio/')&&<VoicePlayer url={m.attachment.url} id={m.id} photo={profiles[m.role==='admin'?'admin':selected]} name={m.role==='admin'?'Support':chat?.name||identity.name||'Seller'}/>}<p className="whitespace-pre-wrap break-words">{m.text}</p><div className={`${m.attachment?.type.startsWith('audio/') ? 'hidden' : 'flex'} gap-3 text-[10px] text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 h-4 overflow-hidden pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto`}><button onClick={()=>setReply(m.text||'Attachment')}>Reply</button>{m.role===role&&!showingPreview&&<><button onClick={()=>{setEditing(m.id);setText(m.text);setAttachment(null);}}>Edit</button></>}<button onClick={()=>setDeleteTarget(m.id)}>Delete</button></div></>}<p className="text-[10px] text-gray-400 text-right leading-3 mt-0.5">{m.edited?'edited · ':''}{new Date(m.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} {m.role===role&&<span aria-label={m.read?'Read':m.delivered?'Delivered':'Sent'} className={m.read?'text-sky-500 ml-1':'text-gray-400 ml-1'}>{m.read||m.delivered?'✓✓':'✓'}</span>}</p></article></div>)}<div ref={bottom}/></div>
 <div className="bg-gray-50 p-3 border-t">{error&&<p role="alert" className="bg-red-50 text-red-700 text-xs p-2 rounded mb-2">{error}</p>}{(reply||editing)&&<div className="flex justify-between bg-emerald-50 p-2 text-xs mb-2"><span>{editing?'Editing message':`Reply: ${reply}`}</span><button aria-label="Cancel reply or edit" onClick={()=>{setReply('');setEditing(null);setText('');}}><X size={14}/></button></div>}{attachment&&<div className="bg-white p-2 border rounded-lg mb-2">{attachment.type.startsWith('image/')?<><img src={attachment.url} alt="Attachment preview" className="h-32 rounded"/><button onClick={rotateImage} className="text-xs flex gap-1 items-center mt-2"><RotateCw size={14}/>Rotate image</button></>:<audio src={attachment.url} controls/>}<button className="text-xs text-red-500 mt-2" onClick={()=>setAttachment(null)}>Remove attachment</button><p className="text-xs text-gray-400">Add a caption below before sending.</p></div>}{emojis&&<div className="mb-2 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white"><div className="flex items-center justify-between px-3 py-2 border-b"><span className="text-xs font-semibold text-gray-600">Emojis</span><button type="button" aria-label="Close emoji picker" title="Close" onClick={()=>setEmojis(false)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"><X size={18}/></button></div><EmojiPicker width="100%" height={380} searchPlaceholder="Search all emojis" lazyLoadEmojis onEmojiClick={emoji=>setText(t=>t+emoji.emoji)}/></div>}{recording ? <div className="flex items-center justify-end gap-3 sm:gap-4 rounded-full bg-white px-3 py-2 shadow-sm">
 <button aria-label="Delete recording" onClick={()=>finishRecording(true)} className="p-2 text-gray-700 hover:text-red-600"><Trash2 size={21}/></button>
 <span className={`w-2.5 h-2.5 rounded-full bg-rose-600 ${paused?'':'animate-pulse'}`} />
 <span className="text-sm tabular-nums text-gray-900">{Math.floor(recordSeconds/60)}:{String(recordSeconds%60).padStart(2,'0')}</span>
 <div aria-label={paused?'Recording paused':'Recording in progress'} className="flex items-center gap-[2px] h-7 flex-1 max-w-[220px] overflow-hidden">{voiceLevels.map((level,i)=><span key={i} className="w-[3px] shrink-0 rounded-full bg-gray-500" style={{height:level}} />)}</div>
 <button aria-label={paused?'Resume recording':'Pause recording'} onClick={()=>{const rec=recorder.current;if(!rec)return;if(rec.state==='recording'){rec.pause();setPaused(true);}else if(rec.state==='paused'){rec.resume();setPaused(false);}}} className="p-2 text-rose-600">{paused?<Play size={21}/>:<Pause size={21}/>}</button>
 <button aria-label="Send voice message" onClick={()=>finishRecording(false,true)} className="p-3 rounded-full bg-emerald-600 text-white"><Send size={21}/></button>
 </div> : <div className="flex items-end gap-2"><button aria-label="Emojis" className="p-2 text-gray-500" onClick={()=>setEmojis(!emojis)}><Smile size={21}/></button><button aria-label="Attach image or audio" className="p-2 text-gray-500" onClick={()=>input.current?.click()}><Paperclip size={21}/></button><input ref={input} type="file" accept="image/png,image/jpeg,image/webp,audio/webm,audio/ogg,audio/mp4" hidden onChange={e=>{loadFile(e.target.files?.[0]);e.target.value='';}}/><textarea aria-label="Message" rows={1} maxLength={4000} placeholder={recording?'Recording… click stop when finished':'Type a message'} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} className="flex-1 min-w-0 rounded-xl border p-3 text-base sm:text-sm resize-none max-h-32"/><button aria-label={recording?'Stop recording':'Record voice message'} onClick={record} className={`p-3 rounded-full ${recording?'bg-red-100 text-red-600':'text-gray-500'}`}>{recording?<Square size={19}/>:<Mic size={19}/>}</button><button type="button" disabled={busy||(!text.trim()&&!attachment)||recording} aria-label={busy?'Sending message':'Send message'} title={busy?'Sending message…':'Send message'} onClick={send} className="rounded-full bg-emerald-600 text-white p-3 disabled:opacity-40">{busy?<Loader2 size={19} className="animate-spin"/>:<Send size={19}/>}</button></div>}</div></> }</main></div></div>;
 return fullScreen && typeof document !== 'undefined' ? createPortal(chatLayout, document.body) : chatLayout;
}
