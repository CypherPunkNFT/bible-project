import { servePopulationExport } from "../../../server/population-export";
// The "Download complete catalogue" link's address; public/_routes.json sends only this path to a function.
export const onRequest: PagesFunction<Env> = ({ request, env, waitUntil }) => servePopulationExport(request, env.ASSETS, waitUntil);
