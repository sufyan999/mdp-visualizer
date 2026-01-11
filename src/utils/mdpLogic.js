// Constants from the assignment
export const ROWS = 4;
export const COLS = 4;
export const STEP_REWARD = -0.1; // [cite: 16]
export const GOAL_REWARD = 10;   // [cite: 14]
export const TRAP_REWARD = -10;  // [cite: 15]

// Initial Grid Setup
export const createInitialGrid = () => {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      let type = 'empty';
      let value = 0;
      let isTerminal = false;

      // Hardcoding a map layout for demonstration
      if (r === 0 && c === 3) { type = 'goal'; value = GOAL_REWARD; isTerminal = true; }
      else if (r === 1 && c === 3) { type = 'trap'; value = TRAP_REWARD; isTerminal = true; }
      else if (r === 1 && c === 1) { type = 'wall'; value = 0; }

      row.push({ row: r, col: c, type, value, policy: 'UP', isTerminal });
    }
    grid.push(row);
  }
  return grid;
};

// Actions [cite: 11]
const ACTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

// Transition Model (Stochastic: 80% intended, 10% left, 10% right) 
const getTransitions = (r, c, action, grid) => {
  const moves = {
    'UP': { dr: -1, dc: 0 },
    'DOWN': { dr: 1, dc: 0 },
    'LEFT': { dr: 0, dc: -1 },
    'RIGHT': { dr: 0, dc: 1 },
  };

  // Helper to check if a move hits a wall or boundary
  const getNextState = (act) => {
    let nr = r + moves[act].dr;
    let nc = c + moves[act].dc;
    // If out of bounds or wall, stay in same spot
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc].type === 'wall') {
      return { r, c };
    }
    return { r: nr, c: nc };
  };

  const results = [];
  
  if (action === 'UP') {
    results.push({ prob: 0.8, ...getNextState('UP') });
    results.push({ prob: 0.1, ...getNextState('LEFT') });
    results.push({ prob: 0.1, ...getNextState('RIGHT') });
  } else if (action === 'DOWN') {
    results.push({ prob: 0.8, ...getNextState('DOWN') });
    results.push({ prob: 0.1, ...getNextState('RIGHT') });
    results.push({ prob: 0.1, ...getNextState('LEFT') });
  } else if (action === 'LEFT') {
    results.push({ prob: 0.8, ...getNextState('LEFT') });
    results.push({ prob: 0.1, ...getNextState('DOWN') });
    results.push({ prob: 0.1, ...getNextState('UP') });
  } else if (action === 'RIGHT') {
    results.push({ prob: 0.8, ...getNextState('RIGHT') });
    results.push({ prob: 0.1, ...getNextState('UP') });
    results.push({ prob: 0.1, ...getNextState('DOWN') });
  }
  return results;
};

// Calculate Q-Value for a state and action
const calculateQValue = (r, c, action, grid, gamma) => {
  const transitions = getTransitions(r, c, action, grid);
  let qValue = 0;
  
  transitions.forEach(({ prob, r: nr, c: nc }) => {
    // Reward is step reward unless we landed in terminal
    const reward = STEP_REWARD; 
    const nextVal = grid[nr][nc].value;
    qValue += prob * (reward + gamma * nextVal);
  });
  
  return qValue;
};

// Value Iteration Step 
export const performValueIteration = (grid, gamma) => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  let maxChange = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell.isTerminal || cell.type === 'wall') continue;

      let bestValue = -Infinity;
      let bestPolicy = cell.policy;

      ACTIONS.forEach(action => {
        const qVal = calculateQValue(r, c, action, grid, gamma);
        if (qVal > bestValue) {
          bestValue = qVal;
          bestPolicy = action;
        }
      });

      newGrid[r][c].value = bestValue;
      newGrid[r][c].policy = bestPolicy; // Update policy greedily
      maxChange = Math.max(maxChange, Math.abs(bestValue - cell.value));
    }
  }
  return { newGrid, maxChange };
};

// Policy Iteration Step 
// Simplified: Does one sweep of Policy Evaluation + Policy Improvement
export const performPolicyIteration = (grid, gamma) => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  // 1. Policy Evaluation (Update values based on current policy)
  for (let i = 0; i < 5; i++) { // Run a few eval steps per main step for stability
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = newGrid[r][c];
        if (cell.isTerminal || cell.type === 'wall') continue;
        
        // Value is strictly determined by current policy action
        cell.value = calculateQValue(r, c, cell.policy, newGrid, gamma);
      }
    }
  }

  // 2. Policy Improvement (Update policy based on new values)
  let policyChanged = false;
  for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = newGrid[r][c];
        if (cell.isTerminal || cell.type === 'wall') continue;

        let bestVal = -Infinity;
        let bestAct = cell.policy;
        
        ACTIONS.forEach(action => {
            const q = calculateQValue(r, c, action, newGrid, gamma);
            if (q > bestVal) {
                bestVal = q;
                bestAct = action;
            }
        });

        if (bestAct !== cell.policy) {
            newGrid[r][c].policy = bestAct;
            policyChanged = true;
        }
      }
  }

  return { newGrid, policyChanged };
};