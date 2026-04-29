import { Search, Share2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HeaderProps {
  showShare?: boolean;
  shareTitle?: string;
}

export const Header = ({ showShare = false }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center transition-opacity hover:opacity-80" aria-label="Ecos Digitales — Inicio">
            <img
              src="/logo-ecosdigitales.svg"
              alt="Ecos Digitales"
              className="h-[27px] sm:h-[30px] w-auto"
            />
          </Link>
        </div>

        {/* Right: Search + Share */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search — Expandable */}
          <div ref={searchContainerRef} className="relative flex items-center">
            <button
              onClick={handleSearchIconClick}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition-all duration-300 hover:bg-secondary",
                isSearchOpen ? "scale-0 opacity-0 absolute" : "scale-100 opacity-100"
              )}
              aria-label="Buscar"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>

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
                    "h-9 rounded-full border border-border bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300",
                    isSearchOpen ? "w-44 sm:w-56" : "w-0"
                  )}
                />
              </div>
              <button
                type="button"
                onClick={handleCloseSearch}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition-all duration-200 hover:bg-secondary",
                  isSearchOpen ? "scale-100 rotate-0" : "scale-0 rotate-90"
                )}
                aria-label="Cerrar búsqueda"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </form>
          </div>

          {/* Share button — Mobile article page only */}
          {showShare && !isSearchOpen && (
            <button
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-secondary sm:hidden"
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
