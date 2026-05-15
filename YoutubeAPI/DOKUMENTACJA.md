# 📚 Kompleksowa Dokumentacja Projektu YouTubeAPI

Projekt YouTubeAPI to zaawansowana aplikacja webowa typu Single Page Application (SPA) zbudowana w oparciu o framework **Angular**. Stanowi innowacyjne połączenie gier interaktywnych bazujących na realnych danych z YouTube (tzw. "YTDLE") oraz w pełni funkcjonalnego, symulowanego rynku akcji twórców (YT-Stock). Aplikacja oferuje unikalne doświadczenie użytkownika dzięki nowoczesnemu designowi, dynamicznej rozgrywce, komunikacji w czasie rzeczywistym z Firebase oraz optymalnej architekturze modularnej.

---

## 1. 🏗 Architektura Projektu i Katalogi

Aplikacja została zbudowana w architekturze **Standalone Components** (brak plików `.module.ts`), co znacząco zmniejsza obciążenie startowe (bundle size) i ułatwia leniwe ładowanie (Lazy Loading).

### Struktura Katalogów
*   **`src/app/components/`** – Zawiera wszystkie komponenty wizualne i logiczne, podzielone na podkatalogi:
    *   `login`, `homepage` – Główny przepływ użytkownika.
    *   `emotes`, `subscribed`, `thumbnails`, `ytidle` – Komponenty gier (YTDLE).
    *   `ytstock`, `market`, `wallet`, `transactions`, `coindetail` – Komponenty giełdy.
    *   `toast` – Globalny system powiadomień.
*   **`src/app/services/`** – Warstwa logiki biznesowej, dostępu do API oraz zarządzania stanem.
*   **`src/app/core/`** – Strażnicy (Guards) np. `thumbnails.guard.ts` zabezpieczające dostęp do odpowiednich sekcji oraz interceptory żądań HTTP (np. AuthInterceptor).
*   **`src/app/interfaces/`** – Definicje modeli danych (np. obiekt `Youtuber`, `Transaction`).

---

## 2. 🔐 System Uwierzytelniania (Firebase & Google Auth)

Proces uwierzytelniania obsługiwany jest przez **Firebase Authentication** w warstwie usługi `AuthService`.
*   **Jak to działa?**
    1.  Użytkownik klika przycisk logowania w komponencie `Login`.
    2.  Wywoływany jest proces `signInWithPopup(GoogleAuthProvider)` oferowany przez Firebase.
    3.  Aplikacja żąda specjalnych uprawnień (`scope: https://www.googleapis.com/auth/youtube.readonly`) pozwalających na odczyt publicznych danych YouTube.
    4.  Po sukcesie pobierany jest `Google Access Token`, który ląduje w `localStorage` – jest niezbędny do pytań do Google API.
    5.  Tworzony (lub weryfikowany) jest rekord użytkownika w bazie **Firestore** w kolekcji `users/`. Jeśli to nowe konto, przypisywany jest mu kapitał początkowy (`balance: 10000$`) oraz portfel (portfolio).

---

## 3. 🎮 Tryby Gry (YTDLE)

Główny trzon rozgrywki dostępny z poziomu ekranu `Homepage`. Interfejs utrzymany w klasycznej, "YouTube'owej czerwieni". Większość gier działa na zasadzie split-screen, pozwalając na wyświetlanie zawartości po jednej stronie i operowanie po drugiej.

### 1. Subscribed
Moduł pozwalający użytkownikowi na odgadywanie, przeglądanie i zarządzanie swoimi faktycznymi subskrypcjami pobranymi z konta Google. Wykorzystuje zapytania do endpointu `/subscriptions`. Wymaga poprawnie przekazanego tokenu Google Auth.

### 2. Emotes
Gra polegająca na rozpoznaniu kanału/twórcy na podstawie zestawu emotikon, wygenerowanych w oparciu o opisy ich profilu, słowa kluczowe lub statystyki. Logika parsowania ukryta jest w `EmojiService`.

### 3. Thumbnails
Gra w odgadywanie filmów (lub twórcy) na podstawie pokazywanej miniatury. Dostęp do tej minigry jest chroniony przez `ThumbnailsGuard`, który sprawdza odpowiednie warunki (np. czy użytkownik wygrał poprzedni tryb, by odblokować ten).

### 4. YT-Idle
Moduł z mechaniką progresywną, w której użytkownik "farmi" zasoby (np. subskrypcje, wyświetlenia) bazując na parametrach popularnych kanałów na platformie YouTube.

---

## 4. 📈 Giełda Twórców (YT-Stock)

W pełni wyizolowana platforma inwestycyjna zaszyta w ramach aplikacji. Charakteryzuje się zmianą motywu wizualnego na "Financial Green" (zielony, giełdowy layout).

### `ytstock` (Główny Hub Giełdowy)
Zarządza nawigacją wewnątrz modułu poprzez wbudowane zakładki (tabbed routing). Przełącza widoki za pomocą `<router-outlet>`.

