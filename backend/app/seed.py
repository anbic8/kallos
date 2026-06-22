"""Beim Start ausgefuehrt: Heimverein, Admin-User, Gokyo-Techniken, Standard-Gewichtsklassen."""
from .database import SessionLocal
from .models import User, Verein, Technik, Gewichtsklasse, TechnikKategorie, UserRolle, GKGeschlecht, Altersklasse
from .auth import hash_password
from .config import settings

GOKYO: list[tuple[str, TechnikKategorie]] = [
    # Dai Ikkyo
    ("De-ashi-barai", TechnikKategorie.nage_waza),
    ("Hiza-guruma", TechnikKategorie.nage_waza),
    ("Sasae-tsuri-komi-ashi", TechnikKategorie.nage_waza),
    ("Uki-goshi", TechnikKategorie.nage_waza),
    ("O-soto-gari", TechnikKategorie.nage_waza),
    ("O-goshi", TechnikKategorie.nage_waza),
    ("O-uchi-gari", TechnikKategorie.nage_waza),
    ("Seoi-nage", TechnikKategorie.nage_waza),
    # Dai Nikyo
    ("Ko-soto-gari", TechnikKategorie.nage_waza),
    ("Ko-uchi-gari", TechnikKategorie.nage_waza),
    ("Koshi-guruma", TechnikKategorie.nage_waza),
    ("Tsuri-komi-goshi", TechnikKategorie.nage_waza),
    ("Okuri-ashi-barai", TechnikKategorie.nage_waza),
    ("Tai-otoshi", TechnikKategorie.nage_waza),
    ("Harai-goshi", TechnikKategorie.nage_waza),
    ("Uchi-mata", TechnikKategorie.nage_waza),
    # Dai Sankyo
    ("Ko-soto-gake", TechnikKategorie.nage_waza),
    ("Tsuri-goshi", TechnikKategorie.nage_waza),
    ("Yoko-otoshi", TechnikKategorie.nage_waza),
    ("Ashi-guruma", TechnikKategorie.nage_waza),
    ("Hane-goshi", TechnikKategorie.nage_waza),
    ("Harai-tsuri-komi-ashi", TechnikKategorie.nage_waza),
    ("Tomoe-nage", TechnikKategorie.nage_waza),
    ("Kata-guruma", TechnikKategorie.nage_waza),
    # Dai Yonkyo
    ("Sumi-gaeshi", TechnikKategorie.nage_waza),
    ("Tani-otoshi", TechnikKategorie.nage_waza),
    ("Hane-makikomi", TechnikKategorie.nage_waza),
    ("Sukui-nage", TechnikKategorie.nage_waza),
    ("Utsuri-goshi", TechnikKategorie.nage_waza),
    ("O-guruma", TechnikKategorie.nage_waza),
    ("Soto-makikomi", TechnikKategorie.nage_waza),
    ("Uki-otoshi", TechnikKategorie.nage_waza),
    # Dai Gokyo
    ("O-soto-guruma", TechnikKategorie.nage_waza),
    ("Uki-waza", TechnikKategorie.nage_waza),
    ("Yoko-wakare", TechnikKategorie.nage_waza),
    ("Yoko-guruma", TechnikKategorie.nage_waza),
    ("Ushiro-goshi", TechnikKategorie.nage_waza),
    ("Ura-nage", TechnikKategorie.nage_waza),
    ("Sumi-otoshi", TechnikKategorie.nage_waza),
    ("Yoko-gake", TechnikKategorie.nage_waza),
    # Weitere Nage-waza
    ("Ippon-seoi-nage", TechnikKategorie.nage_waza),
    ("Ko-uchi-makikomi", TechnikKategorie.nage_waza),
    ("O-soto-makikomi", TechnikKategorie.nage_waza),
    ("Uchi-mata-makikomi", TechnikKategorie.nage_waza),
    ("Harai-makikomi", TechnikKategorie.nage_waza),
    ("Kibisu-gaeshi", TechnikKategorie.nage_waza),
    ("Morote-gari", TechnikKategorie.nage_waza),
    ("Kuchiki-taoshi", TechnikKategorie.nage_waza),
    # Katame-waza -- Osae-komi
    ("Kesa-gatame", TechnikKategorie.katame_waza),
    ("Kuzure-kesa-gatame", TechnikKategorie.katame_waza),
    ("Kata-gatame", TechnikKategorie.katame_waza),
    ("Kami-shiho-gatame", TechnikKategorie.katame_waza),
    ("Kuzure-kami-shiho-gatame", TechnikKategorie.katame_waza),
    ("Yoko-shiho-gatame", TechnikKategorie.katame_waza),
    ("Tate-shiho-gatame", TechnikKategorie.katame_waza),
    # Katame-waza -- Shime-waza
    ("Nami-juji-jime", TechnikKategorie.katame_waza),
    ("Gyaku-juji-jime", TechnikKategorie.katame_waza),
    ("Kata-juji-jime", TechnikKategorie.katame_waza),
    ("Hadaka-jime", TechnikKategorie.katame_waza),
    ("Okuri-eri-jime", TechnikKategorie.katame_waza),
    ("Kataha-jime", TechnikKategorie.katame_waza),
    # Katame-waza -- Kansetsu-waza
    ("Ude-hishigi-juji-gatame", TechnikKategorie.katame_waza),
    ("Ude-hishigi-ude-gatame", TechnikKategorie.katame_waza),
    ("Ude-hishigi-hiza-gatame", TechnikKategorie.katame_waza),
    ("Ude-garami", TechnikKategorie.katame_waza),
]

