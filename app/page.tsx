export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222] relative overflow-hidden">
      {/* Fixed Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center opacity-10 pointer-events-none scale-110 z-0">
        <img 
          src="/logo-outline.png" 
          alt="Forge Background" 
          className="w-[720px] h-auto max-w-[90vw]"
        />
      </div>

      {/* Navigation Bar - Improved Mobile */}
      <nav className="border-b border-[#0B2D5C]/20 bg-[#0B2D5C] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-outline.png" 
              alt="Forge Logo" 
              className="h-12 sm:h-16 w-auto"
            />
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F8F6F2]">
              Forge
            </span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8 text-sm sm:text-lg font-medium text-[#F8F6F2]">
            <a href="#" className="hover:text-[#C62828] transition">Home</a>
            <a href="#" className="hover:text-[#C62828] transition">About</a>
            <a href="#" className="hover:text-[#C62828] transition">Values</a>
            <a href="/waitlist" className="hover:text-[#C62828] transition font-semibold">Join Waitlist</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-73px)] px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-6 text-[#0B2D5C]">
            Forge
          </h1>
          
          <p className="text-xl sm:text-2xl mb-10 text-[#0B2D5C]">
            Strong Values. Strong Connections.
          </p>

          <p className="text-base sm:text-lg mb-12 text-[#444444]">
            A place where shared values come first, helping faith-driven and traditional-minded singles build meaningful, lasting relationships.
          </p>

          <div className="space-y-4 mb-16">
            <a 
              href="/waitlist"
              className="block w-full bg-[#C62828] hover:bg-[#A61F1F] text-white font-semibold py-4 px-8 rounded-xl text-lg transition shadow-md"
            >
              Join the Waitlist
            </a>
            
            <button className="w-full border border-[#0B2D5C] text-[#0B2D5C] font-semibold py-4 px-8 rounded-xl text-lg hover:bg-[#EEF3FA] transition">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B2D5C] text-[#F8F6F2] py-8 border-t border-[#F8F6F2]/10">
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