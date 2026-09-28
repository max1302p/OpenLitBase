"""Erzeugt styles/ieee-de.csl und styles/ieee-de-seite.csl aus dem offiziellen styles/ieee.csl.

Aufruf: python3 scripts/build-ieee-de.py  (nach einem Update von ieee.csl erneut ausführen)
"""
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent / "styles"
csl = (root / "ieee.csl").read_text(encoding="utf-8")


def replace(old: str, new: str, count: int = 1) -> None:
    global csl
    if csl.count(old) < 1:
        raise SystemExit(f"Nicht gefunden: {old[:60]!r}")
    csl = csl.replace(old, new, count)


# Stil-Metadaten und Standard-Locale
replace('version="1.0" demote-non-dropping-particle',
        'version="1.0" default-locale="de-DE" demote-non-dropping-particle')
csl = re.sub(r"<title>.*?</title>", "<title>IEEE (Deutsch)</title>", csl, count=1)
replace("<id>http://www.zotero.org/styles/ieee</id>", "<id>ieee-de</id>")
replace('<link href="http://www.zotero.org/styles/ieee" rel="self"/>',
        '<link href="http://www.zotero.org/styles/ieee" rel="template"/>')

# Englische Locale-Overrides durch deutsche ersetzen
csl = re.sub(
    r'<locale xml:lang="en">.*?</locale>',
    """<locale xml:lang="de">
    <terms>
      <term name="presented at">vorgestellt auf</term>
      <term name="available at">verfügbar unter</term>
      <term name="accessed">Zugriff am</term>
    </terms>
  </locale>""",
    csl,
    count=1,
    flags=re.S,
)

# „Zugriff am 12. März 2024“ statt „Accessed: …“ (ohne Doppelpunkt)
csl = csl.replace(
    """<group delimiter=": ">
                <text term="accessed" text-case="capitalize-first"/>""",
    """<group delimiter=" ">
                <text term="accessed" text-case="capitalize-first"/>""",
)
csl = csl.replace(
    """<group delimiter=": ">
            <text term="accessed" text-case="capitalize-first"/>""",
    """<group delimiter=" ">
            <text term="accessed" text-case="capitalize-first"/>""",
)

# Reihen: „Nr.“/„Bd.“ statt „no.“/„vol.“
replace('prefix="no. "', 'prefix="Nr. "')
replace('prefix="vol. "', 'prefix="Bd. "')

# „o. J.“, wenn kein Erscheinungsdatum vorhanden ist
replace('<macro name="issued">\n    <choose>', '<macro name="issued">\n    <choose>\n      <if variable="issued" match="none">\n        <text term="no date" form="short"/>\n      </if>\n      <else>\n    <choose>')
csl = re.sub(r'(<macro name="issued">.*?</choose>)(\n  </macro>)',
             lambda m: m.group(1) + "\n      </else>\n    </choose>" + m.group(2), csl, count=1, flags=re.S)

# Deutsch: kein Komma vor „und“ (A, B und C)
csl = csl.replace('<name and="text"', '<name and="text" delimiter-precedes-last="never"')
csl = csl.replace('<name initialize-with=". " delimiter=", " and="text"/>',
                  '<name initialize-with=". " delimiter=", " and="text" delimiter-precedes-last="never"/>')

# Normen: Verlag statt „Ort.“ (Vorlage erzeugt sonst „Berlin., November 2015“)
replace("""            <text macro="geographic-location"/>
            <text macro="issued"/>""", """            <text macro="publisher"/>
            <text macro="issued"/>""")

# Preprints: „arXiv:2509.14608“ statt „arXiv: arXiv:2509.14608“ (Nummer enthält die Quelle schon)
replace("""            <group delimiter=": ">
              <text macro="publisher" font-style="italic"/>
              <text variable="number"/>
            </group>""", """            <choose>
              <if variable="number">
                <text variable="number"/>
              </if>
              <else>
                <text macro="publisher" font-style="italic"/>
              </else>
            </choose>""")

