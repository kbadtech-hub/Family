import { NextRequest, NextResponse } from 'next/server';
import { checkDuplicateAccount } from '@/lib/duplicate/matcher';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      father_name,
      grandfather_name,
      mother_name,
      birth_date,
      city,
      phone,
      email,
      current_user_id,
      flag_if_medium = true,
    } = body;

    if (!first_name || !father_name) {
      return NextResponse.json(
        { error: 'First name and Father name are required for verification.' },
        { status: 400 }
      );
    }

    const result = await checkDuplicateAccount({
      first_name,
      father_name,
      grandfather_name,
      mother_name,
      birth_date,
      city,
      phone,
      email,
      current_user_id,
    });

    // If similarity score is in medium-high range (70% - 89%), insert a flag in duplicate_flags for Admin Dashboard review
    if (
      result.has_duplicate &&
      result.matched_profile_id &&
      current_user_id &&
      result.matched_profile_id !== current_user_id &&
      flag_if_medium
    ) {
      await supabaseAdmin.from('duplicate_flags').upsert(
        {
          primary_user_id: result.matched_profile_id,
          flagged_user_id: current_user_id,
          similarity_score: result.match_score,
          matched_stage: result.matched_stage || 'stage_1_basic',
          status: result.duplicate_type === 'stage_2_block' ? 'pending' : 'pending',
          match_details: {
            first_name,
            father_name,
            grandfather_name,
            mother_name,
            city,
            matched_stage: result.matched_stage,
            duplicate_type: result.duplicate_type,
          },
        },
        { onConflict: 'primary_user_id,flagged_user_id' }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error in check-duplicate route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
