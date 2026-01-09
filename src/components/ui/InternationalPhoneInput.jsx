import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const InternationalPhoneInput = ({
  value = '',
  onChange,
  label,
  error,
  helperText,
  required = false,
  defaultCountry = 'BR',
  name
}) => {
  const { currentTheme } = useTheme();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef(null);

  const styles = getStyles(currentTheme, error);

  // 1. Fetch Country Data from Free API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          'https://restcountries.com/v3.1/all?fields=name,flags,idd,cca2'
        );
        const data = await response.json();
        
        // Format and Sort Countries
        const formattedCountries = data
          .filter(c => c.idd?.root) // Filter out invalid entries
          .map(c => ({
            name: c.name.common,
            code: c.cca2,
            flag: c.flags.svg,
            dialCode: c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : '')
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(formattedCountries);
        
        // Set Default Country
        const def = formattedCountries.find(c => c.code === defaultCountry);
        if (def) setSelectedCountry(def);
        
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [defaultCountry]);

  // 2. Handle Value Changes (Parent -> Child)
  useEffect(() => {
    if (selectedCountry) {
        // Se o value já vier preenchido (edição), tenta extrair o número sem o DDI
        // Mas o DDI pode variar. Vamos assumir uma lógica simples:
        // Se o value começa com o dialCode do país selecionado, remove.
        // Caso contrário, assume que o value é o número puro ou tem outro DDI.
        // Para simplificar: na edição, se tiver valor, a gente tenta limpar.
        
        // A lógica ideal seria detectar o país pelo DDI do value, mas isso é complexo.
        // Vamos manter simples: o value recebido é o full number.
        // Se for vazio, limpa.
        
        if (!value) {
            setPhoneNumber('');
            return;
        }

        const cleanValue = value.replace(/\D/g, '');
        const cleanDial = selectedCountry.dialCode.replace(/\D/g, '');
        
        if (cleanValue.startsWith(cleanDial)) {
            setPhoneNumber(cleanValue.slice(cleanDial.length));
        } else {
            // Se não bater, talvez o país selecionado esteja errado ou o número não tenha DDI
            setPhoneNumber(cleanValue);
        }
    }
  }, [value, selectedCountry]);

  // 3. Handle Outside Click to Close Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    // Recalcula o valor final com o novo DDI
    triggerChange(country.dialCode, phoneNumber);
  };

  const handlePhoneChange = (e) => {
    const newValue = e.target.value.replace(/\D/g, ''); // Allow only numbers
    setPhoneNumber(newValue);
    triggerChange(selectedCountry?.dialCode, newValue);
  };

  const triggerChange = (dialCode, number) => {
    if (onChange) {
      // Returns full E.164 format (e.g., 5511999999999) without +
      const cleanDial = dialCode.replace(/\D/g, '');
      onChange({ target: { name, value: `${cleanDial}${number}` } });
    }
  };

  // Filter countries for search
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.dialCode.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.container} ref={dropdownRef}>
      {label && (
        <label style={styles.label}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      <div style={styles.inputGroup}>
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => !loading && setIsOpen(!isOpen)}
          style={styles.countryButton}
        >
          {loading ? (
            <Loader2 size={20} style={styles.spinner} />
          ) : selectedCountry ? (
            <div style={styles.selectedCountry}>
              <img 
                src={selectedCountry.flag} 
                alt={selectedCountry.name} 
                style={styles.flag}
              />
              <span style={styles.countryCode}>{selectedCountry.code}</span>
              <ChevronDown size={14} style={{ color: currentTheme.textSecondary }} />
            </div>
          ) : (
            <span>Select</span>
          )}
        </button>

        {/* Phone Input */}
        <div style={styles.inputWrapper}>
          <div style={styles.dialCodePrefix}>
            {selectedCountry?.dialCode}
          </div>
          <input
            type="tel"
            style={styles.input}
            placeholder="99999-9999"
            value={phoneNumber}
            onChange={handlePhoneChange}
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div style={styles.dropdown}>
            {/* Search Box */}
            <div style={styles.searchBox}>
              <div style={styles.searchWrapper}>
                <Search size={16} style={styles.searchIcon} />
                <input
                  type="text"
                  style={styles.searchInput}
                  placeholder="Buscar país..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Country List */}
            <ul style={styles.countryList}>
              {filteredCountries.length === 0 ? (
                <li style={styles.emptyItem}>Nenhum país encontrado</li>
              ) : (
                filteredCountries.map((country) => (
                  <li
                    key={country.code}
                    style={styles.countryItem}
                    onClick={() => handleCountrySelect(country)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.borderLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <img 
                      src={country.flag} 
                      alt={country.name} 
                      style={styles.listFlag}
                    />
                    <div style={styles.countryInfo}>
                      <span style={styles.countryName}>{country.name}</span>
                      <span style={styles.countryDial}>{country.dialCode}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && <p style={styles.errorText}>{error}</p>}
      {helperText && !error && <p style={styles.helperText}>{helperText}</p>}
    </div>
  );
};

const getStyles = (theme, hasError) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textPrimary
  },
  inputGroup: {
    display: 'flex',
    borderRadius: '8px',
    border: `1px solid ${hasError ? '#ef4444' : theme.border}`,
    backgroundColor: theme.background,
    position: 'relative' // Para o dropdown absoluto
  },
  countryButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: theme.cardBackground, // Ligeiramente diferente
    border: 'none',
    borderRight: `1px solid ${theme.border}`,
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
    cursor: 'pointer',
    minWidth: '80px',
    justifyContent: 'center'
  },
  selectedCountry: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  flag: {
    width: '24px',
    height: '16px',
    objectFit: 'cover',
    borderRadius: '2px'
  },
  countryCode: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textPrimary
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: theme.primary
  },
  inputWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    position: 'relative'
  },
  dialCodePrefix: {
    paddingLeft: '12px',
    fontSize: '14px',
    color: theme.textSecondary,
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 4px', // padding left pequeno pois tem o prefixo
    border: 'none',
    backgroundColor: 'transparent',
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    width: '300px',
    maxHeight: '300px',
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  searchBox: {
    padding: '8px',
    borderBottom: `1px solid ${theme.border}`
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: '6px',
    border: `1px solid ${theme.border}`,
    padding: '4px 8px'
  },
  searchIcon: {
    color: theme.textSecondary,
    marginRight: '8px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
    color: theme.textPrimary,
    fontSize: '13px'
  },
  countryList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    overflowY: 'auto',
    flex: 1
  },
  countryItem: {
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    borderBottom: `1px solid ${theme.borderLight}`
  },
  listFlag: {
    width: '24px',
    height: '16px',
    objectFit: 'cover',
    borderRadius: '2px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  countryInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  countryName: {
    fontSize: '13px',
    fontWeight: '500',
    color: theme.textPrimary
  },
  countryDial: {
    fontSize: '11px',
    color: theme.textSecondary
  },
  emptyItem: {
    padding: '16px',
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: '13px'
  },
  errorText: {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '4px'
  },
  helperText: {
    fontSize: '12px',
    color: theme.textSecondary,
    marginTop: '4px'
  }
});

export default InternationalPhoneInput;
