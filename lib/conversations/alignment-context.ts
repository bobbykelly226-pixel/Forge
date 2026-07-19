/**
 * Load Forge Connection Context for a conversation peer using Compatibility Engine.
 */

import {
  evaluateCompatibility,
  personFromPublicDiscoveryProfile,
  personFromSeedCompatibilityFields,
  toAlignmentPresentation,
} from '@/lib/compatibility';
import { loadViewerCompatibilityPerson } from '@/lib/compatibility/load-viewer';
import { SEED_DEMO_VIEWER } from '@/lib/compatibility/seed-viewer';
import { getDiscoveryProfile } from '@/lib/data/discovery';
import { getSeedProfileById } from '@/lib/seed/catalog';
import { isSeedProfileId } from '@/lib/seed/access';
import type { ConversationAlignmentContext } from './types';

export async function loadConversationAlignmentContext(
  peerUserId: string
): Promise<ConversationAlignmentContext | null> {
  if (isSeedProfileId(peerUserId)) {
    const seed = getSeedProfileById(peerUserId);
    if (!seed) return null;
    const engine = evaluateCompatibility(
      personFromSeedCompatibilityFields(SEED_DEMO_VIEWER),
      personFromSeedCompatibilityFields({
        id: seed.id,
        firstName: seed.firstName,
        relationshipGoal: seed.relationshipGoal,
        faithImportance: seed.faithImportance,
        faithIdentity: seed.faithIdentity ?? null,
        children: seed.children,
        hasChildren: seed.hasChildren,
        openToPartnerWithChildren: seed.openToPartnerWithChildren,
        pets: seed.pets,
        petsTypes: seed.petsTypes,
        petsPartnerPreferences: seed.petsPartnerPreferences,
        petsAllergyConstraint: seed.petsAllergyConstraint,
        petsAllergyTypes: seed.petsAllergyTypes,
        smoking: seed.smoking,
        smokingPartnerPreferences: seed.smokingPartnerPreferences,
        drinking: seed.drinking,
        drinkingPartnerPreferences: seed.drinkingPartnerPreferences,
        coreValues: seed.coreValues,
      })
    );
    const presentation = toAlignmentPresentation(engine, {
      characterSignalIds: seed.characterSignalIds,
    });
    return {
      alignmentLabel: presentation.alignmentLabel,
      whyIntroduced: engine.whyForgeIntroducedYou,
      sharedStrengths: presentation.sharedStrengths,
      importantFactors: presentation.importantFactors.map((factor) => ({
        title: factor.title,
        explanation: factor.explanation,
        viewerAnswer: factor.viewerAnswer,
        partnerAnswer: factor.partnerAnswer,
      })),
      incompleteAssessmentCopy: presentation.incompleteAssessmentCopy,
    };
  }

  const [viewerResult, peerResult] = await Promise.all([
    loadViewerCompatibilityPerson(),
    getDiscoveryProfile(peerUserId),
  ]);

  if (!viewerResult.success || !peerResult.success || !peerResult.data) {
    return null;
  }

  const engine = evaluateCompatibility(
    viewerResult.person,
    personFromPublicDiscoveryProfile(peerResult.data)
  );
  const presentation = toAlignmentPresentation(engine);

  return {
    alignmentLabel: presentation.alignmentLabel,
    whyIntroduced: engine.whyForgeIntroducedYou,
    sharedStrengths: presentation.sharedStrengths,
    importantFactors: presentation.importantFactors.map((factor) => ({
      title: factor.title,
      explanation: factor.explanation,
      viewerAnswer: factor.viewerAnswer,
      partnerAnswer: factor.partnerAnswer,
    })),
    incompleteAssessmentCopy: presentation.incompleteAssessmentCopy,
  };
}
