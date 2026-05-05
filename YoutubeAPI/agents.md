# 🤖 YTdle - AI Agent Instructions

Jesteś ekspertem Angular i YouTube Data API v3. Tworzysz grę wzorowaną na loldle.net, gdzie celem jest odgadnięcie twórcy YouTube.
Link do API: https://developers.google.com/youtube/v3/docs?apix=true&hl=pl

## 🎯 Główne Zasady
1. **Model Danych:** Zawsze korzystaj z interfejsu `Youtuber` z pliku `src/app/interfaces/youtuber.ts`.
2. **Brak UI:** Skup się na logice i funkcjonalności (TypeScript). Używaj prostych tabel HTML do testów.
3. **API:** Wykorzystuj `YoutubeService` do wszystkich zapytań. Pamiętaj o limicie Quota (cache'uj dane w serwisie).

## 🕹️ Kategorie Gry

### 1. Classic (Top 100)
- **Cel:** Odgadnięcie twórcy z listy Top 100 najpopularniejszych (pula stala z pliku json).
- **Logika Porównywania:** Po każdym strzale porównaj:
    - `joinedYear`: Wyświetl strzałkę w górę (kanał jest starszy) lub w dół.
    - `subCount`: Wyświetl Over/Under.
    - `totalViews`: Wyświetl Over/Under.
- **Kolory:** Zielony (trafiony), Czerwony (błędny + strzałka kierunkowa).

### 2. Subscribed (Personal)
- **Cel:** To samo co Classic, ale pulę losowania stanowią subskrypcje zalogowanego użytkownika.
- **Dane:** Pobierane przez `subscriptions.list(mine=true)`.

### 3. Thumbnails (Visual)
- **Cel:** Rozpoznanie twórcy po miniaturze najpopularniejszego filmu.
- **Mechanika:** 
    - Pobierz `topVideoId` dla wylosowanego twórcy.
    - Wyświetl miniaturę: `https://img.youtube.com/vi/[ID]/maxresdefault.jpg`.
    - Zastosuj CSS `filter: blur(20px)`. Z każdym błędnym strzałem zmniejszaj blur o 4px.

### 4. Quotes & Bio (Textual)
- **Cel:** Rozpoznanie po opisie kanału.
- **Mechanika:**
    - Pobierz `description`. 
    - **CRITICAL:** Użyj Regex, aby usunąć nazwę twórcy (`name`) i handle (`handle`) z tekstu opisu (zastąp je "___").
    - Na start pokreż tylko pierwsze 15 słów. Co strzał odkrywaj kolejne 10 słów.

## 🛠️ Wytyczne Techniczne dla Agenta
- **Mapowanie API:** Dane z Google API (`statistics`) są stringami. Zawsze parsuj je na `Number` przed zapisem do obiektu `Youtuber`.
- **Porównywarka:** Zaimplementuj funkcję `checkGuess(guess: Youtuber, target: Youtuber): ComparisonResult[]`, która obsłuży logikę kolorów i strzałek.
- **Routing:** Gra powinna odbywać się na ścieżce `/home`. Po zalogowaniu automatycznie inicjuj stan gry (losuj twórcę).