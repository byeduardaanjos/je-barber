import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";

export default async function AdminLayout({children}:{children:React.ReactNode}){
 if(!await isAdminAuthenticated())redirect("/login");
 return children;
}