### `market` (Rynek)
*   **Funkcjonalność:** Wyświetla listę twórców (spółek) dostępnych do kupienia. Zamiast standardowej tabeli używa **układu siatki (3x3 Grid)**.
*   **Logika cen:** Dynamiczna cena wyciągana jest w czasie rzeczywistym z `StockEngineService`. Kolory (zielony/czerwony) wskaźników dopasowują się na podstawie 24h zmiany ceny.
*   **Akcja:** Kliknięcie na danego twórcę przenosi do widoku `coindetail`.

### `coindetail` (Widok Szczegółowy / Modal Handlowy)
*   **Funkcjonalność:** Panel operacyjny dla wybranego YouTubera. Wyświetla dokładne statystyki oraz pełnoprawny system kupna / sprzedaży (Buy/Sell).
*   **Zabezpieczenia:** Zaawansowana walidacja kwot – nie można kupić akcji za więcej niż posiadane saldo (`WalletService` i `TradingService`), kalkulacja liczby akcji z wybranego budżetu przeliczana jest w czasie rzeczywistym w formularzach (Angular Forms).

### `wallet` (Portfel Inwestora)
*   **Funkcjonalność:** Dashboard aktywów użytkownika. Wyświetla posiadane pakiety akcji i kalkuluje aktualny łączny majątek (Total Wealth).
*   **UX:** Sticky header informujący na bieżąco o posiadanym saldzie płynnym.

### `transactions` (Historia Zleceń)
Moduł odpowiedzialny za listowanie w tabeli historii zrealizowanych transakcji (Kupno, Sprzedaż, Kwota, Ilość, Czas). Dane pobierane i archiwizowane m.in. w Firestore.

---

## 5. 🧠 Usługi i Logika Biznesowa (Services)

Odseparowanie logiki od widoku było priorytetem. Główne "silniki" aplikacji:

### `YoutubeService`
Centralny węzeł komunikacji. Wykorzystuje `HttpClient` do strzałów do Google API.
*   **Kluczowe metody:** `fetchTopChannelIds()`, `getChannelsFullData()`, `getUserSubscriptionsPool()`.
*   **Inicjalizacja giełdy (`initializeGlobalMarket`):** Wyszukuje topowe 50 kanałów z Polski (`PL`) i ze świata, pobiera ich pełne statystyki, zrzuca do localStorage, żeby minimalizować liczbę odpytań (ochrona limitów API).

### `StockEngineService`
Mózg symulacji rynkowej.
*   **Zasada Działania:** Posiada interwał operacyjny (domyślnie `300000ms` = 5 minut lub `30000ms` dla lokalnego mocka), w trakcie którego przelicza nowe ceny.
*   **Algorytm Cenowy:** `calculateNewPrice()` porównuje przyrost w czasie rzeczywistym (Velocity) liczby wyświetleń (total views) i aplikuje średnią kroczącą EMA (Exponential Moving Average) względem starej ceny. Nowa cena jest następnie synchronizowana do chmury Firestore `syncPriceToFirestore()`.
*   **Mock Data:** Jeśli limit API zostanie wyczerpany lub brak dostępu, ładuje testowe dane z "mock" by giełda i UI dalej działały poprawnie.

### `WalletService` i `TradingService`
*   Zarządza `BehaviorSubject` dla stanu balansu w aplikacji.
*   Metoda wykonywania transakcji modyfikuje stan chmury (Firestore – subkolekcja `/portfolio`) i aktualizuje `localStorage`.

---

## 6. 🎨 Design, CSS i Warstwa Wizualna

Aplikacja dąży do wizerunku **Premium Web App**:
*   **Glassmorphism:** Potężne zastosowanie `backdrop-filter: blur(x)` i transparentnych teł (`rgba(255, 255, 255, 0.1)`) dla modalów i kontenerów gier, dodając głębię w trybie Dark Mode.
*   **No-Scroll / Single Screen Design:** Widoki gier (np. tryb `Emotes` czy split-screen `Subscribed`) są celowo zablokowane na 100% wysokości okna przeglądarki (`100vh`), wymuszając symetryczne i skupione rozłożenie elementów.
*   **Zmienne Systematyczne (Variables):** Użycie customowych właściwości CSS np. `--primary-red` (YT), `--primary-green` (Giełda), `--glass-border`. Gwarantuje spójność przy ewentualnym skalowaniu aplikacji na kolejne gry.

---

## 7. 🚀 Kompilacja i Instrukcja Środowiska

1. **Instalacja Zależności:** Uruchom komendę `npm install`. Upewnij się, że masz środowisko wykonawcze (Execution Policy pozwalające na skrypty `.ps1` w PowerShell) dla npm.
2. **Klucze API (.env):** Projekt polega na builderze `@ngx-env/builder`. Wszystkie klucze YouTube Data API v3 i Firebase Web Configuration muszą znajdować się w głównym katalogu w pliku `.env`.
3. **Uruchomienie:** `ng serve` lub `npm start`. Aplikacja ukaże się na porcie `:4200`.

---
© 2026 YouTubeAPI Project - Pełna Dokumentacja Architektoniczna
