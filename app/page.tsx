"use client";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Check, Clock3, Camera as Instagram, MapPin, Menu, MessageCircle, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast, Toaster } from "sonner";

const defaultServices=[
 {name:"Acabamento / alinhamento do pezinho",price:25,duration:30,number:"01"},
 {name:"Barba",price:40,duration:30,number:"02"},
 {name:"Corte + barba",price:85,duration:60,number:"03"},
 {name:"Corte + barba + sobrancelha",price:100,duration:60,number:"04"},
 {name:"Corte degradê",price:45,duration:30,number:"05"},
 {name:"Corte infantil",price:45,duration:30,number:"06"},
 {name:"Corte máquina",price:30,duration:15,number:"07"},
 {name:"Corte social",price:40,duration:30,number:"08"},
 {name:"Corte tesoura",price:45,duration:30,number:"09"},
 {name:"Higienização com cera — nariz",price:25,duration:15,number:"10"},
 {name:"Pigmentação",price:25,duration:30,number:"11"},
 {name:"Luzes + corte",price:169,duration:75,number:"12"},
 {name:"Platinado + corte",price:175,duration:75,number:"13"},
 {name:"Sobrancelha",price:25,duration:15,number:"14"},
];
const times=["09:00","09:40","10:20","11:00","13:00","13:40","14:20","15:00","15:40","16:20","17:00","17:40","18:20","19:00"];
type Booking={id:string;name:string;phone:string;service:string;date:string;time:string;status:string};
function Brand(){return <Link href="#inicio" className="brand" aria-label="BS Barber Classic - início"><Image src="/logo-bs.png" alt="BS Barber Classic" width={180} height={180} priority/></Link>}

