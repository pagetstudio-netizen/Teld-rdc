import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { spiritsCollection, suntoryLogo } from "@/lib/suntory-assets";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-full" style={{ background: "#111" }}>

      {/* Header */}
      <header className="flex items-center px-4 py-3" style={{ background: "#111", borderBottom: "1px solid #222" }}>
        <Link href="/account">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-white pr-6">À propos de nous</h1>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ color: "#d4d4d4", fontSize: 13.5, lineHeight: "1.75" }}>
        <img src={suntoryLogo} alt="Logo Suntory" className="mx-auto w-52 rounded-lg bg-white p-4" />
        <img src={spiritsCollection} alt="Sélection de boissons du Groupe Suntory" className="w-full rounded-lg object-cover" />

        <p>
          Fondé en 1899 à Osaka, au Japon, par Shinjiro Torii, le Groupe Suntory a d’abord développé le premier whisky japonais.
        </p>

        <p>
          Aujourd’hui, Suntory Holdings rassemble des activités internationales dans les boissons alcoolisées, les boissons sans alcool et les produits de santé.
        </p>

        <p>
          Suntory est présent dans de nombreux marchés à travers le monde, avec un portefeuille diversifié de boissons et de produits.
        </p>

      </div>
    </div>
  );
}
