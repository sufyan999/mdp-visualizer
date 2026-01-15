import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Play, StepForward, Pause } from 'lucide-react';
import { createInitialGrid, performValueIteration, performPolicyIteration } from './utils/mdpLogic';
import './index.css';


const getCellStyle = (value, type) => {
  if (type === 'wall') return { backgroundColor: '#1f2937', color: '#fff' }; // Dark gray
  if (type === 'goal') return { backgroundColor: '#22c55e', color: '#fff' }; // Green
  if (type === 'trap') return { backgroundColor: '#ef4444', color: '#fff' }; // Red
  

  const maxVal = 10;
  let r = 255, g = 255, b = 255;
  
  if (value > 0) {

    const intensity = Math.min(1, value / maxVal);
    r = Math.round(255 - (255 * intensity)); 
    b = Math.round(255 - (255 * intensity));

    g = 255; 
    return { backgroundColor: `rgb(${r}, ${200 + (55 * (1-intensity))}, ${b})`, color: '#000' };
  } else if (value < 0) {

    const intensity = Math.min(1, Math.abs(value) / maxVal);
    g = Math.round(255 - (255 * intensity));
    b = Math.round(255 - (255 * intensity));
    r = 255;
    return { backgroundColor: `rgb(${r}, ${g}, ${b})`, color: '#000' };
  }
  
  return { backgroundColor: '#ffffff', color: '#000' };
};

const PolicyArrow = ({ direction }) => {
  const size = 20;
  switch (direction) {
    case 'UP': return <ArrowUp size={size} />;
    case 'DOWN': return <ArrowDown size={size} />;
    case 'LEFT': return <ArrowLeft size={size} />;
    case 'RIGHT': return <ArrowRight size={size} />;
    default: return null;
  }
};

const App = () => {
  const [grid, setGrid] = useState(createInitialGrid());
  const [gamma, setGamma] = useState(0.9);
  const [algorithm, setAlgorithm] = useState('VI');
  const [iteration, setIteration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("Ready");

  const step = () => {
    if (algorithm === 'VI') {
      const { newGrid, maxChange } = performValueIteration(grid, gamma);
      setGrid(newGrid);
      setIteration(prev => prev + 1);
      if (maxChange < 0.001) {
        setStatus("Converged!");
        setIsRunning(false);
      }
    } else {
      const { newGrid, policyChanged } = performPolicyIteration(grid, gamma);
      setGrid(newGrid);
      setIteration(prev => prev + 1);
      if (!policyChanged && iteration > 1) {
        setStatus("Optimal Policy Found!");
        setIsRunning(false);
      }
    }
  };

  useEffect(() => {
    let interval;
    if (isRunning) interval = setInterval(step, 200);
    return () => clearInterval(interval);
  }, [isRunning, grid, gamma, algorithm]);

  const reset = () => {
    setGrid(createInitialGrid());
    setIteration(0);
    setStatus("Ready");
    setIsRunning(false);
  };

  return (
    <div className="app-container">
      <div className="main-card">
        <header className="header">
          <h1>MDP Visualizer</h1>
          <p>Value & Policy Iteration</p>
        </header>

        <div className="controls-section">
          <div className="settings">
            <div className="input-group">
              <label>Algorithm Selection</label>
              <select value={algorithm} onChange={(e) => { setAlgorithm(e.target.value); reset(); }}>
                <option value="VI">Value Iteration</option>
                <option value="PI">Policy Iteration</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Discount Factor (γ): {gamma}</label>
              <input 
                type="range" min="0.1" max="0.99" step="0.01" 
                value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="actions">
            <div className="button-row">
              <button onClick={() => setIsRunning(!isRunning)} className="btn primary">
                {isRunning ? <><Pause size={16}/> Pause</> : <><Play size={16}/> Run</>}
              </button>
              <button onClick={step} disabled={isRunning} className="btn secondary">
                <StepForward size={16}/> Step
              </button>
              <button onClick={reset} className="btn neutral">
                <RotateCcw size={16}/> Reset
              </button>
            </div>
            <div className="status-display">
              <p>Iterations: <strong>{iteration}</strong></p>
              <p className="status-text">{status}</p>
            </div>
          </div>
        </div>

        <div className="grid-container">
          <div className="grid-board">
            {grid.map((row, rIndex) => (
              row.map((cell, cIndex) => (
                <div 
                  key={`${rIndex}-${cIndex}`}
                  className="grid-cell"
                  style={getCellStyle(cell.value, cell.type)}
                >
                  {cell.type === 'goal' && <span className="label goal">GOAL</span>}
                  {cell.type === 'trap' && <span className="label trap">TRAP</span>}
                  
                  {cell.type !== 'wall' && (
                    <>
                      <span className="value-text">{cell.value.toFixed(2)}</span>
                      {!cell.isTerminal && (
                        <div className="arrow-icon">
                          <PolicyArrow direction={cell.policy} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            ))}
          </div>
        </div>

        <div className="legend">
          <div className="legend-item"><span className="dot goal-color"></span> Goal (+10)</div>
          <div className="legend-item"><span className="dot trap-color"></span> Trap (-10)</div>
          <div className="legend-item"><span className="dot wall-color"></span> Wall</div>
          <div className="legend-item"><ArrowUp size={14}/> Optimal Policy</div>
        </div>
      </div>
    </div>
  );
};

export default App;