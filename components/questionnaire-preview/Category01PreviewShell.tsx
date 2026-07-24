'use client';

/**
 * @deprecated Use CompatibilityProfilePreviewShell for the multi-category preview.
 * Retained as a thin Category 1 only wrapper for local isolation.
 */
import CompatibilityProfilePreviewShell from '@/components/questionnaire-preview/CompatibilityProfilePreviewShell';
import type { CategoryDefinition } from '@/lib/questionnaire/types';

type Category01PreviewShellProps = {
  category: CategoryDefinition;
};

export default function Category01PreviewShell({ category }: Category01PreviewShellProps) {
  return <CompatibilityProfilePreviewShell categories={[category]} />;
}