export default function Home(){
 const[menuOpen,setMenuOpen]=useState(false);const[headerScrolled,setHeaderScrolled]=useState(false);const[dateOpen,setDateOpen]=useState(false);const[confirmation,setConfirmation]=useState<{name:string;service:string;date:string;time:string}|null>(null);const[bookings,setBookings]=useState<Booking[]>([]);const[services,setServices]=useState(defaultServices);const[blocks,setBlocks]=useState<{date:string;time:string}[]>([]);const[form,setForm]=useState({name:"",phone:"",service:"",date:"",time:""});
 const heroRef=useRef<HTMLElement>(null);
 useEffect(()=>{queueMicrotask(async()=>{try{const response=await fetch("/api/barber?scope=public",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json() as {bookings:Booking[];blocks:{date:string;time:string}[];services:typeof defaultServices};setBookings(data.bookings||[]);setBlocks(data.blocks||[]);if(data.services?.length)setServices(data.services)}catch{toast.error("Não foi possível carregar a agenda. Tente novamente.")}})},[]);
 useEffect(()=>{const sections=Array.from(document.querySelectorAll<HTMLElement>("main > section:not(.hero)"));sections.forEach(section=>section.classList.add("motion-section"));const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:"0px 0px -40px"});sections.forEach(section=>observer.observe(section));return()=>observer.disconnect()},[]);
 useEffect(()=>{const onScroll=()=>setHeaderScrolled(window.scrollY>28);onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[]);
 function moveHero(event:ReactPointerEvent<HTMLElement>){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const hero=heroRef.current;if(!hero)return;const bounds=hero.getBoundingClientRect();const x=(event.clientX-bounds.left)/bounds.width;const y=(event.clientY-bounds.top)/bounds.height;hero.style.setProperty("--light-x",`${x*100}%`);hero.style.setProperty("--light-y",`${y*100}%`);hero.style.setProperty("--copy-x",`${(x-.5)*-10}px`);hero.style.setProperty("--copy-y",`${(y-.5)*-7}px`)}
 function resetHero(){const hero=heroRef.current;if(!hero)return;hero.style.setProperty("--light-x","72%");hero.style.setProperty("--light-y","38%");hero.style.setProperty("--copy-x","0px");hero.style.setProperty("--copy-y","0px")}
 const unavailable=useMemo(()=>new Set([...bookings.filter(b=>b.date===form.date&&b.status!=="Cancelado").map(b=>b.time),...blocks.filter(b=>b.date===form.date).flatMap(b=>b.time==="Dia inteiro"?times:[b.time])]),[bookings,blocks,form.date]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!form.name||!form.phone||!form.service||!form.date||!form.time){toast.error("Preencha todos os dados para reservar.");return}if(unavailable.has(form.time)){toast.error("Este horário acabou de ser reservado. Escolha outro.");return}const reserved={...form};try{const response=await fetch("/api/barber",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"createBooking",booking:reserved})});const data=await response.json() as {booking:Booking;error?:string};if(!response.ok)throw new Error(data.error||"Não foi possível confirmar o horário.");setBookings(current=>[...current,data.booking]);setConfirmation({name:reserved.name,service:reserved.service,date:reserved.date,time:reserved.time});setForm({name:"",phone:"",service:"",date:"",time:""})}catch(error){toast.error(error instanceof Error?error.message:"Não foi possível confirmar o horário.")}}
 return <main><Toaster theme="dark" richColors position="top-center"/>
  <header className={`site-header${headerScrolled?" is-scrolled":""}`}><Brand/><nav className={menuOpen?"nav open":"nav"} aria-label="Navegação principal"><a href="#inicio" onClick={()=>setMenuOpen(false)}>Início</a><a href="#servicos" onClick={()=>setMenuOpen(false)}>Serviços</a><a href="#sobre" onClick={()=>setMenuOpen(false)}>Sobre</a><a href="#contato" onClick={()=>setMenuOpen(false)}>Contato</a><Button asChild className="nav-cta"><a href="#agendar">Agendar horário</a></Button></nav><button className="menu-button" onClick={()=>setMenuOpen(v=>!v)} aria-label="Abrir menu">{menuOpen?<X/>:<Menu/>}</button></header>
  <section ref={heroRef} id="inicio" className="hero" onPointerMove={moveHero} onPointerLeave={resetHero}><div className="hero-media" aria-hidden="true"/><div className="hero-copy"><p className="eyebrow">BS BARBER CLASSIC · DESDE 2016</p><h1>Clássico na essência.<br/><em>Atual no seu estilo.</em></h1><p className="hero-text">Uma barbearia moderna para o cavalheiro atual. Técnica, visagismo e cuidado em cada detalhe.</p><div className="hero-actions"><Button asChild size="lg"><a href="#agendar">Agendar horário <ArrowRight/></a></Button><a className="text-link" href="#servicos">Conhecer serviços</a></div></div><div className="hero-signature" aria-label="Diferenciais"><span>Atendimento com hora marcada</span><span>Caminho Novo · Palhoça</span></div><span className="scroll-cue" aria-hidden="true"><i/>Explore</span></section>
  <section className="pillars" id="experiencia">{[{n:"01",t:"Visagismo",d:"Um corte pensado para valorizar os seus traços."},{n:"02",t:"Técnica",d:"Precisão, acabamento e domínio em cada serviço."},{n:"03",t:"Experiência",d:"Cuidado completo em um ambiente contemporâneo."}].map(x=><article key={x.n}><small>{x.n}</small><div><h3>{x.t}</h3><p>{x.d}</p></div></article>)}</section>
  <section id="sobre" className="about section-shell"><div className="about-photo"><Image src="/barbeiro-bs.webp" alt="Barbeiro da BS Barber Classic durante um atendimento" width={1211} height={1299}/><span aria-hidden="true"/></div><div className="about-copy"><p className="eyebrow">BARBEARIA DESDE 2016</p><h2>Tradição que acompanha<br/><em>o homem de hoje.</em></h2><p>Na BS Barber Classic, cada atendimento une escuta, técnica e estilo. Um espaço pensado para quem valoriza uma imagem bem cuidada e um resultado que realmente combina com a sua rotina.</p><a className="about-link" href="https://instagram.com/bsbarberclassic" target="_blank" rel="noreferrer">Conhecer nossos trabalhos <ArrowRight/></a></div></section>
  <section className="work-showcase section-shell" aria-labelledby="trabalhos-title"><div className="work-heading"><div><p className="eyebrow">RESULTADOS REAIS</p><h2 id="trabalhos-title">Técnica que se percebe<br/><em>em cada detalhe.</em></h2></div><p>Transformações feitas na BS Barber Classic, respeitando o estilo e a identidade de cada cliente.</p></div><div className="work-grid"><figure><Image src="/trabalho-bs-01.png" alt="Antes e depois de atendimento na BS Barber Classic" width={691} height={390}/><figcaption><span>01</span> Corte e finalização</figcaption></figure><figure><Image src="/trabalho-bs-02.png" alt="Antes e depois de corte e barba na BS Barber Classic" width={691} height={390}/><figcaption><span>02</span> Corte e barba</figcaption></figure></div></section>
  <section id="servicos" className="services section-shell"><div className="section-heading"><div><p className="eyebrow">MENU DE SERVIÇOS</p><h2>Escolha o seu<br/><em>próximo corte.</em></h2></div></div><div className="service-list">{services.slice(0,3).map(s=><article key={s.name}><small>{s.number}</small><div><h3>{s.name}</h3><span>A partir de {s.duration} min</span></div><strong>R$ {s.price.toFixed(2).replace(".",",")}</strong><a href="#agendar" aria-label={`Agendar ${s.name}`}><ArrowRight/></a></article>)}</div><a className="services-cta" href="/servicos">Ver todos os serviços <ArrowRight/></a></section>
  <section id="contato" className="contact section-shell"><div className="contact-heading"><p className="eyebrow">BS BARBER CLASSIC</p><h2>Onde nos<br/><em>encontrar.</em></h2></div><div className="contact-links"><a href="https://wa.me/554891639617" target="_blank" rel="noreferrer"><MessageCircle/><span><small>ATENDIMENTO</small><b>WhatsApp</b><em>+55 48 9163-9617</em></span><ArrowRight/></a><a href="https://instagram.com/bsbarberclassic" target="_blank" rel="noreferrer"><Instagram/><span><small>NOVIDADES</small><b>Instagram</b><em>@bsbarberclassic</em></span><ArrowRight/></a><a href="https://maps.app.goo.gl/gsWDs3J75L928J3G7" target="_blank" rel="noreferrer"><MapPin/><span><small>VISITE-NOS</small><b>Localização</b><em>Rua Padre João Batista Réus, 1427 · Caminho Novo</em></span><ArrowRight/></a><a href="#agendar"><Clock3/><span><small>ATENDIMENTO</small><b>Agendamento</b><em>Escolha o melhor horário disponível</em></span><CalendarDays/></a></div><div className="opening-hours" aria-label="Horários de atendimento"><div><small>SEGUNDA</small><strong>13:30 — 19:30</strong></div><div><small>TERÇA A SEXTA</small><strong>08:30 — 19:30</strong></div><div><small>SÁBADO</small><strong>08:00 — 15:30</strong></div><div><small>DOMINGO</small><strong>Fechada</strong></div></div></section>
  <section id="agendar" className="booking section-shell">
   <div className="booking-intro">
    <p className="eyebrow">AGENDAMENTO</p>
    <h2>Seu horário,<br/><em>sem complicação.</em></h2>
    <p>Escolha o serviço, a melhor data e um horário livre. Sua reserva é confirmada na hora.</p>
    <div className="schedule-legend" aria-label="Legenda dos horários">
     <span><i className="legend-dot available"/>Disponível</span>
     <span><i className="legend-dot selected"/>Selecionado</span>
     <span><i className="legend-dot occupied"/>Ocupado</span>
    </div>
   </div>
   <form onSubmit={submit} className="booking-form">
    <div className="field full"><Label htmlFor="name">Nome</Label><Input id="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Como podemos chamar você?"/></div>
    <div className="field"><Label htmlFor="phone">WhatsApp</Label><Input id="phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(48) 99999-9999"/></div>
    <div className="field"><Label>Serviço</Label><Select value={form.service} onValueChange={service=>setForm({...form,service,time:""})}><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{services.map(s=><SelectItem key={s.name} value={s.name}>{s.name} · R$ {s.price}</SelectItem>)}</SelectContent></Select></div>
    <div className="field full"><Label>Data</Label><Popover open={dateOpen} onOpenChange={setDateOpen}><PopoverTrigger asChild><button type="button" className="date-trigger"><span>{form.date?format(new Date(`${form.date}T12:00:00`),"dd 'de' MMMM 'de' yyyy",{locale:ptBR}):"Escolha uma data"}</span><CalendarDays/></button></PopoverTrigger><PopoverContent className="calendar-popover" align="start"><Calendar mode="single" locale={ptBR} selected={form.date?new Date(`${form.date}T12:00:00`):undefined} disabled={{before:new Date()}} onSelect={date=>{if(!date)return;setForm({...form,date:format(date,"yyyy-MM-dd"),time:""});setDateOpen(false)}}/></PopoverContent></Popover></div>
    <div className="field full time-field">
     <div className="time-heading"><Label>Horários disponíveis</Label>{form.date&&<span>{format(new Date(`${form.date}T12:00:00`),"EEEE, dd 'de' MMMM",{locale:ptBR})}</span>}</div>
     {!form.date?<div className="time-empty"><CalendarDays/><span>Escolha uma data para consultar os horários.</span></div>:<div className="time-board" role="group" aria-label="Horários disponíveis">{times.map(time=>{const busy=unavailable.has(time);const selected=form.time===time;return <button type="button" key={time} disabled={busy} aria-pressed={selected} className={`time-slot${selected?" selected":""}${busy?" unavailable":""}`} onClick={()=>setForm({...form,time})}><Clock3/><span>{time}</span><small>{busy?"Ocupado":selected?"Selecionado":"Disponível"}</small></button>})}</div>}
    </div>
    <Button type="submit" size="lg" className="full submit">Confirmar meu horário <ArrowRight/></Button>
   </form>
  </section>
  <footer><Brand/><p>BS Barber Classic · Desde 2016</p></footer>
  <Dialog open={!!confirmation} onOpenChange={open=>{if(!open)setConfirmation(null)}}><DialogContent className="booking-success" showCloseButton={false}><div className="success-mark"><Check/></div><DialogHeader><p className="eyebrow">RESERVA CONFIRMADA</p><DialogTitle>Seu horário está marcado.</DialogTitle><DialogDescription>{confirmation?.name}, preparamos todos os detalhes da sua reserva.</DialogDescription></DialogHeader><div className="success-details"><div><span>Serviço</span><strong>{confirmation?.service}</strong></div><div><span>Data</span><strong>{confirmation?format(new Date(`${confirmation.date}T12:00:00`),"dd/MM/yyyy"):""}</strong></div><div><span>Horário</span><strong>{confirmation?.time}</strong></div></div><p className="success-note">A confirmação por WhatsApp será ativada na versão final.</p><DialogClose asChild><Button className="success-close">Entendido <ArrowRight/></Button></DialogClose></DialogContent></Dialog>
 </main>
}
