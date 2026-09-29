import {NextResponse} from "next/server";
import {ADMIN_COOKIE,isAdminRequest,safeEqual,sessionToken} from "@/lib/admin-auth";

export const dynamic="force-dynamic";

export async function GET(request:Request){
  return NextResponse.json({authenticated:isAdminRequest(request)},{headers:{"Cache-Control":"no-store"}});
}

export async function POST(request:Request){
  const {username,password}=await request.json().catch(()=>({})) as {username?:string;password?:string};
  const expectedUser=process.env.ADMIN_USERNAME||"admin";
  const expectedPassword=process.env.ADMIN_PASSWORD||"";
  if(!expectedPassword||!username||!password||!safeEqual(username,expectedUser)||!safeEqual(password,expectedPassword)){
    return NextResponse.json({error:"Usuário ou senha inválidos."},{status:401});
  }
  const response=NextResponse.json({authenticated:true});
  response.cookies.set(ADMIN_COOKIE,sessionToken(),{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:60*60*8});
  return response;
}

export async function DELETE(){
  const response=NextResponse.json({authenticated:false});
  response.cookies.set(ADMIN_COOKIE,"",{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:0});
  return response;
}
