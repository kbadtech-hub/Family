/**
 * AI Face Similarity & Profile Photo Embedding Matcher for Beteseb Platform
 */
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Calculates Cosine Similarity between two numeric vector embeddings.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0.0;
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0.0 || normB === 0.0) return 0.0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.round(similarity * 1000) / 1000;
}

/**
 * Compares an uploaded profile face embedding against existing profile face embeddings in DB.
 */
export async function findDuplicateFaceProfiles(
  currentUserId: string,
  targetEmbedding: number[],
  similarityThreshold = 0.85
) {
  const { data: candidates, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, face_embedding')
    .neq('id', currentUserId)
    .not('face_embedding', 'is', null);

  if (error || !candidates) return [];

  const matchedProfiles = [];

  for (const candidate of candidates) {
    const candEmbedding = candidate.face_embedding as number[];
    if (candEmbedding && Array.isArray(candEmbedding)) {
      const score = calculateCosineSimilarity(targetEmbedding, candEmbedding);
      if (score >= similarityThreshold) {
        matchedProfiles.push({
          profile_id: candidate.id,
          full_name: candidate.full_name,
          avatar_url: candidate.avatar_url,
          similarity_score: score,
        });
      }
    }
  }

  return matchedProfiles;
}
