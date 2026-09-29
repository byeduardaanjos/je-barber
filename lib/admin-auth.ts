import {createHmac,timingSafeEqual} from "node:crypto";

export const ADMIN_COOKIE="je_barber_admin";

const authSecret=()=>process.env.ADMIN_AUTH_SECRET||process.env.BARBER_API_SECRET||"";

export function safeEqual(value:string,expected:string){
  const left=Buffer.from(value);
  const right=Buffer.from(expected);
  return left.length===right.length&&timingSafeEqual(left,right);
}

export function sessionToken(){
  return createHmac("sha256",authSecret()).update("je-barber-admin-session").digest("hex");
}

export function isAdminRequest(request:Request){
  const cookie=request.headers.get("cookie")||"";
  const value=cookie.split(";").map(part=>part.trim()).find(part=>part.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length+1);
  return Boolean(authSecret()&&value&&safeEqual(value,sessionToken()));
}
