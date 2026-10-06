# Kilo – lokal agent för 3D och artiklar

## Vilken modell?

**Använd `gpt-oss-120b` som enda agent.** Behåll Qwen2.5-VL-32B som reserv för bildgranskning.

| | gpt-oss-120b (MXFP4) | Qwen2.5-VL-32B (Q4_K_M) |
|---|---|---|
| Storlek | ca 60+ GB minne (RAM + VRAM) | ca 20 GB |
| Arkitektur | MoE, ca 5 B aktiva parametrar, därför snabb trots storleken | Tät 32 B, långsammare per token |
| Verktygsanrop / agentläge | Byggd för det, stabilt i LM Studio | Svagare, mer strul i långa agentkedjor |
| Kod (Three.js, Blender-skript) | Starkare | Okej |
| Artiklar | Starkare, bättre struktur och längre sammanhang (131k) | Okej |
| Ser bilder | **Nej, bara text** | **Ja** |

Därför räcker en agent: gpt-oss-120b skriver koden och texten, och 3D-resultatet kontrolleras med skärmdump + numeriska kontroller (se `.kilo/skills/threejs-scene`). Behövs ett visuellt omdöme byter du till Qwen2.5-VL-32B i Kilos modellväljare för just den granskningen och byter tillbaka.

Undantag: om datorn inte har plats för ~60 GB, kör Qwen2.5-VL-32B som huvudmodell i stället. Det går, men räkna med sämre agentbeteende.

Obs: Qwen2.5-VL i GGUF-form behöver sin `mmproj`-fil bredvid modellfilen för att kunna se bilder.

## Installation (Windows)

1. **LM Studio:** ladda `gpt-oss-120b` (filen `gpt-oss-120b-MXFP4-00001-of-00002.gguf`; LM Studio hittar del 2 själv). Sätt *Context Length* till minst 65536. Starta *Local Server*.
2. Synka modell-id (kräver Node.js, servern måste vara startad):
   ```
   node tools/sync-lmstudio-ids.mjs
   ```
   Skriptet läser vilka id:n LM Studio faktiskt använder, skriver in dem i `kilo.jsonc` och kollar att `mmproj`-filen finns bredvid Qwen-modellen. Modellmappen letas upp i `C:\Users\rayam\.lmstudio\models` (undermapparna `lmstudio-community` och `gaianet` hittas automatiskt). Annan plats: `--models "D:\sökväg"`. Lägg till `--dry-run` för att bara se vad som skulle ändras.
3. Öppna den här mappen i VS Code med Kilo-tillägget. `kilo.jsonc` väljer LM Studio och gpt-oss-120b automatiskt. Ingen API-nyckel behövs för LM Studio.
4. Ladda om VS Code/Kilo en gång så att skills i `.kilo/skills/` hittas.
5. Din Kilo-profil (https://app.kilo.ai/profile) behövs bara för Kilos molntjänster. Lokala modeller går via LM Studio och kostar inga krediter.

## Innehåll

- `kilo.jsonc` – projektkonfig: LM Studio, huvudmodell och reservmodell.
- `tools/sync-lmstudio-ids.mjs` – synkar modell-id:n från LM Studio till `kilo.jsonc`.
- `AGENTS.md` – projektregler: en agent, inga påhittade källor, inga följdfrågor.
- `.kilo/skills/threejs-scene/` – 3D i webbläsaren (Three.js, glTF/GLB, Blender-export, verifiering).
- `.kilo/skills/article-writing/` – artiklar som Markdown, med strikt regel mot påhittade fakta.

Skillsen är medvetet bara dessa två: de är det som behövs för 3D och artiklar. Lägg till fler först när ett riktigt behov dyker upp.

## Vad som inte är verifierat

Konfigen och skillsen är skrivna efter Kilos dokumentation men inte testade mot en körande Kilo + LM Studio, och inte mot hårdvaran i din dator. Storleks- och prestandasiffrorna ovan är ungefärliga.
