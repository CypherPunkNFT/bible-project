import { handleContact } from "../../server/contact";
export const onRequest: PagesFunction<Env> = ({ request, env }) => handleContact(request, env);
