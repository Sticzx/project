# Dokumentacja Projektu YouTubeAPI

Projekt YouTubeAPI to zaawansowana aplikacja webowa oparta na Angularze, która łączy interaktywne gry oparte na danych z YouTube z symulatorem giełdy twórców. Aplikacja oferuje unikalne doświadczenie użytkownika dzięki nowoczesnemu designowi i dynamicznej rozgrywce.

## 🚀 Przegląd Funkcjonalności

Aplikacja składa się z kilku kluczowych modułów:

1.  **System Logowania (`Login`)**: Punkt wejścia do aplikacji, obsługujący autentykację użytkownika.
2.  **Strona Główna (`Homepage`)**: Centralny hub (Dashboard) umożliwiający nawigację do różnych trybów gry i giełdy.
3.  **Tryby Gry**:
    *   **Emotes**: Gra polegająca na odgadywaniu/interakcji z emotkami YouTube.
    *   **Subscribed**: Moduł związany z subskrypcjami kanałów.
    *   **Thumbnails**: Gra w odgadywanie filmów na podstawie miniatur (zabezpieczona Guardem).
    *   **YT-Idle**: Mechanika gry typu "idle" zintegrowana z ekosystemem YouTube.
4.  **YT-Stock (Giełda Twórców)**: Kompleksowy symulator handlu akcjami YouTuberów.

---

## 🏗 Architektura Systemu

### 🧩 Komponenty (Sub-modułu)

Projekt stawia na wysoką modularność:

*   **`ytstock`**: Główny kontener giełdy.
    *   **`market`**: Rynek główny, gdzie użytkownik widzi aktualne ceny i zmiany (24h) akcji twórców.
    *   **`wallet`**: Portfel inwestycyjny, wyświetlający posiadane akcje oraz obliczający zysk/stratę w czasie rzeczywistym.
    *   **`transactions`**: Historia wszystkich operacji kupna i sprzedaży.
*   **Wspólne Elementy UI**: Aplikacja wykorzystuje nowoczesne techniki CSS, takie jak Glassmorphism, animacje wejścia i dynamiczne palety kolorów (np. "Financial Green" dla giełdy).

### 🛠 Usługi (Services)

Logika biznesowa jest odseparowana od prezentacji:

*   **`YouTubeService`**: Komunikacja z API YouTube, pobieranie danych o filmach i twórcach.
*   **`StockEngineService`**: Silnik giełdy symulujący zmiany cen co 30 sekund na podstawie własnych algorytmów.
*   **`WalletService`**: Zarządzanie balansem użytkownika, stanem portfela i persystencją danych w `localStorage`.
*   **`GameStateService`**: Globalne zarządzanie postępem w grach i stanem aplikacji.
*   **`EmojiService`**: Specjalistyczna logika dla trybu emotek.

### 🔐 Bezpieczeństwo i Routing

*   **`AuthInterceptor`**: Automatyczne dodawanie nagłówków autoryzacyjnych do zapytań API.
*   **`ThumbnailsGuard`**: Zabezpieczenie dostępu do trybu miniatur, wymagające spełnienia określonych warunków.
*   **Routing**: Zastosowano hierarchiczny system ścieżek z leniwym ładowaniem (tam gdzie to możliwe) i przekierowaniami.

---

## 🎨 Design i UX

Aplikacja została zaprojektowana z naciskiem na "Premium Look":
*   **Efekty wizualne**: Wykorzystanie `backdrop-filter` dla efektu rozmytego szkła.
*   **Responsywność**: Interfejs dostosowany do urządzeń mobilnych i desktopowych.
*   **Motywy**: Dynamiczna zmiana akcentów kolorystycznych w zależności od wybranego trybu gry (np. czerwień YouTube vs. giełdowa zieleń).

---

## 🛠 Technologie

*   **Framework**: Angular (Standalone Components)
*   **State Management**: RxJS (BehaviorSubjects, Observables)
*   **Stylizacja**: Vanilla CSS z wykorzystaniem zmiennych CSS i nowoczesnych selektorów.
*   **Storage**: LocalStorage dla zapisu stanu portfela i postępów.

---

## 📝 Instrukcja Rozwoju

1.  **Dodawanie nowego trybu gry**: Stwórz komponent w folderze `components`, dodaj odpowiednią usługę w `services` i zarejestruj ścieżkę w `app.routes.ts`.
2.  **Modyfikacja giełdy**: Logika cen znajduje się w `StockEngineService`. Style wizualne tabel są współdzielone między sub-komponentami `market` i `wallet`.

---
© 2026 YouTubeAPI Project - Dokumentacja Techniczna
