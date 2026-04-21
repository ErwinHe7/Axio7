import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { destinationOptions, primaryRoomTypes, presetProfiles } from "../config/runtime";

const boroughOptions = ["Manhattan", "Queens", "Brooklyn", "Bronx"];

export function SearchToolbar({
  preferences,
  onChange,
  onSubmit,
  loading,
  placeSuggestions,
}) {
  const [showMore, setShowMore] = useState(false);

  function update(field, value) {
    onChange({ [field]: value });
  }

  function toggleBorough(borough) {
    const next = preferences.boroughs.includes(borough)
      ? preferences.boroughs.filter((item) => item !== borough)
      : [...preferences.boroughs, borough];
    update("boroughs", next);
  }

  return (
    <section className="panel search-toolbar-panel">
      <form className="search-toolbar" onSubmit={onSubmit}>
        <div className="toolbar-main">
          <label className="field large">
            <span>Place or address</span>
            <input
              list="place-options"
              onChange={(event) => update("placeQuery", event.target.value)}
              placeholder="Columbia University or 116th St & Broadway"
              type="text"
              value={preferences.placeQuery}
            />
            <datalist id="place-options">
              {placeSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </label>

          <label className="field">
            <span>Min</span>
            <input
              min="0"
              onChange={(event) => update("budgetMin", Number(event.target.value))}
              type="number"
              value={preferences.budgetMin}
            />
          </label>

          <label className="field">
            <span>Max</span>
            <input
              min="0"
              onChange={(event) => update("budgetMax", Number(event.target.value))}
              type="number"
              value={preferences.budgetMax}
            />
          </label>

          <label className="field">
            <span>Type</span>
            <select
              onChange={(event) => update("roomType", event.target.value)}
              value={preferences.roomType}
            >
              {primaryRoomTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Move-in</span>
            <input
              onChange={(event) => update("moveInDate", event.target.value)}
              type="date"
              value={preferences.moveInDate}
            />
          </label>

          <label className="field">
            <span>Lease style</span>
            <select
              onChange={(event) => update("leasePreference", event.target.value)}
              value={preferences.leasePreference}
            >
              <option value="short-term-or-sublet">Short-term / sublet</option>
              <option value="flexible-short-term">Flexible short-term</option>
              <option value="long-term">Long-term</option>
              <option value="either">Either</option>
            </select>
          </label>

          <button className="primary-button toolbar-submit" disabled={loading} type="submit">
            <Search size={16} />
            {loading ? "Searching" : "Search"}
          </button>
        </div>

        <div className="toolbar-actions">
          <div className="toolbar-presets">
            {Object.entries(presetProfiles).map(([key, profile]) => (
              <button
                key={key}
                className="chip-button"
                onClick={() => onChange(profile.updates)}
                type="button"
              >
                {profile.label}
              </button>
            ))}
          </div>

          <button
            className={`chip-button ${showMore ? "active" : ""}`}
            onClick={() => setShowMore((current) => !current)}
            type="button"
          >
            <SlidersHorizontal size={14} />
            More filters
          </button>
        </div>

        {showMore && (
          <div className="toolbar-more">
            <label className="field">
              <span>Lease months</span>
              <input
                max="18"
                min="1"
                onChange={(event) => update("leaseMonths", Number(event.target.value))}
                type="number"
                value={preferences.leaseMonths}
              />
            </label>

            <label className="field">
              <span>Furnished</span>
              <select
                onChange={(event) => update("furnished", event.target.value)}
                value={preferences.furnished}
              >
                <option value="either">Either</option>
                <option value="prefer-furnished">Prefer furnished</option>
                <option value="must-be-furnished">Must be furnished</option>
              </select>
            </label>

            <label className="field">
              <span>Broker fee</span>
              <select
                onChange={(event) => update("brokerFeePreference", event.target.value)}
                value={preferences.brokerFeePreference}
              >
                <option value="prefer-no-fee">Prefer no fee</option>
                <option value="must-avoid-fee">Must avoid fee</option>
                <option value="fee-okay">Fee OK</option>
              </select>
            </label>

            <label className="field">
              <span>Commute to</span>
              <select
                onChange={(event) => update("commuteDestination", event.target.value)}
                value={preferences.commuteDestination}
              >
                {destinationOptions.map((destination) => (
                  <option key={destination} value={destination}>
                    {destination}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Max commute</span>
              <select
                onChange={(event) => update("maxCommuteMinutes", Number(event.target.value))}
                value={preferences.maxCommuteMinutes}
              >
                {[20, 25, 30, 35, 40, 45].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} min
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Roommates</span>
              <select
                onChange={(event) => update("roommatePolicy", event.target.value)}
                value={preferences.roommatePolicy}
              >
                <option value="roommate-ok">Roommate OK</option>
                <option value="prefer-solo">Prefer solo</option>
                <option value="must-be-solo">Must be solo</option>
              </select>
            </label>

            <div className="field wide-field">
              <span>Boroughs</span>
              <div className="toggle-row">
                {boroughOptions.map((borough) => (
                  <button
                    key={borough}
                    className={`toggle-pill ${preferences.boroughs.includes(borough) ? "active" : ""}`}
                    onClick={() => toggleBorough(borough)}
                    type="button"
                  >
                    {borough}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
