import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getProgramChangeProposalById } from "@/lib/recommendations/change-proposal-service";
import { setCoachRecommendationApplicationStatus } from "@/lib/ai/recommendation-service";

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

function parseStatus(body: unknown) {
  const value = body as Record<string, unknown> | null;
  const status = typeof value?.status === "string" ? value.status.trim() : "";
  if (!status) {
    throw new Error("A status is required.");
  }

  if (!["draft", "proposed", "needs_review", "approved", "rejected", "applied", "failed", "superseded", "expired"].includes(status)) {
    throw new Error("Unsupported proposal status.");
  }

  return status as "draft" | "proposed" | "needs_review" | "approved" | "rejected" | "applied" | "failed" | "superseded" | "expired";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ proposalId: string }> }) {
  const response = NextResponse.json({ ok: true });
  const auth = await resolveAuth(request, response);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { proposalId } = await params;
  const proposal = await getProgramChangeProposalById(auth.supabase!, auth.userId!, proposalId);

  return jsonWithCookies(response, { proposal, found: Boolean(proposal) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ proposalId: string }> }) {
  const response = NextResponse.json({ ok: true });
  const auth = await resolveAuth(request, response);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { proposalId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const status = parseStatus(body);
    const result = await auth.supabase!
      .from("program_change_proposals")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        rejected_at: status === "rejected" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", proposalId)
      .eq("user_id", auth.userId!)
      .select("*")
      .single();

    if (result.error) {
      return createFallbackResponse(result.error.message, 400);
    }

    const proposal = result.data ? await getProgramChangeProposalById(auth.supabase!, auth.userId!, proposalId) : null;

    if (proposal?.recommendationId) {
      await setCoachRecommendationApplicationStatus(auth.supabase!, auth.userId!, proposal.recommendationId, {
        applicationStatus: status === "rejected" ? "rejected" : "reviewing"
      });
    }

    return jsonWithCookies(response, { proposal });
  } catch (error) {
    return createFallbackResponse(error instanceof Error ? error.message : "Unable to update proposal.", 400);
  }
}
