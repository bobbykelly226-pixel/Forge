'use server';

export type FoundingBetaRequestState = { success: boolean; message: string };

/** Keep stale clients from creating another access request or sending old emails. */
export async function submitFoundingBetaRequest(): Promise<FoundingBetaRequestState> {
  return { success: false, message: 'No access request is needed. Create your account at https://forge.forgedinlife.com/signup, or sign in if you already joined.' };
}
