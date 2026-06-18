'use client';

import Header from '../../components/Header';

export default function Values() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      <div className="pt-20 pb-20 max-w-6xl mx-auto px-6">
        <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] text-center mb-12">Our Core Values</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {/* Faith */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-faith.png" alt="Faith" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Faith</h3>
            <p className="text-[#444444] leading-relaxed">
              We welcome people from all walks of their faith journey who believe spiritual values play an important role in life and relationships.
            </p>
          </div>

          {/* Family */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-family.png" alt="Family" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Family</h3>
            <p className="text-[#444444] leading-relaxed">
              Strong families create strong communities. Whether you're looking to start a family, grow one, or simply prioritize family relationships.
            </p>
          </div>

          {/* Service */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-service.png" alt="Service" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Service</h3>
            <p className="text-[#444444] leading-relaxed">
              Many of the people drawn to Forge dedicate their lives to serving others — first responders, military, healthcare, teachers, and community leaders.
            </p>
          </div>

          {/* Commitment */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-commitment.png" alt="Commitment" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Commitment</h3>
            <p className="text-[#444444] leading-relaxed">
              Meaningful relationships require effort, consistency, and dedication. Forge is built for people seeking more than casual connections.
            </p>
          </div>

          {/* Integrity */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-integrity.png" alt="Integrity" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Integrity</h3>
            <p className="text-[#444444] leading-relaxed">
              Honesty and authenticity are essential to building trust.
            </p>
          </div>

          {/* Personal Responsibility */}
          <div className="text-center">
            <div className="h-28 flex items-center justify-center mb-6">
              <img src="/icon-responsibility.png" alt="Responsibility" className="w-24 h-24 object-contain" />
            </div>
            <h3 className="text-2xl font-semibold text-[#0B2D5C] mb-4">Personal Responsibility</h3>
            <p className="text-[#444444] leading-relaxed">
              We believe character matters. Accountability, self-improvement, and taking ownership of your actions.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-3xl font-semibold text-[#0B2D5C]">
            Strong Values. Strong Connections.
          </p>
        </div>
      </div>
    </div>
  );
}