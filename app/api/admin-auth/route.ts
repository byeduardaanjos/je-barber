import {ADMIN_SESSION_COOKIE,adminCredentialsAreConfigured,createAdminSession,validAdminCredentials,verifyAdminSession} from "@/lib/admin-auth";

export const dynamic="force-dynamic";

function sameOrigin(request:Request){
 const origin=request.headers.get("origin");
 if(!origin)return true;
 try{return new URL(origin).host===new URL(request.url).host}catch{return false}
}

export async function GET(request:Request){
 const cookie=request.headers.get("cookie")?.split(";").map(value=>value.trim()).find(value=>value.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length+1);
 return Response.json({authenticated:await verifyAdminSession(cookie)},{headers:{"Cache-Control":"no-store"}});
}

export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:"Origem não autorizada."},{status:403});
 if(!adminCredentialsAreConfigured())return Response.json({error:"O acesso administrativo ainda não foi configurado."},{status:503});
 const body=await request.json().catch(()=>({})) as {user?:string;password?:string};
 if(!body.user||!body.password||!validAdminCredentials(body.user,body.password)){
  return Response.json({error:"Usuário ou senha incorretos."},{status:401});
 }
 const session=await createAdminSession();
 return Response.json({authenticated:true},{headers:{
  "Cache-Control":"no-store",
  "Set-Cookie":`${ADMIN_SESSION_COOKIE}=${session.value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60*60*12}`,
 }});
}

export async function DELETE(request:Request){
 if(!sameOrigin(request))return Response.json({error:"Origem não autorizada."},{status:403});
 return Response.json({authenticated:false},{headers:{
  "Cache-Control":"no-store",
  "Set-Cookie":`${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
 }});
}

