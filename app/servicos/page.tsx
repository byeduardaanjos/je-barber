"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";

const services=[
  {name:"Degradê",price:40,duration:40,number:"01"},
  {name:"Degradê + barba",price:70,duration:60,number:"02"},
  {name:"Corte social",price:30,duration:35,number:"03"},
  {name:"Sobrancelha",price:15,duration:15,number:"04"},
  {name:"Corte + luzes",price:150,duration:120,number:"05"},
  {name:"Corte + platinado",price:200,duration:180,number:"06"},
];

export default function ServicesPage(){
  const [menuOpen,setMenuOpen]=useState(false);
  const [headerScrolled,setHeaderScrolled]=useState(false);
  useEffect(()=>{const onScroll=()=>setHeaderScrolled(window.scrollY>28);onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[]);
  return <main className="catalog-page">
    <header className={`site-header${headerScrolled?" is-scrolled":""}`}>
      <a href="/" className="brand" aria-label="J&E Barber - início"><Image src="/logoje-transparent.png" alt="J&E Barber" width={180} height={180} priority/></a>
      <nav className={menuOpen?"nav open":"nav"} aria-label="Navegação principal">
        <a href="/" onClick={()=>setMenuOpen(false)}>Início</a>
        <a href="/servicos" onClick={()=>setMenuOpen(false)}>Serviços</a>
        <a href="/#sobre" onClick={()=>setMenuOpen(false)}>Sobre</a>
        <a href="/#contato" onClick={()=>setMenuOpen(false)}>Contato</a>
        <a href="/#agendar" className="nav-cta" onClick={()=>setMenuOpen(false)}>Agendar horário</a>
      </nav>
      <button className="menu-button" onClick={()=>setMenuOpen(v=>!v)} aria-label={menuOpen?"Fechar menu":"Abrir menu"}>{menuOpen?<X/>:<Menu/>}</button>
    </header>
    <section className="catalog-shell catalog-motion">
      <div className="catalog-intro"><p className="eyebrow">MENU COMPLETO</p><h1>Seu estilo começa<br/><em>na escolha certa.</em></h1><p className="catalog-subtitle">Conheça todos os serviços da J&E Barber.</p></div>
      <div className="service-list catalog-list">{services.map(s=><article key={s.name}><small>{s.number}</small><div><h3>{s.name}</h3><span>A partir de {s.duration} min</span></div><strong>R$ {s.price.toFixed(2).replace(".",",")}</strong><a href="/#agendar" aria-label={`Agendar ${s.name}`}><ArrowRight/></a></article>)}</div>
      <div className="catalog-bottom"><p>Escolha o serviço e reserve o melhor horário para você.</p><a href="/#agendar">Agendar horário <ArrowRight/></a></div>
    </section>
  </main>
}
