export default function About() {
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

      {/* Persistent Navigation - Forged by Design */}
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

      {/* About Content */}
      <div className="max-w-2xl mx-auto px-6 py-20 relative z-10">
        <h1 className="text-5xl font-semibold text-[#0B2D5C] mb-12 text-center">About Forge</h1>

        <div className="prose prose-lg text-[#444444] max-w-none">
          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-12 mb-6">Built for Meaningful Relationships</h2>
          <p>
            Forge is a dating platform for people who value faith, family, commitment, and genuine connection, not hookup culture or endless swiping.
          </p>
          <p>
            We believe the strongest relationships begin with shared values. While most dating apps prioritize volume and superficial attraction, Forge is intentionally designed to help people connect through what truly matters: character, purpose, beliefs, and long-term compatibility.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-12 mb-6">Who Forge Is For</h2>
          <p>
            Forge is for people seeking something more intentional. Whether you're a first responder, military member, healthcare worker, parent, blue-collar professional, person of faith, entrepreneur, or simply someone tired of shallow dating, Forge was built for you.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-12 mb-6">Our Mission</h2>
          <p className="text-2xl font-medium text-[#0B2D5C]">
            Strong Values. Strong Connections.
          </p>
          <p>
            We believe meaningful relationships are forged through shared values, mutual respect, and a genuine desire to build something lasting.
          </p>

          <h2 className="text-3xl font-semibold text-[#0B2D5C] mt-12 mb-6">Why We Built Forge</h2>
          <p>
            Modern dating often leaves people frustrated and disconnected. Endless swiping and casual interactions rarely lead to the kind of deep, committed relationships most of us truly want.
          </p>
          <p>
            Forge was created as a better alternative, a place where values come first and meaningful relationships can grow from a strong foundation.
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