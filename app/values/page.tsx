export default function Values() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222] relative overflow-hidden">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center opacity-10 pointer-events-none scale-[1.13] mt-48 z-0">
        <img 
          src="/logo-outline.png" 
          alt="Forge Background" 
          className="w-[820px] h-auto"
        />
      </div>

      {/* Persistent Navigation - Forged by Design (smaller) */}
      <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <img 
              src="/logo-outline.png" 
              alt="Forge Logo" 
              className="h-14 sm:h-18 w-auto"
            />
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[#F8F6F2]">
              Forged by Design
            </span>
          </a>
          
          <div className="flex items-center gap-4 sm:gap-8 text-sm sm:text-lg font-medium text-[#F8F6F2]">
            <a href="/" className="hover:text-[#C62828] transition">Home</a>
            <a href="/about" className="hover:text-[#C62828] transition">About</a>
            <a href="/values" className="hover:text-[#C62828] transition">Values</a>
            <a href="/waitlist" className="hover:text-[#C62828] transition">Join Waitlist</a>
          </div>
        </div>
      </nav>

      {/* Values Content */}
      <div className="max-w-3xl mx-auto px-6 py-20 relative z-10">
        <h1 className="text-5xl font-semibold text-[#0B2D5C] mb-12 text-center">Our Values</h1>
        
        <p className="text-xl text-[#444444] text-center mb-16">
          The strongest relationships begin with a shared foundation.
        </p>

        <div className="space-y-16 text-lg">
          <div>
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Faith</h2>
            <p className="text-[#444444]">
              We welcome people from all walks of their faith journey who believe spiritual values play an important role in life and relationships. Faith provides purpose, encourages growth, strengthens commitment, and helps build lasting foundations.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Family</h2>
            <p className="text-[#444444]">
              Strong families create strong communities. Whether you're looking to start a family, grow one, or simply prioritize family relationships, Forge values those who place importance on family and long-term commitment.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Service</h2>
            <p className="text-[#444444]">
              Many of the people drawn to Forge are those who dedicate their lives to serving others — whether in their families, communities, workplaces, or professions. From military members and veterans to first responders, healthcare professionals, teachers, and community leaders, we deeply value those who understand sacrifice, responsibility, and the importance of putting others before themselves.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Commitment</h2>
            <p className="text-[#444444]">
              Meaningful relationships require effort, consistency, and dedication. Forge is built for people seeking more than casual connections.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Integrity</h2>
            <p className="text-[#444444]">
              Honesty and authenticity are essential to building trust. We value those who are honest about who they are, respect others, communicate openly, and follow through on their commitments.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Personal Responsibility</h2>
            <p className="text-[#444444]">
              We believe character matters. Accountability, self-improvement, respect for others, and taking ownership of your actions are foundational.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-[#0B2D5C] mb-4">Shared Values</h2>
            <p className="text-[#444444]">
              No two people agree on everything. However, strong relationships are often built when people share a common foundation and vision for the future. Forge focuses on helping people connect through values, beliefs, goals, and lifestyle compatibility.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-2xl font-medium text-[#0B2D5C]">
            Strong Values. Strong Connections.
          </p>
          <p className="text-[#444444] mt-6">
            Forge was created for people who believe meaningful relationships are built on more than appearances and shared hobbies. 
            We believe the strongest relationships are forged through faith, family, service, commitment, integrity, personal responsibility, and shared values.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B2D5C] text-[#F8F6F2] py-10 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm opacity-90">
            © 2026 Forged by Design. All Rights Reserved.
          </p>
          <p className="text-sm mt-1 opacity-75">
            Forge — Strong Values. Strong Connections.
          </p>
        </div>
      </footer>
    </div>
  );
}