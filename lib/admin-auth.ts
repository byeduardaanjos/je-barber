import {cookies} from "next/headers";

export const ADMIN_SESSION_COOKIE="bs_barber_admin";
const SESSION_DURATION_SECONDS=60*60*12;

const encode=(value:string)=>new TextEncoder().encode(value);

async function sign(value:string){
 const secret=process.env.BARBER_API_SECRET;
 if(!secret)throw new Error("Configuração de segurança indisponível.");
 const key=await crypto.subtle.importKey("raw",encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const signature=await crypto.subtle.sign("HMAC",key,encode(value));
 return Array.from(new Uint8Array(signature),byte=>byte.toString(16).padStart(2,"0")).join("");
}

function safeEqual(left:string,right:string){
 if(left.length!==right.length)return false;
 let difference=0;
 for(let index=0;index<left.length;index++)difference|=left.charCodeAt(index)^right.charCodeAt(index);
 return difference===0;
}

export function adminCredentialsAreConfigured(){
 return Boolean(process.env.ADMIN_USER&&process.env.ADMIN_PASSWORD&&process.env.BARBER_API_SECRET);
}

export function validAdminCredentials(user:string,password:string){
 const expectedUser=process.env.ADMIN_USER;
 const expectedPassword=process.env.ADMIN_PASSWORD;
 if(!expectedUser||!expectedPassword)return false;
 return safeEqual(user.trim().toLowerCase(),expectedUser.trim().toLowerCase())&&safeEqual(password,expectedPassword);
}

export async function createAdminSession(){
 const expiresAt=Math.floor(Date.now()/1000)+SESSION_DURATION_SECONDS;
 const payload=`admin.${expiresAt}`;
 return {value:`${payload}.${await sign(payload)}`,expiresAt};
}

export async function verifyAdminSession(value?:string){
 if(!value)return false;
 const parts=value.split(".");
 if(parts.length!==3||parts[0]!=="admin")return false;
 const expiresAt=Number(parts[1]);
 if(!Number.isFinite(expiresAt)||expiresAt<=Math.floor(Date.now()/1000))return false;
 const payload=`${parts[0]}.${parts[1]}`;
 try{return safeEqual(parts[2],await sign(payload))}catch{return false}
}

export async function isAdminAuthenticated(){
 const store=await cookies();
 return verifyAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
}

