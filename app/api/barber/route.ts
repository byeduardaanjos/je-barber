export const dynamic = "force-dynamic";

type BookingInput={id?:string;name:string;phone:string;service:string;date:string;time:string;status?:string};
type ApiBody={action:string;booking?:BookingInput;block?:{date:string;time:string;note?:string};service?:{number:string;name:string;price:number;duration:number}};

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
    const data=await callDatabase(isPublic?"get_public":"get_admin",{},!isPublic);
    return Response.json(data,{headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("barber_data_load_failed",error);return Response.json({error:"Não foi possível carregar a agenda."},{status:500})}
}

export async function POST(request:Request){
  try{
    const body=await request.json() as ApiBody;
    if(body.action==="createBooking"&&body.booking){
      const b=body.booking;if(!b.name||!b.phone||!b.service||!b.date||!b.time)return Response.json({error:"Preencha todos os dados."},{status:400});
      try{return Response.json(await callDatabase("create_booking",b as unknown as Record<string,unknown>))}
      catch(error){if(error instanceof Error&&error.message==="SLOT_TAKEN")return Response.json({error:"Este horário acabou de ser reservado."},{status:409});throw error}
    }
    if(body.action==="createBlock"&&body.block)return Response.json(await callDatabase("create_block",body.block,true));
    if(body.action==="upsertService"&&body.service)return Response.json(await callDatabase("upsert_service",body.service,true));
    return Response.json({error:"Ação inválida."},{status:400});
  }catch(error){console.error("barber_data_create_failed",error);return Response.json({error:"Não foi possível salvar os dados."},{status:500})}
}

export async function PATCH(request:Request){
  try{
    const {booking}=await request.json() as {booking:BookingInput};
    if(!booking?.id)return Response.json({error:"Agendamento inválido."},{status:400});
    try{return Response.json(await callDatabase("update_booking",booking as unknown as Record<string,unknown>,true))}
    catch(error){if(error instanceof Error&&error.message==="SLOT_TAKEN")return Response.json({error:"Este horário já está ocupado."},{status:409});throw error}
  }catch(error){console.error("barber_data_update_failed",error);return Response.json({error:"Não foi possível atualizar o agendamento."},{status:500})}
}

export async function DELETE(request:Request){
  try{
    const {type,id}=await request.json() as {type:"block"|"service";id:string};
    if(type==="block")return Response.json(await callDatabase("delete_block",{id},true));
    if(type==="service")return Response.json(await callDatabase("delete_service",{id},true));
    return Response.json({error:"Tipo inválido."},{status:400});
  }catch(error){console.error("barber_data_delete_failed",error);return Response.json({error:"Não foi possível remover o item."},{status:500})}
}
