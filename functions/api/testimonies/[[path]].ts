import { handleTestimonies } from "../../../server/testimonies";
export const onRequest: PagesFunction<Env> = ({ request, env }) => handleTestimonies(request, env);
