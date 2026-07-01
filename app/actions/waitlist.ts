'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function joinWaitlist(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    return { success: false, message: 'Name and email are required' };
  }

  try {
    // Save to Supabase
    console.log('Attempting to save to Supabase:', { name, email });
    const supabaseResponse = await fetch('https://uwgjdqzwcgbaaudbrvgx.supabase.co/rest/v1/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Z2pkcXp3Y2diYWF1ZGJydmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzY2MjMsImV4cCI6MjA5NjcxMjYyM30.E8usBi9Rf_mm1T-9fpMD7BTKbXhPLUxSXVqjl2cab8g',
      },
      body: JSON.stringify({ name, email }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Supabase save failed:', errorText);
      throw new Error('Failed to save to database');
    }

    console.log('✅ Supabase save successful');

    // Send confirmation email to user
    console.log('Attempting to send user confirmation email to:', email);
    const userEmailResult = await resend.emails.send({
      from: 'Forge <hello@forgedinlife.com>',
      to: email,
      subject: "Thank you for supporting the Forge launch!",
      html: `
        <h2>Thank you, ${name}!</h2>
        <p>Thank you for supporting the launch of <strong>Forge</strong>.</p><p>The platform has not launched yet, and this does not sign you up to use the dating app. Your feedback and early interest help us measure demand, shape the platform, and guide the next stage of the build.</p>
        <p>We'll keep you updated as we build a dating platform where strong values lead to strong connections.</p>
        <p>Best regards,<br>The Forge Team</p>
      `,
    });
    console.log('User email result:', userEmailResult);

    // Send notification to admin
    console.log('Attempting to send admin notification');
    await resend.emails.send({
      from: 'Forge <hello@forgedinlife.com>',
      to: 'admin@forgedinlife.com',
      subject: `New Waitlist Signup: ${name}`,
      html: `
        <h2>New Waitlist Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    });
    console.log('✅ Admin notification sent');

    return { success: true, message: 'Thank you for supporting the Forge launch. Your feedback and early interest help guide the next stage of the platform.' };
  } catch (error) {
    console.error('Waitlist error:', error);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
}