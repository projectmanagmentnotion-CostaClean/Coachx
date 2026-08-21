import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import {
  createProgramChangeProposal,
  getLatestProgramChangeProposalByRecommendation,
  programChangeCommandSchema,
  type ProgramChangeCommand
} from "@/lib/recommendations/change-proposal-service";
import { getCoachRecommendationById, setCoachRecommendationApplicationStatus } from "@/lib/ai/recommendation-service";
import { loadProgramBundle } from "@/lib/program-service";

function createFallbackResponse(message: string, status = 503) {
  return NextResponse.json({ error: message }, { status });
}

function jsonWithCookies(source: NextResponse, body: unknown, status = 200) {
  const response = NextResponse.json(body, { status });
  for (const cookie of source.cookies.getAll()) {
    response.cookies.set({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      path: cookie.path,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      partitioned: cookie.partitioned
    });
  }
  return response;
}

async function resolveAuth(request: NextRequest, response: NextResponse) {
  const supabase = createSupabaseRouteClient(request, response);
  if (!supabase) {
    return { supabase: null, userId: null, errorResponse: createFallbackResponse("AthlexForce is not ready yet.") };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, userId: null, errorResponse: createFallbackResponse("Authentication is required.", 401) };
  }

  return { supabase, userId: user.id, errorResponse: null };
}

function parseRecommendationId(url: URL) {
  const recommendationId = url.searchParams.get("recommendationId")?.trim();
  return recommendationId && recommendationId.length > 0 ? recommendationId : null;
}

function parseBody(body: unknown): { recommendationId: string; command: ProgramChangeCommand } {
  const value = body as Record<string, unknown> | null;
  const recommendationId = typeof value?.recommendationId === "string" ? value.recommendationId.trim() : "";
  const command = programChangeCommandSchema.parse(value?.command);

  if (!recommendationId) {
    throw new Error("A recommendationId is required.");
  }

  return {
    recommendationId,
    command
  };
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const auth = await resolveAuth(request, response);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const recommendationId = parseRecommendationId(new URL(request.url));
  if (!recommendationId) {
    return createFallbackResponse("recommendationId is required.", 400);
  }

  const proposal = await getLatestProgramChangeProposalByRecommendation(auth.supabase!, auth.userId!, recommendationId);

  return jsonWithCookies(response, {
    proposal,
    found: Boolean(proposal)
  });
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const auth = await resolveAuth(request, response);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const body = await request.json().catch(() => ({}));

  try {
    const { recommendationId, command } = parseBody(body);
    const recommendation = await getCoachRecommendationById(auth.supabase!, auth.userId!, recommendationId);
    if (!recommendation) {
      return createFallbackResponse("Recommendation not found.", 404);
    }

    const bundle = await loadProgramBundle(auth.supabase!, auth.userId!);
    if (!bundle) {
      return createFallbackResponse("An active program is required before a change proposal can be created.", 409);
    }

    const proposal = await createProgramChangeProposal(auth.supabase!, auth.userId!, recommendation, bundle, command);
    await setCoachRecommendationApplicationStatus(auth.supabase!, auth.userId!, recommendation.id, {
      applicationStatus: "reviewing"
    });

    return jsonWithCookies(response, {
      proposal,
      recommendationStatus: "reviewing"
    });
  } catch (error) {
    return createFallbackResponse(error instanceof Error ? error.message : "Unable to create change proposal.", 400);
  }
}
