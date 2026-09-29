import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showUnitConverter, setShowUnitConverter] = useState(false);

  // Calculator State
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // Unit Converter State (Maund 40kg <-> Kg)
  const [convType, setConvType] = useState('maundToKg'); // 'maundToKg' or 'kgToMaund' or 'ratePerMaund'
  const [convInput, setConvInput] = useState('');
  const [convResult, setConvResult] = useState('');

  const calcRef = useRef(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + C to toggle open/close
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setIsMinimized(false);
        return;
      }

      // If calculator is not open, ignore other keys
      if (!isOpen || isMinimized) return;

      // Don't capture keyboard if user is typing in an input field outside calculator
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        // If the active input is inside our converter, let it type normally
        if (activeEl.closest('#trading-unit-converter')) return;
        return;
      }

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        inputDigit(key);
      } else if (key === '.') {
        e.preventDefault();
        inputDecimal();
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        e.preventDefault();
        const opMap = { '*': '×', '/': '÷', '+': '+', '-': '-' };
        performOperation(opMap[key] || key);
      } else if (key === '%' || key === '%') {
        e.preventDefault();
        performOperation('%');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape') {
        e.preventDefault();
        if (showShortcuts) setShowShortcuts(false);
        else if (showHistory) setShowHistory(false);
        else if (showUnitConverter) setShowUnitConverter(false);
        else clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, display, equation, showShortcuts, showHistory, showUnitConverter]);

  // Digits input
  const inputDigit = (digit) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return String(digit);
      // Limit to reasonable length
      if (prev.length >= 15) return prev;
      return prev + digit;
    });
  };

  // 00 and 000 quick inputs
  const inputZeros = (zeros) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return '0';
      if (prev.length + zeros.length > 15) return prev;
      return prev + zeros;
    });
  };

  // Decimal point
  const inputDecimal = () => {
    setDisplay((prev) => {
      if (prev === 'Error') return '0.';
      if (!prev.includes('.')) return prev + '.';
      return prev;
    });
  };

  // Backspace
  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev === 'Error' || prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  // Clear All
  const clearAll = () => {
    setDisplay('0');
    setEquation('');
  };

  // Toggle plus/minus sign
  const toggleSign = () => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return prev;
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  };

  // Operation (+, -, ×, ÷, %)
  const performOperation = (op) => {
    if (display === 'Error') return;

    if (op === '%') {
      const val = parseFloat(display) / 100;
      setDisplay(String(val));
      return;
    }

    setEquation(`${display} ${op}`);
    setDisplay('0');
  };

  // Calculate Result
  const calculate = () => {
    if (!equation || display === 'Error') return;

    try {
      const parts = equation.trim().split(' ');
      const prevVal = parseFloat(parts[0]);
      const op = parts[1];
      const currentVal = parseFloat(display);

      let result = 0;
      switch (op) {
        case '+':
          result = prevVal + currentVal;
          break;
        case '-':
          result = prevVal - currentVal;
          break;
        case '×':
          result = prevVal * currentVal;
          break;
        case '÷':
          if (currentVal === 0) {
            setDisplay('Error');
            setEquation('');
            return;
          }
          result = prevVal / currentVal;
          break;
        default:
          return;
      }

      // Format result (round to max 6 decimals if floating)
      const cleanResult = Math.round(result * 1000000) / 1000000;
      const calcItem = {
        expression: `${prevVal} ${op} ${currentVal}`,
        result: cleanResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory((prev) => [calcItem, ...prev.slice(0, 19)]);
      setDisplay(String(cleanResult));
      setEquation('');
    } catch {
      setDisplay('Error');
      setEquation('');
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (display === 'Error') return;
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Unit Converter Calculation
  useEffect(() => {
    const val = parseFloat(convInput);
    if (isNaN(val) || val <= 0) {
      setConvResult('');
      return;
    }

    if (convType === 'maundToKg') {
      // 1 Maund = 40 Kg
      setConvResult(`${val * 40} Kg`);
    } else if (convType === 'kgToMaund') {
      // Kg to Maund
      const maunds = (val / 40).toFixed(2);
      setConvResult(`${maunds} Maunds (من)`);
    } else if (convType === 'bagToKg') {
      // 1 Bag = 50 Kg standard
      setConvResult(`${val * 50} Kg (at 50kg/bag)`);
    } else if (convType === 'ratePerKgToMaund') {
      // Rate per Kg to Rate per Maund (* 40)
      setConvResult(`Rs ${(val * 40).toLocaleString()} / Maund`);
    }
  }, [convInput, convType]);

  const loadFromHistory = (item) => {
    setDisplay(String(item.result));
    setShowHistory(false);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-[85] bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center gap-3 border border-indigo-400/30 group cursor-pointer transition-all"
          title="Open Calculator (Shortcut: Alt + C)"
        >
          <div className="relative">
            <i className="fas fa-calculator text-xl text-white group-hover:rotate-12 transition-transform"></i>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
          <span className="font-bold text-xs hidden sm:inline tracking-wide">Calculator</span>
          <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-1.5 py-0.5 rounded font-mono hidden md:inline">
            Alt+C
          </span>
        </motion.button>
      )}

      {/* Main Draggable Calculator Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={calcRef}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            className={`fixed bottom-6 right-6 z-[95] w-[340px] sm:w-[360px] bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-xl overflow-hidden font-['Plus_Jakarta_Sans'] select-none transition-all ${
              isMinimized ? 'h-[62px]' : 'h-auto'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Top Bar / Drag Handle */}
            <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between cursor-move handle">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                <span className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center gap-1.5">
                  <i className="fas fa-calculator text-indigo-400 text-xs"></i> Faran Calc
                </span>
                <span className="text-[9px] bg-indigo-950 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-800/50 hidden sm:inline">
                  Alt+C
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Shortcuts Help Button */}
                <button
                  onClick={() => setShowShortcuts((p) => !p)}
                  className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    showShortcuts ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Keyboard Shortcuts & Tips"
                >
                  <i className="fas fa-keyboard"></i>
                </button>

                {/* Mandi Unit Converter Toggle */}
                <button
                  onClick={() => setShowUnitConverter((p) => !p)}
                  className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    showUnitConverter ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Maund (من) & Bag Converter"
                >
                  <i className="fas fa-balance-scale"></i>
                </button>

                {/* History Toggle */}
                <button
                  onClick={() => setShowHistory((p) => !p)}
                  className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    showHistory ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Calculation History"
                >
                  <i className="fas fa-history"></i>
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsMinimized((p) => !p)}
                  className="w-7 h-7 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <i className={`fas ${isMinimized ? 'fa-window-maximize' : 'fa-minus'}`}></i>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg text-xs text-rose-400 hover:text-white hover:bg-rose-600/80 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                  title="Close Calculator"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* If not minimized, show calculator content */}
            {!isMinimized && (
              <div className="p-4 space-y-3">
                {/* Shortcuts & Tips Panel */}
                <AnimatePresence>
                  {showShortcuts && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-950/70 border border-indigo-800/60 rounded-2xl p-3 text-xs text-indigo-100 space-y-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-indigo-800/40">
                        <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                          <i className="fas fa-bolt text-amber-400"></i> Keyboard Shortcuts & Tips
                        </span>
                        <button
                          onClick={() => setShowShortcuts(false)}
                          className="text-indigo-400 hover:text-white text-xs cursor-pointer"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="flex items-center justify-between bg-indigo-900/40 px-2 py-1 rounded">
                          <span className="text-slate-300">Open/Close:</span>
                          <kbd className="bg-indigo-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-amber-300">Alt + C</kbd>
                        </div>
                        <div className="flex items-center justify-between bg-indigo-900/40 px-2 py-1 rounded">
                          <span className="text-slate-300">Calculate:</span>
                          <kbd className="bg-indigo-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-amber-300">Enter / =</kbd>
                        </div>
                        <div className="flex items-center justify-between bg-indigo-900/40 px-2 py-1 rounded">
                          <span className="text-slate-300">Delete Char:</span>
                          <kbd className="bg-indigo-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-amber-300">Backspace</kbd>
                        </div>
                        <div className="flex items-center justify-between bg-indigo-900/40 px-2 py-1 rounded">
                          <span className="text-slate-300">Clear All:</span>
                          <kbd className="bg-indigo-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-amber-300">Esc</kbd>
                        </div>
                      </div>
                      <p className="text-[10px] text-indigo-300/80 italic pt-0.5">
                        Tip: Click result or copy button to paste straight into Sales / Purchase invoices!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mandi Unit Converter Panel */}
                <AnimatePresence>
                  {showUnitConverter && (
                    <motion.div
                      id="trading-unit-converter"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-amber-950/60 border border-amber-800/60 rounded-2xl p-3 text-xs text-amber-100 space-y-2.5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-amber-800/40">
                        <span className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                          <i className="fas fa-balance-scale text-amber-400"></i> Mandi / Trading Converter
                        </span>
                        <button
                          onClick={() => setShowUnitConverter(false)}
                          className="text-amber-400 hover:text-white text-xs cursor-pointer"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={convType}
                          onChange={(e) => setConvType(e.target.value)}
                          className="bg-amber-900/40 border border-amber-700/50 text-amber-200 text-[11px] rounded-lg p-1.5 outline-none font-medium cursor-pointer"
                        >
                          <option value="maundToKg">Maund (من) ➔ Kg</option>
                          <option value="kgToMaund">Kg ➔ Maund (من)</option>
                          <option value="bagToKg">Bags ➔ Kg (50kg)</option>
                          <option value="ratePerKgToMaund">Rate/Kg ➔ Rate/Maund</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Enter value..."
                          value={convInput}
                          onChange={(e) => setConvInput(e.target.value)}
                          className="bg-slate-900 border border-amber-700/50 text-white text-[11px] rounded-lg px-2 py-1.5 outline-none font-bold"
                        />
                      </div>

                      {convResult && (
                        <div className="bg-amber-900/60 border border-amber-600/40 p-2 rounded-xl flex items-center justify-between">
                          <span className="text-[11px] text-amber-300 font-semibold">Answer:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-amber-100">{convResult}</span>
                            <button
                              onClick={() => {
                                const num = parseFloat(convResult);
                                if (!isNaN(num)) setDisplay(String(num));
                                setShowUnitConverter(false);
                              }}
                              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors"
                              title="Send to Calculator"
                            >
                              Use
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Calculation History Panel */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 text-xs max-h-48 overflow-y-auto space-y-2 scrollbar-thin"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-400">
                        <span className="font-bold flex items-center gap-1.5 text-xs text-slate-300">
                          <i className="fas fa-history text-emerald-400"></i> Recent History
                        </span>
                        <div className="flex items-center gap-2">
                          {history.length > 0 && (
                            <button
                              onClick={() => setHistory([])}
                              className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => setShowHistory(false)}
                            className="text-slate-400 hover:text-white text-xs cursor-pointer"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>

                      {history.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-2">No past calculations yet</p>
                      ) : (
                        history.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => loadFromHistory(item)}
                            className="p-2 bg-slate-900/80 hover:bg-slate-850 rounded-xl cursor-pointer transition-all border border-slate-800/60 flex items-center justify-between group"
                          >
                            <div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.expression} =</div>
                              <div className="text-sm font-black text-emerald-400 font-mono group-hover:underline">
                                {item.result.toLocaleString()}
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">{item.timestamp}</span>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Display Screen */}
                <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800/90 flex flex-col items-end justify-between min-h-[76px] relative group">
                  {/* Equation Line */}
                  <div className="text-slate-400 text-xs font-mono tracking-wider min-h-[16px] overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                    {equation || ' '}
                  </div>

                  {/* Main Value Display */}
                  <div className="flex items-center justify-between w-full mt-1">
                    <button
                      onClick={handleCopy}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 px-2 py-1 rounded-lg border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                      title="Copy result to clipboard"
                    >
                      <i className={`fas ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div
                      onClick={handleCopy}
                      className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white cursor-pointer hover:text-indigo-300 transition-colors max-w-[210px] overflow-hidden text-ellipsis whitespace-nowrap text-right"
                      title="Click to copy"
                    >
                      {display}
                    </div>
                  </div>
                </div>

                {/* Keypad Grid */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {/* Row 1: Clear, Backspace, %, Division */}
                  <button
                    onClick={clearAll}
                    className="p-3 rounded-2xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40 font-black text-sm active:scale-95 transition-all cursor-pointer"
                    title="All Clear (Esc)"
                  >
                    AC
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50 font-bold text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title="Backspace"
                  >
                    <i className="fas fa-backspace"></i>
                  </button>
                  <button
                    onClick={() => performOperation('%')}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-slate-700/50 font-black text-sm active:scale-95 transition-all cursor-pointer"
                    title="Percentage (%)"
                  >
                    %
                  </button>
                  <button
                    onClick={() => performOperation('÷')}
                    className="p-3 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-black text-lg active:scale-95 transition-all cursor-pointer"
                    title="Divide (/)"
                  >
                    ÷
                  </button>

                  {/* Row 2: 7, 8, 9, Multiply */}
                  <button
                    onClick={() => inputDigit('7')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    7
                  </button>
                  <button
                    onClick={() => inputDigit('8')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    8
                  </button>
                  <button
                    onClick={() => inputDigit('9')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    9
                  </button>
                  <button
                    onClick={() => performOperation('×')}
                    className="p-3 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-black text-lg active:scale-95 transition-all cursor-pointer"
                    title="Multiply (*)"
                  >
                    ×
                  </button>

                  {/* Row 3: 4, 5, 6, Subtract */}
                  <button
                    onClick={() => inputDigit('4')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    4
                  </button>
                  <button
                    onClick={() => inputDigit('5')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    5
                  </button>
                  <button
                    onClick={() => inputDigit('6')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    6
                  </button>
                  <button
                    onClick={() => performOperation('-')}
                    className="p-3 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-black text-lg active:scale-95 transition-all cursor-pointer"
                    title="Subtract (-)"
                  >
                    -
                  </button>

                  {/* Row 4: 1, 2, 3, Add */}
                  <button
                    onClick={() => inputDigit('1')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    1
                  </button>
                  <button
                    onClick={() => inputDigit('2')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    2
                  </button>
                  <button
                    onClick={() => inputDigit('3')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    3
                  </button>
                  <button
                    onClick={() => performOperation('+')}
                    className="p-3 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-black text-lg active:scale-95 transition-all cursor-pointer"
                    title="Add (+)"
                  >
                    +
                  </button>

                  {/* Row 5: ±, 0, Dot, Equal */}
                  <button
                    onClick={toggleSign}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-sm active:scale-95 transition-all cursor-pointer"
                    title="Plus/Minus"
                  >
                    ±
                  </button>
                  <button
                    onClick={() => inputDigit('0')}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-bold text-base active:scale-95 transition-all cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    onClick={inputDecimal}
                    className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-white font-black text-base active:scale-95 transition-all cursor-pointer"
                  >
                    .
                  </button>
                  <button
                    onClick={calculate}
                    className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                    title="Calculate (Enter or =)"
                  >
                    =
                  </button>

                  {/* Row 6: ADVANCED TRADING BUTTONS: 00, 000, Quick Copy */}
                  <button
                    onClick={() => inputZeros('00')}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-indigo-950/80 hover:border-indigo-600/60 border border-slate-700/50 text-indigo-300 font-black text-xs active:scale-95 transition-all cursor-pointer"
                    title="Add Double Zero (00)"
                  >
                    00
                  </button>
                  <button
                    onClick={() => inputZeros('000')}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-indigo-950/80 hover:border-indigo-600/60 border border-slate-700/50 text-indigo-300 font-black text-xs active:scale-95 transition-all cursor-pointer"
                    title="Add Triple Zero (000 - Thousand)"
                  >
                    000
                  </button>
                  <button
                    onClick={() => inputZeros('00000')}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-indigo-950/80 hover:border-indigo-600/60 border border-slate-700/50 text-indigo-300 font-black text-[10px] active:scale-95 transition-all cursor-pointer"
                    title="Add 5 Zeros (Lakh / 100,000)"
                  >
                    00k
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                    title="Copy Answer"
                  >
                    <i className="fas fa-paste text-[10px]"></i>
                    <span className="text-[11px]">Copy</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingCalculator;
