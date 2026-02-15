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

  function handleNotFound() {
    setNotFound(true);
    setSelected(null);
    onSelect(null);
  }

  function handleBackToSearch() {
    setNotFound(false);
    setNewSchoolName('');
    if (onNewSchool) onNewSchool('');
  }

  function handleNewSchoolChange(e) {
    const name = e.target.value;
    setNewSchoolName(name);
    if (onNewSchool) onNewSchool(name);
  }

  return (
    <div className="school-autocomplete" ref={wrapperRef}>
      <label className="form-label">School *</label>

      {!notFound ? (
        <>
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

          <button type="button" className="cant-find-btn" onClick={handleNotFound}>
            I can't find my school
          </button>

          {selected && (
            <div className="selected-school">
              Selected: <strong>{selected.name}</strong> ({selected.countries?.name})
            </div>
          )}
        </>
      ) : (
        <div className="new-school-box">
          <input
            type="text"
            className="form-input"
            placeholder="Enter your school name"
            value={newSchoolName}
            onChange={handleNewSchoolChange}
            autoFocus
          />
          <button type="button" className="back-to-search-btn" onClick={handleBackToSearch}>
            Back to search
          </button>
        </div>
      )}
    </div>
  );
}
