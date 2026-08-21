import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { applyProgramChangeProposal, getProgramChangeProposalById } from "@/lib/recommendations/change-proposal-service";
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ proposalId: string }> }) {
  const response = NextResponse.json({ ok: true });
  const auth = await resolveAuth(request, response);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { proposalId } = await params;

  try {
    const proposal = await getProgramChangeProposalById(auth.supabase!, auth.userId!, proposalId);
    if (!proposal) {
      return createFallbackResponse("Proposal not found.", 404);
    }

    if (proposal.status !== "proposed") {
      return createFallbackResponse("Only proposed changes can be applied.", 409);
    }

    if (proposal.validationResult.status !== "approved") {
      return createFallbackResponse("This proposal requires review before it can be applied.", 409);
    }

    const applied = await applyProgramChangeProposal(auth.supabase!, proposalId);
    if (proposal.recommendationId) {
      await setCoachRecommendationApplicationStatus(auth.supabase!, auth.userId!, proposal.recommendationId, {
        applicationStatus: "applied",
        appliedAt: applied.appliedAt ?? new Date().toISOString(),
        appliedChangeSummary: {
          proposalId: applied.id,
          changeType: applied.changeType,
          targetEntityType: applied.targetEntityType,
          status: applied.status
        }
      });
    }

    return jsonWithCookies(response, { proposal: applied });
  } catch (error) {
    return createFallbackResponse(error instanceof Error ? error.message : "Unable to apply proposal.", 400);
  }
}