# Bereiche zusammenfassen: [1]–[3]
replace("<citation>", '<citation collapse="citation-number">')

(root / "ieee-de.csl").write_text(csl, encoding="utf-8")
print("styles/ieee-de.csl geschrieben")

# ---------------------------------------------------------------------------------------------
# Variante nach verbreiteten Hochschul-Merkblättern: Seite im Verzeichnis statt im Text,
# „[Online] Available: URL (Abrufdatum 18.11.2015)“, Komma im Anführungszeichen, Autor:innen
# nur mit Komma, Herausgeber als „(Hrsg.)“ bzw. „hrsg. von“, „Auflage“ ausgeschrieben.

csl = re.sub(r"<title>.*?</title>", "<title>IEEE (Deutsch, Seite im Verzeichnis)</title>", csl, count=1)
replace("<id>ieee-de</id>", "<id>ieee-de-seite</id>")
# Marker für packages/citation: Seitenangaben der Zitate erscheinen im Verzeichnis (eigene Nummer
# pro Titel und Seite), im Text steht nur [n].
replace("<info>", "<!-- openlitbase:locator-in-bibliography -->\n  <info>")

replace("""<locale xml:lang="de">
    <terms>""", """<locale xml:lang="de">
    <style-options punctuation-in-quote="true"/>
    <terms>
      <term name="edition" form="short">Auflage</term>
      <term name="editor" form="short">Hrsg.</term>
      <term name="editor" form="verb-short">hrsg. von</term>""")

# Autor:innen nur mit Komma trennen: „A. Badach, E. Hoffmann, O. Knauer“
csl = csl.replace(' delimiter=", " and="text" delimiter-precedes-last="never"', ' delimiter=", "')
csl = csl.replace(' and="text" delimiter-precedes-last="never"', ' delimiter=", "')

# Herausgeber als Autor:innen: „C. Obermann, F. Schiel (Hrsg.)“
replace("""      <label form="short" prefix=", " text-case="capitalize-first"/>
      <et-al font-style="italic"/>""", """      <label form="short" prefix=" (" suffix=")" text-case="capitalize-first"/>
      <et-al font-style="italic"/>""")
# Herausgeber eines Sammelbands: „in Titel, hrsg. von M. Brütsch, Marburg …“
replace("""  <macro name="editor">
    <names variable="editor">
      <name initialize-with=". " delimiter=", "/>
      <label form="short" prefix=", " text-case="capitalize-first"/>
    </names>""", """  <macro name="editor">
    <names variable="editor">
      <label form="verb-short" suffix=" "/>
      <name initialize-with=". " delimiter=", "/>
    </names>""")

# Online: „[Online] Available: URL (Abrufdatum 18.11.2015)“ – DOI hat weiter Vorrang
csl = re.sub(r'<macro name="access">.*?\n  </macro>', """<macro name="access">
    <choose>
      <if type="webpage post post-weblog" match="any">
        <text macro="online"/>
      </if>
      <else-if variable="DOI">
        <text variable="DOI" prefix=" doi: " suffix="."/>
      </else-if>
      <else>
        <text macro="online"/>
      </else>
    </choose>
  </macro>
  <macro name="online">
    <choose>
      <if variable="URL">
        <group delimiter=" " prefix=" ">
          <text value="[Online] Available:"/>
          <text variable="URL"/>
          <group delimiter=" " prefix="(" suffix=")">
            <text value="Abrufdatum"/>
            <date variable="accessed">
              <date-part name="day" form="numeric-leading-zeros" suffix="."/>
              <date-part name="month" form="numeric-leading-zeros" suffix="."/>
              <date-part name="year"/>
            </date>
          </group>
        </group>
      </if>
    </choose>
  </macro>""", csl, count=1, flags=re.S)

(root / "ieee-de-seite.csl").write_text(csl, encoding="utf-8")
print("styles/ieee-de-seite.csl geschrieben")
