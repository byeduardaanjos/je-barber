"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";

const services=[
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

export default function ServicesPage(){
  const [menuOpen,setMenuOpen]=useState(false);
  const [headerScrolled,setHeaderScrolled]=useState(false);
  useEffect(()=>{const onScroll=()=>setHeaderScrolled(window.scrollY>28);onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[]);
  return <main className="catalog-page">
    <header className={`site-header${headerScrolled?" is-scrolled":""}`}>
      <a href="/" className="brand" aria-label="BS Barber Classic - início"><Image src="/logo-bs.png" alt="BS Barber Classic" width={180} height={180} priority/></a>
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
      <div className="catalog-intro"><p className="eyebrow">MENU COMPLETO</p><h1>Seu visual começa<br/><em>na escolha certa.</em></h1><p className="catalog-subtitle">Do clássico às tendências atuais, escolha o cuidado que combina com você.</p></div>
      <div className="service-list catalog-list">{services.map(s=><article key={s.name}><small>{s.number}</small><div><h3>{s.name}</h3><span>A partir de {s.duration} min</span></div><strong>R$ {s.price.toFixed(2).replace(".",",")}</strong><a href="/#agendar" aria-label={`Agendar ${s.name}`}><ArrowRight/></a></article>)}</div>
      <div className="catalog-bottom"><p>Escolha o serviço e reserve o melhor horário para você.</p><a href="/#agendar">Agendar horário <ArrowRight/></a></div>
    </section>
  </main>
}
