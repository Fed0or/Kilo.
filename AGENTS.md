# Projektregler

- Du är den enda agenten i det här projektet. Starta inte parallella agenter eller delegera till andra agenter; använd skills i `.kilo/skills/` i stället.
- Modellen körs lokalt (LM Studio) och har ingen internetåtkomst om inte ett verktyg uttryckligen ger det. Hitta aldrig på källor, citat, siffror eller URL:er.
- Användaren vill inte få följdfrågor. Gör rimliga antaganden, skriv ner dem kort och gå vidare.
- Svara på det språk användaren skriver på (oftast svenska). Kod, identifierare och commit-meddelanden på engelska.
- Använd bara de skills som uppgiften kräver:
  - `threejs-scene` för 3D i webbläsaren (Three.js, glTF/GLB, Blender-export).
  - `article-writing` för artiklar, blogginlägg och rapporter.
- Verifiera innan du säger att något är klart: kör bygget, läs felloggen, öppna resultatet. Rapportera misslyckanden som de är.
