import { handleTwentyQuestionsReport } from "../../../server/twenty-questions";
export const onRequest: PagesFunction<Env> = ({ request, env }) => handleTwentyQuestionsReport(request, env);
