import { Search, Share2, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.jpg";

interface HeaderProps {
  showShare?: boolean;
  shareTitle?: string;
}

export const Header = ({ showShare = false, shareTitle }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/buscar?q=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
  };

  const handleSearchIconClick = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (isSearchOpen && !searchQuery.trim()) {
          setIsSearchOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen, searchQuery]);

  const navLinks = [
    { to: "/noticias", label: "Noticias" },
    { to: "/toolbox", label: "Toolbox" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center transition-opacity hover:opacity-80">
            <img src={logo} alt="Logo" className="h-9 w-9 rounded-lg object-cover" />
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === link.to
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side - Search & Nav */}
        <div className="flex items-center gap-3">
          {/* Mobile Nav Links */}
          <nav className="flex sm:hidden items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded transition-colors",
                  location.pathname === link.to
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search - Expandable with animation */}
          <div ref={searchContainerRef} className="relative flex items-center">
            {/* Search icon button - always rendered but hidden when search is open */}
            <button
              onClick={handleSearchIconClick}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all duration-300 hover:bg-secondary",
                isSearchOpen ? "scale-0 opacity-0 absolute" : "scale-100 opacity-100"
              )}
              aria-label="Buscar"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Search form - animated expansion */}
            <form 
              onSubmit={handleSearch} 
              className={cn(
                "flex items-center gap-2 transition-all duration-300 ease-out origin-right",
                isSearchOpen 
                  ? "opacity-100 scale-100 translate-x-0" 
                  : "opacity-0 scale-95 translate-x-4 pointer-events-none absolute"
              )}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "h-10 rounded-full border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300",
                    isSearchOpen ? "w-48 sm:w-64" : "w-0"
                  )}
                />
              </div>
              <button
                type="button"
                onClick={handleCloseSearch}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all duration-200 hover:bg-secondary hover:border-destructive/50",
                  isSearchOpen ? "scale-100 rotate-0" : "scale-0 rotate-90"
                )}
                aria-label="Cerrar búsqueda"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </form>
          </div>

          {/* Share button - Mobile only */}
          {showShare && !isSearchOpen && (
            <button
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-secondary sm:hidden"
              aria-label="Compartir"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
