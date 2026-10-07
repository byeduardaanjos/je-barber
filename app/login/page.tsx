"use client";

import {FormEvent,useEffect,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {ArrowLeft,Eye,EyeOff,LockKeyhole,LogIn,UserRound} from "lucide-react";

export default function LoginPage(){
 const[user,setUser]=useState(""),[password,setPassword]=useState(""),[visible,setVisible]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/admin-auth",{cache:"no-store"}).then(response=>response.json()).then((data:{authenticated?:boolean})=>{if(data.authenticated)window.location.replace("/admin")}).catch(()=>{})},[]);
 async function submit(event:FormEvent){
  event.preventDefault();setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin-auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user,password})});
   const data=await response.json() as {authenticated?:boolean;error?:string};
   if(!response.ok||!data.authenticated)throw new Error(data.error||"Não foi possível entrar.");
   window.location.replace("/admin");
  }catch(error){setError(error instanceof Error?error.message:"Não foi possível entrar.")}finally{setLoading(false)}
 }
 return <main className="login-shell">
  <div className="login-glow" aria-hidden="true"/>
  <Link href="/" className="login-back"><ArrowLeft/> Voltar ao site</Link>
  <section className="login-card">
   <div className="login-brand"><Image src="/logo-bs.png" alt="BS Barber Classic" width={116} height={116}/><span>ACESSO RESTRITO</span></div>
   <div className="login-copy"><p>PAINEL ADMINISTRATIVO</p><h1>Gestão da<br/><em>barbearia.</em></h1><span>Entre para organizar a agenda, os clientes e os serviços.</span></div>
   <form onSubmit={submit}>
    <label><span>Usuário</span><div><UserRound/><input autoComplete="username" value={user} onChange={event=>setUser(event.target.value)} placeholder="Seu usuário" required/></div></label>
    <label><span>Senha</span><div><LockKeyhole/><input type={visible?"text":"password"} autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Sua senha" required/><button type="button" onClick={()=>setVisible(current=>!current)} aria-label={visible?"Ocultar senha":"Mostrar senha"}>{visible?<EyeOff/>:<Eye/>}</button></div></label>
    {error&&<p className="login-error" role="alert">{error}</p>}
    <button className="login-submit" disabled={loading}>{loading?"Entrando…":<>Entrar no painel <LogIn/></>}</button>
   </form>
   <small>Área exclusiva da equipe BS Barber Classic.</small>
  </section>
 </main>
}

