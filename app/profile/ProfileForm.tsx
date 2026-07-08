'use client';

import { saveProfile } from '@/app/actions/profile';
import Header from '@/components/Header';
import type { Profile } from '@/lib/types/profile';
import Link from 'next/link';
import { useState } from 'react';

type ProfileFormProps = {
  profile: Profile | null;
};

const inputClassName =
  'w-full px-6 py-4 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 text-lg';

const labelClassName = 'block text-sm font-medium text-[#0B2D5C] mb-2';

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const result = await saveProfile(formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <main className="pt-16 pb-20 max-w-2xl mx-auto px-5 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-wide text-[#D62828] font-semibold mb-4">
            Your Profile
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2D5C] mb-4">
            {profile ? 'Update Your Profile' : 'Create Your Profile'}
          </h1>
          <p className="text-lg text-[#444444] leading-relaxed">
            Share the basics that help Forge understand who you are and what you are looking for.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-[#0B2D5C]/10 rounded-3xl p-7 sm:p-10 shadow-sm">
          <div>
            <label htmlFor="full_name" className={labelClassName}>
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={profile?.full_name ?? ''}
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="age" className={labelClassName}>
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={18}
              max={120}
              defaultValue={profile?.age ?? ''}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="location" className={labelClassName}>
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={profile?.location ?? ''}
              placeholder="City, State"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="relationship_goal" className={labelClassName}>
              Relationship goal
            </label>
            <select
              id="relationship_goal"
              name="relationship_goal"
              defaultValue={profile?.relationship_goal ?? ''}
              className={inputClassName}
            >
              <option value="">Select one</option>
              <option value="Marriage">Marriage</option>
              <option value="Serious relationship">Serious relationship</option>
              <option value="Intentional dating">Intentional dating</option>
              <option value="Getting to know someone">Getting to know someone</option>
            </select>
          </div>

          <div>
            <label htmlFor="faith_importance" className={labelClassName}>
              Faith importance
            </label>
            <select
              id="faith_importance"
              name="faith_importance"
              defaultValue={profile?.faith_importance ?? ''}
              className={inputClassName}
            >
              <option value="">Select one</option>
              <option value="Very important">Very important</option>
              <option value="Important">Important</option>
              <option value="Somewhat important">Somewhat important</option>
              <option value="Not important">Not important</option>
            </select>
          </div>

          <div>
            <label htmlFor="service_background" className={labelClassName}>
              Service background
            </label>
            <input
              id="service_background"
              name="service_background"
              type="text"
              defaultValue={profile?.service_background ?? ''}
              placeholder="Military, first responder, healthcare, volunteer, etc."
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="short_bio" className={labelClassName}>
              Short bio
            </label>
            <textarea
              id="short_bio"
              name="short_bio"
              rows={4}
              defaultValue={profile?.short_bio ?? ''}
              placeholder="A few sentences about you and what matters to you."
              className={`${inputClassName} resize-y min-h-[120px]`}
            />
          </div>

          {status === 'success' && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3" role="status">
              {message}
            </p>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#D62828] hover:bg-[#A61F1F] disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-lg transition"
          >
            {status === 'loading' ? 'Saving...' : profile ? 'Save profile' : 'Create profile'}
          </button>
        </form>

        <p className="text-center mt-8">
          <Link href="/app" className="text-[#0B2D5C] hover:text-[#D62828] font-medium transition">
            ← Back to App
          </Link>
        </p>
      </main>
    </div>
  );
}
