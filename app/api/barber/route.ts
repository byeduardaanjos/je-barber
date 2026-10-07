export const dynamic = "force-dynamic";

import {ADMIN_SESSION_COOKIE,verifyAdminSession} from "@/lib/admin-auth";

type BookingInput={id?:string;name:string;phone:string;service:string;date:string;time:string;status?:string};
type ApiBody={action:string;booking?:BookingInput;block?:{date:string;time:string;note?:string};service?:{number:string;name:string;price:number;duration:number};phone?:string;customerToken?:string;bookingId?:string};

const normalizePhone=(value:string)=>value.replace(/\D/g,"");
function sessionCookie(request:Request){return request.headers.get("cookie")?.split(";").map(value=>value.trim()).find(value=>value.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length+1)}
async function requireAdmin(request:Request){return verifyAdminSession(sessionCookie(request))}
async function customerToken(phone:string){
 const secret=process.env.BARBER_API_SECRET;if(!secret)throw new Error("Configuração de segurança indisponível.");
 const encoder=new TextEncoder();const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signature=await crypto.subtle.sign("HMAC",key,encoder.encode(`customer:${normalizePhone(phone)}`));return Array.from(new Uint8Array(signature),byte=>byte.toString(16).padStart(2,"0")).join("");
}
async function validCustomer(phone:string,token:string){
 if(!phone||!token)return false;const expected=await customerToken(phone);if(expected.length!==token.length)return false;let difference=0;for(let index=0;index<expected.length;index++)difference|=expected.charCodeAt(index)^token.charCodeAt(index);return difference===0;
}
function canCancel(date:string,time:string){return new Date(`${date}T${time}:00-03:00`).getTime()-Date.now()>=4*60*60*1000}
async function notifyCancellation(booking:BookingInput){
 const accessToken=process.env.WHATSAPP_ACCESS_TOKEN,phoneNumberId=process.env.WHATSAPP_PHONE_NUMBER_ID,template=process.env.WHATSAPP_CANCEL_TEMPLATE;
 if(!accessToken||!phoneNumberId||!template)return false;
 const to=normalizePhone(booking.phone).replace(/^0+/,"");
 const recipient=to.startsWith("55")?to:`55${to}`;
 const response=await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",to:recipient,type:"template",template:{name:template,language:{code:"pt_BR"},components:[{type:"body",parameters:[{type:"text",text:booking.name},{type:"text",text:booking.service},{type:"text",text:booking.date},{type:"text",text:booking.time}]}]}})});
 return response.ok;
}

