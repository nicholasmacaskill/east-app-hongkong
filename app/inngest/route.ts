// app/api/inngest/route.ts

import { serve } from "inngest/next";
// Make sure this path is correct relative to the route.ts file:
import { inngest, functions } from "@/app/inngest/client"; 

// The 'serve' function provides the necessary GET/POST exports 
// for Next.js to expose the Inngest endpoint.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: functions,
  // ... any other config ...
});
