import { useEffect, useState } from "react";
import "./Weather.css";

const DEFAULT_LOCATION = {
  name: "Vilnius",
  latitude: 54.6872,
  longitude: 25.2797,
  admin1: "Vilniaus apskritis",
};

function getWeatherUrl(location) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "5",
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

function describeWeather(code) {
  if (code === 0) return "Giedra";
  if ([1, 2].includes(code)) return "Mažai debesuota";
  if (code === 3) return "Debesuota";
  if ([45, 48].includes(code)) return "Rūkas";
  if ([51, 53, 55, 56, 57].includes(code)) return "Dulksna";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Lietus";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Sniegas";
  if ([95, 96, 99].includes(code)) return "Perkūnija";
  return "Oro sąlygos";
}

function Weather() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [cityQuery, setCityQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(getWeatherUrl(location));
        if (!response.ok) throw new Error("weather");
        const data = await response.json();
        if (active) setForecast(data);
      } catch {
        if (active) setError("Nepavyko gauti orų prognozės. Pabandykite vėliau.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWeather();
    return () => { active = false; };
  }, [location]);

  async function handleCitySearch(event) {
    event.preventDefault();
    const query = cityQuery.trim();
    if (query.length < 2) {
      setSearchError("Įveskite bent 2 miesto pavadinimo raides.");
      setPlaces([]);
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setPlaces([]);
    try {
      const params = new URLSearchParams({ name: query, count: "8", language: "lt", countryCode: "LT", format: "json" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
      if (!response.ok) throw new Error("search");
      const result = await response.json();
      const matches = (result.results ?? []).filter((place) => place.country_code === "LT");
      if (matches.length === 0) {
        setSearchError("Lietuvoje tokio miesto neradome. Patikrinkite pavadinimą.");
      } else {
        setPlaces(matches);
      }
    } catch {
      setSearchError("Nepavyko ieškoti miesto. Pabandykite dar kartą.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectPlace(place) {
    setLocation({
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      admin1: place.admin1 ?? "Lietuva",
    });
    setCityQuery("");
    setPlaces([]);
    setSearchError("");
  }

  return (
    <main className="weather-page">
      <header className="weather-heading">
        <p className="weather-eyebrow">ORAI DABAR</p>
        <h1>{location.name}</h1>
        {location.admin1 && <p className="weather-location-area">{location.admin1}, Lietuva</p>}
        <p>Orų prognozė pagal Open-Meteo</p>
      </header>

      <form className="weather-search" onSubmit={handleCitySearch}>
        <label htmlFor="weather-city">Ieškoti miesto Lietuvoje</label>
        <div className="weather-search__controls">
          <input
            id="weather-city"
            type="search"
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
            placeholder="Pvz., Kaunas"
            autoComplete="off"
          />
          <button type="submit" disabled={isSearching}>
            {isSearching ? "Ieškoma..." : "Ieškoti"}
          </button>
        </div>
        {searchError && <p className="weather-search__message" role="alert">{searchError}</p>}
        {places.length > 0 && (
          <ul className="weather-city-results" aria-label="Rasti miestai">
            {places.map((place) => (
              <li key={`${place.id}-${place.latitude}`}>
                <button type="button" onClick={() => handleSelectPlace(place)}>
                  <span>{place.name}</span>
                  <small>{[place.admin1, place.admin2].filter(Boolean).join(", ") || "Lietuva"}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {loading && <section className="weather-card weather-message">Kraunama prognozė...</section>}
      {error && <section className="weather-card weather-message" role="alert">{error}</section>}

      {forecast && (
        <>
          <section className="weather-card weather-current" aria-label="Dabartiniai orai Vilniuje">
            <div>
              <p className="weather-eyebrow">DABAR</p>
              <p className="weather-temperature">{Math.round(forecast.current.temperature_2m)}°</p>
              <p className="weather-description">{describeWeather(forecast.current.weather_code)}</p>
            </div>
            <div className="weather-details">
              <p>Jaučiama kaip <strong>{Math.round(forecast.current.apparent_temperature)}°C</strong></p>
              <p>Drėgmė <strong>{forecast.current.relative_humidity_2m}%</strong></p>
              <p>Vėjas <strong>{Math.round(forecast.current.wind_speed_10m)} km/h</strong></p>
            </div>
          </section>

          <section className="weather-card">
            <header className="weather-forecast-heading">
              <h2>5 dienų prognozė</h2>
              <span>°C</span>
            </header>
            <div className="weather-forecast-list">
              {forecast.daily.time.map((date, index) => (
                <article className="weather-day" key={date}>
                  <time dateTime={date}>
                    {new Intl.DateTimeFormat("lt-LT", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}
                  </time>
                  <span className="weather-day__condition">{describeWeather(forecast.daily.weather_code[index])}</span>
                  <span className="weather-day__temperatures">
                    <strong>{Math.round(forecast.daily.temperature_2m_max[index])}°</strong>
                    <span>{Math.round(forecast.daily.temperature_2m_min[index])}°</span>
                  </span>
                  <span className="weather-day__rain">☂ {forecast.daily.precipitation_probability_max[index] ?? 0}%</span>
                </article>
              ))}
            </div>
          </section>
          <p className="weather-attribution">Duomenys: Open-Meteo</p>
        </>
      )}
    </main>
  );
}

export default Weather;
