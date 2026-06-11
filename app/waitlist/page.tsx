export default function Waitlist() {
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

      {/* Waitlist Content */}
      <div className="max-w-md mx-auto px-6 py-20 text-center relative z-10">
        <h1 className="text-5xl font-semibold text-[#0B2D5C] mb-6">Help Shape What Comes Next</h1>
        
        <p className="text-xl text-[#444444] mb-12">
          Forge is in its early stages, and we're building it with input from people who believe strong relationships begin with shared values.<br /><br />
          Whether you're single, married, or simply believe there should be a better way to build meaningful connections, we'd love your support.<br /><br />
          Joining the waitlist helps us gauge interest, gather feedback, and keep you updated as Forge continues to take shape.
        </p>

        <form className="space-y-6">
          <div>
            <input 
              type="text" 
              placeholder="Your Full Name" 
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg" 
            />
          </div>

          <div>
            <input 
              type="email" 
              placeholder="Your Email Address" 
              className="w-full px-6 py-5 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] text-lg" 
            />
          </div>

          <p className="text-base text-[#666666] text-left pl-1">
            No spam. No pressure. Just updates on our progress and opportunities to help shape the future of Forge.
          </p>

          <button 
            type="button"
            className="w-full bg-[#C62828] hover:bg-[#A61F1F] text-white font-semibold py-5 rounded-2xl text-lg transition mt-6"
          >
            Join Forge
          </button>
        </form>
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