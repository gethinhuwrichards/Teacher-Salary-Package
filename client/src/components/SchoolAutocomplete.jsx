import { useState, useRef, useEffect } from 'react';
import { useSchoolSearch } from '../hooks/useSchoolSearch';
import './SchoolAutocomplete.css';

export default function SchoolAutocomplete({ onSelect, onNewSchool }) {
  const { query, setQuery, results, loading } = useSchoolSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(school) {
    setSelected(school);
    setQuery(school.name);
    setIsOpen(false);
    setNotFound(false);
    onSelect(school);
  }

  function handleNotFoundToggle(e) {
    const checked = e.target.checked;
    setNotFound(checked);
    if (checked) {
      setSelected(null);
      onSelect(null);
    }
  }

  function handleNewSchoolChange(e) {
    const name = e.target.value;
    setNewSchoolName(name);
    if (onNewSchool) onNewSchool(name);
  }

  return (
    <div className="school-autocomplete" ref={wrapperRef}>
      <label className="form-label">School *</label>
      {!notFound && (
        <div className="autocomplete-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder="Start typing school name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setIsOpen(true);
              onSelect(null);
            }}
            onFocus={() => results.length > 0 && setIsOpen(true)}
          />
          {loading && <span className="autocomplete-loader">Searching...</span>}
          {isOpen && results.length > 0 && (
            <ul className="autocomplete-dropdown">
              {results.map((school) => (
                <li
                  key={school.id}
                  className="autocomplete-item"
                  onClick={() => handleSelect(school)}
                >
                  <span className="school-name">{school.name}</span>
                  <span className="school-country">{school.countries?.name}</span>
                </li>
              ))}
            </ul>
          )}
          {isOpen && query.length >= 2 && !loading && results.length === 0 && (
            <div className="autocomplete-dropdown">
              <div className="autocomplete-empty">No schools found</div>
            </div>
          )}
        </div>
      )}

      <label className="checkbox-label not-found-check">
        <input
          type="checkbox"
          checked={notFound}
          onChange={handleNotFoundToggle}
        />
        I have checked and can confirm my school is not in the list
      </label>

      {notFound && (
        <input
          type="text"
          className="form-input"
          placeholder="Enter your school name"
          value={newSchoolName}
          onChange={handleNewSchoolChange}
        />
      )}

      {selected && (
        <div className="selected-school">
          Selected: <strong>{selected.name}</strong> ({selected.countries?.name})
        </div>
      )}
    </div>
  );
}
