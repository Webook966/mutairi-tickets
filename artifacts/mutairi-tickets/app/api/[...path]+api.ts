const API_BASE = "http://localhost:8080";

export async function GET(request: Request): Promise<Response> {
  return proxyRequest(request, "GET");
}

export async function POST(request: Request): Promise<Response> {
  return proxyRequest(request, "POST");
}

export async function PATCH(request: Request): Promise<Response> {
  return proxyRequest(request, "PATCH");
}

export async function DELETE(request: Request): Promise<Response> {
  return proxyRequest(request, "DELETE");
}

export async function OPTIONS(_request: Request): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

async function proxyRequest(request: Request, method: string): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = `${API_BASE}${url.pathname}${url.search}`;

  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    try {
      body = JSON.stringify(await request.json());
    } catch {
      body = undefined;
    }
  }

  const response = await fetch(targetUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
