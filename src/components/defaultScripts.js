export const SCRIPT_GREEDY = `def move(state):
    me = state['me'][0]
    food = state['food']
    
    if food['x'] < me['x']: return 'up'
    if food['x'] > me['x']: return 'down'
    if food['y'] < me['y']: return 'left'
    if food['y'] > me['y']: return 'right'
    return 'right'
`;

export const SCRIPT_WANDERER = `def move(state):
    me = state['me'][0]
    rows = state['rows']
    cols = state['cols']
    
    if me['x'] == 0: return 'down'
    if me['x'] == rows - 1: return 'right'
    if me['y'] == 0: return 'up'
    if me['y'] == cols - 1: return 'left'
    return 'right'
`;

export const SCRIPT_EMPTY = `def move(state):
    return 'right'
`; 