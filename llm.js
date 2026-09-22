const Groq = require("groq-sdk");
const { tavily } = require("@tavily/core");
const readline=require("readline/promises");
const NodeCache = require("node-cache");

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY, 
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
const cache = new NodeCache({
    stdTTL: 60*60, // data expires after 5 minutes
});

 exports.generateMsg= async function(text,threadId) {
  
 const baseMessage = [
  {
    role: "system",
    content: `
You are a smart AI assistant.
Rules:
-Do not use Markdown formatting.
- Provide accurate and helpful answers.
- Use the webSearch tool for:
  - current events
  - latest news
  - recent updates
  - sports results
  - information that may have changed after your training data.
- Do not use webSearch for general knowledge questions.
- Keep answers clear and concise.
- If you are unsure about something, say so instead of making up information.
`
  }
];
  let message = cache.get(threadId) ?? baseMessage;
    
     message.push({
      role: "user",
      content: text,
     },)
     const MAX_RETRIES=6;
     let count=0;
   while(true){
    if(count>MAX_RETRIES){
     return "Sorry,i am not able to find your query.please try again"
    }
    count++;
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    // temperature: 0.8,
    // tool_choice: "required",
    messages: message,
    tools: [
      { 
        type: "function",
        function: {
          name: "webSearch",
          description: "Search the web for latest information",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  message.push(completion.choices[0].message);

  const toolCalls = completion.choices[0].message.tool_calls;
  if (!toolCalls) {
   
    cache.set(threadId,message)
    return completion.choices[0].message.content;
    
  }

  for (const tool of toolCalls) {
    const functionName = tool.function.name;
    const functionParams = tool.function.arguments;
    if (functionName === "webSearch") {
      const toolResult = await webSearch(JSON.parse(functionParams));
      message.push({
        role: "tool",
        tool_call_id: tool.id,
        name: tool.function.name,
        content: toolResult,
      });
    }
  }}
  
}

async function webSearch({ query }) {
  const toolResult = await tvly.search(query);
  return toolResult.results.map((result) => result.content).join("\n\n");
}