async function callDatabase(action:string,payload:Record<string,unknown>={},admin=false){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_PUBLISHABLE_KEY;
  const token=process.env.BARBER_API_SECRET;
  if(!url||!key||(admin&&!token))throw new Error("Configuração do banco indisponível.");
  const response=await fetch(`${url}/rest/v1/rpc/barber_api`,{
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":key,"Cache-Control":"no-store"},
    body:JSON.stringify({p_action:action,p_payload:payload,p_token:admin?token:null}),
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    const message=String((data as {message?:string}).message||"");
    if(message.includes("bookings_slot_key_key")||message.includes("duplicate key"))throw new Error("SLOT_TAKEN");
    throw new Error(message||"Não foi possível acessar o banco.");
  }
  return data;
}

export async function GET(request:Request){
  try{
    const isPublic=new URL(request.url).searchParams.get("scope")==="public";
    if(!isPublic&&!await requireAdmin(request))return Response.json({error:"Sessão administrativa necessária."},{status:401});
    const data=await callDatabase(isPublic?"get_public":"get_admin",{},!isPublic);
    return Response.json(data,{headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("barber_data_load_failed",error);return Response.json({error:"Não foi possível carregar a agenda."},{status:500})}
}

export async function POST(request:Request){
  try{
    const body=await request.json() as ApiBody;
    if(body.action==="createBooking"&&body.booking){
      const b=body.booking;if(!b.name||!b.phone||!b.service||!b.date||!b.time)return Response.json({error:"Preencha todos os dados."},{status:400});
      try{const data=await callDatabase("create_booking",b as unknown as Record<string,unknown>);return Response.json({...data,customerToken:await customerToken(b.phone)})}
      catch(error){if(error instanceof Error&&error.message==="SLOT_TAKEN")return Response.json({error:"Este horário acabou de ser reservado."},{status:409});throw error}
    }
    if(body.action==="createAdminBooking"&&body.booking){
      if(!await requireAdmin(request))return Response.json({error:"Sessão administrativa necessária."},{status:401});
      const b=body.booking;if(!b.name||!b.phone||!b.service||!b.date||!b.time)return Response.json({error:"Preencha todos os dados."},{status:400});
      try{return Response.json(await callDatabase("create_booking",b as unknown as Record<string,unknown>,true))}
      catch(error){if(error instanceof Error&&error.message==="SLOT_TAKEN")return Response.json({error:"Este horário já está ocupado."},{status:409});throw error}
    }
    if(body.action==="getCustomerBookings"&&body.phone&&body.customerToken){
      if(!await validCustomer(body.phone,body.customerToken))return Response.json({error:"Acesso não reconhecido neste aparelho."},{status:403});
      const data=await callDatabase("get_admin",{},true) as {bookings?:BookingInput[]};
      const phone=normalizePhone(body.phone);const bookings=(data.bookings||[]).filter(item=>normalizePhone(item.phone)===phone).sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
      return Response.json({bookings});
    }
    if(body.action==="cancelCustomerBooking"&&body.phone&&body.customerToken&&body.bookingId){
      if(!await validCustomer(body.phone,body.customerToken))return Response.json({error:"Acesso não reconhecido neste aparelho."},{status:403});
      const data=await callDatabase("get_admin",{},true) as {bookings?:BookingInput[]};
      const requestedPhone=normalizePhone(body.phone);const requestedBookingId=body.bookingId;
      const booking=(data.bookings||[]).find(item=>item.id===requestedBookingId&&normalizePhone(item.phone)===requestedPhone);
      if(!booking)return Response.json({error:"Agendamento não encontrado."},{status:404});
      if(booking.status==="Cancelado")return Response.json({booking,notificationSent:false});
      if(!canCancel(booking.date,booking.time))return Response.json({error:"O cancelamento online encerra 4 horas antes do horário. Fale com a barbearia pelo WhatsApp."},{status:422});
      const result=await callDatabase("update_booking",{...booking,status:"Cancelado"},true);
      const notificationSent=await notifyCancellation(booking).catch(()=>false);
      return Response.json({...result,notificationSent});
    }
    if(body.action==="createBlock"&&body.block){if(!await requireAdmin(request))return Response.json({error:"Sessão administrativa necessária."},{status:401});return Response.json(await callDatabase("create_block",body.block,true))}
    if(body.action==="upsertService"&&body.service){if(!await requireAdmin(request))return Response.json({error:"Sessão administrativa necessária."},{status:401});return Response.json(await callDatabase("upsert_service",body.service,true))}
    return Response.json({error:"Ação inválida."},{status:400});
  }catch(error){console.error("barber_data_create_failed",error);return Response.json({error:"Não foi possível salvar os dados."},{status:500})}
}

export async function PATCH(request:Request){
  try{
    if(!await requireAdmin(request))return Response.json({error:"Sessão administrativa necessária."},{status:401});
    const {booking}=await request.json() as {booking:BookingInput};
    if(!booking?.id)return Response.json({error:"Agendamento inválido."},{status:400});
    try{return Response.json(await callDatabase("update_booking",booking as unknown as Record<string,unknown>,true))}
    catch(error){if(error instanceof Error&&error.message==="SLOT_TAKEN")return Response.json({error:"Este horário já está ocupado."},{status:409});throw error}
  }catch(error){console.error("barber_data_update_failed",error);return Response.json({error:"Não foi possível atualizar o agendamento."},{status:500})}
}

export async function DELETE(request:Request){
  try{
    if(!await requireAdmin(request))return Response.json({error:"Sessão administrativa necessária."},{status:401});
    const {type,id}=await request.json() as {type:"block"|"service";id:string};
    if(type==="block")return Response.json(await callDatabase("delete_block",{id},true));
    if(type==="service")return Response.json(await callDatabase("delete_service",{id},true));
    return Response.json({error:"Tipo inválido."},{status:400});
  }catch(error){console.error("barber_data_delete_failed",error);return Response.json({error:"Não foi possível remover o item."},{status:500})}
}
