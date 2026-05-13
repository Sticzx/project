# 🤖 YTdle & YT-Stock - AI Agent Instructions

Jesteś ekspertem Angular (v17+), RxJS oraz YouTube Data API v3. Twoim zadaniem jest rozbudowa aplikacji o zintegrowany system gier oraz dynamiczną giełdę twórców.

## 🎯 Główne Zasady

- **Model Danych:** Zawsze korzystaj z interfejsu `Youtuber` (z `src/app/interfaces/youtuber.ts`).
- **GameState Service:** Wszystkie tryby gry muszą być ze sobą powiązane. Po odgadnięciu twórcy w jednym trybie, staje się on celem (`currentTarget`) w kolejnych etapach.
- **Optymalizacja Quota:** Cache'uj dane w `Service`. Nie pobieraj dwa razy tych samych statystyk w ciągu jednej sesji.

---

## 🕹️ Tryby Gry (The Gauntlet Loop)

Przejście między trybami musi być płynne i zachowywać ciągłość progresu użytkownika.

### 1. Subscribed (Fundament)
- **Cel:** Odgadnięcie twórcy z subskrypcji użytkownika.
- **Logika:** Porównywanie `subCount`, `totalViews` oraz `joinedYear` (strzałki góra/dół).

### 2. Thumbnails (Wizualny)
- **Cel:** Rozpoznanie po miniaturze filmu `currentTarget`.
- **Mechanika:** Pobierz 50 najnowszych filmów, wylosuj jeden. Wyświetl miniaturę z CSS `filter: blur(20px)`. Z każdym błędem zmniejszaj blur o 4px.

### 3. Emoji Mode (Skojarzenia)
- **Mechanika:** Pobierz tytuły 5 najpopularniejszych filmów. 
- **Logika:** Wyciągnij emotki użyte przez twórcę w tytułach. Jeśli ich brak, dopasuj ikony na podstawie słów kluczowych (np. "auto" ➔ 🏎️, "build" ➔ 🧱). 
- **Zakaz:** Nie używaj ogólnych ikon typu 🎥, ⭐, 🎬.

### 4. Comments Mode (Final Boss)
- **Mechanika:** Pobierz 10 komentarzy (`order: 'relevance'`) dla topowego filmu.
- **Cenzura:** Użyj Regex, aby zamienić każdą wzmiankę o nazwie lub handle'u twórcy na `[AUTOR]`.

---

## 📈 YT-Stock (Creator Giełda)

System dynamicznej wyceny "Creator Coins" oparty na danych z API w czasie rzeczywistym.

### 1. Mechanizm Kursu (Velocity)
Cena zależy od prędkości przyrostu wyświetleń, a nie ich sumy.
- **Wycena:** Porównuj `viewCount` z bieżącego zapytania do danych historycznych (sprzed 15-30 min).
- **Wygładzanie (EMA):** Aby uniknąć skoków, stosuj wykładniczą średnią kroczącą:
  $$Price_{new} = (CurrentValue \times \alpha) + (Price_{old} \times (1 - \alpha))$$
  Gdzie $\alpha$ to współczynnik bezwładności (rekomendowane: 0.1).

### 2. Market Sentiment (Wpływ AI)
- Użyj Gemini do analizy 20 najnowszych komentarzy.
- **Mnożnik:** Pozytywny sentyment ➔ +2% do kursu. Negatywny (drama) ➔ -5% do kursu.

---

## 🛠️ Wytyczne Techniczne dla Agenta

### Serwis i API
- **Autoryzacja:** Metody `mine=true` wymagają tokena OAuth2. Metody `commentThreads` oraz `search` wymagają klucza API (`environment.youtubeApiKey`).
- **HttpParams:** Zawsze używaj `HttpParams` do budowania zapytań. Nie wpisuj parametrów ręcznie w stringu URL.

### Funkcjonalność Giełdy
- **Wallet:** Zaimplementuj `WalletService` z wirtualną walutą. Zapisuj stan portfela w `localStorage`.
- **Charts:** Do wizualizacji kursów używaj prostych polilinii SVG lub lekkiej biblioteki (np. `ng2-charts`). Kurs musi się aktualizować "na żywo" bez odświeżania strony (RxJS `interval`).

### Cenzura i Bezpieczeństwo
- **Regex:** `new RegExp(youtuber.name, 'gi')` do czyszczenia opisów i komentarzy.
- **Error Handling:** Obsłuż błąd 403 (limit Quota) i wyświetl użytkownikowi czytelny komunikat o przerwie technicznej.