GEWICHTSKLASSEN: list[tuple[str, float | None, GKGeschlecht, Altersklasse]] = [
    # Senior Herren
    ("-60", 60, GKGeschlecht.m, Altersklasse.Senior),
    ("-66", 66, GKGeschlecht.m, Altersklasse.Senior),
    ("-73", 73, GKGeschlecht.m, Altersklasse.Senior),
    ("-81", 81, GKGeschlecht.m, Altersklasse.Senior),
    ("-90", 90, GKGeschlecht.m, Altersklasse.Senior),
    ("-100", 100, GKGeschlecht.m, Altersklasse.Senior),
    ("+100", None, GKGeschlecht.m, Altersklasse.Senior),
    # Senior Damen
    ("-48", 48, GKGeschlecht.w, Altersklasse.Senior),
    ("-52", 52, GKGeschlecht.w, Altersklasse.Senior),
    ("-57", 57, GKGeschlecht.w, Altersklasse.Senior),
    ("-63", 63, GKGeschlecht.w, Altersklasse.Senior),
    ("-70", 70, GKGeschlecht.w, Altersklasse.Senior),
    ("-78", 78, GKGeschlecht.w, Altersklasse.Senior),
    ("+78", None, GKGeschlecht.w, Altersklasse.Senior),
    # U18 Herren
    ("-55", 55, GKGeschlecht.m, Altersklasse.U18),
    ("-60", 60, GKGeschlecht.m, Altersklasse.U18),
    ("-66", 66, GKGeschlecht.m, Altersklasse.U18),
    ("-73", 73, GKGeschlecht.m, Altersklasse.U18),
    ("-81", 81, GKGeschlecht.m, Altersklasse.U18),
    ("-90", 90, GKGeschlecht.m, Altersklasse.U18),
    ("+90", None, GKGeschlecht.m, Altersklasse.U18),
    # U18 Damen
    ("-44", 44, GKGeschlecht.w, Altersklasse.U18),
    ("-48", 48, GKGeschlecht.w, Altersklasse.U18),
    ("-52", 52, GKGeschlecht.w, Altersklasse.U18),
    ("-57", 57, GKGeschlecht.w, Altersklasse.U18),
    ("-63", 63, GKGeschlecht.w, Altersklasse.U18),
    ("-70", 70, GKGeschlecht.w, Altersklasse.U18),
    ("+70", None, GKGeschlecht.w, Altersklasse.U18),
    # U15 Herren
    ("-46", 46, GKGeschlecht.m, Altersklasse.U15),
    ("-50", 50, GKGeschlecht.m, Altersklasse.U15),
    ("-55", 55, GKGeschlecht.m, Altersklasse.U15),
    ("-60", 60, GKGeschlecht.m, Altersklasse.U15),
    ("-66", 66, GKGeschlecht.m, Altersklasse.U15),
    ("-73", 73, GKGeschlecht.m, Altersklasse.U15),
    ("+73", None, GKGeschlecht.m, Altersklasse.U15),
    # U15 Damen
    ("-40", 40, GKGeschlecht.w, Altersklasse.U15),
    ("-44", 44, GKGeschlecht.w, Altersklasse.U15),
    ("-48", 48, GKGeschlecht.w, Altersklasse.U15),
    ("-52", 52, GKGeschlecht.w, Altersklasse.U15),
    ("-57", 57, GKGeschlecht.w, Altersklasse.U15),
    ("-63", 63, GKGeschlecht.w, Altersklasse.U15),
    ("+63", None, GKGeschlecht.w, Altersklasse.U15),
]


def run():
    db = SessionLocal()
    try:
        # Heimverein anlegen falls keiner existiert (muss vor Admin-Kaempfer-Verknuepfung stehen)
        if db.query(Verein).count() == 0:
            heimverein = Verein(name=settings.heimverein_name)
            db.add(heimverein)
            db.commit()
            print(f"Heimverein angelegt: {settings.heimverein_name}")

        # Admin anlegen falls keine User existieren
        if db.query(User).count() == 0:
            admin = User(
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                rolle=UserRolle.admin,
            )
            db.add(admin)
            db.commit()
            print(f"Admin angelegt: {settings.admin_email}")

        # Techniken seeden
        if db.query(Technik).count() == 0:
            for name, kategorie in GOKYO:
                db.add(Technik(name=name, kategorie=kategorie))
            db.commit()
            print(f"{len(GOKYO)} Techniken angelegt (Gokyo-Katalog)")

        # Gewichtsklassen seeden
        if db.query(Gewichtsklasse).count() == 0:
            for bezeichnung, max_kg, geschlecht, altersklasse in GEWICHTSKLASSEN:
                db.add(Gewichtsklasse(
                    bezeichnung=bezeichnung,
                    max_kg=max_kg,
                    geschlecht=geschlecht,
                    altersklasse=altersklasse,
                ))
            db.commit()
            print(f"{len(GEWICHTSKLASSEN)} Gewichtsklassen angelegt")
    finally:
        db.close()


if __name__ == "__main__":
    run()
