import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import AboutModal from "@/components/about-modal";

import { spiritsCollection, spiritsLineup, whiskyBottle1 } from "@/lib/suntory-assets";
import announcementIcon from "@assets/téléchargement_(91)_1787514048111.png";

function formatAmount(value: number) {
  return value.toLocaleString("fr-FR");
}

export default function HomePage() {
  const { user } = useAuth();
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

  useEffect(() => {
    const handleHomeTabClick = () => setIsWelcomeOpen(true);
    window.addEventListener("home-tab-clicked", handleHomeTabClick);
    return () => window.removeEventListener("home-tab-clicked", handleHomeTabClick);
  }, []);

  if (!user) return null;

  const balance = Number(user.balance || 0);
  const cumulative = Number(user.totalEarnings || 0);

  return (
    <>
      <main className="teld-dashboard-reference" aria-label="Accueil Suntory">
      <style>{`
        .teld-dashboard-reference {
          min-height: 100dvh;
          overflow-x: hidden;
          background: #fff;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }
        .teld-dashboard-reference *,
        .teld-dashboard-reference *::before,
        .teld-dashboard-reference *::after {
          box-sizing: border-box;
        }
        .teld-dashboard-reference__screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          padding: clamp(36px, 10vw, 52px) 0 94px;
          background: #fff;
        }
        .teld-dashboard-reference__hero {
          width: calc(100% - clamp(30px, 8.6vw, 44px));
          aspect-ratio: 2.145 / 1;
          margin: 0 auto;
          overflow: hidden;
          border-radius: clamp(9px, 2.35vw, 12px);
          background: #e7f5f8;
        }
        .teld-dashboard-reference__hero img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .teld-dashboard-reference__announcement {
          display: flex;
          width: calc(100% - clamp(30px, 8.6vw, 44px));
          height: clamp(34px, 9.1vw, 47px);
          align-items: center;
          gap: clamp(7px, 1.95vw, 10px);
          margin: clamp(11px, 3.1vw, 16px) auto 0;
          overflow: hidden;
          border-radius: clamp(6px, 1.55vw, 8px);
          padding: 0 clamp(8px, 2.35vw, 12px);
          background: #f5f5f5;
          box-shadow: 0 1px 4px rgba(0, 0, 0, .035);
        }
        .teld-dashboard-reference__announcement-icon {
          width: clamp(20px, 5.45vw, 28px);
          height: auto;
          flex: 0 0 auto;
          object-fit: contain;
        }
        .teld-dashboard-reference__announcement-window {
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .teld-dashboard-reference__announcement-track {
          display: flex;
          width: max-content;
          align-items: center;
          color: #5a5a5a;
          font-size: clamp(12px, 3.5vw, 18px);
          font-weight: 400;
          line-height: 1;
          white-space: nowrap;
          animation: teld-dashboard-marquee 18s linear infinite;
        }
        .teld-dashboard-reference__announcement-track span {
          padding-right: 56px;
        }
        @keyframes teld-dashboard-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .teld-dashboard-reference__metrics {
          display: grid;
          gap: clamp(15px, 4.3vw, 22px);
          width: calc(100% - clamp(28px, 7.8vw, 40px));
          margin: clamp(16px, 4.5vw, 23px) auto 0;
        }
        .teld-dashboard-reference__metric {
          display: grid;
          min-height: clamp(108px, 30vw, 154px);
          grid-template-columns: minmax(0, 63.5%) minmax(116px, 36.5%);
          align-items: center;
          overflow: hidden;
          border: 1px solid #f3f3f3;
          border-radius: clamp(5px, 1.2vw, 7px);
          background: #fff;
          box-shadow: 0 2px 9px rgba(0, 0, 0, .05);
          transition: transform 130ms ease, box-shadow 130ms ease;
        }
        .teld-dashboard-reference__metric:hover {
          box-shadow: 0 4px 13px rgba(0, 0, 0, .075);
        }
        .teld-dashboard-reference__metric:active {
          transform: scale(.992);
          box-shadow: 0 1px 4px rgba(0, 0, 0, .05);
        }
        .teld-dashboard-reference__station {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: clamp(4px, 1vw, 6px);
        }
        .teld-dashboard-reference__station img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .teld-dashboard-reference__station--equipment {
          justify-content: flex-start;
          padding: clamp(5px, 1.4vw, 8px) clamp(17px, 6.3vw, 32px);
        }
        .teld-dashboard-reference__station--equipment img {
          width: min(64%, 125px);
          object-position: left center;
        }
        .teld-dashboard-reference__metric-copy {
          display: flex;
          min-width: 0;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          gap: clamp(15px, 4.3vw, 22px);
          padding: 7px clamp(7px, 1.8vw, 10px) 8px 0;
          text-align: center;
        }
        .teld-dashboard-reference__metric-label {
          display: inline-grid;
          min-width: clamp(109px, 28vw, 145px);
          min-height: clamp(42px, 11.6vw, 60px);
          place-items: center;
          border: clamp(2px, .55vw, 3px) solid #151515;
          border-radius: 1px;
          padding: 2px 7px;
          background: #ffc000;
          box-shadow: inset 0 0 0 1px rgba(255, 241, 148, .35), 0 1px 2px rgba(0, 0, 0, .22);
          color: #171717;
          font-size: clamp(17px, 5vw, 26px);
          font-weight: 400;
          line-height: 1;
        }
        .teld-dashboard-reference__metric-value {
          display: block;
          max-width: 100%;
          color: #db2222;
          font-size: clamp(17px, 4.8vw, 25px);
          font-weight: 400;
          line-height: 1;
          white-space: nowrap;
        }
        .teld-dashboard-reference__metric-value small {
          font-size: .76em;
          font-weight: inherit;
        }
        @media (max-width: 340px) {
          .teld-dashboard-reference__metric {
            grid-template-columns: minmax(0, 59%) minmax(117px, 41%);
          }
          .teld-dashboard-reference__metric-copy {
            gap: 11px;
          }
          .teld-dashboard-reference__metric-label {
            min-width: 104px;
          }
          .teld-dashboard-reference__station--equipment {
            padding-right: 13px;
            padding-left: 13px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .teld-dashboard-reference__announcement-track {
            animation: none;
          }
        }
      `}</style>

      <div className="teld-dashboard-reference__screen">
        <section className="teld-dashboard-reference__hero" aria-label="Suntory, boissons et produits de santé">
          <img src={spiritsCollection} alt="Sélection de boissons du Groupe Suntory" />
        </section>

        <section className="teld-dashboard-reference__announcement" aria-label="Annonce de recharges">
          <img className="teld-dashboard-reference__announcement-icon" src={announcementIcon} alt="" aria-hidden="true" />
          <div className="teld-dashboard-reference__announcement-window">
            <div className="teld-dashboard-reference__announcement-track" aria-live="off">
              <span>J6 a rechargé 100 000 ******1047 a rechargé 90 000</span>
              <span aria-hidden="true">J6 a rechargé 100 000 ******1047 a rechargé 90 000</span>
            </div>
          </div>
        </section>

        <section className="teld-dashboard-reference__metrics" aria-label="Résumé du compte">
          <article className="teld-dashboard-reference__metric">
            <div className="teld-dashboard-reference__station">
              <img src={spiritsLineup} alt="Gamme de boissons Suntory" />
            </div>
            <div className="teld-dashboard-reference__metric-copy">
              <span className="teld-dashboard-reference__metric-label">Solde</span>
              <strong className="teld-dashboard-reference__metric-value"><small>FCFA </small>{formatAmount(balance)}</strong>
            </div>
          </article>

          <article className="teld-dashboard-reference__metric">
            <div className="teld-dashboard-reference__station teld-dashboard-reference__station--equipment">
              <img src={whiskyBottle1} alt="Produit de la gamme Suntory" />
            </div>
            <div className="teld-dashboard-reference__metric-copy">
              <span className="teld-dashboard-reference__metric-label">Cumulatif</span>
              <strong className="teld-dashboard-reference__metric-value"><small>FCFA </small>{formatAmount(cumulative)}</strong>
            </div>
          </article>
        </section>
      </div>
      </main>
      <AboutModal open={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} />
    </>
  );
}