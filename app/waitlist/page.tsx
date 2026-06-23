'use server';

import { Resend } from 'resend';

const resend = new Resend('re_2t9qaXsf_M4j99cJzgEon9xU8Q7psjaMj');

export async function joinWaitlist(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    return { success: false, message: 'Name and email are required' };
  }

  try {
    // Save to Supabase
    const supabaseResponse = await fetch('https://uwgjdqzwcgbaaudbrvgx.supabase.co/rest/v1/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Z2pkcXp3Y2diYWF1ZGJydmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzY2MjMsImV4cCI6MjA5NjcxMjYyM30.E8usBi9Rf_mm1T-9fpMD7BTKbXhPLUxSXVqjl2cab8g',
      },
      body: JSON.stringify({ name, email }),
    });

    if (!supabaseResponse.ok) {
      throw new Error('Failed to save to database');
    }

    // Send confirmation email to user
    await resend.emails.send({
      from: 'Forge <onboarding@resend.dev>',
      to: email,
      subject: "Welcome to the Forge Waitlist!",
      html: `
        <h2>Thank you, ${name}!</h2>
        <p>You're now on the waitlist for <strong>Forge</strong>.</p>
        <p>We'll keep you updated as we build a dating platform where strong values lead to strong connections.</p>
        <p>Best regards,<br>The Forge Team</p>
      `,
    });

    // Send notification to admin
    await resend.emails.send({
      from: 'Forge <onboarding@resend.dev>',
      to: 'admin@forgedinlife.com',
      subject: `New Waitlist Signup: ${name}`,
      html: `
        <h2>New Waitlist Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    return { success: true, message: 'Successfully joined the waitlist!' };
  } catch (error) {
    console.error('Waitlist error:', error);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
}