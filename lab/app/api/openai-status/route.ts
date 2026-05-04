export async function GET() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.DESENGINE_OPENAI_MODEL || null;

  return Response.json({
    ok: true,
    hasKey,
    model,
  });
}

